'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { StepJobOffer } from '@/components/cv-generator/step-job-offer'
import { StepGoals } from '@/components/cv-generator/step-goals'
import { StepPreview } from '@/components/cv-generator/step-preview'
import { useExperience } from '@/hooks/use-experience'
import { useApplications } from '@/hooks/use-applications'
import { useSettings } from '@/hooks/use-settings'
import { useCvs } from '@/hooks/use-cvs'
import { suggestBullets, generateCv, initSelections } from '@/lib/ai-cv'
import type { BulletsBySection } from '@/lib/ai-cv'
import type { CvData } from '@/types/experience'

type Step = 1 | 2 | 3

// Builds both the draft CV and the parallel bullet-ID tracking map from scratch.
// Used only on init and after AI suggest/optimize (full rebuild cases).
function buildDraftAndIds(
  base: CvData,
  sels: BulletsBySection
): { cv: CvData; ids: Record<string, string[]> } {
  const ids: Record<string, string[]> = {}
  const cv: CvData = {
    ...base,
    experience: base.experience.map((exp) => {
      const selected = (sels[exp.id] ?? []).filter((b) => b.selected)
      ids[exp.id] = selected.map((b) => b.id)
      return { ...exp, bullets: selected.map((b) => b.text) }
    }),
    leadership: base.leadership.map((lead) => {
      const selected = (sels[lead.id] ?? []).filter((b) => b.selected)
      ids[lead.id] = selected.map((b) => b.id)
      return { ...lead, bullets: selected.map((b) => b.text) }
    }),
  }
  return { cv, ids }
}

export default function CvGeneratorPage() {
  const { cvData } = useExperience()
  const { applications, updateApplication } = useApplications()
  const { settings } = useSettings()
  const { saveCV } = useCvs()

  const [step, setStep] = useState<Step>(1)
  const [jobOfferText, setJobOfferText] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [selections, setSelections] = useState<BulletsBySection>({})
  const [draftCv, setDraftCv] = useState<CvData | null>(null)
  // Tracks stable bullet IDs parallel to draftCv.experience/leadership[].bullets
  const [draftBulletIds, setDraftBulletIds] = useState<Record<string, string[]>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedCv, setGeneratedCv] = useState<CvData | null>(null)
  const [usedAI, setUsedAI] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedCv, setOptimizedCv] = useState<CvData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCvId, setSavedCvId] = useState<string | null>(null)

  // Initialize selections + draftCv when cvData loads
  useEffect(() => {
    if (cvData && Object.keys(selections).length === 0) {
      const init = initSelections(cvData)
      setSelections(init)
      const { cv, ids } = buildDraftAndIds(cvData, init)
      setDraftCv(cv)
      setDraftBulletIds(ids)
    }
  }, [cvData, selections])

  async function handleStepOneNext() {
    if (!cvData) return
    setIsAnalyzing(true)
    setStep(2)
    const result = await suggestBullets(jobOfferText, cvData, settings)
    setSelections(result.selections)
    const { cv, ids } = buildDraftAndIds(cvData, result.selections)
    const finalCv = result.suggestedSkills
      ? { ...cv, skills: { ...cv.skills, technical: result.suggestedSkills } }
      : cv
    setDraftCv(finalCv)
    setDraftBulletIds(ids)
    setIsAnalyzing(false)
  }

  // Diff-based: only adds newly selected bullets and removes newly deselected ones.
  // All existing edits in draftCv are preserved.
  function handleSelectionsChange(newSelections: BulletsBySection) {
    setSelections(newSelections)
    if (!cvData || !draftCv) return

    const nextIds = { ...draftBulletIds }

    function diffSection(sectionId: string, currentBullets: string[]): string[] {
      const oldSel = selections[sectionId] ?? []
      const newSel = newSelections[sectionId] ?? []
      const currentIds = nextIds[sectionId] ?? []

      const newlySelected = newSel.filter((nb) => {
        const prev = oldSel.find((ob) => ob.id === nb.id)
        return nb.selected && !(prev?.selected ?? false)
      })
      const newlyDeselectedIds = new Set(
        newSel
          .filter((nb) => {
            const prev = oldSel.find((ob) => ob.id === nb.id)
            return !nb.selected && (prev?.selected ?? false)
          })
          .map((b) => b.id)
      )

      if (newlySelected.length === 0 && newlyDeselectedIds.size === 0) return currentBullets

      const filteredBullets: string[] = []
      const filteredIds: string[] = []
      currentBullets.forEach((bullet, i) => {
        const id = currentIds[i]
        if (!id || !newlyDeselectedIds.has(id)) {
          filteredBullets.push(bullet)
          filteredIds.push(id ?? `unknown-${i}`)
        }
      })

      const finalBullets = [...filteredBullets, ...newlySelected.map((b) => b.text)]
      const finalIds = [...filteredIds, ...newlySelected.map((b) => b.id)]
      nextIds[sectionId] = finalIds
      return finalBullets
    }

    const nextExp = draftCv.experience.map((exp) => ({
      ...exp,
      bullets: diffSection(exp.id, exp.bullets),
    }))
    const nextLead = draftCv.leadership.map((lead) => ({
      ...lead,
      bullets: diffSection(lead.id, lead.bullets),
    }))

    setDraftBulletIds(nextIds)
    setDraftCv({ ...draftCv, experience: nextExp, leadership: nextLead })
  }

  function handleBulletAdded(sectionId: string) {
    setDraftBulletIds((prev) => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] ?? []), `manual-${Date.now()}`],
    }))
  }

  function handleBulletDeleted(sectionId: string, bulletIndex: number) {
    setDraftBulletIds((prev) => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).filter((_, i) => i !== bulletIndex),
    }))
  }

  function handleSectionDeleted(sectionId: string) {
    setSelections((prev) => {
      if (!prev[sectionId]) return prev
      return { ...prev, [sectionId]: prev[sectionId].map((b) => ({ ...b, selected: false })) }
    })
    setDraftBulletIds((prev) => {
      const next = { ...prev }
      delete next[sectionId]
      return next
    })
  }

  function handleUseDraft() {
    if (!draftCv) return
    setGeneratedCv(draftCv)
    setUsedAI(false)
    setSavedCvId(null)
    setStep(3)
  }

  async function handleOptimize(msg: string) {
    if (!cvData) return
    setIsOptimizing(true)
    const { cv } = await generateCv(
      jobOfferText,
      cvData,
      selections,
      settings,
      msg,
      draftCv ?? undefined
    )
    setOptimizedCv(cv)
    setIsOptimizing(false)
  }

  function handleOptimizeConfirm(cv: CvData) {
    setOptimizedCv(null)
    setDraftCv(cv)
    // Rebuild IDs based on current selections (positional mapping)
    if (cvData) {
      const nextIds: Record<string, string[]> = {}
      for (const exp of cvData.experience) {
        nextIds[exp.id] = (selections[exp.id] ?? []).filter((b) => b.selected).map((b) => b.id)
      }
      for (const lead of cvData.leadership) {
        nextIds[lead.id] = (selections[lead.id] ?? []).filter((b) => b.selected).map((b) => b.id)
      }
      setDraftBulletIds(nextIds)
    }
  }

  function handleOptimizeCancel() {
    setOptimizedCv(null)
    setIsOptimizing(false)
  }

  async function handleSaveCv() {
    if (!generatedCv) return
    setIsSaving(true)
    const app = applications.find((a) => a.id === applicationId)
    const result = await saveCV({
      applicationId: applicationId || undefined,
      jobTitle: app?.position ?? 'Sin título',
      company: app?.company ?? 'Sin empresa',
      cvData: generatedCv,
    })
    if (result) {
      setSavedCvId(result.id)
      if (applicationId) {
        await updateApplication(applicationId, { cvId: result.id })
      }
    }
    setIsSaving(false)
  }

  function handleDownload() {
    window.print()
  }

  const stepLabels: Record<Step, string> = {
    1: 'Oferta laboral',
    2: 'Seleccionar bullets',
    3: 'Resultado final',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + step indicator: always max-w-3xl to prevent CLS */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generar CV</h1>
          <p className="text-sm text-muted-foreground">
            Genera un CV optimizado para ATS basado en tu experiencia real
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {([1, 2, 3] as Step[]).map((s, idx) => {
            const canNavigate =
              s === 1 ||
              (s === 2 && Object.keys(selections).length > 0) ||
              (s === 3 && generatedCv !== null)
            const isClickable = canNavigate && s !== step

            return (
              <div key={s} className="flex items-center gap-0">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && setStep(s)}
                  className="flex items-center gap-2 disabled:cursor-default"
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      step === s
                        ? 'bg-primary text-primary-foreground'
                        : step > s
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                      isClickable && 'cursor-pointer hover:opacity-80'
                    )}
                  >
                    {s}
                  </div>
                  {/* Always font-medium to prevent width CLS on active change */}
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      step === s ? 'text-foreground' : 'text-muted-foreground',
                      isClickable && 'cursor-pointer hover:text-foreground'
                    )}
                  >
                    {stepLabels[s]}
                  </span>
                </button>
                {idx < 2 && <div className="w-8 mx-2 h-px bg-border/60" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content: expands to full width on step 2 */}
      <div className={cn('rounded-lg border border-border/60 bg-card p-5', step !== 2 && 'max-w-3xl mx-auto')}>
        {step === 1 && (
          <StepJobOffer
            jobOfferText={jobOfferText}
            applicationId={applicationId}
            applications={applications}
            onJobOfferChange={setJobOfferText}
            onApplicationChange={setApplicationId}
            onNext={handleStepOneNext}
          />
        )}

        {step === 2 && cvData && (
          <StepGoals
            cvData={cvData}
            selections={selections}
            draftCv={draftCv ?? cvData}
            isAnalyzing={isAnalyzing}
            jobOfferText={jobOfferText}
            settings={settings}
            isOptimizing={isOptimizing}
            optimizedCv={optimizedCv}
            draftBulletIds={draftBulletIds}
            onSelectionsChange={handleSelectionsChange}
            onDraftCvChange={setDraftCv}
            onBulletAdded={handleBulletAdded}
            onBulletDeleted={handleBulletDeleted}
            onSectionDeleted={handleSectionDeleted}
            onContinue={handleUseDraft}
            onOptimize={handleOptimize}
            onOptimizeConfirm={handleOptimizeConfirm}
            onOptimizeCancel={handleOptimizeCancel}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepPreview
            cv={generatedCv ?? cvData!}
            usedAI={usedAI}
            isGenerating={false}
            isSaving={isSaving}
            savedCvId={savedCvId}
            onBack={() => setStep(2)}
            onSave={handleSaveCv}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  )
}
