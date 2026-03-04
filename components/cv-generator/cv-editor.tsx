'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Trash2, Plus, Sparkles, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { improveBullet, ATS_VERBS_RE } from '@/lib/ai-cv'
import type { CvData, ExperienceItem, LeadershipItem, EducationItem } from '@/types/experience'
import type { SettingsDocument } from '@/lib/db/schemas'

interface CvEditorProps {
  draftCv: CvData
  jobOfferText: string
  settings: SettingsDocument | null
  originalCv?: CvData
  onChange: (cv: CvData) => void
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
  ]
    .join(' ')
    .length
  return Math.max(1, chars / 1800)
}

// ── Skills tags field ─────────────────────────────────────────────────────────

function TagsField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [newTag, setNewTag] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const tags = value
    ? value.split(/[,;·|]+/).map((s) => s.trim()).filter(Boolean)
    : []

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

  return (
    <div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5">{label}</p>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 rounded-md border bg-muted/10 px-2 py-1.5 cursor-text transition-colors',
          focused ? 'border-ring ring-1 ring-ring' : 'border-border/50'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary leading-none"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i) }}
              className="text-primary/50 hover:text-primary transition-colors ml-0.5"
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
          onKeyDown={handleKeyDown}
          onBlur={() => { commitTag(); setFocused(false) }}
          onFocus={() => setFocused(true)}
          placeholder={tags.length === 0 ? 'Escribe y presiona Enter o coma…' : '+'}
          className="flex-1 min-w-[80px] bg-transparent text-[11px] focus:outline-none placeholder:text-muted-foreground/40"
        />
      </div>
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
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs resize-y min-h-[56px] focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        )}
        <div className="flex gap-1">
          <button type="button" onClick={save} className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
            <Check className="h-2.5 w-2.5" /> Guardar
          </button>
          <button type="button" onClick={() => { setDraft(value); setEditing(false) }} className="flex items-center gap-1 rounded border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-1">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xs text-foreground break-words">{value || <span className="text-muted-foreground/50 italic">vacío</span>}</p>
      </div>
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3 w-3" />
      </button>
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
}: {
  text: string
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (t: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(text)
  const [aiInput, setAiInput] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const isAts = ATS_VERBS_RE.test(text.trimStart())

  function save() {
    onUpdate(editText)
    setEditing(false)
  }

  async function handleAiImprove() {
    if (!aiInput.trim() || !settings) return
    setAiLoading(true)
    const improved = await improveBullet(text, aiInput, jobOfferText, settings)
    onUpdate(improved)
    setShowAiInput(false)
    setAiInput('')
    setAiLoading(false)
  }

  if (editing) {
    return (
      <div className="space-y-1.5 py-1.5">
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs resize-y min-h-[64px] focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-1.5">
          <button type="button" onClick={save} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] text-primary-foreground">
            <Check className="h-2.5 w-2.5" /> Guardar
          </button>
          <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">
            <X className="h-2.5 w-2.5" /> Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <div className="flex gap-2 items-start py-1.5">
        <div className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', isAts ? 'bg-green-500' : 'bg-amber-400')} title={isAts ? 'Verbo ATS fuerte' : 'Sin verbo ATS'} />
        <p className="flex-1 text-xs leading-relaxed">{text}</p>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {settings?.aiApiKey && (
            <button
              type="button"
              onClick={() => setShowAiInput((v) => !v)}
              className={cn('transition-colors', showAiInput ? 'text-primary' : 'text-muted-foreground/50 hover:text-primary')}
              title="Mejorar con IA"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => { setEditText(text); setEditing(true) }} className="text-muted-foreground/50 hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="text-muted-foreground/50 hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showAiInput && (
        <div className="ml-3.5 mb-2 flex gap-1.5">
          <input
            autoFocus
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAiImprove(); if (e.key === 'Escape') setShowAiInput(false) }}
            placeholder='Ej: "hazlo más conciso y agrega impacto"'
            className="flex-1 rounded border border-input bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            disabled={!aiInput.trim() || aiLoading}
            onClick={handleAiImprove}
            className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {aiLoading ? <span className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" /> : <Sparkles className="h-3 w-3" />}
            IA
          </button>
        </div>
      )}
    </div>
  )
}

// ── Role section (experience or leadership) ───────────────────────────────────

function RoleSection({
  item,
  jobOfferText,
  settings,
  onUpdate,
}: {
  item: ExperienceItem | LeadershipItem
  jobOfferText: string
  settings: SettingsDocument | null
  onUpdate: (updated: ExperienceItem | LeadershipItem) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const org = item.organization
  const role = 'title' in item ? item.title : item.role

  function updateBullet(idx: number, text: string) {
    onUpdate({ ...item, bullets: item.bullets.map((b, i) => (i === idx ? text : b)) })
  }
  function deleteBullet(idx: number) {
    onUpdate({ ...item, bullets: item.bullets.filter((_, i) => i !== idx) })
  }
  function addBullet() {
    onUpdate({ ...item, bullets: [...item.bullets, ''] })
  }

  return (
    <div className="rounded-md border border-border/40">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors sticky top-0 z-10 bg-card rounded-t-md"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold">{org}</span>
            <span className="text-[11px] text-muted-foreground">· {role}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{item.dates}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground">{item.bullets.length} bullets</span>
          {collapsed ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      {!collapsed && (
        <div className="px-3 pb-2 border-t border-border/30 divide-y divide-border/20">
          {item.bullets.map((b, i) => (
            <BulletRow
              key={i}
              text={b}
              jobOfferText={jobOfferText}
              settings={settings}
              onUpdate={(t) => updateBullet(i, t)}
              onDelete={() => deleteBullet(i)}
            />
          ))}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={addBullet}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
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
    <div className="rounded-md border border-border/40 px-3 py-2 space-y-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{item.institution || <span className="text-muted-foreground/60 italic">Nueva institución</span>}</p>
          <p className="text-[11px] text-muted-foreground">{item.degree}{item.concentration ? ` — ${item.concentration}` : ''}</p>
          <p className="text-[10px] text-muted-foreground">{item.graduationDate}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-muted-foreground/50 hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} className="text-muted-foreground/50 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border/30">
          <InlineField label="Institución" value={item.institution} onSave={(v) => onUpdate({ ...item, institution: v })} />
          <InlineField label="Grado" value={item.degree} onSave={(v) => onUpdate({ ...item, degree: v })} />
          <InlineField label="Concentración" value={item.concentration} onSave={(v) => onUpdate({ ...item, concentration: v })} />
          <InlineField label="Fecha graduación" value={item.graduationDate} onSave={(v) => onUpdate({ ...item, graduationDate: v })} />
          <InlineField label="Materias clave" value={item.coursework} onSave={(v) => onUpdate({ ...item, coursework: v })} multiline />
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
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <Plus className="h-3 w-3" /> Agregar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {availableEdu.length > 0 && (
            <>
              <div className="px-3 py-1.5 border-b border-border/40">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Desde Mi Experiencia</p>
              </div>
              {availableEdu.map((edu) => (
                <button
                  key={edu.id}
                  type="button"
                  onClick={() => { onAdd(edu); setOpen(false) }}
                  className="flex items-start gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <BookOpen className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{edu.institution}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{edu.degree}</p>
                  </div>
                </button>
              ))}
              <div className="border-t border-border/40" />
            </>
          )}
          <button
            type="button"
            onClick={() => { onAddManual(); setOpen(false) }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
          >
            <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Agregar manualmente</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function CvSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className="flex-1 h-px bg-border/50" />
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

// ── CvEditor main ─────────────────────────────────────────────────────────────

export function CvEditor({ draftCv, jobOfferText, settings, originalCv, onChange }: CvEditorProps) {
  const pages = estimatePageLength(draftCv)
  const pageColor = pages > 2 ? 'text-red-500' : pages > 1.5 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'

  function updateExperience(id: string, updated: ExperienceItem) {
    onChange({ ...draftCv, experience: draftCv.experience.map((e) => (e.id === id ? updated as ExperienceItem : e)) })
  }
  function updateLeadership(id: string, updated: LeadershipItem) {
    onChange({ ...draftCv, leadership: draftCv.leadership.map((l) => (l.id === id ? updated as LeadershipItem : l)) })
  }
  function updateEducation(id: string, updated: EducationItem) {
    onChange({ ...draftCv, education: draftCv.education.map((e) => (e.id === id ? updated : e)) })
  }
  function deleteEducation(id: string) {
    onChange({ ...draftCv, education: draftCv.education.filter((e) => e.id !== id) })
  }
  function addEducation(edu: EducationItem) {
    onChange({ ...draftCv, education: [...draftCv.education, edu].sort((a, b) => a.order - b.order) })
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
  const totalBullets = expWithBullets.reduce((s, e) => s + e.bullets.length, 0) + leadWithBullets.reduce((s, l) => s + l.bullets.length, 0)

  const availableEdu = originalCv
    ? originalCv.education.filter((e) => !draftCv.education.some((d) => d.id === e.id))
    : []

  return (
    <div className="space-y-3 p-3">
      {/* Page estimate header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">CV Borrador</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">{totalBullets} bullets</span>
          <span className={cn('text-[11px] font-medium', pageColor)}>
            ~{pages.toFixed(1)} {pages >= 1.5 ? 'páginas' : 'página'}
          </span>
        </div>
      </div>

      {/* Header section */}
      <div className="rounded-md border border-border/40 px-3 py-2 space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Información personal</p>
        <InlineField label="Nombre" value={draftCv.basics.fullName} onSave={(v) => onChange({ ...draftCv, basics: { ...draftCv.basics, fullName: v } })} />
        <InlineField label="Email" value={draftCv.basics.contact.email} onSave={(v) => onChange({ ...draftCv, basics: { ...draftCv.basics, contact: { ...draftCv.basics.contact, email: v } } })} />
        <InlineField label="Teléfono" value={draftCv.basics.contact.phone} onSave={(v) => onChange({ ...draftCv, basics: { ...draftCv.basics, contact: { ...draftCv.basics.contact, phone: v } } })} />
      </div>

      {/* Experience */}
      {expWithBullets.length > 0 && (
        <CvSection title="Experiencia Profesional">
          {expWithBullets.sort((a, b) => a.order - b.order).map((exp) => (
            <RoleSection
              key={exp.id}
              item={exp}
              jobOfferText={jobOfferText}
              settings={settings}
              onUpdate={(u) => updateExperience(exp.id, u as ExperienceItem)}
            />
          ))}
        </CvSection>
      )}

      {/* Leadership */}
      {leadWithBullets.length > 0 && (
        <CvSection title="Liderazgo y Mentoría">
          {leadWithBullets.sort((a, b) => a.order - b.order).map((lead) => (
            <RoleSection
              key={lead.id}
              item={lead}
              jobOfferText={jobOfferText}
              settings={settings}
              onUpdate={(u) => updateLeadership(lead.id, u as LeadershipItem)}
            />
          ))}
        </CvSection>
      )}

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
          <p className="text-[11px] text-muted-foreground/60 italic px-1">Sin educación en el borrador — usa el botón Agregar.</p>
        ) : (
          draftCv.education.sort((a, b) => a.order - b.order).map((edu) => (
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
        <div className="rounded-md border border-border/40 px-3 py-2.5 space-y-3">
          <TagsField
            label="Técnicas"
            value={draftCv.skills.technical}
            onChange={(v) => onChange({ ...draftCv, skills: { ...draftCv.skills, technical: v } })}
          />
          <TagsField
            label="Idiomas"
            value={draftCv.skills.language}
            onChange={(v) => onChange({ ...draftCv, skills: { ...draftCv.skills, language: v } })}
          />
          {(draftCv.skills.interests !== undefined) && (
            <TagsField
              label="Intereses"
              value={draftCv.skills.interests ?? ''}
              onChange={(v) => onChange({ ...draftCv, skills: { ...draftCv.skills, interests: v } })}
            />
          )}
        </div>
      </CvSection>
    </div>
  )
}
