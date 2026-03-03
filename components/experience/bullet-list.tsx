'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface BulletListProps {
  bullets: string[]
  onChange: (bullets: string[]) => void
}

export function BulletList({ bullets, onChange }: BulletListProps) {
  function update(i: number, val: string) {
    const next = [...bullets]
    next[i] = val
    onChange(next)
  }

  function remove(i: number) {
    onChange(bullets.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...bullets]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex flex-col gap-0.5 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === bullets.length - 1}
              className="text-muted-foreground/40 hover:text-foreground disabled:opacity-20 transition-colors"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <Textarea
            value={b}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 min-h-[72px] text-sm resize-y"
            placeholder="Acción (pasado) + Qué + Cómo + Resultado cuantificable"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="pt-2 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...bullets, ''])}
        className="gap-1.5 text-xs h-7"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar bullet
      </Button>
    </div>
  )
}
