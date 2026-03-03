'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDb } from './use-db'
import type { ApplicationDocument, TimelineEntry } from '@/lib/db/schemas'
import type { ApplicationStatus } from '@/types/cv'

export type ApplicationInput = Omit<
  ApplicationDocument,
  'id' | 'createdAt' | 'updatedAt' | 'cvId' | 'timeline'
> & {
  cvId?: string
  timeline?: TimelineEntry[]
}

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
      const initialTimeline: TimelineEntry[] = [
        {
          id: uuidv4(),
          status: input.status,
          date: now,
          notes: 'Postulación registrada',
        },
      ]
      const doc = await db.applications.insert({
        id: uuidv4(),
        cvId: '',
        ...input,
        timeline: input.timeline ?? initialTimeline,
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

      const currentData = doc.toJSON() as ApplicationDocument
      const now = new Date().toISOString()

      // Auto-add timeline entry when status changes
      let timelinePatch: TimelineEntry[] | undefined
      if (patch.status && patch.status !== currentData.status) {
        const newEntry: TimelineEntry = {
          id: uuidv4(),
          status: patch.status as ApplicationStatus,
          date: now,
          notes: patch.notes ?? '',
        }
        timelinePatch = [...(currentData.timeline ?? []), newEntry]
      }

      await doc.patch({
        ...patch,
        ...(timelinePatch ? { timeline: timelinePatch } : {}),
        updatedAt: now,
      })
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

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return
      const current = doc.toJSON() as ApplicationDocument
      await doc.patch({ isFavorite: !current.isFavorite, updatedAt: new Date().toISOString() })
    },
    [db]
  )

  return {
    applications,
    isLoading: dbLoading || isLoading,
    createApplication,
    updateApplication,
    deleteApplication,
    toggleFavorite,
  }
}
