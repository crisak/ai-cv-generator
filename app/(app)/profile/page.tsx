'use client'

import { useUser } from '@clerk/nextjs'
import { Sun, Moon, Monitor, Save, Upload, X, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const MAX_IMAGE_SIZE_MB = 5
const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Nombre
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isNameDirty, setIsNameDirty] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameSavedOk, setNameSavedOk] = useState(false)

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarSavedOk, setAvatarSavedOk] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
    }
  }, [user])

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? '??'

  // --- Avatar ---
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (file.size > MAX_IMAGE_BYTES) {
      setAvatarError(`La imagen no puede superar ${MAX_IMAGE_SIZE_MB}MB`)
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAvatarUpload() {
    if (!user || !avatarFile) return
    setIsUploadingAvatar(true)
    setAvatarError(null)
    try {
      await user.setProfileImage({ file: avatarFile })
      await user.reload()
      setAvatarPreview(null)
      setAvatarFile(null)
      setAvatarSavedOk(true)
      setTimeout(() => setAvatarSavedOk(false), 3000)
    } catch {
      setAvatarError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function handleCancelAvatar() {
    setAvatarPreview(null)
    setAvatarFile(null)
    setAvatarError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- Nombre ---
  async function handleSaveName() {
    if (!user) return
    setIsSavingName(true)
    try {
      await user.update({ firstName, lastName })
      setIsNameDirty(false)
      setNameSavedOk(true)
      setTimeout(() => setNameSavedOk(false), 3000)
    } finally {
      setIsSavingName(false)
    }
  }

  if (!isLoaded) return null

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Información de tu cuenta</p>
      </div>

      {/* Avatar */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarPreview ?? user?.imageUrl} alt={user?.fullName ?? ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Upload className="h-3.5 w-3.5" />
                Elegir imagen
              </Button>
              {avatarFile && (
                <>
                  <Button size="sm" className="gap-2" onClick={handleAvatarUpload} disabled={isUploadingAvatar}>
                    {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Subir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelAvatar} disabled={isUploadingAvatar}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {avatarSavedOk && (
                <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400 bg-green-500/10">
                  Guardado
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Máx. {MAX_IMAGE_SIZE_MB}MB</p>
            {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      <Separator />

      {/* Nombre y email */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Nombre</h2>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setIsNameDirty(true) }}
              placeholder="Nombre"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setIsNameDirty(true) }}
              placeholder="Apellido"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveName} disabled={!isNameDirty || isSavingName} size="sm" className="gap-2">
            {isSavingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar nombre
          </Button>
          {nameSavedOk && (
            <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400 bg-green-500/10">
              Guardado correctamente
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 max-w-sm">
          <Label className="text-muted-foreground">Correo electrónico</Label>
          <Input
            value={user?.primaryEmailAddress?.emailAddress ?? ''}
            readOnly
            className="bg-muted/40 cursor-default text-muted-foreground"
          />
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
    </div>
  )
}
