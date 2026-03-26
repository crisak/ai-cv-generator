'use client'

import { Document, Page, Text, View, StyleSheet, Font, PDFDownloadLink } from '@react-pdf/renderer'
import type { CvData } from '@/types/experience'

Font.register({
  family: 'Calibri',
  fonts: [{ src: 'https://fonts.gstatic.com/s/calibri/v14/2OGbDZ连字体.ttf' }],
})

const styles = StyleSheet.create({
  page: {
    padding: '40 45',
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
    color: '#111111',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#444444',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
    borderBottom: '1.5 solid #111111',
    paddingBottom: 2,
  },
  roleEntry: {
    marginBottom: 10,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  org: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 9,
    color: '#555555',
  },
  roleSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  role: {
    fontSize: 9.5,
    fontStyle: 'italic',
  },
  dates: {
    fontSize: 9,
    color: '#555555',
  },
  bulletList: {
    marginLeft: 12,
  },
  bullet: {
    fontSize: 9.5,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  educationEntry: {
    marginBottom: 8,
  },
  educationHeader: {
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
  coursework: {
    fontSize: 9,
    color: '#333333',
    marginTop: 2,
  },
  skillRow: {
    fontSize: 9.5,
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
})

interface CvPdfDocumentProps {
  cv: CvData
}

function CvPdfDocument({ cv }: CvPdfDocumentProps) {
  const { basics, experience, leadership, education, skills } = cv

  const expWithBullets = experience.filter((e) => e.bullets.length > 0)
  const leadWithBullets = leadership.filter((l) => l.bullets.length > 0)

  const contactLine = [
    basics.contact.city && basics.contact.state
      ? `${basics.contact.city}, ${basics.contact.state}`
      : basics.contact.city || basics.contact.state,
    basics.contact.phone,
    basics.contact.email,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{basics.fullName}</Text>
          <Text style={styles.contact}>{contactLine}</Text>
        </View>

        {expWithBullets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experiencia Profesional</Text>
            {expWithBullets
              .sort((a, b) => a.order - b.order)
              .map((exp) => (
                <View key={exp.id} style={styles.roleEntry}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.org}>{exp.organization}</Text>
                    <Text style={styles.location}>{exp.location}</Text>
                  </View>
                  <View style={styles.roleSubHeader}>
                    <Text style={styles.role}>{exp.title}</Text>
                    <Text style={styles.dates}>{exp.dates}</Text>
                  </View>
                  <View style={styles.bulletList}>
                    {exp.bullets.map((b, i) => (
                      <Text key={i} style={styles.bullet}>
                        {`• ${b}`}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
          </View>
        )}

        {leadWithBullets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liderazgo y Mentoría</Text>
            {leadWithBullets
              .sort((a, b) => a.order - b.order)
              .map((lead) => (
                <View key={lead.id} style={styles.roleEntry}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.org}>{lead.organization}</Text>
                    <Text style={styles.location}>{lead.location}</Text>
                  </View>
                  <View style={styles.roleSubHeader}>
                    <Text style={styles.role}>{lead.role}</Text>
                    <Text style={styles.dates}>{lead.dates}</Text>
                  </View>
                  <View style={styles.bulletList}>
                    {lead.bullets.map((b, i) => (
                      <Text key={i} style={styles.bullet}>
                        {`• ${b}`}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Educación</Text>
            {education
              .sort((a, b) => a.order - b.order)
              .map((edu) => (
                <View key={edu.id} style={styles.educationEntry}>
                  <View style={styles.educationHeader}>
                    <Text style={styles.institution}>{edu.institution}</Text>
                    <Text style={styles.eduLocation}>{edu.location}</Text>
                  </View>
                  <View style={styles.degreeRow}>
                    <Text style={styles.degree}>
                      {edu.degree}
                      {edu.concentration ? ` — ${edu.concentration}` : ''}
                    </Text>
                    <Text style={styles.gradDate}>{edu.graduationDate}</Text>
                  </View>
                  {(edu.coursework || edu.thesis) && (
                    <Text style={styles.coursework}>{edu.coursework || edu.thesis}</Text>
                  )}
                </View>
              ))}
          </View>
        )}

        {(skills.technical || skills.language) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            {skills.technical && (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>Técnicas: </Text>
                {skills.technical}
              </Text>
            )}
            {skills.language && (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>Idiomas: </Text>
                {skills.language}
              </Text>
            )}
            {(!cv.settings.hideOptionalEmpty || skills.interests) && skills.interests && (
              <Text style={styles.skillRow}>
                <Text style={styles.bold}>Intereses: </Text>
                {skills.interests}
              </Text>
            )}
          </View>
        )}
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
