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
} from 'lucide-react'
import Link from 'next/link'
import { useApplications } from '@/hooks/use-applications'
import { useCvs } from '@/hooks/use-cvs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  if (!amount) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { applications, isLoading, updateApplication, addTimelineEntry, updateTimelineEntry, deleteTimelineEntry, toggleFavorite } =
    useApplications()
  const { cvs } = useCvs()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null)
  const [showCvPreview, setShowCvPreview] = useState(false)

  // Editable form state
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('pending')
  const [salaryOffered, setSalaryOffered] = useState('')
  const [salaryCurrency, setSalaryCurrency] = useState('COP')
  const [benefits, setBenefits] = useState('')
  const [appliedAt, setAppliedAt] = useState('')
  const [responseDate, setResponseDate] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [notes, setNotes] = useState('')

  const app = applications.find((a) => a.id === id) as ApplicationDocument | undefined
  const linkedCv = cvs.find((c) => c.id === app?.cvId)
  const cvData = linkedCv ? (() => { try { return JSON.parse(linkedCv.cvData) as CvData } catch { return null } })() : null

  useEffect(() => {
    if (app) {
      setCompany(app.company)
      setPosition(app.position)
      setSource(app.source ?? '')
      setStatus(app.status)
      setSalaryOffered(app.salaryOffered ? String(app.salaryOffered) : '')
      setSalaryCurrency(app.salaryCurrency || 'COP')
      setBenefits(app.benefits?.join(', ') ?? '')
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
      benefits: benefits.split(',').map((b) => b.trim()).filter(Boolean),
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
    setBenefits(app.benefits?.join(', ') ?? '')
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

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 h-8">
            <ArrowLeft className="h-4 w-4" />
            Postulaciones
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <button
            type="button"
            onClick={() => toggleFavorite(app.id)}
            className="transition-transform hover:scale-110"
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-colors',
                app.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground/40 hover:text-muted-foreground'
              )}
            />
          </button>
        </div>

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

      {/* Title section */}
      <div className="space-y-1">
        {isEditing ? (
          <div className="flex gap-3">
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="text-xl font-bold h-auto py-1 text-foreground"
              placeholder="Cargo"
            />
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="h-auto py-1"
              placeholder="Empresa"
            />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{app.position}</h1>
            <p className="text-muted-foreground">{app.company}</p>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {isEditing ? (
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger className="w-48 h-7">
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
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* LEFT: Details + Economy + Notes */}
        <div className="space-y-6">
          {/* Detalles */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Detalles</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fuente" isEditing={isEditing}>
                {isEditing ? (
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Seleccionar fuente" />
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
                  <Input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} className="h-8" />
                ) : (
                  <span>
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                )}
              </Field>

              <Field label="Fecha de respuesta" isEditing={isEditing}>
                {isEditing ? (
                  <Input type="date" value={responseDate} onChange={(e) => setResponseDate(e.target.value)} className="h-8" />
                ) : (
                  <span>
                    {app.responseDate
                      ? new Date(app.responseDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                )}
              </Field>

              <Field label="Próximos pasos" isEditing={isEditing}>
                {isEditing ? (
                  <Input value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} className="h-8" placeholder="Siguiente acción" />
                ) : (
                  <span>{app.nextSteps || '—'}</span>
                )}
              </Field>
            </div>
          </section>

          <Separator />

          {/* Economía */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Compensación</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Salario ofrecido" isEditing={isEditing}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={salaryOffered}
                    onChange={(e) => setSalaryOffered(e.target.value)}
                    className="h-8"
                    placeholder="0"
                  />
                ) : (
                  <span className="font-medium">{formatSalary(app.salaryOffered, app.salaryCurrency || 'COP')}</span>
                )}
              </Field>

              <Field label="Moneda" isEditing={isEditing}>
                {isEditing ? (
                  <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{app.salaryCurrency || 'COP'}</span>
                )}
              </Field>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Beneficios</Label>
              {isEditing ? (
                <Input
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="Separados por coma: remoto, seguro médico, bonos"
                  className="h-8 text-sm"
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {app.benefits?.length > 0
                    ? app.benefits.map((b) => (
                        <span key={b} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{b}</span>
                      ))
                    : <span className="text-xs text-muted-foreground">—</span>}
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Notas */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-semibold text-foreground">Notas</h2>
            {isEditing ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre la empresa, cultura, etc."
                className="min-h-[80px] resize-y text-sm"
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {app.notes || 'Sin notas.'}
              </p>
            )}
          </section>
        </div>

        {/* RIGHT: Timeline + CV */}
        <div className="space-y-6">
          {/* Timeline */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Proceso de selección</h2>
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

            <div className="rounded-lg border border-border/60 p-3">
              <TimelineView
                entries={[...(app.timeline ?? [])].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                )}
                onEdit={(entry) => { setEditingEntry(entry); setShowTimelineForm(true) }}
                onDelete={(entryId) => deleteTimelineEntry(app.id, entryId)}
              />
            </div>
          </section>

          {/* CV generado */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">CV generado</h2>
            {linkedCv && cvData ? (
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div>
                  <p className="text-sm font-medium">{linkedCv.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    Generado el{' '}
                    {new Date(linkedCv.createdAt).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setShowCvPreview(true)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver CV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    asChild
                  >
                    <Link href="/cvs">Ver todos los CVs</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Sin CV generado para esta postulación</p>
                <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                  <Link href={`/cv-generator?appId=${app.id}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generar CV
                  </Link>
                </Button>
              </div>
            )}
          </section>
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
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className={cn('text-sm', !isEditing && 'text-foreground')}>
        {children}
      </div>
    </div>
  )
}
