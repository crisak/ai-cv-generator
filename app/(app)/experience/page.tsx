import { FileText, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ExperiencePage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Experiencia</h1>
        <p className="text-sm text-muted-foreground">
          Editor de tu experiencia real para generar CVs personalizados
        </p>
      </div>
      <Card className="border-dashed border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Editor de experiencia</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Importa tu <code className="rounded bg-muted px-1">cv-experiencia-real.json</code>,
            edita cada sección con un formulario dinámico y exporta el resultado listo para usar.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            <span>Disponible en Fase 2</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
