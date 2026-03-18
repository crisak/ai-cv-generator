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
  jobOfferText?: string
  cvData: CvData
}

export interface UpdateCvInput {
  jobTitle?: string
  company?: string
  jobOfferText?: string
  cvData?: CvData
  isDraft?: boolean
}

export function useCvs() {
  const { db, isLoading: dbLoading } = useDb()
  const [cvs, setCvs] = useState<CvDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return
    const sub = db.cvs
      .find({ selector: { isDraft: false } })
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
        jobOfferText: input.jobOfferText ?? '',
        cvData: JSON.stringify(input.cvData),
        isDraft: false,
        createdAt: now,
        updatedAt: now,
      })
      return doc.toJSON() as CvDocument
    },
    [db]
  )

  const updateCV = useCallback(
    async (id: string, input: UpdateCvInput): Promise<void> => {
      if (!db) return
      const doc = await db.cvs.findOne(id).exec()
      if (!doc) return
      const patch: Partial<CvDocument> = { updatedAt: new Date().toISOString() }
      if (input.jobTitle !== undefined) patch.jobTitle = input.jobTitle
      if (input.company !== undefined) patch.company = input.company
      if (input.jobOfferText !== undefined) patch.jobOfferText = input.jobOfferText
      if (input.cvData !== undefined) patch.cvData = JSON.stringify(input.cvData)
      if (input.isDraft !== undefined) patch.isDraft = input.isDraft
      await doc.patch(patch)
    },
    [db]
  )

  const getCvById = useCallback(
    async (id: string): Promise<CvDocument | null> => {
      if (!db) return null
      const doc = await db.cvs.findOne(id).exec()
      return doc ? (doc.toJSON() as CvDocument) : null
    },
    [db]
  )

  const createDraft = useCallback(
    async (input: SaveCvInput): Promise<CvDocument | null> => {
      if (!db) return null
      const now = new Date().toISOString()
      const doc = await db.cvs.insert({
        id: uuidv4(),
        applicationId: input.applicationId ?? '',
        jobTitle: input.jobTitle,
        company: input.company,
        jobOfferText: input.jobOfferText ?? '',
        cvData: JSON.stringify(input.cvData),
        isDraft: true,
        createdAt: now,
        updatedAt: now,
      })
      return doc.toJSON() as CvDocument
    },
    [db]
  )

  const deleteDraft = useCallback(
    async (id: string): Promise<void> => {
      if (!db) return
      const doc = await db.cvs.findOne(id).exec()
      if (doc && doc.isDraft) await doc.remove()
    },
    [db]
  )

  const getDraft = useCallback(async (): Promise<CvDocument | null> => {
    if (!db) return null
    const doc = await db.cvs.findOne({ selector: { isDraft: true } }).exec()
    return doc ? (doc.toJSON() as CvDocument) : null
  }, [db])

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
    updateCV,
    getCvById,
    createDraft,
    deleteDraft,
    getDraft,
    deleteCV,
  }
}
