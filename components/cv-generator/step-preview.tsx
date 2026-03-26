'use client'

import { Download, Save, ChevronLeft, Sparkles, Loader2, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CvViewer } from '@/components/cv/cv-viewer'
import { CvPdfDownloadLink } from '@/components/cv/cv-pdf-document'
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
  isEditing?: boolean
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
  isEditing,
  onBack,
  onSave,
  onDownload,
}: StepPreviewProps) {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Generando CV optimizado…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Editar bullets
          </Button>
          {usedAI && (
            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              Optimizado con IA
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!savedCvId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-8 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaving
                ? isEditing
                  ? 'Actualizando…'
                  : 'Guardando…'
                : isEditing
                  ? 'Actualizar CV'
                  : 'Guardar CV'}
            </Button>
          ) : (
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-xs text-green-600 dark:text-green-400"
            >
              {isEditing ? 'CV actualizado' : 'CV guardado'}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadJson(cv)}
            className="h-8 gap-1.5"
          >
            <FileJson className="h-3.5 w-3.5" />
            Descargar JSON
          </Button>
          <CvPdfDownloadLink
            cv={cv}
            filename={`cv-${cv.basics.fullName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`}
          >
            <Button size="sm" className="h-8 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Descargar PDF
            </Button>
          </CvPdfDownloadLink>
        </div>
      </div>

      {/* CV preview */}
      <div className="border-border max-h-[620px] overflow-auto rounded-lg border bg-white shadow-sm">
        <CvViewer cv={cv} />
      </div>

      <p className="text-muted-foreground text-center text-xs">
        "Descargar PDF" abrirá el diálogo de impresión del navegador — selecciona "Guardar como PDF"
      </p>
    </div>
  )
}
