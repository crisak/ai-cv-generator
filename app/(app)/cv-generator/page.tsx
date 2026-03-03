import { Sparkles, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function CvGeneratorPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generar CV</h1>
        <p className="text-sm text-muted-foreground">
          Genera un CV optimizado para la oferta laboral con ayuda de IA
        </p>
      </div>
      <Card className="border-dashed border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Generador de CV con IA</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Pega la oferta laboral, define tus notas sobre tecnologías, aprueba los goals sugeridos
            por IA y genera un CV en formato ATS optimizado.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            <span>Disponible en Fase 3</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
