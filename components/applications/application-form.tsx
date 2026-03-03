'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  Heart,
  Sparkles,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { BenefitTags } from './benefit-tags'
import { ApplicationTimeline } from './application-timeline'
import type { ApplicationDocument } from '@/lib/db/schemas'
import { APPLICATION_STATUS_LABELS } from '@/types/cv'
import { parseJobOffer } from '@/lib/ai'
import { useSettings } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

const schema = z.object({
  jobOfferText: z.string(),
  company: z.string().min(1, 'La empresa es requerida'),
  position: z.string().min(1, 'El cargo es requerido'),
  source: z.string().min(1, 'La fuente es requerida'),
  status: z.enum([
    'pending',
    'phone_screen',
    'technical',
    'hr_interview',
    'offer',
    'rejected',
    'accepted',
    'withdrawn',
  ]),
  salaryOffered: z.coerce.number().min(0),
  salaryCurrency: z.string(),
  isFavorite: z.boolean(),
  benefits: z.array(z.string()),
  appliedAt: z.string(),
  responseDate: z.string(),
  nextSteps: z.string(),
  notes: z.string(),
})

type FormData = z.infer<typeof schema>

const SOURCES = ['LinkedIn', 'Computrabajo', 'GetOnBoard', 'Indeed', 'Referido', 'Otro']
const CURRENCIES = ['COP', 'USD', 'EUR']

interface ApplicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => Promise<void>
  defaultValues?: Partial<ApplicationDocument>
  isEditing?: boolean
}

export function ApplicationForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing = false,
}: ApplicationFormProps) {
  const { settings } = useSettings()
  const [isParsing, setIsParsing] = useState(false)
  const [parseNotice, setParseNotice] = useState<{ type: 'ai' | 'regex' | 'error'; msg: string } | null>(null)
  const [showJobOffer, setShowJobOffer] = useState(!isEditing)
  const [showTimeline, setShowTimeline] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobOfferText: '',
      company: '',
      position: '',
      source: 'LinkedIn',
      status: 'pending',
      salaryOffered: 0,
      salaryCurrency: 'COP',
      isFavorite: false,
      benefits: [],
      appliedAt: new Date().toISOString().split('T')[0],
      responseDate: '',
      nextSteps: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (defaultValues && open) {
      form.reset({
        jobOfferText: defaultValues.jobOfferText ?? '',
        company: defaultValues.company ?? '',
        position: defaultValues.position ?? '',
        source: defaultValues.source ?? 'LinkedIn',
        status: defaultValues.status ?? 'pending',
        salaryOffered: defaultValues.salaryOffered ?? 0,
        salaryCurrency: defaultValues.salaryCurrency ?? 'COP',
        isFavorite: defaultValues.isFavorite ?? false,
        benefits: defaultValues.benefits ?? [],
        appliedAt: defaultValues.appliedAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        responseDate: defaultValues.responseDate ?? '',
        nextSteps: defaultValues.nextSteps ?? '',
        notes: defaultValues.notes ?? '',
      })
      setParseNotice(null)
      setShowJobOffer(false)
      setShowTimeline(false)
    }
  }, [defaultValues, open, form])

  const { isSubmitting } = form.formState
  const isFavoriteValue = form.watch('isFavorite')
  const jobOfferText = form.watch('jobOfferText')

  async function handleAnalyze() {
    if (!jobOfferText.trim()) return
    setIsParsing(true)
    setParseNotice(null)

    try {
      const { result, usedAI } = await parseJobOffer(jobOfferText, settings)

      if (result.company) form.setValue('company', result.company, { shouldValidate: true })
      if (result.position) form.setValue('position', result.position, { shouldValidate: true })
      if (result.salaryOffered) form.setValue('salaryOffered', result.salaryOffered)
      if (result.salaryCurrency) form.setValue('salaryCurrency', result.salaryCurrency)
      if (result.benefits?.length) form.setValue('benefits', result.benefits)

      if (usedAI) {
        setParseNotice({ type: 'ai', msg: 'Campos extraídos con IA ✓' })
      } else if (settings?.aiApiKey) {
        setParseNotice({ type: 'regex', msg: 'Extracción básica (error de IA). Revisa los campos.' })
      } else {
        setParseNotice({
          type: 'regex',
          msg: 'Extracción básica. Configura tu API key en Configuración para usar IA.',
        })
      }
    } catch {
      setParseNotice({ type: 'error', msg: 'Error al analizar. Revisa los campos manualmente.' })
    } finally {
      setIsParsing(false)
    }
  }

  async function handleSubmit(data: FormData) {
    await onSubmit(data)
    form.reset()
    setParseNotice(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4">
          <SheetTitle>{isEditing ? 'Editar postulación' : 'Nueva postulación'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Actualiza los datos de esta postulación' : 'Registra una nueva oferta laboral'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0 py-5">

              {/* ── Sección: Oferta laboral ─────────────────────────────── */}
              <div className="mb-5 rounded-lg border border-border/60 bg-muted/30">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                  onClick={() => setShowJobOffer((v) => !v)}
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Oferta laboral
                    {!isEditing && <span className="text-xs font-normal">(pega aquí para auto-rellenar)</span>}
                  </span>
                  {showJobOffer ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showJobOffer && (
                  <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3">
                    <FormField
                      control={form.control}
                      name="jobOfferText"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <textarea
                              {...field}
                              rows={5}
                              placeholder="Pega aquí la descripción completa de la oferta laboral..."
                              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleAnalyze}
                        disabled={isParsing || !jobOfferText.trim()}
                        className="gap-1.5"
                      >
                        {isParsing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {isParsing ? 'Analizando...' : 'Analizar con IA'}
                      </Button>
                      {!settings?.aiApiKey && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          Configura API key en Configuración
                        </span>
                      )}
                    </div>

                    {parseNotice && (
                      <p
                        className={cn(
                          'text-xs px-2 py-1 rounded',
                          parseNotice.type === 'ai' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          parseNotice.type === 'regex' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                          parseNotice.type === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {parseNotice.msg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sección: Detalles ───────────────────────────────────── */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. Google, VTEX..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. Senior Backend Engineer..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOURCES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(APPLICATION_STATUS_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-5" />

              {/* ── Sección: Economía ──────────────────────────────────── */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Economía</p>
                <div className="flex items-end gap-3">
                  <FormField
                    control={form.control}
                    name="salaryOffered"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Salario ofertado</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="isFavorite"
                    render={({ field }) => (
                      <div className="flex flex-col items-center gap-1 pb-0.5">
                        <span className="text-sm font-medium leading-none">Favorita</span>
                        <button
                          type="button"
                          onClick={() => field.onChange(!field.value)}
                          className="mt-1 transition-transform hover:scale-110"
                        >
                          <Heart
                            className={cn(
                              'h-6 w-6 transition-colors',
                              isFavoriteValue
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground/50'
                            )}
                          />
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-5" />

              {/* ── Sección: Beneficios ────────────────────────────────── */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Beneficios</p>
                <Controller
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <BenefitTags
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Ej: Home office, Seguro médico... (Enter o coma)"
                    />
                  )}
                />
              </div>

              <Separator className="my-5" />

              {/* ── Sección: Fechas ────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appliedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha postulación</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha respuesta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-5" />

              {/* ── Sección: Notas ─────────────────────────────────────── */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próximos pasos</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. Entrevista técnica el 10 de marzo..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={2}
                          placeholder="Observaciones sobre la empresa, proceso, cultura..."
                          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Sección: CV asociado ───────────────────────────────── */}
              <Separator className="my-5" />
              <div className="rounded-lg border border-dashed border-border/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">CV Asociado</p>
                {defaultValues?.cvId ? (
                  <p className="text-sm text-primary cursor-pointer hover:underline">
                    Ver CV generado →
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Sin CV generado aún</p>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
                      <Sparkles className="h-3 w-3" />
                      Generar CV con IA
                    </Button>
                  </div>
                )}
              </div>

              {/* ── Sección: Timeline (solo edición) ──────────────────── */}
              {isEditing && defaultValues?.timeline && defaultValues.timeline.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3"
                      onClick={() => setShowTimeline((v) => !v)}
                    >
                      <span>Historial de estados ({defaultValues.timeline.length})</span>
                      {showTimeline ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {showTimeline && (
                      <ApplicationTimeline entries={defaultValues.timeline} />
                    )}
                  </div>
                </>
              )}

              <div className="pb-6" />
            </form>
          </Form>
        </div>

        {/* ── Footer fijo ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar cambios' : 'Crear postulación'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
