'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X, Plus, Pencil, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BenefitListProps {
  value: string[]
  onChange: (items: string[]) => void
  className?: string
}

export function BenefitList({ value, onChange, className }: BenefitListProps) {
  const [newItem, setNewItem] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addItem() {
    const trimmed = newItem.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setNewItem('')
  }

  function removeItem(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setEditingValue(value[idx])
  }

  function confirmEdit(idx: number) {
    const trimmed = editingValue.trim()
    if (!trimmed) {
      removeItem(idx)
    } else {
      const updated = [...value]
      updated[idx] = trimmed
      onChange(updated)
    }
    setEditingIdx(null)
    setEditingValue('')
  }

  function handleNewKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
    if (e.key === 'Escape') {
      setNewItem('')
      inputRef.current?.blur()
    }
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmEdit(idx)
    }
    if (e.key === 'Escape') {
      setEditingIdx(null)
      setEditingValue('')
    }
  }

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background overflow-hidden',
        className
      )}
    >
      {/* List */}
      {value.length > 0 && (
        <ul className="max-h-48 overflow-y-auto divide-y divide-border/50">
          {value.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 px-3 py-2 group">
              {editingIdx === idx ? (
                <>
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, idx)}
                    onBlur={() => confirmEdit(idx)}
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => confirmEdit(idx)}
                    className="shrink-0 text-primary opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{item}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <div className={cn('flex items-center gap-2 px-3 py-2', value.length > 0 && 'border-t border-border/50')}>
        <input
          ref={inputRef}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleNewKeyDown}
          placeholder={value.length === 0 ? 'Ej: Home office, Seguro médico...' : 'Agregar beneficio...'}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
