import type { SettingsDocument } from './db/schemas'

export interface ParsedJobOffer {
  company?: string
  position?: string
  salaryOffered?: number
  salaryCurrency?: string
  benefits?: string[]
  source?: string
}

// ── Regex-based fallback extraction ──────────────────────────────────────────

function extractWithRegex(text: string): ParsedJobOffer {
  const companyPatterns = [
    /(?:empresa|company|organización|compañía|empleador)\s*[:\-]\s*([^\n,]{2,60})/i,
    /en\s+([A-Z][a-zA-Z\s&\.\-]{2,40})\s+(?:buscamos|estamos|buscando)/i,
    /([A-Z][a-zA-Z\s&\.]{2,30})\s+(?:está buscando|busca|requiere)/i,
  ]
  const positionPatterns = [
    /(?:cargo|position|rol|puesto|título|vacante)\s*[:\-]\s*([^\n]{5,80})/i,
    /(?:buscamos un[ao]?|se busca)\s+([^\n]{5,60})/i,
  ]
  const salaryPatterns = [
    /(?:salario|sueldo|salary|compensación|rango salarial)\s*[:\-]?\s*(?:\$|COP|USD)?\s*([\d.,]+)(?:\s*(?:k|K|millones|M))?/i,
  ]

  let company = ''
  let position = ''
  let salaryOffered: number | undefined

  for (const p of companyPatterns) {
    const m = text.match(p)
    if (m?.[1]) {
      company = m[1].trim().replace(/[.,]+$/, '')
      break
    }
  }

  for (const p of positionPatterns) {
    const m = text.match(p)
    if (m?.[1]) {
      position = m[1].trim().replace(/[.,]+$/, '')
      break
    }
  }

  // If no position found, try first line
  if (!position) {
    const firstLine = text.split('\n').find((l) => l.trim().length > 5)
    if (firstLine) position = firstLine.trim().substring(0, 80)
  }

  for (const p of salaryPatterns) {
    const m = text.match(p)
    if (m?.[1]) {
      const raw = m[1].replace(/\./g, '').replace(',', '.')
      salaryOffered = parseFloat(raw)
      break
    }
  }

  // Extract benefits from common patterns
  const benefitKeywords = [
    'trabajo remoto', 'remote', 'home office', 'híbrido', 'flexible',
    'seguro médico', 'health insurance', 'dental', 'vacaciones',
    'bonos', 'stock', 'opciones', 'capacitación', 'educación',
  ]
  const benefits = benefitKeywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()))

  return { company, position, salaryOffered, benefits: benefits.length > 0 ? benefits : undefined }
}

// ── AI-powered extraction via backend proxy ──────────────────────────────────

async function extractWithBackendProxy(
  text: string,
  model: string,
  apiKey: string
): Promise<ParsedJobOffer> {
  const res = await fetch('/api/ai/parse', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jobOffer: text.substring(0, 4000),
      model,
      apiKey,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.code === 'NO_API_KEY' ? 'NO_API_KEY' : `API error ${res.status}`)
  }

  const data = await res.json()
  if (!data.success) throw new Error('API failed')
  return data.data as ParsedJobOffer
}

// ── Public API ────────────────────────────────────────────────────────────────

const SUPPORTED_MODELS = ['claude', 'gpt', 'deepseek']

export async function parseJobOffer(
  text: string,
  settings: SettingsDocument | null
): Promise<{ result: ParsedJobOffer; usedAI: boolean }> {
  if (!text.trim()) {
    return { result: extractWithRegex(text), usedAI: false }
  }

  if (!settings?.aiApiKey) {
    return { result: extractWithRegex(text), usedAI: false }
  }

  const model = settings.aiModel ?? 'claude'

  if (!SUPPORTED_MODELS.includes(model)) {
    return { result: extractWithRegex(text), usedAI: false }
  }

  try {
    const result = await extractWithBackendProxy(text, model, settings.aiApiKey)
    return { result, usedAI: true }
  } catch {
    return { result: extractWithRegex(text), usedAI: false }
  }
}
