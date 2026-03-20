'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Loader2,
  Heart,
  Sparkles,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Link,
  ClipboardPaste,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BenefitList } from './benefit-list'
import { ApplicationTimeline } from './application-timeline'
import type { ApplicationDocument } from '@/lib/db/schemas'
import { APPLICATION_STATUS_LABELS } from '@/types/cv'
import { parseJobOffer } from '@/lib/ai'
import { useSettings } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'
import { Shimmer } from '@/components/ai-elements/shimmer'

type FlashField = 'company' | 'position' | 'salaryOffered' | 'salaryCurrency' | 'benefits'

// Domains known to block scraping
const UNSUPPORTED_DOMAINS = [
  { pattern: /linkedin\.com/i, name: 'LinkedIn' },
  { pattern: /indeed\.com/i, name: 'Indeed' },
  { pattern: /infojobs\.net/i, name: 'InfoJobs' },
]

function getUnsupportedDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    const match = UNSUPPORTED_DOMAINS.find((d) => d.pattern.test(hostname))
    return match?.name ?? null
  } catch {
    return null
  }
}

function NotFoundNotice({ reason, onDismiss }: { reason?: string; onDismiss: () => void }) {
  return (
    <div className="relative rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/10">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2 right-2 rounded p-0.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/40"
        aria-label="Cerrar"
      >
        <XCircle className="h-3.5 w-3.5" />
      </button>
      <div className="flex gap-2.5 pr-5">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            No encontramos la oferta en esa página
          </p>
          {reason && <p className="text-xs text-amber-700 dark:text-amber-400/80">{reason}</p>}
          <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400/80">
            Esta página puede requerir inicio de sesión, tener protección anti-bots, o mostrar una
            lista de ofertas en lugar de una oferta individual.
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <ClipboardPaste className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Abre la oferta en el navegador, copia todo el texto y pégalo en la pestaña{' '}
              <span className="rounded bg-amber-100 px-1 py-0.5 font-semibold dark:bg-amber-900/40">
                Texto plano
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Double-flash: two bright pulses to signal a field was filled by AI.
// Uses key to force re-mount so framer-motion replays the animation each time.
function FlashWrapper({
  flash,
  flashKey,
  children,
}: {
  flash: boolean
  flashKey: number
  children: React.ReactNode
}) {
  if (!flash) return <div className="rounded-md">{children}</div>
  return (
    <motion.div
      key={flashKey}
      initial={{ backgroundColor: 'transparent' }}
      animate={{
        backgroundColor: [
          'transparent',
          'hsl(var(--primary) / 0.20)',
          'transparent',
          'hsl(var(--primary) / 0.14)',
          'transparent',
        ],
      }}
      transition={{ duration: 1.2, times: [0, 0.18, 0.42, 0.62, 1], ease: 'easeOut' }}
      className="rounded-md"
    >
      {children}
    </motion.div>
  )
}

// Shimmer label: replaces FormLabel text while AI is mapping fields
function ShimmerLabel({ children, active }: { children: string; active: boolean }) {
  if (!active) return <span>{children}</span>
  return (
    <Shimmer as="span" className="text-sm font-medium" duration={1.5}>
      {children}
    </Shimmer>
  )
}

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
  const [isShimmering, setIsShimmering] = useState(false)
  const [parseNotice, setParseNotice] = useState<{
    type: 'ai' | 'regex' | 'error' | 'not_found'
    msg: string
  } | null>(null)
  const [showJobOffer, setShowJobOffer] = useState(!isEditing)
  const [showTimeline, setShowTimeline] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [flashFields, setFlashFields] = useState<Set<FlashField>>(new Set())
  const [flashKey, setFlashKey] = useState(0)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
      abortRef.current?.abort()
    }
  }, [])

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

  function triggerFlash(fields: FlashField[]) {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    setFlashFields(new Set(fields))
    setFlashKey((k) => k + 1)
    flashTimeoutRef.current = setTimeout(() => setFlashFields(new Set()), 1500)
  }

  async function applyParseResult(text: string): Promise<boolean> {
    const { result, usedAI } = await parseJobOffer(text, settings)

    const isValid = (v: unknown): v is string =>
      typeof v === 'string' &&
      v.trim() !== '' &&
      !/^(undefined|null|n\/a|none|no\s+aplica)$/i.test(v.trim())

    const updated: FlashField[] = []
    if (isValid(result.company)) {
      form.setValue('company', result.company, { shouldValidate: true })
      updated.push('company')
    }
    if (isValid(result.position)) {
      form.setValue('position', result.position, { shouldValidate: true })
      updated.push('position')
    }
    if (result.salaryOffered != null) {
      form.setValue('salaryOffered', result.salaryOffered)
      updated.push('salaryOffered')
    }
    if (isValid(result.salaryCurrency)) {
      form.setValue('salaryCurrency', result.salaryCurrency)
      updated.push('salaryCurrency')
    }
    if (result.benefits?.length) {
      const validBenefits = result.benefits.filter(isValid)
      if (validBenefits.length) {
        form.setValue('benefits', validBenefits)
        updated.push('benefits')
      }
    }

    const hasUsefulData = !!(result.company || result.position)
    if (updated.length) triggerFlash(updated)

    if (usedAI && hasUsefulData) {
      setParseNotice({ type: 'ai', msg: 'Campos extraídos con IA ✓' })
    } else if (usedAI && !hasUsefulData) {
      setParseNotice({ type: 'not_found', msg: '' })
    } else if (settings?.aiApiKey) {
      setParseNotice({
        type: 'regex',
        msg: 'Modelo no soportado aún. Extracción básica, revisa los campos.',
      })
    } else {
      setParseNotice({
        type: 'regex',
        msg: 'Extracción básica. Configura tu API key en Configuración para usar IA.',
      })
    }

    return hasUsefulData
  }

  async function handleAnalyze() {
    if (!jobOfferText.trim()) return
    setIsParsing(true)
    setIsShimmering(true)
    setParseNotice(null)
    try {
      await applyParseResult(jobOfferText)
    } catch {
      setParseNotice({ type: 'error', msg: 'Error al analizar. Revisa los campos manualmente.' })
    } finally {
      setIsParsing(false)
      setIsShimmering(false)
    }
  }

  function handleCancelUrl() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsParsing(false)
    setIsShimmering(false)
    setParseNotice(null)
  }

  async function handleAnalyzeUrl() {
    const trimmedUrl = urlInput.trim()
    if (!trimmedUrl) return

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsParsing(true)
    setParseNotice(null)
    // Shimmer only starts once scraping finishes and AI begins mapping
    setIsShimmering(false)
    try {
      // Step 1: Scrape the URL
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: controller.signal,
      })
      const scrapeData = (await scrapeRes.json().catch(() => ({}))) as {
        raw?: string
        error?: string
      }

      if (!scrapeRes.ok || !scrapeData.raw) {
        setParseNotice({
          type: 'not_found',
          msg: scrapeData.error ?? 'No se pudo leer la página.',
        })
        return
      }

      // Step 2: If AI is available, clean the raw text to a proper job offer markdown
      // Shimmer starts now: scraping done, AI is about to map fields
      setIsShimmering(true)
      if (settings?.aiApiKey) {
        const cleanRes = await fetch('/api/ai/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobOffer: scrapeData.raw,
            model: settings.aiModel ?? 'claude',
            apiKey: settings.aiApiKey,
            mode: 'clean',
          }),
          signal: controller.signal,
        })
        const cleanData = (await cleanRes.json().catch(() => ({}))) as {
          success?: boolean
          markdown?: string | null
          error?: string
        }

        if (
          !cleanRes.ok ||
          !cleanData.success ||
          cleanData.markdown === null ||
          cleanData.markdown === undefined ||
          cleanData.markdown.trim().length < 50
        ) {
          setParseNotice({ type: 'not_found', msg: '' })
          return
        }

        // Step 3: Set cleaned markdown in the text field and extract fields
        form.setValue('jobOfferText', cleanData.markdown)
        await applyParseResult(cleanData.markdown)
      } else {
        // No AI: just put the raw text and use regex extraction
        form.setValue('jobOfferText', scrapeData.raw)
        await applyParseResult(scrapeData.raw)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      // Network errors from abort racing with inflight requests have no useful
      // info for the user, but real connectivity failures should surface feedback.
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setParseNotice({
          type: 'error',
          msg: 'Error de red. Verifica tu conexión e intenta de nuevo.',
        })
        return
      }
      setParseNotice({ type: 'error', msg: 'Error al procesar la URL.' })
    } finally {
      abortRef.current = null
      setIsParsing(false)
      setIsShimmering(false)
    }
  }

  async function handleSubmit(data: FormData) {
    await onSubmit(data)
    abortRef.current?.abort()
    form.reset()
    setParseNotice(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-border shrink-0 border-b px-6 py-4">
          <SheetTitle>{isEditing ? 'Editar postulación' : 'Registrar oferta'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Actualiza los datos de esta postulación'
              : 'Registra una nueva oferta laboral'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0 py-5">
              {/* ── Sección: Oferta laboral ─────────────────────────────── */}
              <div className="border-border/60 bg-muted/30 mb-5 rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                  onClick={() => setShowJobOffer((v) => !v)}
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Oferta laboral
                    {!isEditing && (
                      <span className="text-xs font-normal">(pega aquí para auto-rellenar)</span>
                    )}
                  </span>
                  {showJobOffer ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  )}
                </button>

                {showJobOffer && (
                  <div className="border-border/60 space-y-3 border-t px-4 pt-3 pb-4">
                    <Tabs defaultValue="text" className="w-full">
                      <TabsList className="h-8 w-full">
                        <TabsTrigger value="text" className="h-6 flex-1 gap-1.5 text-xs">
                          <FileText className="h-3 w-3" />
                          Texto plano
                        </TabsTrigger>
                        <TabsTrigger value="url" className="h-6 flex-1 gap-1.5 text-xs">
                          <Link className="h-3 w-3" />
                          URL
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="mt-3 space-y-3">
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
                                  className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-1"
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
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              Configura API key en Configuración
                            </span>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="mt-3 space-y-3">
                        {(() => {
                          const blocked = getUnsupportedDomain(urlInput)
                          return (
                            <>
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  placeholder="https://empresa.com/careers/job/..."
                                  value={urlInput}
                                  onChange={(e) => {
                                    setUrlInput(e.target.value)
                                    setParseNotice(null)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleAnalyzeUrl()
                                    }
                                  }}
                                  className={cn(
                                    'flex-1 text-sm',
                                    blocked &&
                                      'border-amber-400 focus-visible:ring-amber-400 dark:border-amber-600'
                                  )}
                                />
                                {isParsing ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelUrl}
                                    className="relative shrink-0 gap-1.5 overflow-hidden border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                  >
                                    {/* Indeterminate progress bar at bottom */}
                                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-200 dark:bg-red-900/40">
                                      <span className="absolute inset-y-0 w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite] bg-red-500 dark:bg-red-400" />
                                    </span>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Cancelar
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleAnalyzeUrl}
                                    disabled={!urlInput.trim()}
                                    className="shrink-0 gap-1.5"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Analizar con IA
                                  </Button>
                                )}
                              </div>

                              {blocked ? (
                                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/10">
                                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                      {blocked} no permite extraer ofertas automáticamente
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400/80">
                                      Abre la oferta, selecciona todo el texto (Ctrl+A) y pégalo en{' '}
                                      <span className="rounded bg-amber-100 px-1 py-0.5 font-semibold dark:bg-amber-900/40">
                                        Texto plano
                                      </span>
                                      .
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-xs">
                                  Pega la URL directa a la oferta. Funciona con Computrabajo,
                                  Elempleo, Workday, Eightfold y otros portales. Si falla, usa{' '}
                                  <span className="font-medium">Texto plano</span>.
                                </p>
                              )}
                            </>
                          )
                        })()}
                      </TabsContent>
                    </Tabs>

                    {parseNotice && (
                      <>
                        {parseNotice.type === 'not_found' ? (
                          <NotFoundNotice
                            reason={parseNotice.msg || undefined}
                            onDismiss={() => setParseNotice(null)}
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex items-center justify-between gap-1.5 rounded-md px-3 py-2',
                              parseNotice.type === 'ai' &&
                                'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                              parseNotice.type === 'regex' &&
                                'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
                              parseNotice.type === 'error' &&
                                'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            )}
                          >
                            <span className="flex items-center gap-1.5 text-xs">
                              {parseNotice.type === 'ai' && (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {parseNotice.type === 'error' && (
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {parseNotice.type === 'regex' && (
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {parseNotice.msg}
                            </span>
                            <button
                              type="button"
                              onClick={() => setParseNotice(null)}
                              className="ml-2 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
                              aria-label="Cerrar"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sección: Detalles ───────────────────────────────────── */}
              <div className="space-y-4">
                <FlashWrapper flash={flashFields.has('company')} flashKey={flashKey}>
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <ShimmerLabel active={isShimmering}>Empresa *</ShimmerLabel>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="ej. Google, VTEX..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FlashWrapper>
                <FlashWrapper flash={flashFields.has('position')} flashKey={flashKey}>
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <ShimmerLabel active={isShimmering}>Cargo *</ShimmerLabel>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="ej. Senior Backend Engineer..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FlashWrapper>
                {isEditing ? (
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
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
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
                          <FormLabel>
                            <span className="flex items-center gap-1">
                              Estado
                              <span className="group relative inline-flex">
                                <HelpCircle className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                                <span className="bg-popover text-popover-foreground ring-border pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-md px-3 py-2 text-xs font-normal shadow-md ring-1 group-hover:block">
                                  Refleja el paso actual del proceso. Actualízalo desde aquí o en la
                                  página de detalle.
                                </span>
                              </span>
                            </span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(APPLICATION_STATUS_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
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
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator className="my-5" />

              {/* ── Sección: Economía ──────────────────────────────────── */}
              <div className="space-y-1">
                <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                  Economía
                </p>
                <div className="flex items-end gap-3">
                  <FlashWrapper flash={flashFields.has('salaryOffered')} flashKey={flashKey}>
                    <FormField
                      control={form.control}
                      name="salaryOffered"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>
                            <ShimmerLabel active={isShimmering}>Salario ofertado</ShimmerLabel>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </FlashWrapper>
                  <FlashWrapper flash={flashFields.has('salaryCurrency')} flashKey={flashKey}>
                    <FormField
                      control={form.control}
                      name="salaryCurrency"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>
                            <ShimmerLabel active={isShimmering}>Moneda</ShimmerLabel>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </FlashWrapper>
                  <Controller
                    control={form.control}
                    name="isFavorite"
                    render={({ field }) => (
                      <div className="flex flex-col items-center gap-1 pb-0.5">
                        <span className="text-sm leading-none font-medium">Favorita</span>
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
              <FlashWrapper flash={flashFields.has('benefits')} flashKey={flashKey}>
                <div className="space-y-2">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium tracking-wider uppercase">
                    {isShimmering ? (
                      <Shimmer as="span" className="text-xs font-medium" duration={1.5}>
                        Beneficios
                      </Shimmer>
                    ) : (
                      'Beneficios'
                    )}
                    <span className="group relative inline-flex normal-case">
                      <HelpCircle className="h-3.5 w-3.5 cursor-help" />
                      <span className="bg-popover text-popover-foreground ring-border pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-56 -translate-x-1/2 rounded-md px-3 py-2 text-xs font-normal shadow-md ring-1 group-hover:block">
                        Escribe un beneficio y presiona Enter o coma para agregarlo. Ejemplos: Home
                        office, Seguro médico, Bono anual.
                      </span>
                    </span>
                  </p>
                  <Controller
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <BenefitList value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </FlashWrapper>

              <Separator className="my-5" />

              {/* ── Sección: Fechas ────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appliedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span className="flex items-center gap-1">
                          Fecha postulación
                          <span className="group relative inline-flex">
                            <HelpCircle className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                            <span className="bg-popover text-popover-foreground ring-border pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-md px-3 py-2 text-xs font-normal shadow-md ring-1 group-hover:block">
                              Día en que enviaste tu candidatura a esta oferta.
                            </span>
                          </span>
                        </span>
                      </FormLabel>
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
                      <FormLabel>
                        <span className="flex items-center gap-1">
                          Fecha respuesta
                          <span className="group relative inline-flex">
                            <HelpCircle className="text-muted-foreground/60 h-3.5 w-3.5 cursor-help" />
                            <span className="bg-popover text-popover-foreground ring-border pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-52 -translate-x-1/2 rounded-md px-3 py-2 text-xs font-normal shadow-md ring-1 group-hover:block">
                              Fecha en que la empresa te dio una respuesta (positiva o negativa).
                              Déjala vacía si aún esperas.
                            </span>
                          </span>
                        </span>
                      </FormLabel>
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
                          className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-1"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Sección: CV asociado ───────────────────────────────── */}
              <Separator className="my-5" />
              <div className="border-border/70 rounded-lg border border-dashed p-4">
                <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                  CV Asociado
                </p>
                {defaultValues?.cvId ? (
                  <p className="text-primary cursor-pointer text-sm hover:underline">
                    Ver CV generado →
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-sm">Sin CV generado aún</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled
                    >
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
                      className="text-muted-foreground mb-3 flex w-full items-center justify-between text-xs font-medium tracking-wider uppercase"
                      onClick={() => setShowTimeline((v) => !v)}
                    >
                      <span>Historial de estados ({defaultValues.timeline.length})</span>
                      {showTimeline ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {showTimeline && <ApplicationTimeline entries={defaultValues.timeline} />}
                  </div>
                </>
              )}

              <div className="pb-6" />
            </form>
          </Form>
        </div>

        {/* ── Footer fijo ────────────────────────────────────────────── */}
        <div className="border-border shrink-0 border-t px-6 py-4">
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
              {isEditing ? 'Guardar cambios' : 'Registrar oferta'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
