'use client'

import { useState } from 'react'
import { Download, Eye, Trash2, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCvs } from '@/hooks/use-cvs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CvViewer } from '@/components/cv/cv-viewer'
import type { CvData } from '@/types/experience'
import type { CvDocument } from '@/lib/db/schemas'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function parseCvData(raw: string): CvData | null {
  try {
    return JSON.parse(raw) as CvData
  } catch {
    return null
  }
}

export default function CvsPage() {
  const { cvs, isLoading, deleteCV } = useCvs()
  const [previewCv, setPreviewCv] = useState<CvDocument | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const previewData = previewCv ? parseCvData(previewCv.cvData) : null

  function handleDownload() {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis CVs</h1>
        <p className="text-sm text-muted-foreground">
          CVs generados y guardados desde el generador de CV
        </p>
      </div>

      {cvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-lg border border-dashed border-border/60 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Sin CVs guardados aún</p>
          <p className="text-xs text-muted-foreground">
            Genera tu primer CV optimizado desde el generador
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/cv-generator">Ir al generador</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cv.jobTitle}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{cv.company}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{formatDate(cv.createdAt)}</span>
                  {cv.applicationId && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <Link
                        href={`/applications/${cv.applicationId}`}
                        className="text-xs text-primary hover:underline flex items-center gap-0.5"
                      >
                        Ver postulación
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setPreviewCv(cv)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setPreviewCv(cv)
                    setTimeout(() => window.print(), 300)
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(cv.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Badge variant="secondary" className="text-xs">
        {cvs.length} CV{cvs.length !== 1 ? 's' : ''} guardado{cvs.length !== 1 ? 's' : ''}
      </Badge>

      {/* CV Preview Sheet */}
      <Sheet open={!!previewCv} onOpenChange={(open) => !open && setPreviewCv(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm">
                {previewCv?.jobTitle} — {previewCv?.company}
              </SheetTitle>
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Descargar PDF
              </Button>
            </div>
          </SheetHeader>
          {previewData && (
            <div className="bg-white">
              <CvViewer cv={previewData} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este CV?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El CV se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingId) await deleteCV(deletingId)
                setDeletingId(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
