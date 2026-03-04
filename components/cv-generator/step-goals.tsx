'use client'

import { useState } from 'react'
import { Pencil, Check, X, ChevronDown, ChevronUp, Sparkles, MessageSquare, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MatchAnalysis } from './match-analysis'
import { CvEditor } from './cv-editor'
import { AiChat } from './ai-chat'
import { cn } from '@/lib/utils'
import { improveBullet } from '@/lib/ai-cv'
import type { BulletsBySection, BulletState, ChatMessage, ChatStyle } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

interface StepGoalsProps {
  cvData: CvData
  selections: BulletsBySection
  draftCv: CvData
  isAnalyzing: boolean
  jobOfferText: string
  customMessage: string
  settings: SettingsDocument | null
  isGenerating?: boolean
  onSelectionsChange: (selections: BulletsBySection) => void
  onDraftCvChange: (cv: CvData) => void
  onCustomMessageChange: (msg: string) => void
  onNext: () => void
  onBack: () => void
}

export function StepGoals({
  cvData,
  selections,
  draftCv,
  isAnalyzing,
  jobOfferText,
  customMessage,
  settings,
  isGenerating,
  onSelectionsChange,
  onDraftCvChange,
  onCustomMessageChange,
  onNext,
  onBack,
}: StepGoalsProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatStyle, setChatStyle] = useState<ChatStyle>('normal')
  const [offerOpen, setOfferOpen] = useState(false)

  const totalSelected = Object.values(selections).reduce(
    (sum, bullets) => sum + bullets.filter((b) => b.selected).length,
    0
  )

  function setItemBullets(id: string, bullets: BulletState[]) {
    onSelectionsChange({ ...selections, [id]: bullets })
  }

  const sections = [
    ...cvData.experience.map((exp) => ({
      id: exp.id,
      header: exp.organization,
      subheader: exp.title,
      dates: exp.dates,
    })),
    ...cvData.leadership.map((lead) => ({
      id: lead.id,
      header: lead.organization,
      subheader: lead.role,
      dates: lead.dates,
    })),
  ]

  const lastMessage = chatMessages[chatMessages.length - 1]

  return (
    <div className="space-y-3">
      {isAnalyzing && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm text-primary">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Analizando oferta y seleccionando bullets relevantes…
        </div>
      )}

      {/* Toolbar row */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOfferOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card hover:bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Ver oferta laboral
        </button>
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

          <div className="flex-1 overflow-y-auto space-y-0 rounded-md border border-border/40 min-h-0">
            {sections.map((section) => {
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
                  jobOfferText={jobOfferText}
                  settings={settings}
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

        {/* Column 3: Match analysis + chat trigger */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          <MatchAnalysis
            jobOfferText={jobOfferText}
            draftCv={draftCv}
            customMessage={customMessage}
            settings={settings}
            onCustomMessageChange={onCustomMessageChange}
            onDraftCvChange={onDraftCvChange}
            onGenerate={onNext}
            isGenerating={isGenerating}
          />

          {/* Chat trigger card */}
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group w-full rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Chat con IA</span>
              </div>
              {chatMessages.length > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {chatMessages.length}
                </span>
              )}
            </div>
            {lastMessage ? (
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {lastMessage.role === 'assistant' ? '✦ ' : ''}
                {lastMessage.content}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/60">
                Consulta al asistente sobre tu CV, la oferta o mejoras específicas…
              </p>
            )}
            <p className="mt-2 text-[10px] text-primary/70 font-medium group-hover:text-primary transition-colors">
              Abrir chat →
            </p>
          </button>
        </div>
      </div>

      {/* Job offer dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Oferta laboral
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {jobOfferText ? (
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground font-sans">
                {jobOfferText}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground italic">No se ingresó texto de oferta laboral.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

function SectionGroup({
  header,
  subheader,
  dates,
  bullets,
  selectedCount,
  jobOfferText,
  settings,
  onChange,
}: {
  header: string
  subheader: string
  dates: string
  bullets: BulletState[]
  selectedCount: number
  jobOfferText: string
  settings: SettingsDocument | null
  onChange: (bullets: BulletState[]) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [aiInputIdx, setAiInputIdx] = useState<number | null>(null)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiLoadingIdx, setAiLoadingIdx] = useState<number | null>(null)

  function toggle(i: number) {
    const next = [...bullets]
    next[i] = { ...next[i], selected: !next[i].selected }
    onChange(next)
  }

  function startEdit(i: number) {
    setEditingIdx(i)
    setEditText(bullets[i].text)
    setAiInputIdx(null)
  }

  function saveEdit(i: number) {
    const next = [...bullets]
    next[i] = { ...next[i], text: editText }
    onChange(next)
    setEditingIdx(null)
  }

  function openAiInput(i: number) {
    setAiInputIdx(i)
    setAiInstruction('')
    setEditingIdx(null)
  }

  async function handleAiImprove(i: number) {
    if (!aiInstruction.trim() || !settings) return
    setAiLoadingIdx(i)
    const improved = await improveBullet(bullets[i].text, aiInstruction, jobOfferText, settings)
    const next = [...bullets]
    next[i] = { ...next[i], text: improved }
    onChange(next)
    setAiInputIdx(null)
    setAiInstruction('')
    setAiLoadingIdx(null)
  }

  return (
    <div className="border-b border-border/40 last:border-0">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors sticky top-0 z-10 bg-card border-b border-border/30"
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

                {editingIdx === i ? (
                  <div className="flex-1 space-y-1.5">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px] text-xs resize-y"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs gap-1" onClick={() => saveEdit(i)}>
                        <Check className="h-3 w-3" /> Guardar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setEditingIdx(null)}>
                        <X className="h-3 w-3" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-relaxed">{bullet.text}</p>

                    {aiInputIdx === i && (
                      <div className="mt-1.5 flex gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={aiInstruction}
                          onChange={(e) => setAiInstruction(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAiImprove(i)
                            if (e.key === 'Escape') setAiInputIdx(null)
                          }}
                          placeholder='Ej: "hazlo más conciso"'
                          className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                        />
                        <button
                          type="button"
                          disabled={!aiInstruction.trim() || aiLoadingIdx === i}
                          onClick={() => handleAiImprove(i)}
                          className="flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                        >
                          {aiLoadingIdx === i
                            ? <span className="h-2.5 w-2.5 animate-spin rounded-full border border-primary-foreground border-t-transparent inline-block" />
                            : <Sparkles className="h-2.5 w-2.5" />
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiInputIdx(null)}
                          className="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {editingIdx !== i && (
                  <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    {settings?.aiApiKey && (
                      <button
                        type="button"
                        onClick={() => aiInputIdx === i ? setAiInputIdx(null) : openAiInput(i)}
                        className={cn(
                          'transition-colors p-0.5',
                          aiInputIdx === i ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary'
                        )}
                        title="Mejorar con IA"
                      >
                        <Sparkles className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="text-muted-foreground/40 hover:text-foreground transition-colors p-0.5"
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
