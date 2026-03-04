'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, FileText, Key, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ATS_VERBS_RE, improveNonAtsBullets } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

// Spanish + English stopwords
const STOPWORDS = new Set([
  'que', 'con', 'para', 'por', 'una', 'los', 'las', 'del', 'como',
  'sus', 'más', 'pero', 'muy', 'sin', 'sobre', 'entre', 'cuando',
  'ser', 'nos', 'has', 'este', 'esta', 'estos', 'estas', 'también',
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'have',
  'will', 'your', 'all', 'our', 'not', 'can', 'work', 'you', 'we',
  'been', 'they', 'their', 'what', 'into', 'nuestro', 'nuestra',
  'donde', 'quien', 'cada', 'otro', 'otras', 'todos', 'todas',
  'desde', 'hasta', 'siendo', 'durante', 'hacia', 'algún', 'cualquier',
  'puedes', 'podrás', 'deberás', 'tendrás', 'serás', 'estarás',
  'buscamos', 'ofrecemos', 'tenemos', 'somos', 'estamos', 'trabajamos',
  'empresa', 'equipo', 'trabajo', 'cargo', 'puesto',
])

const SENTENCE_STARTERS = new Set([
  'El', 'La', 'Los', 'Las', 'Un', 'Una', 'De', 'Del', 'En', 'Con', 'Por', 'Para',
  'Se', 'Es', 'Son', 'Ser', 'No', 'Si', 'Que', 'Y', 'O', 'A', 'Al', 'Su', 'Sus',
  'Nos', 'Fue', 'Ha', 'Han', 'Hay', 'Muy', 'Más', 'Pero', 'Sin', 'Sobre', 'Como',
  'Cuando', 'Nuestro', 'Nuestra', 'Busca', 'Buscamos', 'Ofrecemos', 'Estamos',
  'Somos', 'También', 'Donde', 'Quien', 'Este', 'Esta', 'Estos', 'Estas',
  'Tenemos', 'Serás', 'Podrás', 'Deberás', 'Trabajarás', 'Colaborarás',
  'Necesitamos', 'Contamos', 'Apoyarás', 'Participarás',
])

function extractKeywords(text: string): string[] {
  const seen = new Set<string>()
  const keywords: string[] = []

  const add = (word: string) => {
    const key = word.toLowerCase().trim()
    if (key.length >= 2 && !STOPWORDS.has(key) && !seen.has(key)) {
      seen.add(key)
      keywords.push(word)
    }
  }

  const tokens = text.split(/\s+/)
  tokens.forEach((raw) => {
    const w = raw.replace(/^[^a-zA-Z0-9áéíóúüñ]+|[^a-zA-Z0-9áéíóúüñ.+#_/-]+$/g, '')
    if (!w || w.length < 2) return
    const isAllCaps = /^[A-Z]{2,10}$/.test(w)
    const hasTechSep = /[.+#]/.test(w) && w.length >= 3
    const hasVersion = /[A-Za-z]\d/.test(w) || /\d[A-Za-z]/.test(w)
    const isPascal = /^[A-Z][a-z]/.test(w) && !SENTENCE_STARTERS.has(w) && w.length >= 3
    const isCamelMixed = /^[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/.test(w)
    if (isAllCaps || hasTechSep || hasVersion || isPascal || isCamelMixed) add(w)
  })

  const reqRe = /(?:experiencia|conocimiento|manejo|dominio|habilidades?|skills?)\s+(?:en|de|con|sobre|usando?)\s+([\w.+#/áéíóúüñ-]{2,30})/gi
  let m
  while ((m = reqRe.exec(text)) !== null) add(m[1])

  text.toLowerCase().replace(/[^\w\sáéíóúüñ]/gi, ' ').split(/\s+/)
    .filter((w) => w.length > 7 && !STOPWORDS.has(w))
    .forEach((w) => add(w))

  return keywords.slice(0, 35)
}

function cvText(cv: CvData): string {
  return [
    ...cv.experience.flatMap((e) => e.bullets),
    ...cv.leadership.flatMap((l) => l.bullets),
    cv.skills.technical,
    cv.skills.language,
  ].join(' ').toLowerCase()
}

function estimatePages(cv: CvData): number {
  const chars = [
    ...cv.experience.flatMap((e) => e.bullets),
    ...cv.leadership.flatMap((l) => l.bullets),
    ...cv.education.map((e) => `${e.institution} ${e.degree} ${e.coursework ?? ''}`),
    cv.skills.technical,
    cv.skills.language,
  ].join(' ').length
  return Math.max(1, chars / 1800)
}

function getNonAtsBullets(cv: CvData): number {
  return [
    ...cv.experience.flatMap((e) => e.bullets),
    ...cv.leadership.flatMap((l) => l.bullets),
  ].filter((b) => !ATS_VERBS_RE.test(b.trimStart())).length
}

interface MatchAnalysisProps {
  jobOfferText: string
  draftCv: CvData
  customMessage: string
  settings: SettingsDocument | null
  onCustomMessageChange: (msg: string) => void
  onDraftCvChange: (cv: CvData) => void
  onGenerate: () => void
  isGenerating?: boolean
}

export function MatchAnalysis({
  jobOfferText,
  draftCv,
  customMessage,
  settings,
  onCustomMessageChange,
  onDraftCvChange,
  onGenerate,
  isGenerating,
}: MatchAnalysisProps) {
  const [isFixingAts, setIsFixingAts] = useState(false)

  const keywords = useMemo(() => extractKeywords(jobOfferText), [jobOfferText])
  const allCvText = useMemo(() => cvText(draftCv), [draftCv])

  const keywordMatches = useMemo(() =>
    keywords.map((kw) => ({ keyword: kw, found: allCvText.includes(kw.toLowerCase()) })),
    [keywords, allCvText]
  )

  const matchScore = useMemo(() => {
    if (keywordMatches.length === 0) return 0
    return Math.round((keywordMatches.filter((k) => k.found).length / keywordMatches.length) * 100)
  }, [keywordMatches])

  const pages = useMemo(() => estimatePages(draftCv), [draftCv])
  const nonAtsCount = useMemo(() => getNonAtsBullets(draftCv), [draftCv])
  const missingKeywords = keywordMatches.filter((k) => !k.found).slice(0, 5)
  const foundKeywords = keywordMatches.filter((k) => k.found).slice(0, 8)

  const totalBullets = draftCv.experience.reduce((s, e) => s + e.bullets.length, 0) +
    draftCv.leadership.reduce((s, l) => s + l.bullets.length, 0)

  const scoreColor =
    matchScore >= 70 ? 'text-green-600 dark:text-green-400' :
    matchScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400'

  const scoreBg =
    matchScore >= 70 ? 'bg-green-500' :
    matchScore >= 40 ? 'bg-amber-500' :
    'bg-red-500'

  async function handleFixAts() {
    if (!settings?.aiApiKey) return
    setIsFixingAts(true)
    const updated = await improveNonAtsBullets(draftCv, jobOfferText, settings)
    onDraftCvChange(updated)
    setIsFixingAts(false)
  }

  return (
    <div className="space-y-4">
      {/* Match Score */}
      {keywords.length > 0 && (
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Match con la oferta</p>
            <span className={cn('text-lg font-bold', scoreColor)}>{matchScore}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500', scoreBg)} style={{ width: `${matchScore}%` }} />
          </div>
          <div className="space-y-1">
            {foundKeywords.map(({ keyword }) => (
              <div key={keyword} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                <span className="text-[11px] text-foreground">{keyword}</span>
              </div>
            ))}
            {missingKeywords.map(({ keyword }) => (
              <div key={keyword} className="flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3 shrink-0 text-amber-500" />
                <span className="text-[11px] text-muted-foreground">{keyword}</span>
                <span className="text-[10px] text-muted-foreground/60">no cubierto</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Alertas</p>

        <AlertRow
          icon={<FileText className="h-3.5 w-3.5" />}
          variant={pages > 3 ? 'error' : pages > 2 ? 'warn' : 'ok'}
          message={
            pages > 3 ? `~${pages.toFixed(1)} páginas — reduce bullets` :
            pages > 2 ? `~${pages.toFixed(1)} páginas — considera reducir` :
            `~${pages.toFixed(1)} página${pages >= 1.5 ? 's' : ''} estimada`
          }
        />

        {nonAtsCount > 0 && (
          <div className="rounded-md px-2.5 py-1.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{nonAtsCount} bullet{nonAtsCount > 1 ? 's' : ''} sin verbo de impacto</span>
              {settings?.aiApiKey && (
                <button
                  type="button"
                  disabled={isFixingAts}
                  onClick={handleFixAts}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                >
                  {isFixingAts
                    ? <span className="h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" />
                    : <Sparkles className="h-2.5 w-2.5" />}
                  {isFixingAts ? 'Mejorando…' : 'Mejorar'}
                </button>
              )}
            </div>
          </div>
        )}

        {missingKeywords.length > 0 && (
          <AlertRow
            icon={<Key className="h-3.5 w-3.5" />}
            variant="warn"
            message={`${missingKeywords.length} requisito${missingKeywords.length > 1 ? 's' : ''} clave sin cubrir`}
          />
        )}

        {totalBullets === 0 && (
          <AlertRow icon={<AlertCircle className="h-3.5 w-3.5" />} variant="error" message="Agrega al menos un bullet al CV" />
        )}
      </div>

      {/* Custom message */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Contexto adicional para la IA</p>
        <textarea
          value={customMessage}
          onChange={(e) => onCustomMessageChange(e.target.value)}
          placeholder='Ej: "Menciona experiencia con Go aunque sea de proyectos personales"'
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-y min-h-[64px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={totalBullets === 0 || isGenerating}
        className={cn(
          'w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2',
          totalBullets > 0 && !isGenerating
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        )}
      >
        {isGenerating ? (
          <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Generando CV…</>
        ) : (
          `Optimizar con IA (${totalBullets} bullets)`
        )}
      </button>
    </div>
  )
}

function AlertRow({ icon, variant, message }: { icon: React.ReactNode; variant: 'ok' | 'warn' | 'error'; message: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs',
      variant === 'ok' && 'bg-green-500/10 text-green-700 dark:text-green-400',
      variant === 'warn' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      variant === 'error' && 'bg-red-500/10 text-red-700 dark:text-red-400',
    )}>
      <span className="shrink-0">{icon}</span>
      {message}
    </div>
  )
}
