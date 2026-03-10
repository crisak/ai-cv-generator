'use client'

import { useUser } from '@clerk/nextjs'
import { Sun, Moon, Monitor, Save } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
    }
  }, [user])

  async function handleSave() {
    if (!user) return
    setIsSaving(true)
    try {
      await user.update({ firstName, lastName })
      setIsDirty(false)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? '??'

  if (!isLoaded) return null

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
      </div>

      {/* Avatar + email */}
      <section className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ''} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user?.fullName ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{user?.emailAddresses?.[0]?.emailAddress}</p>
        </div>
      </section>

      <Separator />

      {/* Nombre */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Nombre</h2>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setIsDirty(true) }}
              placeholder="Nombre"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setIsDirty(true) }}
              placeholder="Apellido"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Apariencia */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Apariencia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Modo oscuro o claro</p>
        </div>

        <div className="flex gap-2">
          {(
            [
              { value: 'dark', label: 'Oscuro', icon: Moon },
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'system', label: 'Sistema', icon: Monitor },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                mounted && theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!isDirty || isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {savedOk && (
          <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400 bg-green-500/10">
            Guardado correctamente
          </Badge>
        )}
      </div>
    </div>
  )
}
