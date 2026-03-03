'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDb } from './use-db'
import type { CvData } from '@/types/experience'
import seedData from '@/docs/cv-experiencia-real.json'

const SINGLETON_ID = 'singleton'

function parseCvData(raw: string): CvData {
  try {
    return JSON.parse(raw) as CvData
  } catch {
    return seedData as CvData
  }
}

export function useExperience() {
  const { db, isLoading: dbLoading } = useDb()
  const [cvData, setCvData] = useState<CvData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!db) return

    const sub = db.experiences
      .findOne(SINGLETON_ID)
      .$.subscribe(async (doc) => {
        if (doc) {
          setCvData(parseCvData(doc.cvData))
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
    async (json: string) => {
      const data = parseCvData(json)
      await save(data)
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
