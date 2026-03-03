'use client'

import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import type { RxDatabase, RxCollection } from 'rxdb'
import {
  applicationSchema,
  cvSchema,
  settingsSchema,
  experienceSchema,
  type ApplicationDocument,
  type CvDocument,
  type SettingsDocument,
  type ExperienceDocument,
} from './schemas'

addRxPlugin(RxDBQueryBuilderPlugin)

export type DatabaseCollections = {
  applications: RxCollection<ApplicationDocument>
  cvs: RxCollection<CvDocument>
  settings: RxCollection<SettingsDocument>
  experiences: RxCollection<ExperienceDocument>
}

export type AppDatabase = RxDatabase<DatabaseCollections>

let dbInstance: AppDatabase | null = null
let initPromise: Promise<AppDatabase> | null = null

export async function getDatabase(): Promise<AppDatabase> {
  if (dbInstance) return dbInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    const db = await createRxDatabase<DatabaseCollections>({
      name: 'cvgeneratordb',
      storage: getRxStorageDexie(),
      ignoreDuplicate: true,
    })

    await db.addCollections({
      applications: { schema: applicationSchema },
      cvs: { schema: cvSchema },
      settings: { schema: settingsSchema },
      experiences: { schema: experienceSchema },
    })

    dbInstance = db
    return db
  })()

  return initPromise
}
