'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import type { TimelineEntry } from '@/lib/db/schemas'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types/cv'

interface ApplicationTimelineProps {
  entries: TimelineEntry[]
}

export function ApplicationTimeline({ entries }: ApplicationTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin historial aún.</p>
  }

  return (
    <div className="relative space-y-0">
      {sorted.map((entry, i) => (
        <div key={entry.id} className="flex gap-4">
          {/* Line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-background ring-2 ${
                i === 0 ? 'ring-primary bg-primary' : 'ring-border bg-muted'
              }`}
            />
            {i < sorted.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-xs font-medium ${APPLICATION_STATUS_COLORS[entry.status]}`}
              >
                {APPLICATION_STATUS_LABELS[entry.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.date), "dd 'de' MMM yyyy, HH:mm", { locale: es })}
              </span>
            </div>
            {entry.notes && (
              <p className="mt-1 text-sm text-muted-foreground leading-snug">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
