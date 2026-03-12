'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import { CheckCircle2, CheckIcon, Eye, EyeOff, Loader2, Save, XCircle } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import { Badge } from '@/components/ui/badge'
import type { AIModel } from '@/types/cv'

type ModelEntry = {
  value: AIModel
  name: string
  chef: string
  chefSlug: string
  keyLabel: string
  disabled?: boolean
}

const AI_MODELS: ModelEntry[] = [
  { value: 'claude', name: 'Claude', chef: 'Anthropic', chefSlug: 'anthropic', keyLabel: 'Anthropic API Key' },
  { value: 'gpt', name: 'GPT-4o', chef: 'OpenAI', chefSlug: 'openai', keyLabel: 'OpenAI API Key' },
  { value: 'gemini', name: 'Gemini', chef: 'Google', chefSlug: 'google', keyLabel: 'Google AI Studio Key' },
  { value: 'grok', name: 'Grok', chef: 'xAI', chefSlug: 'xai', keyLabel: 'xAI API Key', disabled: true },
  { value: 'deepseek', name: 'DeepSeek', chef: 'DeepSeek', chefSlug: 'deepseek', keyLabel: 'DeepSeek API Key' },
]

const chefs = [...new Set(AI_MODELS.map((m) => m.chef))]

interface ModelItemProps {
  model: ModelEntry
  selectedModel: AIModel
  onSelect: (value: AIModel) => void
}

const ModelItem = memo(({ model, selectedModel, onSelect }: ModelItemProps) => {
  const handleSelect = useCallback(() => onSelect(model.value), [onSelect, model.value])
  return (
    <ModelSelectorItem
      value={model.value}
      onSelect={handleSelect}
      disabled={model.disabled}
    >
      <ModelSelectorLogo provider={model.chefSlug} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      {model.disabled && (
        <span className="ml-auto text-xs text-muted-foreground">Próximamente</span>
      )}
      {!model.disabled && selectedModel === model.value && (
        <CheckIcon className="ml-auto size-4" />
      )}
      {!model.disabled && selectedModel !== model.value && (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  )
})

ModelItem.displayName = 'ModelItem'

export default function SettingsPage() {
  const { settings, isSaving, saveSettings } = useSettings()

  const [aiModel, setAiModel] = useState<AIModel>('claude')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; reason?: string } | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)

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

  const handleModelSelect = useCallback((value: AIModel) => {
    setAiModel(value)
    setSelectorOpen(false)
    markDirty()
  }, [])

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
            <div className="relative max-w-sm">
              <ModelSelector open={selectorOpen} onOpenChange={setSelectorOpen}>
              <ModelSelectorTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start gap-2">
                  <ModelSelectorLogo provider={selectedModel.chefSlug} />
                  <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
                </Button>
              </ModelSelectorTrigger>
              <ModelSelectorContent title="Seleccionar modelo">
                <ModelSelectorInput placeholder="Buscar modelo…" />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No se encontraron modelos.</ModelSelectorEmpty>
                  {chefs.map((chef) => (
                    <ModelSelectorGroup heading={chef} key={chef}>
                      {AI_MODELS.filter((m) => m.chef === chef).map((m) => (
                        <ModelItem
                          key={m.value}
                          model={m}
                          selectedModel={aiModel}
                          onSelect={handleModelSelect}
                        />
                      ))}
                    </ModelSelectorGroup>
                  ))}
                </ModelSelectorList>
              </ModelSelectorContent>
            </ModelSelector>
            </div>
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
