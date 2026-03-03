'use client'

import { useState, useEffect } from 'react'
import { getDatabase, type AppDatabase } from '@/lib/db'

export function useDb() {
  const [db, setDb] = useState<AppDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { db, isLoading, error }
}
