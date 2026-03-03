import type { RxJsonSchema } from 'rxdb'
import type { ApplicationStatus, AIModel } from '@/types/cv'

export interface ApplicationDocument {
  id: string
  company: string
  position: string
  source: string
  status: ApplicationStatus
  salaryOffered: number
  salaryCurrency: string
  benefits: string
  ranking: number
  appliedAt: string
  responseDate: string
  nextSteps: string
  notes: string
  cvId: string
  createdAt: string
  updatedAt: string
}

export interface CvDocument {
  id: string
  applicationId: string
  jobTitle: string
  company: string
  cvData: string
  createdAt: string
}

export interface SettingsDocument {
  id: string
  aiModel: AIModel
  aiApiKey: string
  userName: string
  userEmail: string
}

export interface ExperienceDocument {
  id: string
  cvData: string
  updatedAt: string
}

export const applicationSchema: RxJsonSchema<ApplicationDocument> = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    company: { type: 'string' },
    position: { type: 'string' },
    source: { type: 'string' },
    status: {
      type: 'string',
      enum: [
        'pending',
        'phone_screen',
        'technical',
        'hr_interview',
        'offer',
        'rejected',
        'accepted',
        'withdrawn',
      ],
    },
    salaryOffered: { type: 'number' },
    salaryCurrency: { type: 'string' },
    benefits: { type: 'string' },
    ranking: { type: 'number', minimum: 0, maximum: 5 },
    appliedAt: { type: 'string' },
    responseDate: { type: 'string' },
    nextSteps: { type: 'string' },
    notes: { type: 'string' },
    cvId: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'company', 'position', 'status', 'createdAt', 'updatedAt'],
}

export const cvSchema: RxJsonSchema<CvDocument> = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    applicationId: { type: 'string' },
    jobTitle: { type: 'string' },
    company: { type: 'string' },
    cvData: { type: 'string' },
    createdAt: { type: 'string' },
  },
  required: ['id', 'cvData', 'createdAt'],
}

export const settingsSchema: RxJsonSchema<SettingsDocument> = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    aiModel: {
      type: 'string',
      enum: ['claude', 'gpt', 'gemini', 'grok', 'deepseek'],
    },
    aiApiKey: { type: 'string' },
    userName: { type: 'string' },
    userEmail: { type: 'string' },
  },
  required: ['id'],
}

export const experienceSchema: RxJsonSchema<ExperienceDocument> = {
  version: 0,
  type: 'object',
  primaryKey: 'id',
  properties: {
    id: { type: 'string', maxLength: 100 },
    cvData: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'cvData', 'updatedAt'],
}
