'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Star } from 'lucide-react'
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
import type { ApplicationDocument } from '@/lib/db/schemas'
import { APPLICATION_STATUS_LABELS } from '@/types/cv'

const applicationSchema = z.object({
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
  benefits: z.string(),
  ranking: z.coerce.number().min(0).max(5),
  appliedAt: z.string(),
  responseDate: z.string(),
  nextSteps: z.string(),
  notes: z.string(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

const SOURCES = ['LinkedIn', 'Computrabajo', 'GetOnBoard', 'Indeed', 'Referido', 'Otro']
const CURRENCIES = ['COP', 'USD', 'EUR']

interface ApplicationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ApplicationFormData) => Promise<void>
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
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company: '',
      position: '',
      source: 'LinkedIn',
      status: 'pending',
      salaryOffered: 0,
      salaryCurrency: 'COP',
      benefits: '',
      ranking: 0,
      appliedAt: new Date().toISOString().split('T')[0],
      responseDate: '',
      nextSteps: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (defaultValues && open) {
      form.reset({
        company: defaultValues.company ?? '',
        position: defaultValues.position ?? '',
        source: defaultValues.source ?? 'LinkedIn',
        status: defaultValues.status ?? 'pending',
        salaryOffered: defaultValues.salaryOffered ?? 0,
        salaryCurrency: defaultValues.salaryCurrency ?? 'COP',
        benefits: defaultValues.benefits ?? '',
        ranking: defaultValues.ranking ?? 0,
        appliedAt: defaultValues.appliedAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        responseDate: defaultValues.responseDate ?? '',
        nextSteps: defaultValues.nextSteps ?? '',
        notes: defaultValues.notes ?? '',
      })
    }
  }, [defaultValues, open, form])

  const { isSubmitting } = form.formState
  const rankingValue = form.watch('ranking')

  async function handleSubmit(data: ApplicationFormData) {
    await onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-4">
          <SheetTitle>{isEditing ? 'Editar postulación' : 'Nueva postulación'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Actualiza los datos de esta postulación'
              : 'Registra una nueva oferta laboral'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Company & Position */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
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
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="ej. Senior Backend Engineer..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <FormMessage />
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
                        {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Salary */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salaryOffered"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Salario ofertado</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salaryCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ranking */}
            <FormField
              control={form.control}
              name="ranking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ranking</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star === rankingValue ? 0 : star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= rankingValue
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/40'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {/* Dates */}
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
                    <FormMessage />
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

            {/* Benefits & Notes */}
            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficios</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Seguro médico, Home office, Bonos..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
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
                    <Input placeholder="Observaciones adicionales..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear postulación'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
