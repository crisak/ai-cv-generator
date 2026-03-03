'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Upload, Save } from 'lucide-react'
import { useExperience } from '@/hooks/use-experience'
import { BasicsForm } from '@/components/experience/basics-form'
import { EducationSection } from '@/components/experience/education-section'
import { ExperienceSection } from '@/components/experience/experience-section'
import { LeadershipSection } from '@/components/experience/leadership-section'
import { SkillsForm } from '@/components/experience/skills-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { CvData } from '@/types/experience'

export default function ExperiencePage() {
  const { cvData, isLoading, isSaving, save, importJson, exportJson } = useExperience()
  const [localData, setLocalData] = useState<CvData | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cvData && !localData) {
      setLocalData(cvData)
    }
  }, [cvData, localData])

  function update(partial: Partial<CvData>) {
    setLocalData((prev) => (prev ? { ...prev, ...partial } : null))
    setIsDirty(true)
  }

  async function handleSave() {
    if (!localData) return
    await save(localData)
    setIsDirty(false)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importJson(text)
    setIsDirty(false)
    e.target.value = ''
  }

  if (isLoading || !localData) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Mi Experiencia</h1>
            {isDirty && (
              <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400">
                Sin guardar
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Edita tu experiencia real — base para generar CVs personalizados
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <Button variant="outline" size="sm" onClick={exportJson} className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basics">
        <TabsList className="h-9 w-full justify-start gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
          <TabsTrigger value="basics" className="text-xs">Datos</TabsTrigger>
          <TabsTrigger value="education" className="text-xs">
            Educación
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 text-[10px]">
              {localData.education.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="experience" className="text-xs">
            Experiencia
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 text-[10px]">
              {localData.experience.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="leadership" className="text-xs">
            Liderazgo
            <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 text-[10px]">
              {localData.leadership.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="basics" className="mt-0">
            <BasicsForm
              value={localData.basics}
              onChange={(basics) => update({ basics })}
            />
          </TabsContent>

          <TabsContent value="education" className="mt-0">
            <EducationSection
              items={localData.education}
              onChange={(education) => update({ education })}
            />
          </TabsContent>

          <TabsContent value="experience" className="mt-0">
            <ExperienceSection
              items={localData.experience}
              onChange={(experience) => update({ experience })}
            />
          </TabsContent>

          <TabsContent value="leadership" className="mt-0">
            <LeadershipSection
              items={localData.leadership}
              onChange={(leadership) => update({ leadership })}
            />
          </TabsContent>

          <TabsContent value="skills" className="mt-0">
            <SkillsForm
              skills={localData.skills}
              settings={localData.settings}
              onSkillsChange={(skills) => update({ skills })}
              onSettingsChange={(settings) => update({ settings })}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Floating save bar */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button onClick={handleSave} disabled={isSaving} className="shadow-lg gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      )}
    </div>
  )
}
