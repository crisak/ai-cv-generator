'use client'

import { useState, useMemo, useEffect } from 'react'
import { Check, X, GitMerge, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { computeCvDiffs, applyDiffs } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'
import type { CvDiffItem, BulletDiff, SkillsDiff } from '@/lib/ai-cv'

interface CvOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftCv: CvData
  optimizedCv: CvData | null
  isLoading: boolean
  onConfirm: (cv: CvData) => void
}

export function CvOptimizeDialog({
  open,
  onOpenChange,
  draftCv,
  optimizedCv,
  isLoading,
  onConfirm,
}: CvOptimizeDialogProps) {
  const [diffs, setDiffs] = useState<CvDiffItem[]>([])

  useEffect(() => {
    if (optimizedCv) {
      setDiffs(computeCvDiffs(draftCv, optimizedCv))
    } else {
      setDiffs([])
    }
  }, [optimizedCv])

  const changedDiffs = useMemo(() => diffs.filter((d) => d.changed), [diffs])
  const pendingCount = changedDiffs.filter((d) => d.changed).length

  function toggleAccept(key: string) {
    setDiffs((prev) =>
      prev.map((d) => (d.key === key ? { ...d, accepted: !d.accepted } : d))
    )
  }

  function acceptAll() {
    setDiffs((prev) => prev.map((d) => ({ ...d, accepted: true })))
  }

  function rejectAll() {
    setDiffs((prev) => prev.map((d) => ({ ...d, accepted: d.changed ? false : d.accepted })))
  }

  function handleConfirm() {
    if (!optimizedCv) return
    const finalCv = applyDiffs(draftCv, diffs)
    onConfirm(finalCv)
  }

  // Group bullet diffs by section
  const sections = useMemo(() => {
    const map = new Map<string, { label: string; items: BulletDiff[] }>()
    diffs.forEach((d) => {
      if (d.key === 'skills') return
      const bd = d as BulletDiff
      if (!map.has(bd.sectionId)) {
        map.set(bd.sectionId, { label: bd.sectionLabel, items: [] })
      }
      map.get(bd.sectionId)!.items.push(bd)
    })
    return Array.from(map.entries())
  }, [diffs])

  const skillsDiff = diffs.find((d) => d.key === 'skills') as SkillsDiff | undefined

  const acceptedChanges = changedDiffs.filter((d) => d.accepted).length
  const rejectedChanges = changedDiffs.filter((d) => !d.accepted).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <GitMerge className="h-4 w-4 text-primary" />
            Revisar cambios sugeridos por la IA
          </DialogTitle>
          {!isLoading && changedDiffs.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">
                {changedDiffs.length} cambio{changedDiffs.length > 1 ? 's' : ''} detectado{changedDiffs.length > 1 ? 's' : ''}
              </span>
              <div className="flex gap-1.5">
                <Badge variant="secondary" className="text-[10px] text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0">
                  {acceptedChanges} aceptados
                </Badge>
                {rejectedChanges > 0 && (
                  <Badge variant="secondary" className="text-[10px] text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0">
                    {rejectedChanges} rechazados
                  </Badge>
                )}
              </div>
              <div className="flex gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="text-[10px] text-green-600 dark:text-green-400 hover:underline"
                >
                  Aceptar todos
                </button>
                <span className="text-muted-foreground/40 text-[10px]">·</span>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="text-[10px] text-red-600 dark:text-red-400 hover:underline"
                >
                  Rechazar todos
                </button>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">La IA está optimizando tu CV…</p>
            </div>
          )}

          {!isLoading && changedDiffs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Check className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium">Sin cambios significativos</p>
              <p className="text-xs text-muted-foreground">Tu borrador ya está optimizado</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Skills change */}
              {skillsDiff?.changed && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Habilidades técnicas</p>
                  <DiffCard
                    diff={skillsDiff}
                    original={skillsDiff.original}
                    proposed={skillsDiff.proposed}
                    onToggle={() => toggleAccept(skillsDiff.key)}
                  />
                </div>
              )}

              {/* Bullet changes per section */}
              {sections.map(([sectionId, { label, items }]) => {
                const changedItems = items.filter((d) => d.changed)
                if (changedItems.length === 0) return null
                return (
                  <div key={sectionId} className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <div className="space-y-2">
                      {changedItems.map((diff) => (
                        <DiffCard
                          key={diff.key}
                          diff={diff}
                          original={diff.original}
                          proposed={diff.proposed}
                          label={`Bullet ${diff.bulletIdx + 1}`}
                          onToggle={() => toggleAccept(diff.key)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {!isLoading && (
          <DialogFooter className="px-5 py-3 border-t border-border/50 shrink-0 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8"
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {acceptedChanges}/{pendingCount} cambios aceptados
                </span>
              )}
              <Button size="sm" onClick={handleConfirm} className="h-8 gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Confirmar y continuar
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DiffCard({
  diff,
  original,
  proposed,
  label,
  onToggle,
}: {
  diff: CvDiffItem
  original: string
  proposed: string
  label?: string
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-lg border text-xs transition-all',
        diff.accepted
          ? 'border-green-500/40 bg-green-500/5'
          : 'border-border/60 bg-muted/20 opacity-70'
      )}
    >
      {label && (
        <div className="px-3 py-1.5 border-b border-border/40 flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-1.5 py-0',
              diff.accepted
                ? 'text-green-600 dark:text-green-400 bg-green-500/10'
                : 'text-muted-foreground bg-muted'
            )}
          >
            {diff.accepted ? 'Aceptado' : 'Rechazado'}
          </Badge>
        </div>
      )}

      <div className="p-3 space-y-2">
        {original && (
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">Borrador</span>
            <p className="leading-relaxed text-muted-foreground line-through decoration-muted-foreground/40">
              {original}
            </p>
          </div>
        )}
        {proposed && (
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">IA sugiere</span>
            <p className="leading-relaxed text-foreground">{proposed}</p>
          </div>
        )}
      </div>

      <div className="px-3 pb-2.5 flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors border',
            diff.accepted
              ? 'border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10'
              : 'border-green-500/40 text-green-600 dark:text-green-400 hover:bg-green-500/10'
          )}
        >
          {diff.accepted ? (
            <><X className="h-2.5 w-2.5" /> Rechazar</>
          ) : (
            <><Check className="h-2.5 w-2.5" /> Aceptar</>
          )}
        </button>
      </div>
    </div>
  )
}
