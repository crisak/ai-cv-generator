'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2, Save, XCircle } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
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

  const [aiModel, setAiModel] = useState<AIModel>('claude')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; reason?: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setAiModel(settings.aiModel ?? 'claude')
      setApiKey(settings.aiApiKey ?? '')
    }
  }, [settings])

  function markDirty() {
    setIsDirty(true)
    setSavedOk(false)
    setValidationResult(null)
  }

  async function handleValidate() {
    if (!apiKey) return
    setIsValidating(true)
    setValidationResult(null)
    try {
      const res = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: aiModel, apiKey }),
      })
      const data = await res.json()
      setValidationResult({ valid: data.valid, reason: data.reason })
    } catch {
      setValidationResult({ valid: false, reason: 'Error de red' })
    } finally {
      setIsValidating(false)
    }
  }

  async function handleSave() {
    await saveSettings({ aiModel, aiApiKey: apiKey })
    setIsDirty(false)
    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
  }

  const selectedModel = AI_MODELS.find((m) => m.value === aiModel) ?? AI_MODELS[0]

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modelo de IA</h1>
        <p className="text-sm text-muted-foreground">
          Proveedor y API key para analizar ofertas y generar CVs
        </p>
      </div>

      <section className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select
              value={aiModel}
              onValueChange={(v) => { setAiModel(v as AIModel); markDirty() }}
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
                onChange={(e) => { setApiKey(e.target.value); markDirty() }}
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
            {apiKey && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="gap-2"
                >
                  {isValidating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {isValidating ? 'Probando…' : 'Probar conexión'}
                </Button>
                {validationResult && (
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${validationResult.valid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    {validationResult.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {validationResult.valid ? 'Conexión exitosa' : (validationResult.reason ?? 'Key inválida')}
                  </span>
                )}
              </div>
            )}
          </div>

          {!apiKey && (
            <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2.5 text-xs text-muted-foreground">
              Sin API key, el análisis de ofertas y la generación de CV usarán extracción con expresiones regulares como fallback.
            </div>
          )}
        </div>
      </section>

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
