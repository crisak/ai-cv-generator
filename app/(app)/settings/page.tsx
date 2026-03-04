'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Sun, Moon, Monitor } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { useThemeStore } from '@/store/theme-store'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AIModel } from '@/types/cv'

const AI_MODELS: { value: AIModel; label: string; keyLabel: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', keyLabel: 'Anthropic API Key' },
  { value: 'gpt', label: 'GPT-4o (OpenAI)', keyLabel: 'OpenAI API Key' },
  { value: 'gemini', label: 'Gemini (Google)', keyLabel: 'Google AI Studio Key' },
  { value: 'grok', label: 'Grok (xAI)', keyLabel: 'xAI API Key' },
  { value: 'deepseek', label: 'DeepSeek', keyLabel: 'DeepSeek API Key' },
]

export default function SettingsPage() {
  const { settings, isSaving, saveSettings } = useSettings()
  const { theme: storeTheme, setTheme: setStoreTheme } = useThemeStore()
  const { setTheme: setNextTheme } = useTheme()

  const [aiModel, setAiModel] = useState<AIModel>('claude')
  const [apiKey, setApiKey] = useState('')
  const [userName, setUserName] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (settings) {
      setAiModel(settings.aiModel ?? 'claude')
      setApiKey(settings.aiApiKey ?? '')
      setUserName(settings.userName ?? '')
    }
  }, [settings])

  function markDirty() {
    setIsDirty(true)
    setSavedOk(false)
  }

  async function handleSave() {
    await saveSettings({ aiModel, aiApiKey: apiKey, userName })
    setIsDirty(false)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
  }

  function handleThemeChange(t: 'dark' | 'light' | 'system') {
    setStoreTheme(t)
    setNextTheme(t)
  }

  const selectedModel = AI_MODELS.find((m) => m.value === aiModel) ?? AI_MODELS[0]

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Modelo de IA, API key y preferencias de la aplicación
        </p>
      </div>

      {/* ── AI Config ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Inteligencia Artificial</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Usado para analizar ofertas laborales y generar CVs optimizados
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select
              value={aiModel}
              onValueChange={(v) => {
                setAiModel(v as AIModel)
                markDirty()
              }}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{selectedModel.keyLabel}</Label>
            <div className="relative max-w-sm">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  markDirty()
                }}
                placeholder="sk-..."
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              La API key se almacena localmente en tu navegador (RxDB/IndexedDB). No se envía a ningún servidor externo salvo las APIs de IA seleccionadas.
            </p>
          </div>

          {!apiKey && (
            <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
              Sin API key, el análisis de ofertas y la generación de CV usarán extracción con expresiones regulares como fallback.
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* ── Profile ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Perfil</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nombre visible en la aplicación
          </p>
        </div>

        <div className="space-y-1.5 max-w-sm">
          <Label>Nombre</Label>
          <Input
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value)
              markDirty()
            }}
            placeholder="Tu nombre"
          />
        </div>
      </section>

      <Separator />

      {/* ── Theme ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Apariencia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modo oscuro o claro
          </p>
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
              onClick={() => handleThemeChange(value)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                storeTheme === value
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

      {/* ── Save button ── */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="gap-2"
        >
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
