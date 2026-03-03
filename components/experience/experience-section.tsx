'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { BulletList } from './bullet-list'
import type { ExperienceItem } from '@/types/experience'

interface ExperienceSectionProps {
  items: ExperienceItem[]
  onChange: (items: ExperienceItem[]) => void
}

const EMPTY_ITEM = (): ExperienceItem => ({
  id: uuidv4(),
  organization: '',
  title: '',
  location: '',
  dates: '',
  bullets: [],
  order: 0,
})

export function ExperienceSection({ items, onChange }: ExperienceSectionProps) {
  const [editItem, setEditItem] = useState<ExperienceItem | null>(null)
  const [isNew, setIsNew] = useState(false)

  const sorted = [...items].sort((a, b) => a.order - b.order)

  function openEdit(item: ExperienceItem) {
    setEditItem({ ...item, bullets: [...item.bullets] })
    setIsNew(false)
  }

  function openNew() {
    const blank = EMPTY_ITEM()
    blank.order = items.length
    setEditItem(blank)
    setIsNew(true)
  }

  function saveEdit() {
    if (!editItem) return
    const updated = isNew
      ? [...sorted, editItem]
      : sorted.map((it) => (it.id === editItem.id ? editItem : it))
    onChange(updated.map((it, idx) => ({ ...it, order: idx })))
    setEditItem(null)
  }

  function remove(id: string) {
    onChange(sorted.filter((it) => it.id !== id).map((it, idx) => ({ ...it, order: idx })))
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...sorted]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next.map((it, i) => ({ ...it, order: i })))
  }

  function setField<K extends keyof ExperienceItem>(key: K, val: ExperienceItem[K]) {
    if (!editItem) return
    setEditItem({ ...editItem, [key]: val })
  }

  return (
    <>
      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2.5"
          >
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === sorted.length - 1}
                className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{item.organization || 'Sin empresa'}</p>
                <span className="text-xs text-muted-foreground shrink-0">·</span>
                <p className="text-xs text-muted-foreground truncate">{item.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.dates}
                {item.bullets.length > 0 && (
                  <span className="ml-2 text-muted-foreground/60">
                    {item.bullets.length} bullet{item.bullets.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={openNew} className="gap-1.5 w-full">
          <Plus className="h-4 w-4" />
          Agregar experiencia
        </Button>
      </div>

      <Sheet open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{isNew ? 'Nueva experiencia' : 'Editar experiencia'}</SheetTitle>
            <SheetDescription>
              {editItem?.organization
                ? `${editItem.organization} — ${editItem.title}`
                : 'Completa los datos'}
            </SheetDescription>
          </SheetHeader>

          {editItem && (
            <div className="space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Empresa">
                  <Input
                    value={editItem.organization}
                    onChange={(e) => setField('organization', e.target.value)}
                    placeholder="VTEX"
                  />
                </Field>
                <Field label="Cargo">
                  <Input
                    value={editItem.title}
                    onChange={(e) => setField('title', e.target.value)}
                    placeholder="Software Engineer II"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Ubicación">
                  <Input
                    value={editItem.location}
                    onChange={(e) => setField('location', e.target.value)}
                    placeholder="Bogotá, Colombia"
                  />
                </Field>
                <Field label="Fechas">
                  <Input
                    value={editItem.dates}
                    onChange={(e) => setField('dates', e.target.value)}
                    placeholder="Enero 2024 – Octubre 2025"
                  />
                </Field>
              </div>

              <div className="space-y-1.5">
                <Label>Bullets ({editItem.bullets.length})</Label>
                <BulletList
                  bullets={editItem.bullets}
                  onChange={(bullets) => setField('bullets', bullets)}
                />
              </div>

              <Button onClick={saveEdit} className="w-full mt-2">
                Guardar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
