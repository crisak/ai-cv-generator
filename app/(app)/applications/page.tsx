'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, BarChart2, Heart, X } from 'lucide-react'
import { useApplications } from '@/hooks/use-applications'
import { ApplicationsTable } from '@/components/applications/applications-table'
import { ApplicationForm } from '@/components/applications/application-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
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

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [minSalary, setMinSalary] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [benefitFilter, setBenefitFilter] = useState<string>('all')

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

  // Derived filter options from data
  const uniqueCompanies = useMemo(
    () => [...new Set(applications.map((a) => a.company).filter(Boolean))].sort(),
    [applications]
  )
  const uniqueBenefits = useMemo(
    () =>
      [...new Set(applications.flatMap((a) => a.benefits ?? []).filter(Boolean))].sort(),
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
        const matchFavorite = !onlyFavorites || app.isFavorite
        const matchCurrency = currencyFilter === 'all' || app.salaryCurrency === currencyFilter
        const matchSalary = !minSalary || app.salaryOffered >= parseFloat(minSalary)
        const matchCompany = companyFilter === 'all' || app.company === companyFilter
        const matchBenefit =
          benefitFilter === 'all' || (app.benefits ?? []).includes(benefitFilter)
        return matchSearch && matchStatus && matchFavorite && matchCurrency && matchSalary && matchCompany && matchBenefit
      }),
    [applications, search, statusFilter, onlyFavorites, currencyFilter, minSalary, companyFilter, benefitFilter]
  )

  const activeFilterCount = [
    search,
    statusFilter !== 'all',
    onlyFavorites,
    currencyFilter !== 'all',
    minSalary,
    companyFilter !== 'all',
    benefitFilter !== 'all',
  ].filter(Boolean).length

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setOnlyFavorites(false)
    setCurrencyFilter('all')
    setMinSalary('')
    setCompanyFilter('all')
    setBenefitFilter('all')
  }

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
        <StatCard label="En proceso" value={stats.active} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Ofertas recibidas" value={stats.offers} color="text-green-600 dark:text-green-400" />
        <StatCard label="Aceptadas" value={stats.accepted} color="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Row 1: Search + Status + Favorites */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px] h-9">
              <BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Estado" />
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

          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 rounded-md border px-3 h-9 text-sm transition-colors ${
              onlyFavorites
                ? 'border-red-400/60 bg-red-500/10 text-red-600 dark:text-red-400'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Heart className={`h-4 w-4 ${onlyFavorites ? 'fill-red-500 text-red-500' : ''}`} />
            Favoritos
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md border border-border/60 px-3 h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            </button>
          )}
        </div>

        {/* Row 2: Company + Currency + Salary + Benefits */}
        <div className="flex flex-wrap gap-2">
          {uniqueCompanies.length > 0 && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {uniqueCompanies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Moneda</SelectItem>
              <SelectItem value="COP">COP</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Salario mínimo"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            className="w-[140px] h-8 text-xs"
          />

          {uniqueBenefits.length > 0 && (
            <Select value={benefitFilter} onValueChange={setBenefitFilter}>
              <SelectTrigger className="w-[170px] h-8 text-xs">
                <SelectValue placeholder="Beneficio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los beneficios</SelectItem>
                {uniqueBenefits.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Results count */}
      {activeFilterCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {applications.length} postulaciones
        </p>
      )}

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
