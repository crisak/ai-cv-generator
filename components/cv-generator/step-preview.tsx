'use client'

import { Download, Save, ChevronLeft, Sparkles, Loader2, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CvViewer } from '@/components/cv/cv-viewer'
import type { CvData } from '@/types/experience'

function downloadJson(cv: CvData) {
  const blob = new Blob([JSON.stringify(cv, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cv-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

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

        <div className="flex gap-2 items-center">
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
          <Button variant="outline" size="sm" onClick={() => downloadJson(cv)} className="gap-1.5 h-8">
            <FileJson className="h-3.5 w-3.5" />
            Descargar JSON
          </Button>
          <Button size="sm" onClick={onDownload} className="gap-1.5 h-8">
            <Download className="h-3.5 w-3.5" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* CV preview */}
      <div className="rounded-lg border border-border shadow-sm overflow-auto max-h-[620px] bg-white">
        <CvViewer cv={cv} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        "Descargar PDF" abrirá el diálogo de impresión del navegador — selecciona "Guardar como PDF"
      </p>
    </div>
  )
}
