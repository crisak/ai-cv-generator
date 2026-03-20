'use client'

import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useDb } from './use-db'
import type { CvData } from '@/types/experience'
import seedData from '@/docs/cv-experiencia-real.json'

const StudyAbroadSchema = z.object({
  program: z.string(),
  location: z.string(),
  coursework: z.string(),
  dates: z.string(),
})

const CvContactSchema = z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  email: z.string(),
  phone: z.string(),
})

const CvBasicsSchema = z.object({
  fullName: z.string(),
  contact: CvContactSchema,
})

const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string(),
  location: z.string(),
  degree: z.string(),
  concentration: z.string(),
  gpa: z.string(),
  graduationDate: z.string(),
  thesis: z.string(),
  coursework: z.string(),
  studyAbroad: z.nullable(StudyAbroadSchema),
  order: z.number(),
})

const ExperienceItemSchema = z.object({
  id: z.string(),
  organization: z.string(),
  title: z.string(),
  location: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
  order: z.number(),
})

const LeadershipItemSchema = z.object({
  id: z.string(),
  organization: z.string(),
  location: z.string(),
  role: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
  order: z.number(),
})

const CvSkillsSchema = z.object({
  technical: z.string(),
  language: z.string(),
  laboratory: z.string(),
  interests: z.string(),
})

const CvSettingsSchema = z.object({
  paperSize: z.enum(['A4', 'Letter']),
  fontFamily: z.enum(['Calibri', 'Times New Roman']),
  fontSize: z.number().min(8).max(16),
  hideOptionalEmpty: z.boolean(),
})

const CvDataSchema = z.object({
  schemaVersion: z.number(),
  updatedAt: z.string(),
  basics: CvBasicsSchema,
  education: z.array(EducationItemSchema),
  experience: z.array(ExperienceItemSchema),
  leadership: z.array(LeadershipItemSchema),
  skills: CvSkillsSchema,
  settings: CvSettingsSchema,
})

export type ImportResult =
  | { success: true; data: CvData }
  | { success: false; error: string; details?: string[] }

function parseCvData(raw: string): ImportResult {
  try {
    const parsed = JSON.parse(raw)
    const result = CvDataSchema.safeParse(parsed)
    if (result.success) {
      return { success: true, data: result.data }
    }
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return {
      success: false,
      error: 'El JSON no tiene el formato esperado',
      details: errors,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'JSON inválido'
    return {
      success: false,
      error: 'No se pudo parsear el archivo JSON',
      details: [message],
    }
  }
}

const SINGLETON_ID = 'singleton'

export function useExperience() {
  const { db, isLoading: dbLoading } = useDb()
  const [cvData, setCvData] = useState<CvData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!db) return

    const sub = db.experiences.findOne(SINGLETON_ID).$.subscribe(async (doc) => {
      if (doc) {
        const result = parseCvData(doc.cvData)
        if (result.success) {
          setCvData(result.data)
        }
      } else {
        // Seed with real experience data on first load
        const now = new Date().toISOString()
        await db.experiences.insert({
          id: SINGLETON_ID,
          cvData: JSON.stringify(seedData),
          updatedAt: now,
        })
      }
      setIsLoading(false)
    })

    return () => sub.unsubscribe()
  }, [db])

  const save = useCallback(
    async (data: CvData) => {
      if (!db) return
      setIsSaving(true)
      try {
        const updated = { ...data, updatedAt: new Date().toISOString() }
        const doc = await db.experiences.findOne(SINGLETON_ID).exec()
        if (doc) {
          await doc.patch({ cvData: JSON.stringify(updated), updatedAt: updated.updatedAt })
        } else {
          await db.experiences.insert({
            id: SINGLETON_ID,
            cvData: JSON.stringify(updated),
            updatedAt: updated.updatedAt,
          })
        }
        setCvData(updated)
      } finally {
        setIsSaving(false)
      }
    },
    [db]
  )

  const importJson = useCallback(
    async (json: string): Promise<ImportResult> => {
      const result = parseCvData(json)
      if (result.success) {
        await save(result.data)
      }
      return result
    },
    [save]
  )

  const exportJson = useCallback(() => {
    if (!cvData) return
    const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cv-experiencia-real.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [cvData])

  return {
    cvData,
    isLoading: dbLoading || isLoading,
    isSaving,
    save,
    importJson,
    exportJson,
  }
}
