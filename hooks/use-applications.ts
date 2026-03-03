'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDb } from './use-db'
import type { ApplicationDocument } from '@/lib/db/schemas'

export type ApplicationInput = Omit<ApplicationDocument, 'id' | 'createdAt' | 'updatedAt' | 'cvId'> & { cvId?: string }

export function useApplications() {
  const { db, isLoading: dbLoading } = useDb()
  const [applications, setApplications] = useState<ApplicationDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!db) return

    const sub = db.applications.find().sort({ createdAt: 'desc' }).$.subscribe((docs) => {
      setApplications(docs.map((d) => d.toJSON() as ApplicationDocument))
      setIsLoading(false)
    })

    return () => sub.unsubscribe()
  }, [db])

  const createApplication = useCallback(
    async (input: ApplicationInput) => {
      if (!db) return null
      const now = new Date().toISOString()
      const doc = await db.applications.insert({
        id: uuidv4(),
        cvId: '',
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      return doc.toJSON() as ApplicationDocument
    },
    [db]
  )

  const updateApplication = useCallback(
    async (id: string, patch: Partial<ApplicationInput>) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return
      await doc.patch({ ...patch, updatedAt: new Date().toISOString() })
    },
    [db]
  )

  const deleteApplication = useCallback(
    async (id: string) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return
      await doc.remove()
    },
    [db]
  )

  return {
    applications,
    isLoading: dbLoading || isLoading,
    createApplication,
    updateApplication,
    deleteApplication,
  }
}
