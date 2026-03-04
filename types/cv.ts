export interface CVContact {
  address: string
  city: string
  state: string
  zip: string
  email: string
  phone: string
}

export interface CVBasics {
  fullName: string
  contact: CVContact
}

export interface CVStudyAbroad {
  program: string
  location: string
  coursework: string
  dates: string
}

export interface CVEducation {
  id: string
  institution: string
  location: string
  degree: string
  concentration: string
  gpa: string
  graduationDate: string
  thesis: string
  coursework: string
  studyAbroad: CVStudyAbroad | null
  order: number
}

export interface CVExperience {
  id: string
  organization: string
  title: string
  location: string
  dates: string
  bullets: string[]
  order: number
}

export interface CVLeadership {
  id: string
  organization: string
  location: string
  role: string
  dates: string
  bullets: string[]
  order: number
}

export interface CVSkills {
  technical: string
  language: string
  laboratory: string
  interests: string
}

export interface CVSettings {
  paperSize: 'A4' | 'Letter'
  fontFamily: 'Calibri' | 'Times New Roman'
  fontSize: number
  hideOptionalEmpty: boolean
}

export interface CVData {
  schemaVersion: number
  updatedAt: string
  basics: CVBasics
  education: CVEducation[]
  experience: CVExperience[]
  leadership: CVLeadership[]
  skills: CVSkills
  settings: CVSettings
}

// ── Application types ─────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'pending'
  | 'phone_screen'
  | 'technical'
  | 'hr_interview'
  | 'offer'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  phone_screen: 'Llamada inicial',
  technical: 'Entrevista técnica',
  hr_interview: 'Entrevista HR',
  offer: 'Oferta recibida',
  rejected: 'Rechazado',
  accepted: 'Aceptado',
  withdrawn: 'Retirado',
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  phone_screen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  technical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  hr_interview: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  accepted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  withdrawn: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
}

// ── AI / Settings types ────────────────────────────────────────────────────────

export type AIModel = 'claude' | 'gpt' | 'gemini' | 'grok' | 'deepseek'

export const AI_MODEL_LABELS: Record<AIModel, string> = {
  claude: 'Claude (Anthropic)',
  gpt: 'GPT (OpenAI)',
  gemini: 'Gemini (Google)',
  grok: 'Grok (xAI)',
  deepseek: 'DeepSeek',
}
