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
            // ranking field is dropped automatically (not in new schema)
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

    dbInstance = db
    return db
  })()

  return initPromise
}
