'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { Heart, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
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
import type { ApplicationDocument } from '@/lib/db/schemas'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types/cv'
import { cn } from '@/lib/utils'

interface ApplicationsTableProps {
  applications: ApplicationDocument[]
  onEdit: (application: ApplicationDocument) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

function formatSalary(amount: number, currency: string) {
  if (!amount) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency || 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ApplicationsTable({
  applications,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ApplicationsTableProps) {
  const router = useRouter()
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
        <h3 className="mb-1 font-semibold">Sin ofertas registradas</h3>
        <p className="text-muted-foreground text-sm">
          Registra tu primera oferta haciendo clic en &quot;Registrar oferta&quot;
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border-border overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8 pl-4" />
              <TableHead className="w-[180px]">Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="w-[160px]">Estado</TableHead>
              <TableHead className="w-[130px]">Salario</TableHead>
              <TableHead className="w-[120px]">Aplicado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="group">
                {/* Favorite */}
                <TableCell className="pr-2 pl-4">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(app.id)}
                    className="transition-transform hover:scale-110"
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4 transition-colors',
                        app.isFavorite
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground/30 group-hover:text-muted-foreground/60'
                      )}
                    />
                  </button>
                </TableCell>

                {/* Company */}
                <TableCell>
                  <div>
                    <p className="leading-snug font-medium">{app.company}</p>
                    <p className="text-muted-foreground text-xs">{app.source}</p>
                  </div>
                </TableCell>

                {/* Position + next steps */}
                <TableCell>
                  <p className="text-sm">{app.position}</p>
                  {app.nextSteps && (
                    <p className="text-muted-foreground mt-0.5 max-w-[220px] truncate text-xs">
                      → {app.nextSteps}
                    </p>
                  )}
                  {app.benefits && app.benefits.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.benefits.slice(0, 3).map((b) => (
                        <span
                          key={b}
                          className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]"
                        >
                          {b}
                        </span>
                      ))}
                      {app.benefits.length > 3 && (
                        <span className="text-muted-foreground text-[10px]">
                          +{app.benefits.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Status (read-only) */}
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                </TableCell>

                {/* Salary */}
                <TableCell>
                  <span className="text-sm">
                    {formatSalary(app.salaryOffered, app.salaryCurrency || 'COP')}
                  </span>
                </TableCell>

                {/* Date */}
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
                    <p className="text-muted-foreground text-xs">
                      {app.createdAt &&
                        formatDistanceToNow(new Date(app.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                    </p>
                  </div>
                </TableCell>

                {/* Actions */}
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
                      <DropdownMenuItem onClick={() => router.push(`/applications/${app.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(app)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edición rápida
                      </DropdownMenuItem>
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
    </>
  )
}
