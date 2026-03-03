'use client'

import { useState, useEffect } from 'react'
import { useDb } from './use-db'
import type { SettingsDocument } from '@/lib/db/schemas'

export function useSettings() {
  const { db } = useDb()
  const [settings, setSettings] = useState<SettingsDocument | null>(null)

  useEffect(() => {
    if (!db) return
    const sub = db.settings
      .findOne('singleton')
      .$.subscribe((doc) => setSettings(doc ? (doc.toJSON() as SettingsDocument) : null))
    return () => sub.unsubscribe()
  }, [db])

  return { settings }
}
