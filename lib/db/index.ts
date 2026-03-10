'use client'

import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import type { RxDatabase, RxCollection } from 'rxdb'
import { v4 as uuidv4 } from 'uuid'
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
addRxPlugin(RxDBMigrationSchemaPlugin)

export type DatabaseCollections = {
  applications: RxCollection<ApplicationDocument>
  cvs: RxCollection<CvDocument>
  settings: RxCollection<SettingsDocument>
  experiences: RxCollection<ExperienceDocument>
}

export type AppDatabase = RxDatabase<DatabaseCollections>

const dbInstances = new Map<string, AppDatabase>()
const initPromises = new Map<string, Promise<AppDatabase>>()

export async function getDatabase(userId: string): Promise<AppDatabase> {
  const dbName = `cvgeneratordb-${userId}`

  if (dbInstances.has(dbName)) return dbInstances.get(dbName)!
  if (initPromises.has(dbName)) return initPromises.get(dbName)!

  const promise = (async () => {
    const db = await createRxDatabase<DatabaseCollections>({
      name: dbName,
      storage: getRxStorageDexie(),
      ignoreDuplicate: true,
    })

    await db.addCollections({
      applications: {
        schema: applicationSchema,
        migrationStrategies: {
          // v0 → v1: replace ranking/benefits(string) with isFavorite/benefits(array)/timeline/jobOfferText
          1: (oldDoc: Record<string, unknown>) => ({
            ...oldDoc,
            isFavorite: false,
            benefits: oldDoc.benefits
              ? [oldDoc.benefits as string].filter(Boolean)
              : [],
            jobOfferText: '',
            timeline: [
              {
                id: uuidv4(),
                status: oldDoc.status ?? 'pending',
                date: oldDoc.createdAt ?? new Date().toISOString(),
                notes: 'Estado inicial',
              },
            ],
          }),
          // v1 → v2: add title, deadline, files to each timeline entry
          2: (oldDoc: Record<string, unknown>) => {
            const timeline = (oldDoc.timeline as Record<string, unknown>[] | undefined) ?? []
            return {
              ...oldDoc,
              timeline: timeline.map((entry) => ({
                ...entry,
                title: entry.title ?? (entry.notes as string) ?? '',
                deadline: entry.deadline ?? undefined,
                files: entry.files ?? [],
              })),
            }
          },
        },
      },
      cvs: { schema: cvSchema },
      settings: { schema: settingsSchema },
      experiences: { schema: experienceSchema },
    })

    dbInstances.set(dbName, db)
    initPromises.delete(dbName)
    return db
  })()

  initPromises.set(dbName, promise)
  return promise
}

export function clearDbInstance(userId: string) {
  dbInstances.delete(`cvgeneratordb-${userId}`)
}
