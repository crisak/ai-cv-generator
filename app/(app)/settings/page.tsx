import { Settings, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Personaliza el modelo de IA, tu perfil y preferencias de la aplicación
        </p>
      </div>
      <Card className="border-dashed border-border/70">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <Settings className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Panel de configuración</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Selecciona el modelo de IA (Claude, GPT, Gemini, Grok, DeepSeek), configura tu API key,
            y actualiza tu información de perfil.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            <span>Disponible en Fase 4</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
