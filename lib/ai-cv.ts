import type { SettingsDocument } from './db/schemas'
import type { CvData, ExperienceItem, LeadershipItem } from '@/types/experience'

export interface BulletState {
  selected: boolean
  text: string
}

// experienceId → array of BulletState (one per bullet)
export type BulletsBySection = Record<string, BulletState[]>

export const ATS_VERBS_RE =
  /^(Diseñé|Implementé|Optimicé|Reduje|Migré|Lideré|Establecí|Mejoré|Desarrollé|Construí|Automaticé|Coordiné|Gestioné|Incrementé|Logré|Administré|Configuré|Integré|Entregué|Supervisé|Creé|Impulsé|Colaboré|Definí|Ejecuté|Refactoricé|Analicé|Propuse|Manejé|Dirigí)/i

// ── Shared low-level AI caller ────────────────────────────────────────────────

async function callAI(
  prompt: string,
  settings: SettingsDocument,
  maxTokens = 400
): Promise<string> {
  const model = settings.aiModel ?? 'claude'

  if (model === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.aiApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
    const data = await res.json()
    return data.content?.[0]?.text ?? ''
  }

  const baseUrl = model === 'gpt' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com/v1'
  const modelName = model === 'gpt' ? 'gpt-4o-mini' : 'deepseek-chat'
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${settings.aiApiKey}` },
    body: JSON.stringify({
      model: modelName,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content ?? ''
}

// ── Improve a single bullet ───────────────────────────────────────────────────

export async function improveBullet(
  bulletText: string,
  instruction: string,
  jobOffer: string,
  settings: SettingsDocument | null
): Promise<string> {
  if (!settings?.aiApiKey) return bulletText

  const prompt = `Eres un experto en CVs ATS. Mejora este bullet según la instrucción del candidato.
REGLAS: Verbo fuerte en pasado (Diseñé/Implementé/Optimicé/Lideré/etc.) + Qué + Cómo + Resultado cuantificable. Solo español. No inventes datos que no estén en el original.

BULLET ORIGINAL: ${bulletText}
INSTRUCCIÓN: ${instruction}
CONTEXTO (oferta): ${jobOffer.substring(0, 400)}

Responde ÚNICAMENTE con el texto del bullet mejorado, sin comillas ni prefijos.`

  try {
    const result = await callAI(prompt, settings, 300)
    return result.trim().replace(/^["']|["']$/g, '') || bulletText
  } catch {
    return bulletText
  }
}

// ── Batch-improve all non-ATS bullets (works on CvData directly) ─────────────

export async function improveNonAtsBullets(
  draftCv: CvData,
  jobOffer: string,
  settings: SettingsDocument | null
): Promise<CvData> {
  if (!settings?.aiApiKey) return draftCv

  type Loc = { section: 'experience' | 'leadership'; id: string; idx: number; text: string }
  const toImprove: Loc[] = []

  draftCv.experience.forEach((exp) => {
    exp.bullets.forEach((b, idx) => {
      if (!ATS_VERBS_RE.test(b.trimStart())) toImprove.push({ section: 'experience', id: exp.id, idx, text: b })
    })
  })
  draftCv.leadership.forEach((lead) => {
    lead.bullets.forEach((b, idx) => {
      if (!ATS_VERBS_RE.test(b.trimStart())) toImprove.push({ section: 'leadership', id: lead.id, idx, text: b })
    })
  })

  if (toImprove.length === 0) return draftCv

  const bulletsList = toImprove.map((b, i) => `${i + 1}. ${b.text}`).join('\n')
  const prompt = `Eres un experto en CVs ATS. Reescribe estos bullets para que empiecen con un verbo fuerte en pasado.
VERBOS: Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré, Mejoré, Desarrollé, Construí, Automaticé, Gestioné, Incrementé, Logré, Configuré, Integré, Ejecuté, Refactoricé, Analicé
REGLAS: Mantén métricas y datos del original. Solo español. Misma cantidad de bullets.
CONTEXTO (oferta): ${jobOffer.substring(0, 300)}

BULLETS A MEJORAR:
${bulletsList}

Responde SOLO con JSON: {"bullets": ["bullet mejorado 1", "bullet mejorado 2", ...]}`

  try {
    const raw = await callAI(prompt, settings, 1500)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return draftCv
    const parsed = JSON.parse(jsonMatch[0]) as { bullets: string[] }
    if (!Array.isArray(parsed.bullets) || parsed.bullets.length !== toImprove.length) return draftCv

    const updated: CvData = {
      ...draftCv,
      experience: draftCv.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
      leadership: draftCv.leadership.map((l) => ({ ...l, bullets: [...l.bullets] })),
    }
    toImprove.forEach((item, i) => {
      if (item.section === 'experience') {
        const ei = updated.experience.findIndex((e) => e.id === item.id)
        if (ei >= 0) updated.experience[ei].bullets[item.idx] = parsed.bullets[i]
      } else {
        const li = updated.leadership.findIndex((l) => l.id === item.id)
        if (li >= 0) updated.leadership[li].bullets[item.idx] = parsed.bullets[i]
      }
    })
    return updated
  } catch {
    return draftCv
  }
}

// ── AI chat with CV context ───────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type ChatStyle = 'concise' | 'normal' | 'extended'

const STYLE_INSTRUCTIONS: Record<ChatStyle, string> = {
  concise: 'IMPORTANTE: Responde de forma MUY breve y directa. Máximo 2-3 oraciones. Sin introducciones, sin listas largas, sin conclusiones. Solo la respuesta esencial.',
  normal: 'Sé claro y conciso. Usa listas cortas cuando ayuden.',
  extended: 'Puedes dar explicaciones detalladas con ejemplos concretos cuando sea útil para el candidato.',
}

export async function chatWithCv(
  messages: ChatMessage[],
  draftCv: CvData,
  jobOffer: string,
  settings: SettingsDocument | null,
  style: ChatStyle = 'normal'
): Promise<string> {
  if (!settings?.aiApiKey) return 'Configura una API key en Configuración para usar el chat.'

  const cvSummary = JSON.stringify({
    nombre: draftCv.basics.fullName,
    experience: draftCv.experience.map((e) => ({ org: e.organization, titulo: e.title, bullets: e.bullets })),
    leadership: draftCv.leadership.map((l) => ({ org: l.organization, rol: l.role, bullets: l.bullets })),
    educacion: draftCv.education.map((e) => ({ institucion: e.institution, grado: e.degree })),
    skills: draftCv.skills,
  }, null, 2).substring(0, 3000)

  const maxTokens = style === 'concise' ? 300 : style === 'extended' ? 1500 : 800

  const systemCtx = `Eres un experto en CVs ATS y reclutamiento. Ayuda al candidato a optimizar su CV para la oferta.

CV ACTUAL:
${cvSummary}

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

Responde en español. ${STYLE_INSTRUCTIONS[style]}`

  try {
    const model = settings.aiModel ?? 'claude'
    if (model === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.aiApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system: systemCtx,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`Claude error: ${res.status}`)
      const data = await res.json()
      return data.content?.[0]?.text ?? ''
    }

    const baseUrl = model === 'gpt' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com/v1'
    const modelName = model === 'gpt' ? 'gpt-4o-mini' : 'deepseek-chat'
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${settings.aiApiKey}` },
      body: JSON.stringify({
        model: modelName,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemCtx }, ...messages.map((m) => ({ role: m.role, content: m.content }))],
      }),
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const data = await res.json()
    return data.choices[0].message.content ?? ''
  } catch {
    return 'Error al conectar con la IA. Verifica tu API key en Configuración.'
  }
}

// ── Fallback: build CV from selected bullets without AI ───────────────────────

export function assembleCv(cvData: CvData, selections: BulletsBySection): CvData {
  function filterBullets<T extends ExperienceItem | LeadershipItem>(item: T): T {
    const states = selections[item.id]
    if (!states) return item
    return { ...item, bullets: states.filter((s) => s.selected).map((s) => s.text) }
  }

  return {
    ...cvData,
    updatedAt: new Date().toISOString(),
    experience: cvData.experience.map(filterBullets),
    leadership: cvData.leadership.map(filterBullets),
  }
}

// ── Initialize selections (all selected, trimmed to recommended counts) ───────

export function initSelections(cvData: CvData): BulletsBySection {
  const result: BulletsBySection = {}

  cvData.experience.forEach((exp, expIdx) => {
    const maxBullets = expIdx === 0 ? 5 : 3
    result[exp.id] = exp.bullets.map((text, i) => ({
      selected: i < maxBullets,
      text,
    }))
  })

  cvData.leadership.forEach((lead) => {
    result[lead.id] = lead.bullets.map((text, i) => ({
      selected: i < 3,
      text,
    }))
  })

  return result
}

// ── Shared helpers ────────────────────────────────────────────────────────────

interface SuggestionResult {
  selections: Record<string, number[]>
}

function buildBulletsSummary(cvData: CvData) {
  return [
    ...cvData.experience.map((exp) => ({
      id: exp.id,
      label: `${exp.organization} — ${exp.title}`,
      bullets: exp.bullets.map((b, i) => ({ index: i, text: b.substring(0, 120) })),
    })),
    ...cvData.leadership.map((lead) => ({
      id: lead.id,
      label: `${lead.organization} — ${lead.role} (liderazgo)`,
      bullets: lead.bullets.map((b, i) => ({ index: i, text: b.substring(0, 120) })),
    })),
  ]
}

// ── AI bullet suggestion ──────────────────────────────────────────────────────

async function suggestWithClaude(
  jobOffer: string,
  cvData: CvData,
  apiKey: string,
  customMessage?: string
): Promise<SuggestionResult> {
  const bulletsJson = JSON.stringify(buildBulletsSummary(cvData))

  const prompt = `Eres un experto en ATS y selección de personal. Analiza la oferta laboral y selecciona los bullets del candidato MÁS relevantes para esa oferta.

REGLAS DE SELECCIÓN:
- Rol más reciente: máximo 5 bullets
- Otros roles: máximo 3 bullets
- Prioriza bullets con métricas y tecnologías mencionadas en la oferta
- Prioriza verbos fuertes de impacto

Responde SOLO con JSON válido (sin explicaciones):
{"selections": {"<id>": [<índices seleccionados>], ...}}

OFERTA LABORAL:
${jobOffer.substring(0, 3000)}

BULLETS DEL CANDIDATO:
${bulletsJson}${customMessage ? `\n\nCONTEXTO ADICIONAL DEL CANDIDATO:\n${customMessage}` : ''}`

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
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0]) as SuggestionResult
}

async function suggestWithOpenAICompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  jobOffer: string,
  cvData: CvData,
  customMessage?: string
): Promise<SuggestionResult> {
  const bulletsSummary = buildBulletsSummary(cvData)
  const extra = customMessage ? `\n\nContexto adicional del candidato: ${customMessage}` : ''

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Selecciona los bullets más relevantes del candidato para esta oferta. Responde JSON: {"selections": {"<id>": [índices], ...}}. Máx 5 bullets para el rol más reciente, 3 para los demás.\n\nOferta: ${jobOffer.substring(0, 2000)}\n\nBullets: ${JSON.stringify(bulletsSummary)}${extra}`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content) as SuggestionResult
}

export async function suggestBullets(
  jobOffer: string,
  cvData: CvData,
  settings: SettingsDocument | null,
  customMessage?: string
): Promise<BulletsBySection> {
  const fallback = initSelections(cvData)
  if (!settings?.aiApiKey || !jobOffer.trim()) return fallback

  try {
    const model = settings.aiModel ?? 'claude'
    let result: SuggestionResult

    if (model === 'claude') {
      result = await suggestWithClaude(jobOffer, cvData, settings.aiApiKey, customMessage)
    } else if (model === 'gpt') {
      result = await suggestWithOpenAICompat('https://api.openai.com/v1', 'gpt-4o-mini', settings.aiApiKey, jobOffer, cvData, customMessage)
    } else if (model === 'deepseek') {
      result = await suggestWithOpenAICompat('https://api.deepseek.com/v1', 'deepseek-chat', settings.aiApiKey, jobOffer, cvData, customMessage)
    } else {
      return fallback
    }

    // Apply AI suggestions to the selection state
    const suggested: BulletsBySection = {}

    cvData.experience.forEach((exp) => {
      const selectedIndices = new Set(result.selections[exp.id] ?? [])
      suggested[exp.id] = exp.bullets.map((text, i) => ({
        selected: selectedIndices.has(i),
        text,
      }))
    })

    cvData.leadership.forEach((lead) => {
      const selectedIndices = new Set(result.selections[lead.id] ?? [])
      suggested[lead.id] = lead.bullets.map((text, i) => ({
        selected: selectedIndices.has(i),
        text,
      }))
    })

    return suggested
  } catch {
    return fallback
  }
}

// ── AI CV generation (optimize/rewrite selected bullets) ─────────────────────

const CV_GEN_SYSTEM = `Eres un experto en CVs ATS. Tienes un borrador de CV y una oferta laboral.
Reescribe SOLO los bullets del candidato para que sean más impactantes y relevantes para ESTA oferta.

REGLAS:
- Verbo de acción en pasado (Diseñé, Implementé, Optimicé, Reduje, Migré, Lideré, Establecí, Mejoré)
- Fórmula: Verbo + Qué + Cómo + Resultado cuantificable
- Mantener las métricas numéricas del original
- Solo en español
- No inventar logros que no estén en el original
- Max 4-5 bullets para el rol más reciente, 3 para los demás`

function buildCvGenPrompt(jobOffer: string, draft: CvData, customMessage?: string): string {
  const extra = customMessage ? `\n\nCONTEXTO ADICIONAL DEL CANDIDATO:\n${customMessage}` : ''
  return `${CV_GEN_SYSTEM}

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

BORRADOR CV (JSON):
${JSON.stringify({ experience: draft.experience, leadership: draft.leadership }, null, 2).substring(0, 4000)}${extra}

Responde SOLO con JSON: {"experience": [...], "leadership": [...]}`
}

async function generateWithClaude(
  jobOffer: string,
  draft: CvData,
  apiKey: string,
  customMessage?: string
): Promise<CvData> {
  const extra = customMessage ? `\n\nCONTEXTO ADICIONAL DEL CANDIDATO:\n${customMessage}` : ''
  const prompt = `${CV_GEN_SYSTEM}

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

BORRADOR CV (JSON):
${JSON.stringify({ experience: draft.experience, leadership: draft.leadership }, null, 2).substring(0, 4000)}${extra}

Responde SOLO con el JSON del CV completo (misma estructura del borrador con bullets mejorados):
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
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json()
  const content = data.content?.[0]?.text ?? ''
  const match = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')

  const parsed = JSON.parse(match[0]) as Partial<CvData>
  return {
    ...draft,
    experience: parsed.experience ?? draft.experience,
    leadership: parsed.leadership ?? draft.leadership,
  }
}

async function generateWithOpenAICompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  jobOffer: string,
  draft: CvData,
  customMessage?: string
): Promise<CvData> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildCvGenPrompt(jobOffer, draft, customMessage) }],
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.choices[0].message.content) as Partial<CvData>
  return {
    ...draft,
    experience: parsed.experience ?? draft.experience,
    leadership: parsed.leadership ?? draft.leadership,
  }
}

export async function generateCv(
  jobOffer: string,
  cvData: CvData,
  selections: BulletsBySection,
  settings: SettingsDocument | null,
  customMessage?: string,
  draftOverride?: CvData
): Promise<{ cv: CvData; usedAI: boolean }> {
  const draft = draftOverride ?? assembleCv(cvData, selections)

  if (!settings?.aiApiKey || !jobOffer.trim()) {
    return { cv: draft, usedAI: false }
  }

  try {
    const model = settings.aiModel ?? 'claude'

    if (model === 'claude') {
      const optimized = await generateWithClaude(jobOffer, draft, settings.aiApiKey, customMessage)
      return { cv: optimized, usedAI: true }
    } else if (model === 'gpt') {
      const optimized = await generateWithOpenAICompat('https://api.openai.com/v1', 'gpt-4o-mini', settings.aiApiKey, jobOffer, draft, customMessage)
      return { cv: optimized, usedAI: true }
    } else if (model === 'deepseek') {
      const optimized = await generateWithOpenAICompat('https://api.deepseek.com/v1', 'deepseek-chat', settings.aiApiKey, jobOffer, draft, customMessage)
      return { cv: optimized, usedAI: true }
    }

    return { cv: draft, usedAI: false }
  } catch {
    return { cv: draft, usedAI: false }
  }
}
