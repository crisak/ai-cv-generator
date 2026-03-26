'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CvViewer } from '@/components/cv/cv-viewer'
import { CvPdfDownloadLink } from '@/components/cv/cv-pdf-document'
import { Eye, Download } from 'lucide-react'
import type { CvData } from '@/types/experience'

interface CvPreviewDialogProps {
  cv: CvData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CvPreviewDialog({ cv, open, onOpenChange }: CvPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col p-0">
        <DialogHeader className="border-border/50 shrink-0 border-b px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Eye className="text-primary h-4 w-4" />
              Vista previa del borrador
            </DialogTitle>
            <CvPdfDownloadLink
              cv={cv}
              filename={`cv-${cv.basics.fullName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Descargar PDF
              </Button>
            </CvPdfDownloadLink>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto rounded-b-lg bg-white">
          <CvViewer cv={cv} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
