'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDb } from './use-db'
import type { SettingsDocument } from '@/lib/db/schemas'

const SINGLETON_ID = 'singleton'

export function useSettings() {
  const { db } = useDb()
  const [settings, setSettings] = useState<SettingsDocument | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!db) return
    const sub = db.settings
      .findOne(SINGLETON_ID)
      .$.subscribe((doc) => setSettings(doc ? (doc.toJSON() as SettingsDocument) : null))
    return () => sub.unsubscribe()
  }, [db])

  const saveSettings = useCallback(
    async (patch: Partial<Omit<SettingsDocument, 'id'>>) => {
      if (!db) return
      setIsSaving(true)
      try {
        const doc = await db.settings.findOne(SINGLETON_ID).exec()
        if (doc) {
          await doc.patch(patch)
        } else {
          await db.settings.insert({
            id: SINGLETON_ID,
            aiModel: 'claude',
            aiApiKey: '',
            userName: '',
            userEmail: '',
            ...patch,
          })
        }
      } finally {
        setIsSaving(false)
      }
    },
    [db]
  )

  return { settings, isSaving, saveSettings }
}
