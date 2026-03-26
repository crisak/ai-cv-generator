'use client'

import { useState } from 'react'
import { Download, Eye, Trash2, FileText, ExternalLink, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useCvs } from '@/hooks/use-cvs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
import { CvPdfDownloadLink } from '@/components/cv/cv-pdf-document'
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

function CvListItemPdfButton({ cvDoc }: { cvDoc: CvDocument }) {
  const cvData = parseCvData(cvDoc.cvData)
  if (!cvData) return null
  return (
    <CvPdfDownloadLink
      cv={cvData}
      filename={`cv-${cvDoc.jobTitle?.toLowerCase().replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.pdf`}
    >
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
        <Download className="h-3.5 w-3.5" />
        PDF
      </Button>
    </CvPdfDownloadLink>
  )
}

export default function CvsPage() {
  const { cvs, isLoading, deleteCV } = useCvs()
  const [previewCv, setPreviewCv] = useState<CvDocument | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const previewData = previewCv ? parseCvData(previewCv.cvData) : null

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis CVs</h1>
        <p className="text-muted-foreground text-sm">
          CVs generados y guardados desde el generador de CV
        </p>
      </div>

      {cvs.length === 0 ? (
        <div className="border-border/60 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <FileText className="text-muted-foreground/40 h-10 w-10" />
          <p className="text-sm font-medium">Sin CVs guardados aún</p>
          <p className="text-muted-foreground text-xs">
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
              className="border-border/60 bg-card flex items-center gap-4 rounded-lg border px-4 py-3"
            >
              <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                <FileText className="text-primary h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cv.jobTitle}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{cv.company}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{formatDate(cv.createdAt)}</span>
                  {cv.applicationId && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <Link
                        href={`/applications/${cv.applicationId}`}
                        className="text-primary flex items-center gap-0.5 text-xs hover:underline"
                      >
                        Ver postulación
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setPreviewCv(cv)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                  <Link href={`/cv-generator?editId=${cv.id}&step=2`}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                </Button>
                <CvListItemPdfButton cvDoc={cv} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-8"
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
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
          <SheetHeader className="border-border/60 border-b p-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm">
                {previewCv?.jobTitle} — {previewCv?.company}
              </SheetTitle>
              {previewData ? (
                <CvPdfDownloadLink
                  cv={previewData}
                  filename={`cv-${previewCv?.jobTitle?.toLowerCase().replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.pdf`}
                >
                  <Button size="sm" variant="outline" className="h-8 gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Descargar PDF
                  </Button>
                </CvPdfDownloadLink>
              ) : (
                <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled>
                  <Download className="h-3.5 w-3.5" />
                  Descargar PDF
                </Button>
              )}
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
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open: boolean) => !open && setDeletingId(null)}
      >
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
