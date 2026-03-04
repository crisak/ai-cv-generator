'use client'

import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useDb } from './use-db'
import type { ApplicationDocument, TimelineEntry, TimelineFile } from '@/lib/db/schemas'
import type { ApplicationStatus } from '@/types/cv'

export type ApplicationInput = Omit<
  ApplicationDocument,
  'id' | 'createdAt' | 'updatedAt' | 'cvId' | 'timeline'
> & {
  cvId?: string
  timeline?: TimelineEntry[]
}

export type NewTimelineEntry = {
  title: string
  status: ApplicationStatus
  date: string
  deadline?: string
  notes: string
  files: TimelineFile[]
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Postulado',
  phone_screen: 'Llamada inicial',
  technical: 'Entrevista técnica',
  hr_interview: 'Entrevista HR',
  offer: 'Oferta recibida',
  rejected: 'Rechazado',
  accepted: 'Aceptado',
  withdrawn: 'Retirado',
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
          title: STATUS_LABELS[input.status] ?? 'Postulación registrada',
          date: now,
          notes: 'Postulación registrada',
          files: [],
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

      // Auto-add timeline entry when status changes (quick inline change from table)
      let timelinePatch: TimelineEntry[] | undefined
      if (patch.status && patch.status !== currentData.status) {
        const newEntry: TimelineEntry = {
          id: uuidv4(),
          status: patch.status as ApplicationStatus,
          title: STATUS_LABELS[patch.status as ApplicationStatus] ?? '',
          date: now,
          notes: patch.notes ?? '',
          files: [],
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

  const addTimelineEntry = useCallback(
    async (id: string, entry: NewTimelineEntry) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return

      const currentData = doc.toJSON() as ApplicationDocument
      const newEntry: TimelineEntry = {
        id: uuidv4(),
        ...entry,
      }
      await doc.patch({
        timeline: [...(currentData.timeline ?? []), newEntry],
        status: entry.status,
        updatedAt: new Date().toISOString(),
      })
    },
    [db]
  )

  const updateTimelineEntry = useCallback(
    async (id: string, entryId: string, patch: Partial<Omit<TimelineEntry, 'id'>>) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return

      const currentData = doc.toJSON() as ApplicationDocument
      const updatedTimeline = currentData.timeline.map((e) =>
        e.id === entryId ? { ...e, ...patch } : e
      )

      // If status changed in entry, also update application status to match latest entry
      const latestEntry = updatedTimeline[updatedTimeline.length - 1]
      await doc.patch({
        timeline: updatedTimeline,
        status: latestEntry?.status ?? currentData.status,
        updatedAt: new Date().toISOString(),
      })
    },
    [db]
  )

  const deleteTimelineEntry = useCallback(
    async (id: string, entryId: string) => {
      if (!db) return
      const doc = await db.applications.findOne(id).exec()
      if (!doc) return

      const currentData = doc.toJSON() as ApplicationDocument
      const updatedTimeline = currentData.timeline.filter((e) => e.id !== entryId)
      const latestEntry = updatedTimeline[updatedTimeline.length - 1]

      await doc.patch({
        timeline: updatedTimeline,
        status: latestEntry?.status ?? currentData.status,
        updatedAt: new Date().toISOString(),
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
    addTimelineEntry,
    updateTimelineEntry,
    deleteTimelineEntry,
    deleteApplication,
    toggleFavorite,
  }
}
