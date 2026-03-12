'use client'

import { useUser, useReverification } from '@clerk/nextjs'
import { ExternalAccountResource } from '@clerk/types'
import { Sun, Moon, Monitor, Save, Upload, X, Loader2, Github } from 'lucide-react'
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

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode }> = {
  google: {
    label: 'Google',
    icon: (
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  github: {
    label: 'GitHub',
    icon: <Github className="h-4 w-4 shrink-0" />,
  },
}

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

  // Cuentas externas
  const [externalError, setExternalError] = useState<string | null>(null)
  const destroyExternalAccount = useReverification((account: ExternalAccountResource) =>
    account.destroy()
  )

  async function handleUnlinkAccount(account: ExternalAccountResource) {
    if (!user) return
    setExternalError(null)
    try {
      await destroyExternalAccount(account)
      await user.reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desvincular cuenta'
      setExternalError(msg)
    }
  }

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

      {/* Cuentas conectadas */}
      {user?.externalAccounts && user.externalAccounts.length > 0 && (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Cuentas conectadas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Iniciaste sesión con estos proveedores
              </p>
            </div>

            {externalError && <p className="text-xs text-destructive">{externalError}</p>}

            <ul className="space-y-2">
              {user.externalAccounts.map((account) => {
                const meta = PROVIDER_META[account.provider] ?? {
                  label: account.provider.charAt(0).toUpperCase() + account.provider.slice(1),
                  icon: null,
                }
                // Bloquear desvincular si es la única cuenta externa Y el usuario no tiene password
                // Un email verificado sin password no es suficiente para iniciar sesión
                const isOnlyAuthMethod =
                  user.externalAccounts.length === 1 && !user.passwordEnabled

                return (
                  <li key={account.id} className="flex items-center justify-between gap-4 max-w-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {meta.icon}
                      <span className="text-sm font-medium">{meta.label}</span>
                      {account.emailAddress && (
                        <span className="text-xs text-muted-foreground truncate">
                          {account.emailAddress}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleUnlinkAccount(account)}
                      disabled={isOnlyAuthMethod}
                      title={isOnlyAuthMethod ? 'No puedes desvincular tu único método de acceso' : undefined}
                    >
                      Desvincular
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>

          <Separator />
        </>
      )}

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
