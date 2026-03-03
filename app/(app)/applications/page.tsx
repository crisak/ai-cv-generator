'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, BarChart2 } from 'lucide-react'
import { useApplications } from '@/hooks/use-applications'
import { ApplicationsTable } from '@/components/applications/applications-table'
import { ApplicationForm } from '@/components/applications/application-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ApplicationDocument } from '@/lib/db/schemas'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationStatus,
} from '@/types/cv'

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className={`text-xs font-medium ${color ?? 'text-muted-foreground'}`}>{label}</p>
      </CardContent>
    </Card>
  )
}

export default function ApplicationsPage() {
  const { applications, isLoading, createApplication, updateApplication, deleteApplication, toggleFavorite } =
    useApplications()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<ApplicationDocument | undefined>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const stats = useMemo(
    () => ({
      total: applications.length,
      active: applications.filter((a) =>
        ['pending', 'phone_screen', 'technical', 'hr_interview'].includes(a.status)
      ).length,
      offers: applications.filter((a) => a.status === 'offer').length,
      accepted: applications.filter((a) => a.status === 'accepted').length,
    }),
    [applications]
  )

  const filtered = useMemo(
    () =>
      applications.filter((app) => {
        const matchSearch =
          !search ||
          app.company.toLowerCase().includes(search.toLowerCase()) ||
          app.position.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || app.status === statusFilter
        return matchSearch && matchStatus
      }),
    [applications, search, statusFilter]
  )

  function handleEdit(app: ApplicationDocument) {
    setEditingApp(app)
    setIsFormOpen(true)
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) setEditingApp(undefined)
  }

  async function handleFormSubmit(data: Parameters<typeof createApplication>[0]) {
    if (editingApp) {
      await updateApplication(editingApp.id, data)
    } else {
      await createApplication(data)
    }
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    await updateApplication(id, { status })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Postulaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y sigue el estado de tus postulaciones laborales
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva postulación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard
          label="En proceso"
          value={stats.active}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Ofertas recibidas"
          value={stats.offers}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Aceptadas"
          value={stats.accepted}
          color="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                <span className={`text-xs font-medium ${APPLICATION_STATUS_COLORS[value as ApplicationStatus]}`}>
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <ApplicationsTable
        applications={filtered}
        onEdit={handleEdit}
        onDelete={deleteApplication}
        onStatusChange={handleStatusChange}
        onToggleFavorite={toggleFavorite}
      />

      {/* Form Sheet */}
      <ApplicationForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleFormSubmit}
        defaultValues={editingApp}
        isEditing={!!editingApp}
      />
    </div>
  )
}
