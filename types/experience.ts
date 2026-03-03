export interface CvContact {
  address: string
  city: string
  state: string
  zip: string
  email: string
  phone: string
}

export interface CvBasics {
  fullName: string
  contact: CvContact
}

export interface StudyAbroad {
  program: string
  location: string
  coursework: string
  dates: string
}

export interface EducationItem {
  id: string
  institution: string
  location: string
  degree: string
  concentration: string
  gpa: string
  graduationDate: string
  thesis: string
  coursework: string
  studyAbroad: StudyAbroad | null
  order: number
}

export interface ExperienceItem {
  id: string
  organization: string
  title: string
  location: string
  dates: string
  bullets: string[]
  order: number
}

export interface LeadershipItem {
  id: string
  organization: string
  location: string
  role: string
  dates: string
  bullets: string[]
  order: number
}

export interface CvSkills {
  technical: string
  language: string
  laboratory: string
  interests: string
}

export interface CvSettings {
  paperSize: 'A4' | 'Letter'
  fontFamily: 'Calibri' | 'Times New Roman'
  fontSize: number
  hideOptionalEmpty: boolean
}

export interface CvData {
  schemaVersion: number
  updatedAt: string
  basics: CvBasics
  education: EducationItem[]
  experience: ExperienceItem[]
  leadership: LeadershipItem[]
  skills: CvSkills
  settings: CvSettings
}
