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

function assembleDraftCv(base: CvData, sels: BulletsBySection, existing?: CvData | null): CvData {
  return {
    ...(existing ?? base),
    experience: base.experience.map((exp) => ({
      ...exp,
      bullets: (sels[exp.id] ?? []).filter((b) => b.selected).map((b) => b.text),
    })),
    leadership: base.leadership.map((lead) => ({
      ...lead,
      bullets: (sels[lead.id] ?? []).filter((b) => b.selected).map((b) => b.text),
    })),
  }
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
  const [customMessage, setCustomMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedCv, setGeneratedCv] = useState<CvData | null>(null)
  const [usedAI, setUsedAI] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedCvId, setSavedCvId] = useState<string | null>(null)

  // Initialize selections + draftCv when cvData loads
  useEffect(() => {
    if (cvData && Object.keys(selections).length === 0) {
      const init = initSelections(cvData)
      setSelections(init)
      setDraftCv(assembleDraftCv(cvData, init))
    }
  }, [cvData, selections])

  async function handleStepOneNext() {
    if (!cvData) return
    setIsAnalyzing(true)
    setStep(2)
    const suggested = await suggestBullets(jobOfferText, cvData, settings, customMessage)
    setSelections(suggested)
    setDraftCv(assembleDraftCv(cvData, suggested))
    setIsAnalyzing(false)
  }

  function handleSelectionsChange(newSelections: BulletsBySection) {
    setSelections(newSelections)
    if (cvData) {
      setDraftCv((prev) => assembleDraftCv(cvData, newSelections, prev))
    }
  }

  async function handleGenerateCv() {
    if (!cvData) return
    setIsGenerating(true)
    setStep(3)
    const { cv, usedAI: aiUsed } = await generateCv(
      jobOfferText,
      cvData,
      selections,
      settings,
      customMessage,
      draftCv ?? undefined
    )
    setGeneratedCv(cv)
    setUsedAI(aiUsed)
    setIsGenerating(false)
    setSavedCvId(null)
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
    3: 'Vista previa',
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
            customMessage={customMessage}
            settings={settings}
            isGenerating={isGenerating}
            onSelectionsChange={handleSelectionsChange}
            onDraftCvChange={setDraftCv}
            onCustomMessageChange={setCustomMessage}
            onNext={handleGenerateCv}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepPreview
            cv={generatedCv ?? cvData!}
            usedAI={usedAI}
            isGenerating={isGenerating}
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
