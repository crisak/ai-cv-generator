'use client'

import { useState } from 'react'
import { MoreHorizontal, Paperclip, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/hooks/use-applications'
import type { TimelineEntry, TimelineFile } from '@/lib/db/schemas'
import type { ApplicationStatus } from '@/types/cv'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-slate-400',
  phone_screen: 'bg-blue-400',
  technical: 'bg-violet-500',
  hr_interview: 'bg-amber-400',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-500',
  accepted: 'bg-green-500',
  withdrawn: 'bg-gray-400',
}

const STATUS_BADGE_VARIANT: Record<ApplicationStatus, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  phone_screen: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  technical: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  hr_interview: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`
  return `hace ${Math.floor(days / 30)} mes.`
}

function deadlineStatus(deadlineIso: string) {
  const diff = new Date(deadlineIso).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return { label: `Vencido hace ${-days} día${-days !== 1 ? 's' : ''}`, variant: 'destructive' as const }
  if (days === 0) return { label: 'Vence hoy', variant: 'destructive' as const }
  if (days <= 3) return { label: `Vence en ${days} día${days !== 1 ? 's' : ''}`, variant: 'warning' as const }
  return { label: `Límite: ${formatDate(deadlineIso)}`, variant: 'default' as const }
}

function downloadFile(file: TimelineFile) {
  const isBase64 = file.content.startsWith('data:')
  const blob = isBase64
    ? fetch(file.content).then((r) => r.blob())
    : Promise.resolve(new Blob([file.content], { type: 'text/plain' }))

  blob.then((b) => {
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  })
}

function FileChip({ file }: { file: TimelineFile }) {
  return (
    <button
      type="button"
      onClick={() => downloadFile(file)}
      className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Paperclip className="h-2.5 w-2.5" />
      {file.name}
    </button>
  )
}

interface TimelineViewProps {
  entries: TimelineEntry[]
  onEdit?: (entry: TimelineEntry) => void
  onDelete?: (entryId: string) => void
}

export function TimelineView({ entries, onEdit, onDelete }: TimelineViewProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">Sin historial de pasos aún.</p>
    )
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, idx) => (
        <TimelineItem
          key={entry.id}
          entry={entry}
          isLast={idx === entries.length - 1}
          onEdit={onEdit ? () => onEdit(entry) : undefined}
          onDelete={onDelete ? () => onDelete(entry.id) : undefined}
        />
      ))}
    </div>
  )
}

function TimelineItem({
  entry,
  isLast,
  onEdit,
  onDelete,
}: {
  entry: TimelineEntry
  isLast: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasLongNotes = entry.notes.length > 120
  const notesPreview = hasLongNotes ? entry.notes.substring(0, 120) + '…' : entry.notes
  const dl = entry.deadline ? deadlineStatus(entry.deadline) : null

  return (
    <div className="flex gap-3">
      {/* Dot + connector */}
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-3 rounded-full shrink-0 mt-1', STATUS_COLORS[entry.status as ApplicationStatus] ?? 'bg-gray-400')} />
        {!isLast && <div className="w-px flex-1 bg-border/60 my-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-1')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium leading-tight">
                {entry.title || STATUS_LABELS[entry.status as ApplicationStatus] || entry.status}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0 text-[10px] font-medium',
                  STATUS_BADGE_VARIANT[entry.status as ApplicationStatus] ?? 'bg-muted text-muted-foreground'
                )}
              >
                {STATUS_LABELS[entry.status as ApplicationStatus] ?? entry.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{relativeTime(entry.date)}</span>
              {dl && (
                <span
                  className={cn(
                    'flex items-center gap-0.5 text-[10px] font-medium',
                    dl.variant === 'destructive' ? 'text-red-500' : dl.variant === 'warning' ? 'text-amber-500' : 'text-muted-foreground'
                  )}
                >
                  {(dl.variant === 'destructive' || dl.variant === 'warning') && (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  )}
                  {dl.variant === 'default' && <Calendar className="h-2.5 w-2.5" />}
                  {dl.label}
                </span>
              )}
            </div>
          </div>

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {entry.notes && (
          <div className="mt-1.5">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {expanded || !hasLongNotes ? entry.notes : notesPreview}
            </p>
            {hasLongNotes && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-[10px] text-primary mt-0.5 hover:underline"
              >
                {expanded ? (
                  <><ChevronUp className="h-2.5 w-2.5" /> Ver menos</>
                ) : (
                  <><ChevronDown className="h-2.5 w-2.5" /> Ver más</>
                )}
              </button>
            )}
          </div>
        )}

        {entry.files?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.files.map((f, i) => (
              <FileChip key={i} file={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
