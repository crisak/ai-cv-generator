'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDb } from './use-db'
import type { CvDocument } from '@/lib/db/schemas'
import type { CvData } from '@/types/experience'

export interface SaveCvInput {
  applicationId?: string
  jobTitle: string
  company: string
  cvData: CvData
}

export function useCvs() {
  const { db, isLoading: dbLoading } = useDb()
  const [cvs, setCvs] = useState<CvDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return
    const sub = db.cvs
      .find()
      .sort({ createdAt: 'desc' })
      .$.subscribe((docs) => {
        setCvs(docs.map((d) => d.toJSON() as CvDocument))
        setIsLoading(false)
      })
    return () => sub.unsubscribe()
  }, [db])

  const saveCV = useCallback(
    async (input: SaveCvInput): Promise<CvDocument | null> => {
      if (!db) return null
      const now = new Date().toISOString()
      const doc = await db.cvs.insert({
        id: uuidv4(),
        applicationId: input.applicationId ?? '',
        jobTitle: input.jobTitle,
        company: input.company,
        cvData: JSON.stringify(input.cvData),
        createdAt: now,
      })
      return doc.toJSON() as CvDocument
    },
    [db]
  )

  const deleteCV = useCallback(
    async (id: string) => {
      if (!db) return
      const doc = await db.cvs.findOne(id).exec()
      await doc?.remove()
    },
    [db]
  )

  return {
    cvs,
    isLoading: dbLoading || isLoading,
    saveCV,
    deleteCV,
  }
}
