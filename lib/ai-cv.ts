import type { SettingsDocument } from './db/schemas'
import type { CvData, ExperienceItem, LeadershipItem } from '@/types/experience'

export interface BulletState {
  id: string       // stable: "${sectionId}-b${originalIndex}", never changes
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

// ── Improve a single bullet — 3 variants ─────────────────────────────────────

const BULLET_VARIANTS_RULES = `EVITA señales de CV escrito por IA:
1. Guiones largos (–): usa puntos o comas en su lugar
2. Porcentajes sin contexto: usa cifras concretas (ej: "aumenté ingresos en €200K", no "mejoré un 20%")
3. Frases vacías como "mejoré la eficiencia operativa": sé específico ("Reduje el tiempo de X de 8h a 2h")
4. Lenguaje genérico: verbo fuerte en pasado + Qué + Cómo + Resultado cuantificable real`

export async function improveBulletVariants(
  bulletText: string,
  instruction: string,
  jobOffer: string,
  settings: SettingsDocument | null
): Promise<string[]> {
  if (!settings?.aiApiKey) return []

  const prompt = `Eres un experto en CVs ATS. Genera EXACTAMENTE 3 versiones mejoradas de este bullet con enfoques distintos.
${BULLET_VARIANTS_RULES}
Solo español. No inventes datos que no estén en el original. Cada versión debe tener un ángulo distinto.

BULLET ORIGINAL: ${bulletText}
INSTRUCCIÓN DEL CANDIDATO: ${instruction}
CONTEXTO (oferta): ${jobOffer.substring(0, 400)}

Responde SOLO con JSON: {"variants": ["versión 1", "versión 2", "versión 3"]}`

  try {
    const result = await callAI(prompt, settings, 700)
    const match = result.match(/\{[\s\S]*\}/)
    if (!match) return []
    const parsed = JSON.parse(match[0]) as { variants?: unknown }
    return (Array.isArray(parsed.variants) ? parsed.variants : [])
      .slice(0, 3)
      .filter((v: unknown): v is string => typeof v === 'string' && v.trim().length > 0)
  } catch {
    return []
  }
}

// ── Improve technical skills list ────────────────────────────────────────────

export async function improveSkills(
  currentSkills: string,
  jobOffer: string,
  instruction: string,
  settings: SettingsDocument | null
): Promise<string | null> {
  if (!settings?.aiApiKey) return null

  const prompt = `Eres un experto en CVs ATS. Genera una lista de habilidades técnicas optimizada para este perfil.

HABILIDADES ACTUALES DEL CANDIDATO:
${currentSkills}

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

INSTRUCCIÓN DEL CANDIDATO: ${instruction}

REGLAS:
- Incluye habilidades del candidato que sigan siendo relevantes para la oferta
- Extrae y añade habilidades mencionadas en la oferta que el candidato pueda dominar dado su perfil
- Ordena de mayor a menor relevancia para la oferta (las más solicitadas primero)
- Sin duplicados, sin categorías ni prefijos, solo los nombres de las habilidades
- Usa el mismo formato separado por comas
- Si la instrucción pide mínimo N skills, asegúrate de cumplirlo

Responde SOLO con JSON: {"skills": "skill1, skill2, skill3, ..."}`

  try {
    const result = await callAI(prompt, settings, 600)
    const match = result.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0]) as { skills?: unknown }
    return typeof parsed.skills === 'string' && parsed.skills.trim() ? parsed.skills.trim() : null
  } catch {
    return null
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
      id: `${exp.id}-b${i}`,
      selected: i < maxBullets,
      text,
    }))
  })

  cvData.leadership.forEach((lead) => {
    result[lead.id] = lead.bullets.map((text, i) => ({
      id: `${lead.id}-b${i}`,
      selected: i < 3,
      text,
    }))
  })

  return result
}

// ── Shared helpers ────────────────────────────────────────────────────────────

interface SuggestionResult {
  selections: Record<string, number[]>
  skills?: string
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

SKILLS ACTUALES DEL CANDIDATO: ${cvData.skills.technical}

También sugiere un nuevo campo "skills" que sea una cadena de habilidades técnicas separadas por comas, priorizando las que aparecen en la oferta y que el candidato ya tiene o puede incluir.

Responde SOLO con JSON válido (sin explicaciones):
{"selections": {"<id>": [<índices seleccionados>], ...}, "skills": "<habilidades sugeridas separadas por coma>"}

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
      max_tokens: 900,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Selecciona los bullets más relevantes del candidato para esta oferta y sugiere skills. Responde JSON: {"selections": {"<id>": [índices], ...}, "skills": "<habilidades sugeridas separadas por coma>"}. Máx 5 bullets para el rol más reciente, 3 para los demás. Skills actuales: ${cvData.skills.technical}\n\nOferta: ${jobOffer.substring(0, 2000)}\n\nBullets: ${JSON.stringify(bulletsSummary)}${extra}`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content) as SuggestionResult
}

export interface SuggestBulletsResult {
  selections: BulletsBySection
  suggestedSkills: string | null
}

export async function suggestBullets(
  jobOffer: string,
  cvData: CvData,
  settings: SettingsDocument | null,
  customMessage?: string
): Promise<SuggestBulletsResult> {
  const fallbackSelections = initSelections(cvData)
  const fallback: SuggestBulletsResult = { selections: fallbackSelections, suggestedSkills: null }
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
        id: `${exp.id}-b${i}`,
        selected: selectedIndices.has(i),
        text,
      }))
    })

    cvData.leadership.forEach((lead) => {
      const selectedIndices = new Set(result.selections[lead.id] ?? [])
      suggested[lead.id] = lead.bullets.map((text, i) => ({
        id: `${lead.id}-b${i}`,
        selected: selectedIndices.has(i),
        text,
      }))
    })

    return { selections: suggested, suggestedSkills: result.skills ?? null }
  } catch {
    return fallback
  }
}

// ── AI CV generation (optimize/rewrite selected bullets) ─────────────────────

const CV_GEN_SYSTEM = `Eres un experto en CVs ATS. Tienes un borrador de CV y una oferta laboral.
Reescribe los bullets del candidato para que sean más impactantes y relevantes para ESTA oferta.
También puedes actualizar el campo "title" (experiencia) o "role" (liderazgo) si un título más específico mejora el ATS match (ej: "Software Engineer" → "Backend Software Engineer Senior").

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
También optimiza el campo "skills.technical" para hacer match con la oferta.

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

BORRADOR CV (JSON):
${JSON.stringify({ experience: draft.experience, leadership: draft.leadership, skills: draft.skills }, null, 2).substring(0, 4000)}${extra}

Responde SOLO con JSON. Por cada item de experience incluye solo: {"id", "title", "bullets"}. Por cada item de leadership incluye solo: {"id", "role", "bullets"}.
{"experience": [{"id":"...","title":"...","bullets":[...]}], "leadership": [{"id":"...","role":"...","bullets":[...]}], "skills": {"technical":"...","language":"...","laboratory":"...","interests":"..."}}`
}

async function generateWithClaude(
  jobOffer: string,
  draft: CvData,
  apiKey: string,
  customMessage?: string
): Promise<CvData> {
  const extra = customMessage ? `\n\nCONTEXTO ADICIONAL DEL CANDIDATO:\n${customMessage}` : ''
  const prompt = `${CV_GEN_SYSTEM}
También optimiza el campo "skills.technical": reordena o ajusta las habilidades técnicas para hacer match con la oferta, usando las que ya tiene el candidato.

OFERTA LABORAL:
${jobOffer.substring(0, 2000)}

BORRADOR CV (JSON):
${JSON.stringify({ experience: draft.experience, leadership: draft.leadership, skills: draft.skills }, null, 2).substring(0, 4000)}${extra}

Responde SOLO con JSON. Por cada item de experience incluye solo: {"id", "title", "bullets"}. Por cada item de leadership incluye solo: {"id", "role", "bullets"}.
{"experience": [{"id":"...","title":"...","bullets":[...]}], "leadership": [{"id":"...","role":"...","bullets":[...]}], "skills": {"technical":"...","language":"...","laboratory":"...","interests":"..."}}
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

  const parsed = JSON.parse(match[0]) as { experience?: Array<{ id?: string; title?: string; bullets?: string[] }>; leadership?: Array<{ id?: string; role?: string; bullets?: string[] }>; skills?: Partial<CvData['skills']> }
  return {
    ...draft,
    experience: draft.experience.map((exp, idx) => {
      const opt = (parsed.experience ?? [])[idx]
      if (!opt) return exp
      return { ...exp, ...(opt.title ? { title: opt.title } : {}), ...(opt.bullets ? { bullets: opt.bullets } : {}) }
    }),
    leadership: draft.leadership.map((lead, idx) => {
      const opt = (parsed.leadership ?? [])[idx]
      if (!opt) return lead
      return { ...lead, ...(opt.role ? { role: opt.role } : {}), ...(opt.bullets ? { bullets: opt.bullets } : {}) }
    }),
    skills: parsed.skills ? { ...draft.skills, ...parsed.skills } : draft.skills,
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
  const parsed = JSON.parse(data.choices[0].message.content) as { experience?: Array<{ id?: string; title?: string; bullets?: string[] }>; leadership?: Array<{ id?: string; role?: string; bullets?: string[] }>; skills?: Partial<CvData['skills']> }
  return {
    ...draft,
    experience: draft.experience.map((exp, idx) => {
      const opt = (parsed.experience ?? [])[idx]
      if (!opt) return exp
      return { ...exp, ...(opt.title ? { title: opt.title } : {}), ...(opt.bullets ? { bullets: opt.bullets } : {}) }
    }),
    leadership: draft.leadership.map((lead, idx) => {
      const opt = (parsed.leadership ?? [])[idx]
      if (!opt) return lead
      return { ...lead, ...(opt.role ? { role: opt.role } : {}), ...(opt.bullets ? { bullets: opt.bullets } : {}) }
    }),
    skills: parsed.skills ? { ...draft.skills, ...parsed.skills } : draft.skills,
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

// ── CV diff computation for conflict resolution UI ────────────────────────────

export interface BulletDiff {
  key: string
  sectionType: 'experience' | 'leadership'
  sectionId: string
  sectionLabel: string
  bulletIdx: number
  original: string
  proposed: string
  changed: boolean
  accepted: boolean
}

export interface SkillsDiff {
  key: 'skills'
  original: string
  proposed: string
  changed: boolean
  accepted: boolean
}

export interface TitleDiff {
  key: string          // format: `${sectionId}-title`
  sectionType: 'experience' | 'leadership'
  sectionId: string
  sectionLabel: string
  field: 'title' | 'role'
  original: string
  proposed: string
  changed: boolean
  accepted: boolean
}

export type CvDiffItem = BulletDiff | SkillsDiff | TitleDiff

export function computeCvDiffs(draft: CvData, optimized: CvData): CvDiffItem[] {
  const diffs: CvDiffItem[] = []

  const processSection = (
    draftItems: Array<{ id: string; organization: string; bullets: string[]; title?: string; role?: string }>,
    optimizedItems: Array<{ id: string; bullets: string[]; title?: string; role?: string }>,
    sectionType: 'experience' | 'leadership',
    getLabel: (item: { organization: string }) => string,
    titleField: 'title' | 'role'
  ) => {
    draftItems.forEach((draftItem, sectionIdx) => {
      const optimizedItem = optimizedItems[sectionIdx]
      if (!optimizedItem) return

      // Detect title/role change
      const draftTitle = (draftItem[titleField] ?? '').trim()
      const optimizedTitle = (optimizedItem[titleField] ?? '').trim()
      if (optimizedTitle && draftTitle !== optimizedTitle) {
        diffs.push({
          key: `${draftItem.id}-title`,
          sectionType,
          sectionId: draftItem.id,
          sectionLabel: getLabel(draftItem),
          field: titleField,
          original: draftTitle,
          proposed: optimizedTitle,
          changed: true,
          accepted: true,
        } as TitleDiff)
      }

      const optimizedBullets = optimizedItem.bullets ?? []
      const maxLen = Math.max(draftItem.bullets.length, optimizedBullets.length)
      for (let i = 0; i < maxLen; i++) {
        const orig = draftItem.bullets[i] ?? ''
        const prop = optimizedBullets[i] ?? ''
        const changed = orig.trim() !== prop.trim()
        diffs.push({
          key: `${draftItem.id}-${i}`,
          sectionType,
          sectionId: draftItem.id,
          sectionLabel: getLabel(draftItem as { organization: string }),
          bulletIdx: i,
          original: orig,
          proposed: prop,
          changed,
          accepted: true,
        })
      }
    })
  }

  processSection(
    draft.experience,
    optimized.experience,
    'experience',
    (item) => item.organization,
    'title'
  )
  processSection(
    draft.leadership,
    optimized.leadership,
    'leadership',
    (item) => item.organization,
    'role'
  )

  const origSkills = draft.skills.technical.trim()
  const propSkills = optimized.skills.technical.trim()
  if (origSkills !== propSkills) {
    diffs.push({
      key: 'skills',
      original: origSkills,
      proposed: propSkills,
      changed: true,
      accepted: true,
    })
  }

  return diffs
}

export function applyDiffs(draft: CvData, diffs: CvDiffItem[]): CvData {
  const result: CvData = {
    ...draft,
    experience: draft.experience.map((e) => ({ ...e, bullets: [...e.bullets] })),
    leadership: draft.leadership.map((l) => ({ ...l, bullets: [...l.bullets] })),
    skills: { ...draft.skills },
  }

  for (const diff of diffs) {
    if (!diff.changed) continue

    if (diff.key === 'skills') {
      const sd = diff as SkillsDiff
      result.skills = { ...result.skills, technical: sd.accepted ? sd.proposed : sd.original }
      continue
    }

    if (diff.key.endsWith('-title')) {
      const td = diff as TitleDiff
      if (!td.accepted) continue
      if (td.sectionType === 'experience') {
        const exp = result.experience.find((s) => s.id === td.sectionId)
        if (exp) exp.title = td.proposed
      } else {
        const lead = result.leadership.find((s) => s.id === td.sectionId)
        if (lead) lead.role = td.proposed
      }
      continue
    }

    const bd = diff as BulletDiff
    if (!bd.accepted) continue

    const section = bd.sectionType === 'experience' ? result.experience : result.leadership
    const item = section.find((s) => s.id === bd.sectionId)
    if (!item) continue

    if (bd.proposed) {
      item.bullets[bd.bulletIdx] = bd.proposed
    } else {
      // AI removed this bullet — remove from result if user accepted
      item.bullets.splice(bd.bulletIdx, 1)
    }
  }

  return result
}
