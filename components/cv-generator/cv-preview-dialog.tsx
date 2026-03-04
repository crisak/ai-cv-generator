'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CvViewer } from '@/components/cv/cv-viewer'
import { Eye } from 'lucide-react'
import type { CvData } from '@/types/experience'

interface CvPreviewDialogProps {
  cv: CvData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CvPreviewDialog({ cv, open, onOpenChange }: CvPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary" />
            Vista previa del borrador
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-white rounded-b-lg">
          <CvViewer cv={cv} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
