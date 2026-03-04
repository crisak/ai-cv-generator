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

// ── AI-powered extraction ─────────────────────────────────────────────────────

const EXTRACTION_PROMPT = (text: string) =>
  `Extrae la información de esta oferta laboral como JSON con campos: company (string), position (string), salaryOffered (número sin texto), salaryCurrency (COP/USD/EUR), benefits (array de strings).

Oferta: ${text.substring(0, 4000)}`

async function extractWithClaude(text: string, apiKey: string): Promise<ParsedJobOffer> {
  const prompt = `Analiza esta oferta laboral y extrae la información clave. Responde SOLO con un JSON válido sin explicaciones.

Campos a extraer:
- company: nombre de la empresa (string)
- position: título del cargo (string)
- salaryOffered: salario numérico si se menciona (number, sin texto)
- salaryCurrency: moneda del salario si se menciona: COP, USD o EUR (string)
- benefits: lista de beneficios mencionados (array de strings cortos)

Oferta laboral:
${text.substring(0, 4000)}

JSON:`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')

  return JSON.parse(jsonMatch[0]) as ParsedJobOffer
}

async function extractWithOpenAICompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  text: string
): Promise<ParsedJobOffer> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: EXTRACTION_PROMPT(text) }],
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content) as ParsedJobOffer
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseJobOffer(
  text: string,
  settings: SettingsDocument | null
): Promise<{ result: ParsedJobOffer; usedAI: boolean }> {
  if (!settings?.aiApiKey || !text.trim()) {
    return { result: extractWithRegex(text), usedAI: false }
  }

  try {
    const model = settings.aiModel ?? 'claude'
    let result: ParsedJobOffer

    if (model === 'claude') {
      result = await extractWithClaude(text, settings.aiApiKey)
    } else if (model === 'gpt') {
      result = await extractWithOpenAICompat('https://api.openai.com/v1', 'gpt-4o-mini', settings.aiApiKey, text)
    } else if (model === 'deepseek') {
      result = await extractWithOpenAICompat('https://api.deepseek.com/v1', 'deepseek-chat', settings.aiApiKey, text)
    } else {
      // Gemini, Grok: not yet implemented — fallback to regex
      result = extractWithRegex(text)
      return { result, usedAI: false }
    }

    return { result, usedAI: true }
  } catch {
    return { result: extractWithRegex(text), usedAI: false }
  }
}
