'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { EducationItem } from '@/types/experience'

interface EducationSectionProps {
  items: EducationItem[]
  onChange: (items: EducationItem[]) => void
}

const EMPTY_ITEM = (): EducationItem => ({
  id: uuidv4(),
  institution: '',
  location: '',
  degree: '',
  concentration: '',
  gpa: '',
  graduationDate: '',
  thesis: '',
  coursework: '',
  studyAbroad: null,
  order: 0,
})

export function EducationSection({ items, onChange }: EducationSectionProps) {
  const [editItem, setEditItem] = useState<EducationItem | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [hasStudyAbroad, setHasStudyAbroad] = useState(false)

  const sorted = [...items].sort((a, b) => a.order - b.order)

  function openEdit(item: EducationItem) {
    setEditItem({ ...item, studyAbroad: item.studyAbroad ? { ...item.studyAbroad } : null })
    setHasStudyAbroad(!!item.studyAbroad)
    setIsNew(false)
  }

  function openNew() {
    const blank = EMPTY_ITEM()
    blank.order = items.length
    setEditItem(blank)
    setHasStudyAbroad(false)
    setIsNew(true)
  }

  function saveEdit() {
    if (!editItem) return
    const final = {
      ...editItem,
      studyAbroad: hasStudyAbroad ? (editItem.studyAbroad ?? { program: '', location: '', coursework: '', dates: '' }) : null,
    }
    const updated = isNew
      ? [...sorted, final]
      : sorted.map((it) => (it.id === final.id ? final : it))
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

  function setField<K extends keyof EducationItem>(key: K, val: EducationItem[K]) {
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
              <p className="text-sm font-medium truncate">{item.institution || 'Sin nombre'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.degree} {item.graduationDate ? `· ${item.graduationDate}` : ''}
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
          Agregar educación
        </Button>
      </div>

      <Sheet open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>{isNew ? 'Nueva educación' : 'Editar educación'}</SheetTitle>
            <SheetDescription>{editItem?.institution || 'Completa los datos'}</SheetDescription>
          </SheetHeader>

          {editItem && (
            <div className="space-y-4 pb-6">
              <Field label="Institución">
                <Input value={editItem.institution} onChange={(e) => setField('institution', e.target.value)} placeholder="Universidad Nacional" />
              </Field>
              <Field label="Ubicación">
                <Input value={editItem.location} onChange={(e) => setField('location', e.target.value)} placeholder="Bogotá, Colombia" />
              </Field>
              <Field label="Título / Grado">
                <Input value={editItem.degree} onChange={(e) => setField('degree', e.target.value)} placeholder="Ingeniería de Sistemas" />
              </Field>
              <Field label="Concentración (opcional)">
                <Input value={editItem.concentration} onChange={(e) => setField('concentration', e.target.value)} placeholder="Tecnología de la información" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de graduación">
                  <Input value={editItem.graduationDate} onChange={(e) => setField('graduationDate', e.target.value)} placeholder="Octubre 2021" />
                </Field>
                <Field label="GPA (opcional)">
                  <Input value={editItem.gpa} onChange={(e) => setField('gpa', e.target.value)} placeholder="4.2/5.0" />
                </Field>
              </div>
              <Field label="Tesis (opcional)">
                <Input value={editItem.thesis} onChange={(e) => setField('thesis', e.target.value)} placeholder="Título de tesis" />
              </Field>
              <Field label="Cursos / Logros destacados (opcional)">
                <Input value={editItem.coursework} onChange={(e) => setField('coursework', e.target.value)} placeholder="Medalla WorldSkills 2018" />
              </Field>

              <div className="flex items-center gap-3">
                <Switch checked={hasStudyAbroad} onCheckedChange={setHasStudyAbroad} />
                <Label>Intercambio / estudio en el exterior</Label>
              </div>

              {hasStudyAbroad && (
                <div className="rounded-md border border-border/60 p-3 space-y-3">
                  <Field label="Programa">
                    <Input
                      value={editItem.studyAbroad?.program ?? ''}
                      onChange={(e) => setField('studyAbroad', { ...(editItem.studyAbroad ?? { program: '', location: '', coursework: '', dates: '' }), program: e.target.value })}
                    />
                  </Field>
                  <Field label="Ubicación">
                    <Input
                      value={editItem.studyAbroad?.location ?? ''}
                      onChange={(e) => setField('studyAbroad', { ...(editItem.studyAbroad ?? { program: '', location: '', coursework: '', dates: '' }), location: e.target.value })}
                    />
                  </Field>
                  <Field label="Fechas">
                    <Input
                      value={editItem.studyAbroad?.dates ?? ''}
                      onChange={(e) => setField('studyAbroad', { ...(editItem.studyAbroad ?? { program: '', location: '', coursework: '', dates: '' }), dates: e.target.value })}
                    />
                  </Field>
                </div>
              )}

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
