'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Heart,
  Plus,
  ExternalLink,
  Sparkles,
  Building2,
  CalendarDays,
  DollarSign,
  LayoutList,
} from 'lucide-react'
import Link from 'next/link'
import { useApplications } from '@/hooks/use-applications'
import { useCvs } from '@/hooks/use-cvs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { TimelineView } from '@/components/applications/timeline-view'
import { BenefitList } from '@/components/applications/benefit-list'
import { TimelineEntryForm } from '@/components/applications/timeline-entry-form'
import { CvViewer } from '@/components/cv/cv-viewer'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '@/types/cv'
import type { ApplicationDocument, TimelineEntry } from '@/lib/db/schemas'
import type { CvData } from '@/types/experience'
import { cn } from '@/lib/utils'

const SOURCES = ['LinkedIn', 'Computrabajo', 'GetOnBoard', 'Indeed', 'Referido', 'Otro']
const CURRENCIES = ['COP', 'USD', 'EUR']

function formatSalary(amount: number, currency: string) {
  if (!amount) return null
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function daysSince(isoDate: string) {
  if (!isoDate) return null
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return '1 día'
  return `${days} días`
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    applications,
    isLoading,
    updateApplication,
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    toggleFavorite,
  } = useApplications()
  const { cvs } = useCvs()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null)
  const [showCvPreview, setShowCvPreview] = useState(false)

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('pending')
  const [salaryOffered, setSalaryOffered] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('COP')
  const [benefits, setBenefits] = useState<string[]>([])
  const [appliedAt, setAppliedAt] = useState('')
  const [responseDate, setResponseDate] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [notes, setNotes] = useState('')

  const app = applications.find((a) => a.id === id) as ApplicationDocument | undefined
  const linkedCv = cvs.find((c) => c.id === app?.cvId)
  const cvData = linkedCv
    ? (() => { try { return JSON.parse(linkedCv.cvData) as CvData } catch { return null } })()
    : null

  useEffect(() => {
    if (app) {
      setCompany(app.company)
      setPosition(app.position)
      setSource(app.source ?? '')
      setStatus(app.status)
      setSalaryOffered(app.salaryOffered ? String(app.salaryOffered) : '')
      setSalaryCurrency(app.salaryCurrency || 'COP')
      setBenefits(app.benefits ?? [])
      setAppliedAt(app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : '')
      setResponseDate(app.responseDate ? new Date(app.responseDate).toISOString().split('T')[0] : '')
      setNextSteps(app.nextSteps ?? '')
      setNotes(app.notes ?? '')
    }
  }, [app])

  async function handleSave() {
    if (!app) return
    setIsSaving(true)
    await updateApplication(id, {
      company,
      position,
      source,
      status,
      salaryOffered: salaryOffered ? parseFloat(salaryOffered) : 0,
      salaryCurrency,
      benefits,
      appliedAt: appliedAt ? new Date(appliedAt).toISOString() : '',
      responseDate: responseDate ? new Date(responseDate).toISOString() : '',
      nextSteps,
      notes,
      jobOfferText: app.jobOfferText,
      isFavorite: app.isFavorite,
    })
    setIsSaving(false)
    setIsEditing(false)
  }

  function cancelEdit() {
    if (!app) return
    setCompany(app.company)
    setPosition(app.position)
    setSource(app.source ?? '')
    setStatus(app.status)
    setSalaryOffered(app.salaryOffered ? String(app.salaryOffered) : '')
    setSalaryCurrency(app.salaryCurrency || 'COP')
    setBenefits(app.benefits ?? [])
    setAppliedAt(app.appliedAt ? new Date(app.appliedAt).toISOString().split('T')[0] : '')
    setResponseDate(app.responseDate ? new Date(app.responseDate).toISOString().split('T')[0] : '')
    setNextSteps(app.nextSteps ?? '')
    setNotes(app.notes ?? '')
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <p className="text-muted-foreground">Postulación no encontrada.</p>
      </div>
    )
  }

  const currentStatus = isEditing ? status : app.status
  const salary = formatSalary(app.salaryOffered, app.salaryCurrency || 'COP')
  const daysAgo = daysSince(app.appliedAt)

  return (
    <div className="p-6 pb-10">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 h-8 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Postulaciones
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5 h-8">
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 h-8">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5 h-8">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            )}
          </div>
        </div>

        {/* ── Company identity card (signature element: pipeline indicator) ── */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {/* Header row: company + favorite */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Company line */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {isEditing ? (
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="h-6 text-sm py-0 px-1.5 w-52"
                      placeholder="Empresa"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{app.company}</span>
                  )}
                  {!isEditing && app.source && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                      {app.source}
                    </span>
                  )}
                </div>

                {/* Position */}
                {isEditing ? (
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="text-xl font-bold h-auto py-1 mb-3 max-w-sm"
                    placeholder="Cargo"
                  />
                ) : (
                  <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-tight mb-3">
                    {app.position}
                  </h1>
                )}

                {/* Status badge + edit */}
                {isEditing ? (
                  <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
                    <SelectTrigger className="w-52 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPLICATION_STATUS_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn('text-xs font-medium', APPLICATION_STATUS_COLORS[app.status])}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                )}
              </div>

              {/* Favorite */}
              <button
                type="button"
                onClick={() => toggleFavorite(app.id)}
                className="transition-transform hover:scale-110 mt-0.5 shrink-0"
                aria-label={app.isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
              >
                <Heart
                  className={cn(
                    'h-5 w-5 transition-colors',
                    app.isFavorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground/40 hover:text-muted-foreground',
                  )}
                />
              </button>
            </div>
          </div>

          {/* Quick stats bar */}
          {!isEditing && (salary || daysAgo || app.appliedAt) && (
            <div className="px-6 py-3 border-t border-border/40 flex flex-wrap items-center gap-x-6 gap-y-2">
              {salary && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{salary}</span>
                  <span className="text-xs text-muted-foreground">{app.salaryCurrency || 'COP'}</span>
                </div>
              )}
              {daysAgo && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Aplicado</span>
                  <span className="text-xs font-medium text-foreground">{daysAgo} atrás</span>
                </div>
              )}
              {app.appliedAt && (
                <span className="text-xs text-muted-foreground">
                  {new Date(app.appliedAt).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">

          {/* LEFT: Details, Compensation, Notes */}
          <div className="space-y-4">

            {/* Detalles */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalles</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Fuente" isEditing={isEditing}>
                  {isEditing ? (
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{app.source || '—'}</span>
                  )}
                </Field>

                <Field label="Fecha de aplicación" isEditing={isEditing}>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={appliedAt}
                      onChange={(e) => setAppliedAt(e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <span>
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  )}
                </Field>

                <Field label="Fecha de respuesta" isEditing={isEditing}>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={responseDate}
                      onChange={(e) => setResponseDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <span>
                      {app.responseDate
                        ? new Date(app.responseDate).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  )}
                </Field>

                <Field label="Próximos pasos" isEditing={isEditing}>
                  {isEditing ? (
                    <Input
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Siguiente acción"
                    />
                  ) : (
                    <span>{app.nextSteps || '—'}</span>
                  )}
                </Field>
              </div>
            </div>

            {/* Compensación */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compensación</h2>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Salario ofrecido" isEditing>
                    <Input
                      type="number"
                      value={salaryOffered}
                      onChange={(e) => setSalaryOffered(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Moneda" isEditing>
                    <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              ) : salary ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{salary}</span>
                  <span className="text-sm text-muted-foreground">{app.salaryCurrency || 'COP'} / año</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin salario registrado</p>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">Beneficios</Label>
                {isEditing ? (
                  <BenefitList value={benefits} onChange={setBenefits} />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {app.benefits?.length > 0
                      ? app.benefits.map((b) => (
                          <span
                            key={b}
                            className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                          >
                            {b}
                          </span>
                        ))
                      : <span className="text-sm text-muted-foreground italic">Sin beneficios registrados</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</h2>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones sobre la empresa, cultura, entrevistadores, etc."
                  className="min-h-[100px] resize-y text-sm"
                />
              ) : app.notes ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{app.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin notas.</p>
              )}
            </div>
          </div>

          {/* RIGHT: Timeline + CV */}
          <div className="space-y-4">

            {/* Proceso de selección */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Proceso de selección
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => { setEditingEntry(null); setShowTimelineForm(true) }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Registrar paso
                </Button>
              </div>

              <TimelineView
                entries={[...(app.timeline ?? [])].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                )}
                onEdit={(entry) => { setEditingEntry(entry); setShowTimelineForm(true) }}
                onDelete={(entryId) => deleteTimelineEntry(app.id, entryId)}
              />
            </div>

            {/* CV generado */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CV generado</h2>

              {linkedCv && cvData ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-muted/30 border border-border/40 p-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <LayoutList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{linkedCv.jobTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Generado el{' '}
                        {new Date(linkedCv.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setShowCvPreview(true)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver CV
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                      <Link href="/cvs">Todos los CVs</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-6 flex flex-col items-center text-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Sin CV generado</p>
                    <p className="text-xs text-muted-foreground">
                      Genera un CV optimizado para esta postulación
                    </p>
                  </div>
                  <Button asChild size="sm" className="gap-1.5 h-8 text-xs">
                    <Link href={`/cv-generator?appId=${app.id}`}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generar CV con IA
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Entry Form */}
      <TimelineEntryForm
        open={showTimelineForm}
        onOpenChange={setShowTimelineForm}
        currentStatus={currentStatus}
        initialEntry={editingEntry ?? undefined}
        onSave={async (entry) => {
          if (editingEntry) {
            await updateTimelineEntry(app.id, editingEntry.id, entry)
          } else {
            await addTimelineEntry(app.id, entry)
          }
          setEditingEntry(null)
        }}
      />

      {/* CV Preview Sheet */}
      <Sheet open={showCvPreview} onOpenChange={setShowCvPreview}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b border-border/60">
            <SheetTitle className="text-sm">
              {linkedCv?.jobTitle} — {linkedCv?.company}
            </SheetTitle>
          </SheetHeader>
          {cvData && (
            <div className="bg-white">
              <CvViewer cv={cvData} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({
  label,
  isEditing,
  children,
}: {
  label: string
  isEditing: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className={cn('text-sm', !isEditing && 'text-foreground font-medium')}>
        {children}
      </div>
    </div>
  )
}
