'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { CvSkills, CvSettings } from '@/types/experience'

interface SkillsFormProps {
  skills: CvSkills
  settings: CvSettings
  onSkillsChange: (s: CvSkills) => void
  onSettingsChange: (s: CvSettings) => void
}

export function SkillsForm({ skills, settings, onSkillsChange, onSettingsChange }: SkillsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Habilidades
        </p>

        <div className="space-y-1.5">
          <Label>Habilidades técnicas</Label>
          <Textarea
            value={skills.technical}
            onChange={(e) => onSkillsChange({ ...skills, technical: e.target.value })}
            className="min-h-[120px] text-sm resize-y"
            placeholder="Node.js, TypeScript, AWS, React.js, Docker, CI/CD..."
          />
          <p className="text-xs text-muted-foreground">Separadas por comas. Incluir keywords exactas de las ofertas.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Idiomas</Label>
          <Textarea
            value={skills.language}
            onChange={(e) => onSkillsChange({ ...skills, language: e.target.value })}
            className="min-h-[48px] text-sm resize-y"
            placeholder="Español (Nativo) | Inglés (Intermedio)"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Intereses profesionales (opcional)</Label>
          <Textarea
            value={skills.interests}
            onChange={(e) => onSkillsChange({ ...skills, interests: e.target.value })}
            className="min-h-[48px] text-sm resize-y"
            placeholder="Cloud Architecture, Open Source, Developer Experience"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Laboratorio (opcional)</Label>
          <Textarea
            value={skills.laboratory}
            onChange={(e) => onSkillsChange({ ...skills, laboratory: e.target.value })}
            className="min-h-[48px] text-sm resize-y"
            placeholder="Dejar vacío si no aplica"
          />
        </div>
      </div>

      <div className="border-t border-border/60 pt-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Formato del CV
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tamaño de papel</Label>
            <Select
              value={settings.paperSize}
              onValueChange={(v) => onSettingsChange({ ...settings, paperSize: v as 'A4' | 'Letter' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (Internacional)</SelectItem>
                <SelectItem value="Letter">Letter (USA/Canadá)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Fuente</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(v) =>
                onSettingsChange({ ...settings, fontFamily: v as 'Calibri' | 'Times New Roman' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Calibri">Calibri</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={settings.hideOptionalEmpty}
            onCheckedChange={(v) => onSettingsChange({ ...settings, hideOptionalEmpty: v })}
          />
          <div>
            <Label>Ocultar campos opcionales vacíos</Label>
            <p className="text-xs text-muted-foreground">Recomendado: evita secciones vacías en el CV final</p>
          </div>
        </div>
      </div>
    </div>
  )
}
