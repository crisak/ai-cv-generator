'use client'

import { useState, useRef, useEffect, useId } from 'react'
import {
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Link2,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { improveBulletVariants, improveSkills, ATS_VERBS_RE } from '@/lib/ai-cv'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CvData, ExperienceItem, LeadershipItem, EducationItem } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

interface CvEditorProps {
  draftCv: CvData
  jobOfferText: string
  settings: SettingsDocument | null
  originalCv?: CvData
  onChange: (cv: CvData) => void
  onBulletAdded?: (sectionId: string) => void
  onBulletDeleted?: (sectionId: string, bulletIndex: number) => void
  onSectionDeleted?: (sectionId: string) => void
  onBulletMoved?: (
    fromSectionId: string,
    fromIndex: number,
    toSectionId: string,
    toIndex: number
  ) => void
  draftBulletIds?: Record<string, string[]>
  hoveredBulletId?: string | null
  onBulletHover?: (id: string) => void
  onBulletLeave?: () => void
}

// ── Page length estimate ──────────────────────────────────────────────────────

function estimatePageLength(cv: CvData): number {
  const chars = [
    ...cv.experience.flatMap((e) => e.bullets),
    ...cv.leadership.flatMap((l) => l.bullets),
    ...cv.education.map((e) => `${e.institution} ${e.degree} ${e.coursework ?? ''}`),
    cv.skills.technical,
    cv.skills.language,
    cv.skills.interests,
  ].join(' ').length
  return Math.max(1, chars / 1800)
}

// ── Sortable tag pill ────────────────────────────────────────────────────────

function SortableTag({ id, tag, onRemove }: { id: string; tag: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      className="bg-primary/10 border-primary/20 text-primary flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none font-medium select-none"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-primary/40 hover:text-primary/70 -ml-0.5 cursor-grab transition-colors active:cursor-grabbing"
      >
        <GripVertical className="h-2.5 w-2.5" />
      </button>
      {tag}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-primary/50 hover:text-primary ml-0.5 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}

// ── Skills tags field ─────────────────────────────────────────────────────────

function TagsField({
  label,
  value,
  onChange,
  action,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  action?: React.ReactNode
}) {
  const [newTag, setNewTag] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dndId = useId()

  const tags = value
    ? value
        .split(/[,;·|]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const tagIds = tags.map((_, i) => `${dndId}-tag-${i}`)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function removeTag(idx: number) {
    onChange(tags.filter((_, i) => i !== idx).join(', '))
  }

  function commitTag() {
    const trimmed = newTag.trim().replace(/[,;]$/, '')
    if (!trimmed) return
    onChange([...tags, trimmed].join(', '))
    setNewTag('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag()
    }
    if (e.key === 'Backspace' && !newTag && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  function handleTagDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tagIds.indexOf(active.id as string)
    const newIndex = tagIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    onChange(arrayMove(tags, oldIndex, newIndex).join(', '))
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        {action}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTagDragEnd}>
        <SortableContext items={tagIds} strategy={rectSortingStrategy}>
          <div
            className={cn(
              'bg-muted/10 flex cursor-text flex-wrap gap-1.5 rounded-md border px-2 py-1.5 transition-colors',
              focused ? 'border-ring ring-ring ring-1' : 'border-border/50'
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {tags.map((tag, i) => (
              <SortableTag key={tagIds[i]} id={tagIds[i]} tag={tag} onRemove={() => removeTag(i)} />
            ))}
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                commitTag()
                setFocused(false)
              }}
              onFocus={() => setFocused(true)}
              placeholder={tags.length === 0 ? 'Escribe y presiona Enter o coma…' : '+'}
              className="placeholder:text-muted-foreground/40 min-w-[80px] flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── Inline text field editor ──────────────────────────────────────────────────

function InlineField({
  label,
  value,
  onSave,
  multiline = false,
}: {
  label: string
  value: string
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="border-input bg-background focus:ring-ring min-h-[56px] w-full resize-y rounded border px-2 py-1.5 text-xs focus:ring-1 focus:outline-none"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="border-input bg-background focus:ring-ring w-full rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none"
          />
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={save}
            className="bg-primary text-primary-foreground flex items-center gap-1 rounded px-2 py-0.5 text-[10px]"
          >
            <Check className="h-2.5 w-2.5" /> Guardar
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value)
              setEditing(false)
            }}
            className="border-border/60 text-muted-foreground flex items-center gap-1 rounded border px-2 py-0.5 text-[10px]"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-1">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          {label}
        </p>
        <p className="text-foreground text-xs break-words">
          {value || <span className="text-muted-foreground/50 italic">vacío</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── AI Improve Popover ─────────────────────────────────────────────────────────

const AI_BULLET_CHIPS = [
  'Hazlo más conciso y específico',
  'Agrega métricas concretas con contexto',
  'Reemplaza términos vagos por impacto real',
  'Optimiza el verbo de acción para ATS',
]

type PopoverMode = 'input' | 'loading' | 'variants'

function BulletAiPopover({
  bulletText,
  jobOfferText,
  settings,
  onUpdate,
  onClose,
  onLoadingChange,
}: {
  bulletText: string
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (t: string) => void
  onClose: () => void
  onLoadingChange: (loading: boolean) => void
}) {
  const [mode, setMode] = useState<PopoverMode>('input')
  const [instruction, setInstruction] = useState('')
  const [variants, setVariants] = useState<string[]>([])

  async function handleSubmit() {
    if (!instruction.trim()) return
    setMode('loading')
    onLoadingChange(true)
    const result = await improveBulletVariants(bulletText, instruction, jobOfferText, settings)
    onLoadingChange(false)
    if (result.length > 0) {
      setVariants(result)
      setMode('variants')
    } else {
      setMode('input')
    }
  }

  return (
    <div className="border-border bg-popover absolute right-0 bottom-full z-50 mb-1.5 w-96 rounded-lg border text-xs shadow-lg">
      {/* Header with title + X close button */}
      <div className="border-border/40 flex items-center justify-between border-b px-3 py-2">
        <p className="text-foreground text-[10px] font-semibold tracking-wide uppercase">
          {mode === 'variants' ? 'Elige la mejor versión' : 'Mejorar con IA'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground/50 hover:text-foreground transition-colors"
          title="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {mode === 'input' && (
        <div className="space-y-2.5 p-3">
          <textarea
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
              if (e.key === 'Escape') onClose()
            }}
            placeholder='Ej: "hazlo más conciso y agrega impacto cuantificable"'
            className="border-input bg-background focus:ring-ring placeholder:text-muted-foreground/50 min-h-[56px] w-full resize-none rounded border px-2 py-1.5 text-[11px] focus:ring-1 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {AI_BULLET_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInstruction(chip)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                  instruction === chip
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 pt-0.5">
            <button
              type="button"
              disabled={!instruction.trim()}
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" /> Generar variantes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border-border/60 text-muted-foreground hover:text-foreground rounded border px-2 py-1 text-[11px] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'loading' && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 p-6">
          <span className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-[11px]">Generando variantes…</span>
        </div>
      )}

      {mode === 'variants' && (
        <div className="space-y-2 p-3">
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onUpdate(v)
                onClose()
              }}
              className="border-border/50 bg-background hover:bg-muted/40 hover:border-primary/30 w-full rounded-md border p-2 text-left transition-colors"
            >
              <div className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0 text-[10px] font-bold">{i + 1}</span>
                <p className="text-foreground text-[11px] leading-relaxed">{v}</p>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode('input')}
            className="text-muted-foreground hover:text-foreground w-full pt-0.5 text-center text-[10px] transition-colors"
          >
            ← Reintentar con otras instrucciones
          </button>
        </div>
      )}
    </div>
  )
}

// ── Skills AI Popover ─────────────────────────────────────────────────────────

const SKILLS_AI_CHIPS = [
  'Extrae skills de la oferta que coincidan con mi perfil',
  'Genera mínimo 10 skills: match + complemento',
  'Reordena por relevancia para la oferta',
  'Agrega skills técnicas que complementen mi experiencia',
]

type SkillsPopoverMode = 'input' | 'loading' | 'result'

function SkillsAiPopover({
  currentSkills,
  jobOfferText,
  settings,
  onUpdate,
  onClose,
}: {
  currentSkills: string
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (skills: string) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<SkillsPopoverMode>('input')
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const parseSkills = (text: string): string[] => {
    return text
      .split(/[,;·|]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleSubmit() {
    if (!instruction.trim()) return
    setMode('loading')
    const suggested = await improveSkills(jobOfferText, instruction, settings)
    if (suggested) {
      setResult(parseSkills(suggested))
      setMode('result')
    } else {
      setMode('input')
    }
  }

  function removePill(idx: number) {
    setResult(result.filter((_, i) => i !== idx))
  }

  function commitPill() {
    const trimmed = newTag.trim().replace(/[,;]$/, '')
    if (!trimmed) return
    if (!result.includes(trimmed)) {
      setResult([...result, trimmed])
    }
    setNewTag('')
  }

  function handlePillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitPill()
    }
    if (e.key === 'Backspace' && !newTag && result.length > 0) {
      removePill(result.length - 1)
    }
  }

  function handleAccept() {
    const existing = parseSkills(currentSkills)
    const merged = [...existing]
    result.forEach((skill) => {
      if (!merged.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        merged.push(skill)
      }
    })
    onUpdate(merged.join(', '))
    onClose()
  }

  return (
    <div className="border-border bg-popover absolute right-0 bottom-full z-50 mb-1.5 w-96 rounded-lg border text-xs shadow-lg">
      {/* Header */}
      <div className="border-border/40 flex items-center justify-between border-b px-3 py-2">
        <p className="text-foreground text-[10px] font-semibold tracking-wide uppercase">
          {mode === 'result' ? 'Habilidades sugeridas por IA' : 'Mejorar habilidades con IA'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground/50 hover:text-foreground transition-colors"
          title="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {mode === 'input' && (
        <div className="space-y-2.5 p-3">
          <textarea
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
              if (e.key === 'Escape') onClose()
            }}
            placeholder='Ej: "Extrae al menos 10 skills que hagan match con la oferta y agrega complementos"'
            className="border-input bg-background focus:ring-ring placeholder:text-muted-foreground/50 min-h-[56px] w-full resize-none rounded border px-2 py-1.5 text-[11px] focus:ring-1 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {SKILLS_AI_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setInstruction(chip)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
                  instruction === chip
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 pt-0.5">
            <button
              type="button"
              disabled={!instruction.trim()}
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" /> Generar sugerencia
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border-border/60 text-muted-foreground hover:text-foreground rounded border px-2 py-1 text-[11px] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'loading' && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 p-6">
          <span className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-[11px]">Analizando oferta y perfil…</span>
        </div>
      )}

      {mode === 'result' && (
        <div className="space-y-2.5 p-3">
          <p className="text-muted-foreground text-[10px]">
            Edita las sugerencias antes de aceptar:
          </p>
          <div
            className="border-border/50 bg-muted/10 flex min-h-[52px] flex-wrap gap-1.5 rounded-md border px-2 py-1.5"
            onClick={() => inputRef.current?.focus()}
          >
            {result.map((skill, i) => (
              <span
                key={i}
                className="bg-primary/10 border-primary/20 text-primary flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removePill(i)
                  }}
                  className="text-primary/50 hover:text-primary ml-0.5 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handlePillKeyDown}
              onBlur={() => {
                commitPill()
                setNewTag('')
              }}
              placeholder={result.length === 0 ? 'Agregar skill…' : '+'}
              className="placeholder:text-muted-foreground/40 min-w-[80px] flex-1 bg-transparent text-[11px] focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleAccept}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition-colors"
            >
              <Check className="h-3 w-3" /> Aceptar
            </button>
            <button
              type="button"
              onClick={() => {
                setResult([])
                setMode('input')
              }}
              className="border-border/60 text-muted-foreground hover:text-foreground rounded border px-2 py-1 text-[11px] transition-colors"
            >
              ← Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sortable bullet wrapper ──────────────────────────────────────────────────

function SortableBulletRow({
  sortableId,
  ...props
}: {
  sortableId: string
} & Parameters<typeof BulletRow>[0]) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BulletRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

// ── Bullet row with edit/AI/delete ────────────────────────────────────────────

function BulletRow({
  text,
  jobOfferText,
  settings,
  onUpdate,
  onDelete,
  bulletId,
  isLinked,
  onHover,
  onLeave,
  dragHandleProps,
}: {
  text: string
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (t: string) => void
  onDelete: () => void
  bulletId?: string
  isLinked?: boolean
  onHover?: () => void
  onLeave?: () => void
  dragHandleProps?: Record<string, unknown>
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(text)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const isAts = ATS_VERBS_RE.test(text.trimStart())

  function save() {
    onUpdate(editText)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5 py-1.5">
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="border-input bg-background focus:ring-ring min-h-[64px] w-full resize-y rounded border px-2 py-1.5 text-xs focus:ring-1 focus:outline-none"
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={save}
            className="bg-primary text-primary-foreground flex items-center gap-1 rounded px-2 py-1 text-[10px]"
          >
            <Check className="h-2.5 w-2.5" /> Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="border-border/60 text-muted-foreground hover:text-foreground flex items-center gap-1 rounded border px-2 py-1 text-[10px]"
          >
            <X className="h-2.5 w-2.5" /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Manual bullets (added by user in col 2) have no col-1 counterpart
  const isOriginalBullet = !!bulletId && !bulletId.startsWith('manual-')

  return (
    <div
      data-col2-bullet-id={isOriginalBullet ? bulletId : undefined}
      className={cn(
        // Layout-stable: ring + rounded always present, only color transitions
        'group relative rounded-sm ring-1 ring-inset',
        'transition-[box-shadow] duration-300 ease-out',
        isLinked ? 'ring-primary/40' : 'ring-transparent'
      )}
      onMouseEnter={isOriginalBullet ? onHover : undefined}
      onMouseLeave={isOriginalBullet ? onLeave : undefined}
    >
      {/* Background + scan layer — overflow-hidden here so scan line is clipped but popover escapes */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden rounded-sm',
          'transition-colors duration-300 ease-out',
          isLinked && !aiOpen && !aiLoading && 'bg-primary/[0.07]',
          aiOpen && !aiLoading && 'bg-primary/[0.04]',
          aiLoading && 'bg-amber-400/[0.05]'
        )}
      >
        {aiOpen && !aiLoading && (
          <div className="bg-primary/50 absolute top-2 bottom-2 left-0 w-0.5 rounded-full" />
        )}
        {aiLoading && (
          <>
            <div className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-amber-400/70" />
            <div className="animate-ai-scan absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
          </>
        )}
      </div>

      {/* Content — relative so it sits above background layer */}
      <div
        className={cn(
          'relative flex items-start gap-2 py-1.5 transition-all duration-200',
          aiOpen && 'pl-2.5'
        )}
      >
        {dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps}
            className="text-muted-foreground/30 hover:text-muted-foreground/70 mt-1 shrink-0 cursor-grab touch-none transition-colors active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <div
          className={cn(
            'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200',
            aiLoading
              ? 'animate-pulse bg-amber-400'
              : aiOpen
                ? 'bg-primary'
                : isAts
                  ? 'bg-green-500'
                  : 'bg-amber-400'
          )}
          title={isAts ? 'Verbo ATS fuerte' : 'Sin verbo ATS'}
        />
        <p
          className={cn(
            'flex-1 text-xs leading-relaxed transition-opacity duration-200',
            aiLoading && 'opacity-50'
          )}
        >
          {text}
        </p>
        {/* Link2 scroll button — always rendered for layout stability, visible only for original bullets */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() =>
            bulletId &&
            document
              .querySelector(`[data-col1-bullet-id="${bulletId}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
          className={cn(
            'text-primary/60 hover:text-primary mt-0.5 shrink-0',
            'transition-[opacity,color] duration-300 ease-out',
            isOriginalBullet
              ? cn('opacity-0 group-hover:opacity-100', isLinked && '!opacity-100')
              : 'pointer-events-none opacity-0'
          )}
          title="Ver bullet original"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <div
          className={cn(
            'relative flex shrink-0 items-center gap-1 transition-opacity',
            aiOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {settings?.aiApiKey && (
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className={cn(
                'transition-colors',
                aiOpen ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary'
              )}
              title="Mejorar con IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
          {aiOpen && settings?.aiApiKey && (
            <BulletAiPopover
              bulletText={text}
              jobOfferText={jobOfferText}
              settings={settings}
              onUpdate={(t) => {
                onUpdate(t)
                setAiOpen(false)
              }}
              onClose={() => {
                setAiOpen(false)
                setAiLoading(false)
              }}
              onLoadingChange={setAiLoading}
            />
          )}
          <button
            type="button"
            onClick={() => {
              setEditText(text)
              setEditing(true)
            }}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground/50 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role section (experience or leadership) ───────────────────────────────────

function RoleSection({
  item,
  jobOfferText,
  settings,
  onUpdate,
  onDelete,
  onBulletAdded,
  onBulletDeleted,
  bulletIds,
  hoveredBulletId,
  onBulletHover,
  onBulletLeave,
}: {
  item: ExperienceItem | LeadershipItem
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (updated: ExperienceItem | LeadershipItem) => void
  onDelete?: () => void
  onBulletAdded?: () => void
  onBulletDeleted?: (idx: number) => void
  bulletIds?: string[]
  hoveredBulletId?: string | null
  onBulletHover?: (id: string) => void
  onBulletLeave?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [headerEditing, setHeaderEditing] = useState(false)
  const isExp = 'title' in item
  const org = item.organization
  const role = isExp ? item.title : item.role

  function updateBullet(idx: number, text: string) {
    onUpdate({ ...item, bullets: item.bullets.map((b, i) => (i === idx ? text : b)) })
  }
  function deleteBullet(idx: number) {
    onBulletDeleted?.(idx)
    onUpdate({ ...item, bullets: item.bullets.filter((_, i) => i !== idx) })
  }
  function addBullet() {
    onUpdate({ ...item, bullets: [...item.bullets, ''] })
    onBulletAdded?.()
  }

  return (
    <div className="border-border/40 rounded-md border">
      <div className="bg-card group/header sticky top-0 z-10 rounded-t-md px-3 py-2">
        {headerEditing ? (
          <div className="space-y-2">
            <InlineField
              label="Organización"
              value={item.organization}
              onSave={(v) => onUpdate({ ...item, organization: v })}
            />
            <InlineField
              label={isExp ? 'Título / Cargo' : 'Rol'}
              value={role}
              onSave={(v) =>
                onUpdate(
                  isExp
                    ? ({ ...item, title: v } as ExperienceItem)
                    : ({ ...item, role: v } as LeadershipItem)
                )
              }
            />
            <InlineField
              label="Período"
              value={item.dates}
              onSave={(v) => onUpdate({ ...item, dates: v })}
            />
            <button
              type="button"
              onClick={() => setHeaderEditing(false)}
              className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
            >
              ← Cerrar edición
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setCollapsed((v) => !v)}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold">{org}</span>
                <span className="text-muted-foreground text-[11px]">· {role}</span>
              </div>
              <p className="text-muted-foreground text-[11px]">{item.dates}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setHeaderEditing(true)
                  setCollapsed(false)
                }}
                className="text-muted-foreground/50 hover:text-foreground opacity-0 transition-opacity group-hover/header:opacity-100"
                title="Editar cabecera"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-muted-foreground/50 hover:text-destructive opacity-0 transition-opacity group-hover/header:opacity-100"
                  title="Eliminar entrada"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-muted-foreground ml-1 text-[10px]">
                {item.bullets.length} bullets
              </span>
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="text-muted-foreground"
              >
                {collapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {!collapsed && !headerEditing && (
        <div className="border-border/30 divide-border/20 divide-y border-t px-3 pb-2">
          <SortableContext
            items={item.bullets.map((_, i) => `${item.id}-bullet-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {item.bullets.map((b, i) => {
              const bid = bulletIds?.[i]
              return (
                <SortableBulletRow
                  key={`${item.id}-bullet-${i}`}
                  sortableId={`${item.id}-bullet-${i}`}
                  text={b}
                  jobOfferText={jobOfferText}
                  settings={settings}
                  onUpdate={(t) => updateBullet(i, t)}
                  onDelete={() => deleteBullet(i)}
                  bulletId={bid}
                  isLinked={!!bid && hoveredBulletId === bid}
                  onHover={() => bid && onBulletHover?.(bid)}
                  onLeave={onBulletLeave}
                />
              )
            })}
          </SortableContext>
          <div className="pt-1.5">
            <button
              type="button"
              onClick={addBullet}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] transition-colors"
            >
              <Plus className="h-3 w-3" /> Agregar bullet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Education entry ───────────────────────────────────────────────────────────

function EduEntry({
  item,
  onUpdate,
  onDelete,
}: {
  item: EducationItem
  onUpdate: (updated: EducationItem) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-border/40 space-y-1.5 rounded-md border px-3 py-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {item.institution || (
              <span className="text-muted-foreground/60 italic">Nueva institución</span>
            )}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {item.degree}
            {item.concentration ? ` — ${item.concentration}` : ''}
          </p>
          <p className="text-muted-foreground text-[10px]">{item.graduationDate}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground/50 hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground/50 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-border/30 space-y-2 border-t pt-1">
          <InlineField
            label="Institución"
            value={item.institution}
            onSave={(v) => onUpdate({ ...item, institution: v })}
          />
          <InlineField
            label="Grado"
            value={item.degree}
            onSave={(v) => onUpdate({ ...item, degree: v })}
          />
          <InlineField
            label="Concentración"
            value={item.concentration}
            onSave={(v) => onUpdate({ ...item, concentration: v })}
          />
          <InlineField
            label="Fecha graduación"
            value={item.graduationDate}
            onSave={(v) => onUpdate({ ...item, graduationDate: v })}
          />
          <InlineField
            label="Materias clave"
            value={item.coursework}
            onSave={(v) => onUpdate({ ...item, coursework: v })}
            multiline
          />
        </div>
      )}
    </div>
  )
}

// ── Education add dropdown ────────────────────────────────────────────────────

function AddEduDropdown({
  availableEdu,
  onAdd,
  onAddManual,
}: {
  availableEdu: EducationItem[]
  onAdd: (edu: EducationItem) => void
  onAddManual: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
      >
        <Plus className="h-3 w-3" /> Agregar
      </button>

      {open && (
        <div className="border-border bg-popover absolute top-full right-0 z-30 mt-1 w-64 overflow-hidden rounded-md border shadow-md">
          {availableEdu.length > 0 && (
            <>
              <div className="border-border/40 border-b px-3 py-1.5">
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                  Desde Mi Experiencia
                </p>
              </div>
              {availableEdu.map((edu) => (
                <button
                  key={edu.id}
                  type="button"
                  onClick={() => {
                    onAdd(edu)
                    setOpen(false)
                  }}
                  className="hover:bg-muted/40 flex w-full items-start gap-2 px-3 py-2 text-left transition-colors"
                >
                  <BookOpen className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{edu.institution}</p>
                    <p className="text-muted-foreground truncate text-[10px]">{edu.degree}</p>
                  </div>
                </button>
              ))}
              <div className="border-border/40 border-t" />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              onAddManual()
              setOpen(false)
            }}
            className="hover:bg-muted/40 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
          >
            <Plus className="text-muted-foreground h-3 w-3 shrink-0" />
            <span className="text-muted-foreground text-xs">Agregar manualmente</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function CvSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
          {title}
        </p>
        <div className="bg-border/50 h-px flex-1" />
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ── CvEditor main ─────────────────────────────────────────────────────────────

export function CvEditor({
  draftCv,
  jobOfferText,
  settings,
  originalCv,
  onChange,
  onBulletAdded,
  onBulletDeleted,
  onSectionDeleted,
  onBulletMoved,
  draftBulletIds,
  hoveredBulletId,
  onBulletHover,
  onBulletLeave,
}: CvEditorProps) {
  const [skillsAiOpen, setSkillsAiOpen] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const pages = estimatePageLength(draftCv)
  const pageColor =
    pages > 2
      ? 'text-red-500'
      : pages > 1.5
        ? 'text-amber-500'
        : 'text-green-600 dark:text-green-400'

  const bulletSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Parse sortable ID format: "{sectionId}-bullet-{index}"
  function parseBulletId(id: string): { sectionId: string; bulletIndex: number } | null {
    const match = id.match(/^(.+)-bullet-(\d+)$/)
    if (!match) return null
    return { sectionId: match[1], bulletIndex: Number(match[2]) }
  }

  // Track the original position of the dragged bullet (before any cross-section moves)
  const dragOriginRef = useRef<{ sectionId: string; bulletIndex: number } | null>(null)

  function handleBulletDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
    const parsed = parseBulletId(event.active.id as string)
    dragOriginRef.current = parsed
  }

  function applyBulletChange(
    sectionId: string,
    newBullets: string[],
    exp: ExperienceItem[],
    lead: LeadershipItem[]
  ): { experience: ExperienceItem[]; leadership: LeadershipItem[] } {
    return {
      experience: exp.map((s) => (s.id === sectionId ? { ...s, bullets: newBullets } : s)),
      leadership: lead.map((s) => (s.id === sectionId ? { ...s, bullets: newBullets } : s)),
    }
  }

  function handleBulletDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || active.id === over.id) {
      dragOriginRef.current = null
      return
    }

    const from = parseBulletId(active.id as string)
    const to = parseBulletId(over.id as string)
    if (!from || !to) {
      dragOriginRef.current = null
      return
    }

    const allSections = [...draftCv.experience, ...draftCv.leadership]

    if (from.sectionId === to.sectionId) {
      // Same section: reorder
      const srcSection = allSections.find((s) => s.id === from.sectionId)
      if (!srcSection) {
        dragOriginRef.current = null
        return
      }
      const reordered = arrayMove(srcSection.bullets, from.bulletIndex, to.bulletIndex)
      const updated = applyBulletChange(
        from.sectionId,
        reordered,
        draftCv.experience,
        draftCv.leadership
      )
      onChange({ ...draftCv, ...updated })
      onBulletMoved?.(from.sectionId, from.bulletIndex, to.sectionId, to.bulletIndex)
    } else {
      // Cross-section: move bullet from source to destination
      const srcSection = allSections.find((s) => s.id === from.sectionId)
      const dstSection = allSections.find((s) => s.id === to.sectionId)
      if (!srcSection || !dstSection) {
        dragOriginRef.current = null
        return
      }

      const bulletText = srcSection.bullets[from.bulletIndex]
      if (bulletText === undefined) {
        dragOriginRef.current = null
        return
      }

      const srcBullets = srcSection.bullets.filter((_, i) => i !== from.bulletIndex)
      const dstBullets = [...dstSection.bullets]
      dstBullets.splice(to.bulletIndex, 0, bulletText)

      let { experience, leadership } = applyBulletChange(
        from.sectionId,
        srcBullets,
        draftCv.experience,
        draftCv.leadership
      )
      ;({ experience, leadership } = applyBulletChange(
        to.sectionId,
        dstBullets,
        experience,
        leadership
      ))
      onChange({ ...draftCv, experience, leadership })
      onBulletMoved?.(from.sectionId, from.bulletIndex, to.sectionId, to.bulletIndex)
    }

    dragOriginRef.current = null
  }

  // Find the text for the currently dragged bullet (for DragOverlay)
  const activeDragText = (() => {
    if (!activeDragId) return null
    const parsed = parseBulletId(activeDragId)
    if (!parsed) return null
    const section = [...draftCv.experience, ...draftCv.leadership].find(
      (s) => s.id === parsed.sectionId
    )
    return section?.bullets[parsed.bulletIndex] ?? null
  })()

  function updateExperience(id: string, updated: ExperienceItem) {
    onChange({
      ...draftCv,
      experience: draftCv.experience.map((e) => (e.id === id ? (updated as ExperienceItem) : e)),
    })
  }
  function deleteExperience(id: string) {
    onSectionDeleted?.(id)
    onChange({ ...draftCv, experience: draftCv.experience.filter((e) => e.id !== id) })
  }
  function updateLeadership(id: string, updated: LeadershipItem) {
    onChange({
      ...draftCv,
      leadership: draftCv.leadership.map((l) => (l.id === id ? (updated as LeadershipItem) : l)),
    })
  }
  function deleteLeadershipItem(id: string) {
    onSectionDeleted?.(id)
    onChange({ ...draftCv, leadership: draftCv.leadership.filter((l) => l.id !== id) })
  }
  function clearLeadership() {
    draftCv.leadership.forEach((l) => onSectionDeleted?.(l.id))
    onChange({ ...draftCv, leadership: [] })
  }
  function updateEducation(id: string, updated: EducationItem) {
    onChange({ ...draftCv, education: draftCv.education.map((e) => (e.id === id ? updated : e)) })
  }
  function deleteEducation(id: string) {
    onChange({ ...draftCv, education: draftCv.education.filter((e) => e.id !== id) })
  }
  function addEducation(edu: EducationItem) {
    onChange({
      ...draftCv,
      education: [...draftCv.education, edu].sort((a, b) => a.order - b.order),
    })
  }
  function addManualEducation() {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: '',
      location: '',
      degree: '',
      concentration: '',
      gpa: '',
      graduationDate: '',
      thesis: '',
      coursework: '',
      studyAbroad: null,
      order: draftCv.education.length,
    }
    onChange({ ...draftCv, education: [...draftCv.education, newEdu] })
  }

  const expWithBullets = draftCv.experience.filter((e) => e.bullets.length > 0)
  const leadWithBullets = draftCv.leadership.filter((l) => l.bullets.length > 0)
  const totalBullets =
    expWithBullets.reduce((s, e) => s + e.bullets.length, 0) +
    leadWithBullets.reduce((s, l) => s + l.bullets.length, 0)

  const availableEdu = originalCv
    ? originalCv.education.filter((e) => !draftCv.education.some((d) => d.id === e.id))
    : []

  return (
    <div className="space-y-3 p-3">
      {/* Page estimate header */}
      <div className="flex items-center justify-between">
        <p className="text-foreground text-xs font-semibold">CV Borrador</p>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-[11px]">{totalBullets} bullets</span>
          <span className={cn('text-[11px] font-medium', pageColor)}>
            ~{pages.toFixed(1)} {pages >= 1.5 ? 'páginas' : 'página'}
          </span>
        </div>
      </div>

      {/* Header section */}
      <div className="border-border/40 space-y-1.5 rounded-md border px-3 py-2">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          Información personal
        </p>
        <InlineField
          label="Nombre"
          value={draftCv.basics.fullName}
          onSave={(v) => onChange({ ...draftCv, basics: { ...draftCv.basics, fullName: v } })}
        />
        <InlineField
          label="Email"
          value={draftCv.basics.contact.email}
          onSave={(v) =>
            onChange({
              ...draftCv,
              basics: { ...draftCv.basics, contact: { ...draftCv.basics.contact, email: v } },
            })
          }
        />
        <InlineField
          label="Teléfono"
          value={draftCv.basics.contact.phone}
          onSave={(v) =>
            onChange({
              ...draftCv,
              basics: { ...draftCv.basics, contact: { ...draftCv.basics.contact, phone: v } },
            })
          }
        />
      </div>

      {/* Experience + Leadership — shared DndContext for cross-section bullet D&D */}
      <DndContext
        sensors={bulletSensors}
        collisionDetection={closestCenter}
        onDragStart={handleBulletDragStart}
        onDragEnd={handleBulletDragEnd}
      >
        {/* Experience */}
        {expWithBullets.length > 0 && (
          <CvSection title="Experiencia Profesional">
            {expWithBullets
              .sort((a, b) => a.order - b.order)
              .map((exp) => (
                <RoleSection
                  key={exp.id}
                  item={exp}
                  jobOfferText={jobOfferText}
                  settings={settings}
                  onUpdate={(u) => updateExperience(exp.id, u as ExperienceItem)}
                  onDelete={() => deleteExperience(exp.id)}
                  onBulletAdded={() => onBulletAdded?.(exp.id)}
                  onBulletDeleted={(idx) => onBulletDeleted?.(exp.id, idx)}
                  bulletIds={draftBulletIds?.[exp.id]}
                  hoveredBulletId={hoveredBulletId}
                  onBulletHover={onBulletHover}
                  onBulletLeave={onBulletLeave}
                />
              ))}
          </CvSection>
        )}

        {/* Leadership */}
        {leadWithBullets.length > 0 && (
          <CvSection
            title="Liderazgo y Mentoría"
            action={
              <button
                type="button"
                onClick={clearLeadership}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
                title="Eliminar sección completa"
              >
                <Trash2 className="h-3 w-3" /> Eliminar sección
              </button>
            }
          >
            {leadWithBullets
              .sort((a, b) => a.order - b.order)
              .map((lead) => (
                <RoleSection
                  key={lead.id}
                  item={lead}
                  jobOfferText={jobOfferText}
                  settings={settings}
                  onUpdate={(u) => updateLeadership(lead.id, u as LeadershipItem)}
                  onDelete={() => deleteLeadershipItem(lead.id)}
                  onBulletAdded={() => onBulletAdded?.(lead.id)}
                  onBulletDeleted={(idx) => onBulletDeleted?.(lead.id, idx)}
                  bulletIds={draftBulletIds?.[lead.id]}
                  hoveredBulletId={hoveredBulletId}
                  onBulletHover={onBulletHover}
                  onBulletLeave={onBulletLeave}
                />
              ))}
          </CvSection>
        )}

        {/* Drag overlay for bullet being dragged */}
        <DragOverlay>
          {activeDragText ? (
            <div className="border-primary/30 bg-card max-w-2xl rounded-md border px-3 py-2 text-xs leading-relaxed opacity-90 shadow-lg">
              {activeDragText}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Education */}
      <CvSection
        title="Educación"
        action={
          <AddEduDropdown
            availableEdu={availableEdu}
            onAdd={addEducation}
            onAddManual={addManualEducation}
          />
        }
      >
        {draftCv.education.length === 0 ? (
          <p className="text-muted-foreground/60 px-1 text-[11px] italic">
            Sin educación en el borrador — usa el botón Agregar.
          </p>
        ) : (
          draftCv.education
            .sort((a, b) => a.order - b.order)
            .map((edu) => (
              <EduEntry
                key={edu.id}
                item={edu}
                onUpdate={(u) => updateEducation(edu.id, u)}
                onDelete={() => deleteEducation(edu.id)}
              />
            ))
        )}
      </CvSection>

      {/* Skills */}
      <CvSection title="Habilidades">
        <div className="border-border/40 space-y-3 rounded-md border px-3 py-2.5">
          <TagsField
            label="Técnicas"
            value={draftCv.skills.technical}
            onChange={(v) => onChange({ ...draftCv, skills: { ...draftCv.skills, technical: v } })}
            action={
              settings?.aiApiKey ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSkillsAiOpen((v) => !v)}
                    className={cn(
                      'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                      skillsAiOpen
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    )}
                    title="Mejorar habilidades con IA"
                  >
                    <Sparkles className="h-3 w-3" /> IA
                  </button>
                  {skillsAiOpen && (
                    <SkillsAiPopover
                      currentSkills={draftCv.skills.technical}
                      jobOfferText={jobOfferText}
                      settings={settings}
                      onUpdate={(v) => {
                        onChange({ ...draftCv, skills: { ...draftCv.skills, technical: v } })
                        setSkillsAiOpen(false)
                      }}
                      onClose={() => setSkillsAiOpen(false)}
                    />
                  )}
                </div>
              ) : undefined
            }
          />
          <TagsField
            label="Idiomas"
            value={draftCv.skills.language}
            onChange={(v) => onChange({ ...draftCv, skills: { ...draftCv.skills, language: v } })}
          />
          {draftCv.skills.interests !== undefined && (
            <TagsField
              label="Intereses"
              value={draftCv.skills.interests ?? ''}
              onChange={(v) =>
                onChange({ ...draftCv, skills: { ...draftCv.skills, interests: v } })
              }
            />
          )}
        </div>
      </CvSection>
    </div>
  )
}
