'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS } from '@/hooks/use-applications'
import type { TimelineEntry, TimelineFile } from '@/lib/db/schemas'
import type { ApplicationStatus } from '@/types/cv'

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'pending',
  'phone_screen',
  'technical',
  'hr_interview',
  'offer',
  'rejected',
  'accepted',
  'withdrawn',
]

const ALLOWED_TYPES = ['.md', '.pdf', '.txt', '.json']
const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface TimelineEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (entry: {
    title: string
    status: ApplicationStatus
    date: string
    deadline?: string
    notes: string
    files: TimelineFile[]
  }) => Promise<void>
  initialEntry?: TimelineEntry
  currentStatus: ApplicationStatus
}

export function TimelineEntryForm({
  open,
  onOpenChange,
  onSave,
  initialEntry,
  currentStatus,
}: TimelineEntryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [fileError, setFileError] = useState('')

  const [title, setTitle] = useState(initialEntry?.title ?? '')
  const [status, setStatus] = useState<ApplicationStatus>(initialEntry?.status ?? currentStatus)
  const [date, setDate] = useState(
    initialEntry?.date
      ? new Date(initialEntry.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [deadline, setDeadline] = useState(
    initialEntry?.deadline ? new Date(initialEntry.deadline).toISOString().split('T')[0] : ''
  )
  const [notes, setNotes] = useState(initialEntry?.notes ?? '')
  const [files, setFiles] = useState<TimelineFile[]>(initialEntry?.files ?? [])

  function resetForm() {
    setTitle(initialEntry?.title ?? '')
    setStatus(initialEntry?.status ?? currentStatus)
    setDate(
      initialEntry?.date
        ? new Date(initialEntry.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    )
    setDeadline(
      initialEntry?.deadline ? new Date(initialEntry.deadline).toISOString().split('T')[0] : ''
    )
    setNotes(initialEntry?.notes ?? '')
    setFiles(initialEntry?.files ?? [])
    setFileError('')
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError('')
    const newFiles = Array.from(e.target.files ?? [])

    if (files.length + newFiles.length > MAX_FILES) {
      setFileError(`Máximo ${MAX_FILES} archivos permitidos`)
      return
    }

    const processed: TimelineFile[] = []

    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_TYPES.includes(ext)) {
        setFileError(`Tipo no permitido: ${ext}. Solo ${ALLOWED_TYPES.join(', ')}`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} supera el límite de 5MB`)
        continue
      }

      const content = await readFile(file, ext === '.pdf')
      processed.push({ name: file.name, type: ext, content, size: file.size })
    }

    setFiles((prev) => [...prev, ...processed])
    if (e.target) e.target.value = ''
  }

  function readFile(file: File, asBase64: boolean): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      if (asBase64) {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        status,
        date: new Date(date).toISOString(),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        notes: notes.trim(),
        files,
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialEntry ? 'Editar paso del proceso' : 'Registrar nuevo paso'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Título del paso *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Entrevista técnica con CTO"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Nuevo estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Breve resumen: qué preguntas hicieron, cómo estuvo el proceso..."
              className="min-h-[80px] resize-y text-sm"
            />
          </div>

          {/* File attachments */}
          <div className="space-y-1.5">
            <Label>Archivos adjuntos</Label>
            <p className="text-xs text-muted-foreground">
              {ALLOWED_TYPES.join(', ')} — máx. {MAX_FILES} archivos, 5MB c/u
            </p>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs"
                  >
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <span className="text-muted-foreground/60">
                      ({(f.size / 1024).toFixed(0)}KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <Paperclip className="h-3.5 w-3.5" />
              Adjuntar archivo
            </Button>

            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {initialEntry ? 'Guardar cambios' : 'Registrar paso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
