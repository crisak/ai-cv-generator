'use client'

import { useState } from 'react'
import { Download, Save, ChevronLeft, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CvViewer } from '@/components/cv/cv-viewer'
import type { CvData } from '@/types/experience'

interface StepPreviewProps {
  cv: CvData
  usedAI: boolean
  isGenerating: boolean
  isSaving: boolean
  savedCvId: string | null
  onBack: () => void
  onSave: () => void
  onDownload: () => void
}

export function StepPreview({
  cv,
  usedAI,
  isGenerating,
  isSaving,
  savedCvId,
  onBack,
  onSave,
  onDownload,
}: StepPreviewProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generando CV optimizado…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 h-8">
            <ChevronLeft className="h-4 w-4" />
            Editar bullets
          </Button>
          {usedAI && (
            <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" />
              Optimizado con IA
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {!savedCvId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="gap-1.5 h-8"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaving ? 'Guardando…' : 'Guardar CV'}
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400 bg-green-500/10">
              CV guardado
            </Badge>
          )}
          <Button size="sm" onClick={onDownload} className="gap-1.5 h-8">
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* CV preview */}
      <div
        className="rounded-lg border border-border shadow-sm overflow-auto max-h-[620px] bg-white"
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 0)}
      >
        <CvViewer cv={cv} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        "Descargar PDF" abrirá el diálogo de impresión del navegador — selecciona "Guardar como PDF"
      </p>
    </div>
  )
}
