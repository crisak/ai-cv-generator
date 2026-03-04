'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Sparkles, MessageSquare, FileText, Eye, Search, Briefcase, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MatchAnalysis } from './match-analysis'
import { CvEditor } from './cv-editor'
import { AiChat } from './ai-chat'
import { CvPreviewDialog } from './cv-preview-dialog'
import { CvOptimizeDialog } from './cv-optimize-dialog'
import { cn } from '@/lib/utils'
import type { BulletsBySection, BulletState, ChatMessage, ChatStyle } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

const OPTIMIZE_SUGGESTIONS = [
  'Enfócate en habilidades técnicas relevantes',
  'Optimiza para sistemas ATS',
  'Añade métricas y resultados cuantificables',
  'Resalta liderazgo y gestión de equipos',
]

interface StepGoalsProps {
  cvData: CvData
  selections: BulletsBySection
  draftCv: CvData
  isAnalyzing: boolean
  jobOfferText: string
  settings: SettingsDocument | null
  isOptimizing?: boolean
  optimizedCv: CvData | null
  onSelectionsChange: (selections: BulletsBySection) => void
  onDraftCvChange: (cv: CvData) => void
  onContinue: () => void
  onOptimize: (msg: string) => void
  onOptimizeConfirm: (cv: CvData) => void
  onOptimizeCancel: () => void
  onBack: () => void
}

export function StepGoals({
  cvData,
  selections,
  draftCv,
  isAnalyzing,
  jobOfferText,
  settings,
  isOptimizing,
  optimizedCv,
  onSelectionsChange,
  onDraftCvChange,
  onContinue,
  onOptimize,
  onOptimizeConfirm,
  onOptimizeCancel,
  onBack,
}: StepGoalsProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatStyle, setChatStyle] = useState<ChatStyle>('normal')
  const [offerOpen, setOfferOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [offerSearch, setOfferSearch] = useState('')
  const [offerMatchIdx, setOfferMatchIdx] = useState(0)
  const [offerMatchTotal, setOfferMatchTotal] = useState(0)
  const offerListRef = useRef<HTMLDivElement>(null)
  const [bulletSearch, setBulletSearch] = useState('')
  const [matchIdx, setMatchIdx] = useState(0)
  const [matchTotal, setMatchTotal] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const [optimizeContextOpen, setOptimizeContextOpen] = useState(false)
  const [optimizeMessage, setOptimizeMessage] = useState('')

  const totalSelected = Object.values(selections).reduce(
    (sum, bullets) => sum + bullets.filter((b) => b.selected).length,
    0
  )

  useEffect(() => {
    if (!bulletSearch.trim()) {
      setMatchTotal(0)
      setMatchIdx(0)
      return
    }
    const timer = setTimeout(() => {
      if (!listRef.current) return
      const marks = listRef.current.querySelectorAll('mark[data-match]')
      const total = marks.length
      setMatchTotal(total)
      setMatchIdx(0)
      if (marks[0]) {
        highlightMark(marks, 0)
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [bulletSearch])

  useEffect(() => {
    if (!offerSearch.trim()) {
      setOfferMatchTotal(0)
      setOfferMatchIdx(0)
      return
    }
    const timer = setTimeout(() => {
      if (!offerListRef.current) return
      const marks = offerListRef.current.querySelectorAll('mark[data-match]')
      const total = marks.length
      setOfferMatchTotal(total)
      setOfferMatchIdx(0)
      if (marks[0]) {
        highlightMark(marks, 0)
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [offerSearch])

  function navigateOfferMatch(dir: 1 | -1) {
    if (!offerListRef.current) return
    const marks = offerListRef.current.querySelectorAll('mark[data-match]')
    const total = marks.length
    if (total === 0) return
    const nextIdx = (offerMatchIdx + dir + total) % total
    setOfferMatchIdx(nextIdx)
    setOfferMatchTotal(total)
    highlightMark(marks, nextIdx)
    marks[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function highlightMark(marks: NodeListOf<Element>, idx: number) {
    marks.forEach((m, i) => {
      const el = m as HTMLElement
      el.style.boxShadow = i === idx ? '0 0 0 2px #f59e0b' : ''
    })
  }

  function navigateMatch(dir: 1 | -1) {
    if (!listRef.current) return
    const marks = listRef.current.querySelectorAll('mark[data-match]')
    const total = marks.length
    if (total === 0) return
    const nextIdx = (matchIdx + dir + total) % total
    setMatchIdx(nextIdx)
    setMatchTotal(total)
    highlightMark(marks, nextIdx)
    marks[nextIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function setItemBullets(id: string, bullets: BulletState[]) {
    onSelectionsChange({ ...selections, [id]: bullets })
  }

  const experienceSections = cvData.experience.map((exp) => ({
    id: exp.id,
    header: exp.organization,
    subheader: exp.title,
    dates: exp.dates,
  }))

  const leadershipSections = cvData.leadership.map((lead) => ({
    id: lead.id,
    header: lead.organization,
    subheader: lead.role,
    dates: lead.dates,
  }))

  function handleOptimizeConfirmClick() {
    setOptimizeContextOpen(false)
    onOptimize(optimizeMessage)
  }

  return (
    <div className="space-y-3">
      {isAnalyzing && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm text-primary">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Analizando oferta y seleccionando bullets relevantes…
        </div>
      )}

      {/* Toolbar row */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip label="Previsualiza el CV y verifica que no supere 1 página">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card hover:bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Vista previa
          </button>
        </Tooltip>
        <Tooltip label="Consulta el texto completo de la oferta laboral">
          <button
            type="button"
            onClick={() => setOfferOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card hover:bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver oferta
          </button>
        </Tooltip>
        <Tooltip label="Ajusta bullets individuales con ayuda del chat de IA">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card hover:bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat con IA
            {chatMessages.length > 0 && (
              <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-medium text-primary">
                {chatMessages.length}
              </span>
            )}
          </button>
        </Tooltip>
        <Tooltip label="La IA optimiza todo el CV para hacer mejor match con la oferta">
          <button
            type="button"
            disabled={isOptimizing}
            onClick={() => setOptimizeContextOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 text-xs text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOptimizing
              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            {isOptimizing ? 'Optimizando…' : 'Optimizar con IA'}
          </button>
        </Tooltip>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-[300px_1fr_300px] gap-4 h-[calc(100vh-280px)]">

        {/* Column 1: Bullets checklist */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{totalSelected}</span> bullets seleccionados
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  const all: BulletsBySection = {}
                  Object.entries(selections).forEach(([id, bullets]) => {
                    all[id] = bullets.map((b) => ({ ...b, selected: true }))
                  })
                  onSelectionsChange(all)
                }}
              >
                Todos
              </button>
              <span className="text-muted-foreground/40 text-[10px]">·</span>
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  const none: BulletsBySection = {}
                  Object.entries(selections).forEach(([id, bullets]) => {
                    none[id] = bullets.map((b) => ({ ...b, selected: false }))
                  })
                  onSelectionsChange(none)
                }}
              >
                Ninguno
              </button>
            </div>
          </div>

          {/* Search bar — fixed */}
          <div className="flex items-center gap-1.5 rounded-md border border-input bg-muted/30 px-2.5 py-1.5 shrink-0">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={bulletSearch}
              onChange={(e) => setBulletSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); navigateMatch(e.shiftKey ? -1 : 1) }
                if (e.key === 'Escape') setBulletSearch('')
              }}
              placeholder="Buscar tecnología, herramienta…"
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/50 min-w-0"
            />
            {bulletSearch && (
              <>
                {matchTotal > 0 ? (
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {matchIdx + 1}/{matchTotal}
                  </span>
                ) : (
                  <span className="text-[10px] text-red-500/70 shrink-0">Sin resultados</span>
                )}
                <div className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateMatch(-1)}
                    disabled={matchTotal === 0}
                    title="Anterior (Shift+Enter)"
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMatch(1)}
                    disabled={matchTotal === 0}
                    title="Siguiente (Enter)"
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button type="button" onClick={() => setBulletSearch('')} className="text-muted-foreground/60 hover:text-foreground shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto rounded-md border border-border/40 min-h-0">
            {/* Experiencia */}
            {experienceSections.some((s) => (selections[s.id] ?? []).length > 0) && (
              <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-1.5 bg-muted/60 backdrop-blur-md border-b border-border/40">
                <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Experiencia</span>
              </div>
            )}
            {experienceSections.map((section) => {
              const bullets = selections[section.id] ?? []
              const selectedCount = bullets.filter((b) => b.selected).length
              if (bullets.length === 0) return null
              return (
                <SectionGroup
                  key={section.id}
                  header={section.header}
                  subheader={section.subheader}
                  dates={section.dates}
                  bullets={bullets}
                  selectedCount={selectedCount}
                  searchQuery={bulletSearch}
                  onChange={(updated) => setItemBullets(section.id, updated)}
                />
              )
            })}

            {/* Liderazgo */}
            {leadershipSections.some((s) => (selections[s.id] ?? []).length > 0) && (
              <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-1.5 bg-muted/60 backdrop-blur-md border-y border-border/40">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Liderazgo</span>
              </div>
            )}
            {leadershipSections.map((section) => {
              const bullets = selections[section.id] ?? []
              const selectedCount = bullets.filter((b) => b.selected).length
              if (bullets.length === 0) return null
              return (
                <SectionGroup
                  key={section.id}
                  header={section.header}
                  subheader={section.subheader}
                  dates={section.dates}
                  bullets={bullets}
                  selectedCount={selectedCount}
                  searchQuery={bulletSearch}
                  onChange={(updated) => setItemBullets(section.id, updated)}
                />
              )
            })}
          </div>

          <Button variant="outline" size="sm" onClick={onBack} className="w-full shrink-0">
            Atrás
          </Button>
        </div>

        {/* Column 2: Editable CV preview */}
        <div className="min-h-0 overflow-y-auto rounded-md border border-border/40">
          <CvEditor
            draftCv={draftCv}
            jobOfferText={jobOfferText}
            settings={settings}
            originalCv={cvData}
            onChange={onDraftCvChange}
          />
        </div>

        {/* Column 3: Match analysis — fills height internally */}
        <div className="min-h-0 flex flex-col">
          <MatchAnalysis
            jobOfferText={jobOfferText}
            draftCv={draftCv}
            settings={settings}
            onDraftCvChange={onDraftCvChange}
            onContinue={onContinue}
          />
        </div>
      </div>

      {/* Job offer dialog */}
      <Dialog open={offerOpen} onOpenChange={(o) => { setOfferOpen(o); if (!o) setOfferSearch('') }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Oferta laboral
            </DialogTitle>
          </DialogHeader>
          {jobOfferText && (
            <div className="shrink-0 flex items-center gap-1.5 rounded-md border border-input bg-muted/30 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); navigateOfferMatch(e.shiftKey ? -1 : 1) }
                  if (e.key === 'Escape') setOfferSearch('')
                }}
                placeholder="Buscar en la oferta…"
                className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/50 min-w-0"
              />
              {offerSearch && (
                <>
                  {offerMatchTotal > 0 ? (
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {offerMatchIdx + 1}/{offerMatchTotal}
                    </span>
                  ) : (
                    <span className="text-[10px] text-red-500/70 shrink-0">Sin resultados</span>
                  )}
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateOfferMatch(-1)}
                      disabled={offerMatchTotal === 0}
                      title="Anterior (Shift+Enter)"
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateOfferMatch(1)}
                      disabled={offerMatchTotal === 0}
                      title="Siguiente (Enter)"
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setOfferSearch('')} className="text-muted-foreground/60 hover:text-foreground shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )}
          <div ref={offerListRef} className="flex-1 overflow-y-auto">
            {jobOfferText ? (
              <HighlightedJobOffer text={jobOfferText} query={offerSearch} />
            ) : (
              <p className="text-sm text-muted-foreground italic">No se ingresó texto de oferta laboral.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Optimize context modal */}
      <Dialog open={optimizeContextOpen} onOpenChange={setOptimizeContextOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Optimizar CV con IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              La IA revisará cada bullet y las habilidades técnicas para hacerlos match con la oferta. Puedes añadir contexto adicional (opcional).
            </p>
            <Textarea
              placeholder="Ej: Enfócate en mi experiencia con microservicios, ignora los proyectos de 2019…"
              value={optimizeMessage}
              onChange={(e) => setOptimizeMessage(e.target.value)}
              className="min-h-[80px] text-xs resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {OPTIMIZE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOptimizeMessage(s)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] transition-colors',
                    optimizeMessage === s
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOptimizeContextOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleOptimizeConfirmClick} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Optimizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CV Preview dialog */}
      <CvPreviewDialog cv={draftCv} open={previewOpen} onOpenChange={setPreviewOpen} />

      {/* AI Optimize diff dialog */}
      <CvOptimizeDialog
        open={optimizedCv !== null}
        onOpenChange={(o) => { if (!o) onOptimizeCancel() }}
        draftCv={draftCv}
        optimizedCv={optimizedCv}
        onConfirm={onOptimizeConfirm}
      />

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-[480px] sm:w-[480px] p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-primary" />
              Chat con IA — Asistente de CV
            </SheetTitle>
            {!settings?.aiApiKey && (
              <p className="text-[11px] text-muted-foreground/70 font-normal mt-0.5">
                Configura una API key en Configuración para activar el chat.
              </p>
            )}
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <AiChat
              draftCv={draftCv}
              jobOfferText={jobOfferText}
              settings={settings}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              isLoading={chatLoading}
              onLoadingChange={setChatLoading}
              style={chatStyle}
              onStyleChange={setChatStyle}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 pointer-events-none">
        <div className="rounded-md border border-border/60 bg-popover px-2.5 py-1.5 text-[10px] text-popover-foreground shadow-md whitespace-nowrap max-w-[200px] text-center leading-snug">
          {label}
        </div>
      </div>
    </div>
  )
}

function HighlightedJobOffer({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans">{text}</pre>
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} data-match className="bg-yellow-200 dark:bg-yellow-600/50 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </pre>
  )
}

function SectionGroup({
  header,
  subheader,
  dates,
  bullets,
  selectedCount,
  searchQuery,
  onChange,
}: {
  header: string
  subheader: string
  dates: string
  bullets: BulletState[]
  selectedCount: number
  searchQuery?: string
  onChange: (bullets: BulletState[]) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  function toggle(i: number) {
    const next = [...bullets]
    next[i] = { ...next[i], selected: !next[i].selected }
    onChange(next)
  }

  return (
    <div className="border-b border-border/40 last:border-0">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors sticky top-7 z-10 bg-card border-b border-border/30"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">{header}</span>
            <span className="text-[10px] text-muted-foreground truncate">— {subheader}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{dates}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {selectedCount}/{bullets.length}
          </Badge>
          {collapsed
            ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
            : <ChevronUp className="h-3 w-3 text-muted-foreground" />
          }
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="flex gap-2 px-3 py-1 bg-muted/20">
            <button type="button" onClick={() => onChange(bullets.map((b) => ({ ...b, selected: true })))} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Todos
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button type="button" onClick={() => onChange(bullets.map((b) => ({ ...b, selected: false })))} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Ninguno
            </button>
          </div>

          <div className="divide-y divide-border/30">
            {bullets.map((bullet, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2 px-3 py-2 items-start transition-colors',
                  bullet.selected ? 'bg-background' : 'bg-muted/20 opacity-60'
                )}
              >
                <Checkbox
                  checked={bullet.selected}
                  onCheckedChange={() => toggle(i)}
                  className="mt-0.5 shrink-0"
                />
                <p className="flex-1 text-[11px] leading-relaxed min-w-0">
                  <HighlightText text={bullet.text} query={searchQuery ?? ''} />
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} data-match className="bg-yellow-200 dark:bg-yellow-600/50 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
