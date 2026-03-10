'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getDatabase, type AppDatabase } from '@/lib/db'

export function useDb() {
  const { userId, isLoaded } = useAuth()
  const [db, setDb] = useState<AppDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isLoaded || !userId) return
    getDatabase(userId)
      .then(setDb)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [userId, isLoaded])

  return { db, isLoading: !isLoaded || isLoading, error }
}
