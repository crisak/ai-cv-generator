'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  FileText,
  Eye,
  Search,
  Briefcase,
  Users,
  Link2,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  draftBulletIds: Record<string, string[]>
  isAnalyzing: boolean
  jobOfferText: string
  settings: SettingsDocument | null
  isOptimizing?: boolean
  optimizedCv: CvData | null
  onSelectionsChange: (selections: BulletsBySection) => void
  onDraftCvChange: (cv: CvData) => void
  onBulletAdded?: (sectionId: string) => void
  onBulletDeleted?: (sectionId: string, bulletIndex: number) => void
  onSectionDeleted?: (sectionId: string) => void
  onBulletMoved?: (
    fromSectionId: string,
    fromIndex: number,
    toSectionId: string,
    toIndex: number
  ) => void
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
  draftBulletIds,
  isAnalyzing,
  jobOfferText,
  settings,
  isOptimizing,
  optimizedCv,
  onSelectionsChange,
  onDraftCvChange,
  onBulletAdded,
  onBulletDeleted,
  onSectionDeleted,
  onBulletMoved,
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
  const [chatWidth, setChatWidth] = useState(480)
  const [isChatResizing, setIsChatResizing] = useState(false)
  const chatWidthStartRef = useRef({ x: 0, width: 0 })
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
  const [hoveredBulletId, setHoveredBulletId] = useState<string | null>(null)
  const [col1Collapsed, setCol1Collapsed] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const handleChatResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsChatResizing(true)
      chatWidthStartRef.current = { x: e.clientX, width: chatWidth }
    },
    [chatWidth]
  )

  useEffect(() => {
    if (!isChatResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - chatWidthStartRef.current.x
      const newWidth = Math.min(900, Math.max(400, chatWidthStartRef.current.width - delta))
      setChatWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsChatResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isChatResizing])

  const allSectionIds = [
    ...cvData.experience.map((e) => e.id),
    ...cvData.leadership.map((l) => l.id),
  ].filter((id) => (selections[id] ?? []).length > 0)

  const allSectionsCollapsed =
    allSectionIds.length > 0 && allSectionIds.every((id) => collapsedSections[id])

  const toggleAllSections = useCallback(() => {
    const nextState = !allSectionsCollapsed
    const next: Record<string, boolean> = {}
    allSectionIds.forEach((id) => {
      next[id] = nextState
    })
    setCollapsedSections(next)
  }, [allSectionsCollapsed, allSectionIds])

  const setSectionCollapsed = useCallback((id: string, collapsed: boolean) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: collapsed }))
  }, [])

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
        <div className="bg-primary/10 border-primary/20 text-primary flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm">
          <div className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
          Analizando oferta y seleccionando bullets relevantes…
        </div>
      )}

      {/* Toolbar row */}
      <div className="flex items-center justify-end gap-2">
        <Tooltip label="Previsualiza el CV y verifica que no supere 1 página">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Vista previa
          </button>
        </Tooltip>
        <Tooltip label="Consulta el texto completo de la oferta laboral">
          <button
            type="button"
            onClick={() => setOfferOpen(true)}
            className="border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver oferta
          </button>
        </Tooltip>
        <Tooltip label="Ajusta bullets individuales con ayuda del chat de IA">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat con IA
            {chatMessages.length > 0 && (
              <span className="bg-primary/20 text-primary rounded-full px-1.5 text-[10px] font-medium">
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
            className="border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isOptimizing ? (
              <span className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isOptimizing ? 'Optimizando…' : 'Optimizar con IA'}
          </button>
        </Tooltip>
      </div>

      {/* 3-column layout */}
      <div
        className={cn(
          'grid h-[calc(100vh-280px)] gap-4 transition-[grid-template-columns] duration-300 ease-in-out',
          col1Collapsed ? 'grid-cols-[0px_1fr_300px]' : 'grid-cols-[300px_1fr_300px]'
        )}
      >
        {/* Column 1: Bullets checklist */}
        <div
          className={cn(
            'flex min-h-0 flex-col gap-2 transition-opacity duration-300',
            col1Collapsed ? 'pointer-events-none overflow-hidden opacity-0' : 'opacity-100'
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-medium">{totalSelected}</span> bullets
              seleccionados
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
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
                className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
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
              <span className="text-muted-foreground/40 text-[10px]">·</span>
              <Tooltip
                label={
                  allSectionsCollapsed
                    ? 'Expandir todas las secciones'
                    : 'Colapsar todas las secciones'
                }
              >
                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Search bar — fixed */}
          <div className="border-input bg-muted/30 flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5">
            <Search className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <input
              type="text"
              value={bulletSearch}
              onChange={(e) => setBulletSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  navigateMatch(e.shiftKey ? -1 : 1)
                }
                if (e.key === 'Escape') setBulletSearch('')
              }}
              placeholder="Buscar tecnología, herramienta…"
              className="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-xs focus:outline-none"
            />
            {bulletSearch && (
              <>
                {matchTotal > 0 ? (
                  <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                    {matchIdx + 1}/{matchTotal}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-red-500/70">Sin resultados</span>
                )}
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => navigateMatch(-1)}
                    disabled={matchTotal === 0}
                    title="Anterior (Shift+Enter)"
                    className="text-muted-foreground hover:text-foreground p-0.5 transition-colors disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMatch(1)}
                    disabled={matchTotal === 0}
                    title="Siguiente (Enter)"
                    className="text-muted-foreground hover:text-foreground p-0.5 transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setBulletSearch('')}
                  className="text-muted-foreground/60 hover:text-foreground shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          <div
            ref={listRef}
            className="border-border/40 min-h-0 flex-1 overflow-y-auto rounded-md border"
          >
            {/* Experiencia */}
            {experienceSections.some((s) => (selections[s.id] ?? []).length > 0) && (
              <div className="bg-muted/60 border-border/40 sticky top-0 z-20 flex items-center gap-2 border-b px-3 py-1.5 backdrop-blur-md">
                <Briefcase className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Experiencia
                </span>
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
                  activeBulletId={hoveredBulletId}
                  onBulletHover={setHoveredBulletId}
                  onBulletLeave={() => setHoveredBulletId(null)}
                  collapsed={!!collapsedSections[section.id]}
                  onCollapsedChange={(c) => setSectionCollapsed(section.id, c)}
                />
              )
            })}

            {/* Liderazgo */}
            {leadershipSections.some((s) => (selections[s.id] ?? []).length > 0) && (
              <div className="bg-muted/60 border-border/40 sticky top-0 z-20 flex items-center gap-2 border-y px-3 py-1.5 backdrop-blur-md">
                <Users className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                  Liderazgo
                </span>
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
                  activeBulletId={hoveredBulletId}
                  onBulletHover={setHoveredBulletId}
                  onBulletLeave={() => setHoveredBulletId(null)}
                  collapsed={!!collapsedSections[section.id]}
                  onCollapsedChange={(c) => setSectionCollapsed(section.id, c)}
                />
              )
            })}
          </div>

          <Button variant="outline" size="sm" onClick={onBack} className="w-full shrink-0">
            Atrás
          </Button>
        </div>

        {/* Column 2: Editable CV preview — with collapse toggle */}
        <div className="relative flex min-h-0 gap-0">
          <Tooltip label={col1Collapsed ? 'Mostrar experiencia' : 'Ocultar experiencia'}>
            <button
              type="button"
              onClick={() => setCol1Collapsed(!col1Collapsed)}
              className="border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground absolute top-1/2 left-0 z-10 flex h-8 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border shadow-sm transition-colors"
            >
              {col1Collapsed ? (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )}
            </button>
          </Tooltip>
          <div className="border-border/40 min-h-0 flex-1 overflow-y-auto rounded-md border">
            <CvEditor
              draftCv={draftCv}
              jobOfferText={jobOfferText}
              settings={settings}
              originalCv={cvData}
              onChange={onDraftCvChange}
              onBulletAdded={onBulletAdded}
              onBulletDeleted={onBulletDeleted}
              onSectionDeleted={onSectionDeleted}
              onBulletMoved={onBulletMoved}
              draftBulletIds={draftBulletIds}
              hoveredBulletId={hoveredBulletId}
              onBulletHover={setHoveredBulletId}
              onBulletLeave={() => setHoveredBulletId(null)}
            />
          </div>
        </div>

        {/* Column 3: Match analysis — fills height internally */}
        <div className="flex min-h-0 flex-col">
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
      <Dialog
        open={offerOpen}
        onOpenChange={(o) => {
          setOfferOpen(o)
          if (!o) setOfferSearch('')
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="text-primary h-4 w-4" />
              Oferta laboral
            </DialogTitle>
          </DialogHeader>
          {jobOfferText && (
            <div className="border-input bg-muted/30 flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5">
              <Search className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <input
                type="text"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    navigateOfferMatch(e.shiftKey ? -1 : 1)
                  }
                  if (e.key === 'Escape') setOfferSearch('')
                }}
                placeholder="Buscar en la oferta…"
                className="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-xs focus:outline-none"
              />
              {offerSearch && (
                <>
                  {offerMatchTotal > 0 ? (
                    <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                      {offerMatchIdx + 1}/{offerMatchTotal}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-red-500/70">Sin resultados</span>
                  )}
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => navigateOfferMatch(-1)}
                      disabled={offerMatchTotal === 0}
                      title="Anterior (Shift+Enter)"
                      className="text-muted-foreground hover:text-foreground p-0.5 transition-colors disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateOfferMatch(1)}
                      disabled={offerMatchTotal === 0}
                      title="Siguiente (Enter)"
                      className="text-muted-foreground hover:text-foreground p-0.5 transition-colors disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfferSearch('')}
                    className="text-muted-foreground/60 hover:text-foreground shrink-0"
                  >
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
              <p className="text-muted-foreground text-sm italic">
                No se ingresó texto de oferta laboral.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Optimize context modal */}
      <Dialog open={optimizeContextOpen} onOpenChange={setOptimizeContextOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="text-primary h-4 w-4" />
              Optimizar CV con IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              La IA revisará cada bullet y las habilidades técnicas para hacerlos match con la
              oferta. Puedes añadir contexto adicional (opcional).
            </p>
            <Textarea
              placeholder="Ej: Enfócate en mi experiencia con microservicios, ignora los proyectos de 2019…"
              value={optimizeMessage}
              onChange={(e) => setOptimizeMessage(e.target.value)}
              className="min-h-[80px] resize-none text-xs"
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
        onOpenChange={(o) => {
          if (!o) onOptimizeCancel()
        }}
        draftCv={draftCv}
        optimizedCv={optimizedCv}
        onConfirm={onOptimizeConfirm}
      />

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent
          side="right"
          className="flex flex-col overflow-hidden p-0"
          style={{ width: chatWidth, maxWidth: '95vw' }}
        >
          {/* Resize Handle - left edge */}
          <div
            className="absolute top-0 left-0 z-50 flex h-full w-1 cursor-ew-resize items-center justify-center"
            onMouseDown={handleChatResizeStart}
          >
            <div
              className={cn(
                'h-full w-0.5 rounded-full transition-all duration-150',
                isChatResizing
                  ? 'bg-primary opacity-100'
                  : 'group-hover/resize:bg-primary/50 bg-transparent'
              )}
              style={{ opacity: isChatResizing ? 1 : undefined }}
            />
          </div>
          <SheetHeader className="border-border/50 shrink-0 border-b px-5 pt-5 pb-4">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="text-primary h-4 w-4" />
              Chat con IA — Asistente de CV
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">
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
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 group-hover:block">
        <div className="border-border/60 bg-popover text-popover-foreground max-w-[200px] rounded-md border px-2.5 py-1.5 text-center text-[10px] leading-snug whitespace-nowrap shadow-md">
          {label}
        </div>
      </div>
    </div>
  )
}

function HighlightedJobOffer({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return (
      <pre className="text-foreground font-sans text-xs leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
    )
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <pre className="text-foreground font-sans text-xs leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            data-match
            className="text-foreground rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-600/50"
          >
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
  activeBulletId,
  onBulletHover,
  onBulletLeave,
  collapsed,
  onCollapsedChange,
}: {
  header: string
  subheader: string
  dates: string
  bullets: BulletState[]
  selectedCount: number
  searchQuery?: string
  onChange: (bullets: BulletState[]) => void
  activeBulletId?: string | null
  onBulletHover?: (id: string) => void
  onBulletLeave?: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}) {
  function toggle(i: number) {
    const next = [...bullets]
    next[i] = { ...next[i], selected: !next[i].selected }
    onChange(next)
  }

  return (
    <div className="border-border/40 border-b last:border-0">
      <div
        className="hover:bg-muted bg-card border-border/30 sticky top-7 z-10 flex cursor-pointer items-center gap-2 border-b px-3 py-2.5 transition-colors"
        onClick={() => onCollapsedChange(!collapsed)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs font-semibold">{header}</span>
            <span className="text-muted-foreground truncate text-[10px]">— {subheader}</span>
          </div>
          <p className="text-muted-foreground text-[10px]">{dates}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {selectedCount}/{bullets.length}
          </Badge>
          {collapsed ? (
            <ChevronDown className="text-muted-foreground h-3 w-3" />
          ) : (
            <ChevronUp className="text-muted-foreground h-3 w-3" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="bg-muted/20 flex gap-2 px-3 py-1">
            <button
              type="button"
              onClick={() => onChange(bullets.map((b) => ({ ...b, selected: true })))}
              className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
            >
              Todos
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              type="button"
              onClick={() => onChange(bullets.map((b) => ({ ...b, selected: false })))}
              className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
            >
              Ninguno
            </button>
          </div>

          <div className="divide-border/30 divide-y">
            {bullets.map((bullet, i) => {
              // Only link when bullet is selected (unchecked have no col-2 counterpart)
              const isLinked = bullet.selected && activeBulletId === bullet.id
              return (
                <div
                  key={i}
                  data-col1-bullet-id={bullet.id}
                  className={cn(
                    // Layout-stable base: ring + rounded always present, only color transitions
                    'flex items-start gap-2 rounded-sm px-3 py-2',
                    'ring-1 ring-inset',
                    'transition-[background-color,box-shadow,opacity] duration-300 ease-out',
                    bullet.selected ? 'bg-background' : 'bg-muted/20 opacity-60',
                    isLinked
                      ? 'ring-primary/40 !bg-primary/[0.07] !opacity-100'
                      : 'ring-transparent'
                  )}
                  onMouseEnter={() => bullet.selected && onBulletHover?.(bullet.id)}
                  onMouseLeave={onBulletLeave}
                >
                  <Checkbox
                    checked={bullet.selected}
                    onCheckedChange={() => toggle(i)}
                    className="mt-0.5 shrink-0"
                  />
                  <p className="min-w-0 flex-1 text-[11px] leading-relaxed">
                    <HighlightText text={bullet.text} query={searchQuery ?? ''} />
                  </p>
                  {/* Always reserve icon space — opacity-only transition, no layout shift */}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      document
                        .querySelector(`[data-col2-bullet-id="${bullet.id}"]`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                    }
                    className={cn(
                      'text-primary/60 hover:text-primary mt-0.5 shrink-0',
                      'transition-[opacity,color] duration-300 ease-out',
                      bullet.selected && isLinked
                        ? 'cursor-pointer opacity-100'
                        : 'pointer-events-none opacity-0'
                    )}
                  >
                    <Link2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
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
          <mark
            key={i}
            data-match
            className="text-foreground rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-600/50"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
