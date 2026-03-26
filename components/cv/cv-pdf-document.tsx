'use client'

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import type { CvData } from '@/types/experience'

const styles = StyleSheet.create({
  page: {
    padding: '40 45',
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.35,
    color: '#111111',
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  contactLine: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerLine: {
    borderBottom: '1 solid #000000',
    marginTop: 11,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
  },
  roleEntry: {
    marginBottom: 10,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  org: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 9,
    color: '#555555',
  },
  roleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  roleTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 9,
    color: '#555555',
  },
  bulletList: {
    marginLeft: 12,
    marginTop: 3,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletPoint: {
    fontSize: 9.5,
    marginRight: 4,
  },
  bulletText: {
    fontSize: 9.5,
    flex: 1,
  },
  educationEntry: {
    marginBottom: 8,
  },
  eduHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  institution: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  eduLocation: {
    fontSize: 9,
    color: '#555555',
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  degree: {
    fontSize: 9.5,
    fontStyle: 'italic',
  },
  gradDate: {
    fontSize: 9,
    color: '#555555',
  },
  skillItem: {
    marginBottom: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  skillValue: {
    fontSize: 9.5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    right: 45,
    fontSize: 9,
    color: '#666666',
  },
})

function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function buildContactLine(contact: CvData['basics']['contact']): string {
  const parts: string[] = []

  if (contact.address) {
    parts.push(contact.address)
  }

  const locationParts: string[] = []
  if (contact.city) locationParts.push(contact.city)
  if (contact.state) {
    if (contact.zip) {
      locationParts.push(`${contact.state} ${contact.zip}`)
    } else {
      locationParts.push(contact.state)
    }
  }
  if (locationParts.length > 0) {
    parts.push(locationParts.join(', '))
  }

  if (contact.email) parts.push(contact.email)
  if (contact.phone) parts.push(contact.phone)

  return parts.join(' | ')
}

function EducationSection({ cv }: { cv: CvData }) {
  const { education } = cv

  const validEducation = education.filter((e) => e.degree && e.degree.trim() !== '')
  if (validEducation.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionTitle}>Educación</Text>
      {validEducation
        .sort((a, b) => a.order - b.order)
        .map((edu) => (
          <View key={edu.id} style={styles.educationEntry}>
            <View style={styles.eduHeaderRow}>
              <Text style={styles.institution}>{edu.institution}</Text>
              {edu.location && <Text style={styles.eduLocation}>{edu.location}</Text>}
            </View>
            <View style={styles.degreeRow}>
              <Text style={styles.degree}>
                {edu.degree}
                {edu.concentration ? ` — ${edu.concentration}` : ''}
              </Text>
              <Text style={styles.gradDate}>{edu.graduationDate}</Text>
            </View>
          </View>
        ))}
    </View>
  )
}

function ExperienceSection({ cv }: { cv: CvData }) {
  const { experience } = cv

  const validExperience = experience.filter((e) => e.bullets && e.bullets.length > 0)
  if (validExperience.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionTitle}>Experiencia</Text>
      {validExperience
        .sort((a, b) => a.order - b.order)
        .map((exp) => (
          <View key={exp.id} style={styles.roleEntry}>
            <View style={styles.roleHeader}>
              <Text style={styles.org}>{exp.organization}</Text>
              {exp.location && <Text style={styles.location}>{exp.location}</Text>}
            </View>
            <View style={styles.roleTitleRow}>
              <Text style={styles.roleTitle}>{exp.title}</Text>
              <Text style={styles.dates}>{exp.dates}</Text>
            </View>
            <View style={styles.bulletList}>
              {exp.bullets.map((b, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
    </View>
  )
}

function LeadershipSection({ cv }: { cv: CvData }) {
  const { leadership } = cv

  const validLeadership = leadership.filter((l) => l.bullets && l.bullets.length > 0)
  if (validLeadership.length === 0) return null

  return (
    <View>
      <Text style={styles.sectionTitle}>Liderazgo y Actividades</Text>
      {validLeadership
        .sort((a, b) => a.order - b.order)
        .map((lead) => (
          <View key={lead.id} style={styles.roleEntry}>
            <View style={styles.roleHeader}>
              <Text style={styles.org}>{lead.organization}</Text>
              {lead.location && <Text style={styles.location}>{lead.location}</Text>}
            </View>
            <View style={styles.roleTitleRow}>
              <Text style={styles.roleTitle}>{lead.role}</Text>
              <Text style={styles.dates}>{lead.dates}</Text>
            </View>
            <View style={styles.bulletList}>
              {lead.bullets.map((b, i) => (
                <View key={i} style={styles.bulletItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
    </View>
  )
}

function SkillsSection({ cv }: { cv: CvData }) {
  const { skills } = cv
  const hideOptionalEmpty = cv.settings.hideOptionalEmpty

  const hasTechnical = skills.technical && skills.technical.trim() !== ''
  const hasLanguage = skills.language && skills.language.trim() !== ''
  const hasLaboratory = skills.laboratory && skills.laboratory.trim() !== ''
  const hasInterests = skills.interests && skills.interests.trim() !== ''

  if (!hasTechnical && !hasLanguage && !hasLaboratory && !hasInterests) return null

  const showAll = !hideOptionalEmpty

  return (
    <View>
      <Text style={styles.sectionTitle}>Habilidades e Intereses</Text>
      {hasTechnical && (
        <View style={styles.skillItem}>
          <Text style={styles.skillLabel}>Técnicas: </Text>
          <Text style={styles.skillValue}>{skills.technical}</Text>
        </View>
      )}
      {hasLanguage && (
        <View style={styles.skillItem}>
          <Text style={styles.skillLabel}>Idiomas: </Text>
          <Text style={styles.skillValue}>{skills.language}</Text>
        </View>
      )}
      {hasLaboratory && showAll && (
        <View style={styles.skillItem}>
          <Text style={styles.skillLabel}>Laboratorio: </Text>
          <Text style={styles.skillValue}>{skills.laboratory}</Text>
        </View>
      )}
      {hasInterests && showAll && (
        <View style={styles.skillItem}>
          <Text style={styles.skillLabel}>Intereses: </Text>
          <Text style={styles.skillValue}>{skills.interests}</Text>
        </View>
      )}
    </View>
  )
}

interface CvPdfDocumentProps {
  cv: CvData
}

function CvPdfDocument({ cv }: CvPdfDocumentProps) {
  const { basics } = cv
  const contactLine = buildContactLine(basics.contact)

  return (
    <Document>
      <Page size={cv.settings.paperSize === 'Letter' ? 'LETTER' : 'A4'} style={styles.page}>
        <Text style={styles.name}>{capitalize(basics.fullName)}</Text>
        <View style={styles.headerLine} />
        <Text style={styles.contactLine}>{contactLine}</Text>

        <EducationSection cv={cv} />
        <ExperienceSection cv={cv} />
        <LeadershipSection cv={cv} />
        <SkillsSection cv={cv} />

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}

interface CvPdfDownloadProps {
  cv: CvData
  filename?: string
  children: React.ReactNode
}

export function CvPdfDownloadLink({
  cv,
  filename = `cv-${new Date().toISOString().slice(0, 10)}.pdf`,
  children,
}: CvPdfDownloadProps) {
  return (
    <PDFDownloadLink
      document={<CvPdfDocument cv={cv} />}
      fileName={filename}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {({ loading }) => (loading ? 'Generando PDF...' : children)}
    </PDFDownloadLink>
  )
}

export { CvPdfDocument }
export default CvPdfDocument
