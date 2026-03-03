'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Star, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ApplicationDocument } from '@/lib/db/schemas'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '@/types/cv'

interface ApplicationsTableProps {
  applications: ApplicationDocument[]
  onEdit: (application: ApplicationDocument) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ApplicationStatus) => void
}

function formatSalary(amount: number, currency: string) {
  if (!amount) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  )
}

export function ApplicationsTable({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 text-4xl">📋</div>
        <h3 className="mb-1 font-semibold">Sin postulaciones aún</h3>
        <p className="text-sm text-muted-foreground">
          Crea tu primera postulación haciendo clic en "Nueva postulación"
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Empresa</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead className="w-[160px]">Estado</TableHead>
            <TableHead className="w-[140px]">Salario</TableHead>
            <TableHead className="w-[100px]">Ranking</TableHead>
            <TableHead className="w-[140px]">Aplicado</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id} className="group">
              <TableCell>
                <div>
                  <p className="font-medium">{app.company}</p>
                  <p className="text-xs text-muted-foreground">{app.source}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{app.position}</p>
                {app.nextSteps && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[200px]">
                    → {app.nextSteps}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={app.status}
                  onValueChange={(val) => onStatusChange(app.id, val as ApplicationStatus)}
                >
                  <SelectTrigger className="h-7 w-full border-0 p-0 shadow-none focus:ring-0">
                    <SelectValue>
                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}
                      >
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${APPLICATION_STATUS_COLORS[value as ApplicationStatus]}`}
                        >
                          {label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {formatSalary(app.salaryOffered, app.salaryCurrency || 'COP')}
                </span>
              </TableCell>
              <TableCell>
                <StarRating value={app.ranking || 0} />
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.createdAt &&
                      formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(app)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {app.cvId && (
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver CV
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(app.id)}
                      disabled={deletingId === app.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
