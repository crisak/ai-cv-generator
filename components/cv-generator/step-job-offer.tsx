'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApplicationDocument } from '@/lib/db/schemas'

interface StepJobOfferProps {
  jobOfferText: string
  applicationId: string
  applications: ApplicationDocument[]
  onJobOfferChange: (text: string) => void
  onApplicationChange: (id: string) => void
  onNext: () => void
}

export function StepJobOffer({
  jobOfferText,
  applicationId,
  applications,
  onJobOfferChange,
  onApplicationChange,
  onNext,
}: StepJobOfferProps) {
  const [selectedAppId, setSelectedAppId] = useState(applicationId)

  function handleAppSelect(id: string) {
    setSelectedAppId(id)
    onApplicationChange(id)
    if (id !== 'none') {
      const app = applications.find((a) => a.id === id)
      if (app?.jobOfferText) onJobOfferChange(app.jobOfferText)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Vincular a una postulación (opcional)</Label>
        <Select value={selectedAppId || 'none'} onValueChange={handleAppSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Sin vincular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin vincular</SelectItem>
            {applications.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.company} — {app.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Al vincular, se carga el texto de la oferta automáticamente y el CV se asocia a la postulación.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>
          Oferta laboral
          <span className="ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          value={jobOfferText}
          onChange={(e) => onJobOfferChange(e.target.value)}
          className="min-h-[280px] text-sm resize-y font-mono"
          placeholder="Pega aquí el texto completo de la oferta laboral..."
        />
        <p className="text-xs text-muted-foreground">
          Incluye el texto completo — título, requisitos, responsabilidades y stack tecnológico.
        </p>
      </div>

      {!jobOfferText.trim() && (
        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Pega el texto de la oferta para obtener mejores sugerencias de bullets.
          </p>
        </div>
      )}

      <Button
        onClick={onNext}
        disabled={!jobOfferText.trim()}
        className="w-full gap-2"
        size="lg"
      >
        <Sparkles className="h-4 w-4" />
        Analizar oferta y seleccionar bullets
      </Button>
    </div>
  )
}
