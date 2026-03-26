import type { CvData } from '@/types/experience'

interface CvViewerProps {
  cv: CvData
}

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

export function CvViewer({ cv }: CvViewerProps) {
  const { basics, experience, leadership, education, skills, settings } = cv
  const fontFamily =
    settings.fontFamily === 'Times New Roman'
      ? '"Times New Roman", serif'
      : 'Calibri, "Segoe UI", Arial, sans-serif'
  const fontSize = `${settings.fontSize}pt`
  const hideOptionalEmpty = settings.hideOptionalEmpty

  const expWithBullets = experience.filter((e) => e.bullets && e.bullets.length > 0)
  const leadWithBullets = leadership.filter((l) => l.bullets && l.bullets.length > 0)
  const validEducation = education.filter((e) => e.degree && e.degree.trim() !== '')

  const hasTechnical = skills.technical && skills.technical.trim() !== ''
  const hasLanguage = skills.language && skills.language.trim() !== ''
  const hasLaboratory = skills.laboratory && skills.laboratory.trim() !== ''
  const hasInterests = skills.interests && skills.interests.trim() !== ''
  const hasSkills = hasTechnical || hasLanguage || hasLaboratory || hasInterests
  const showAllSkills = !hideOptionalEmpty

  const contactLine = buildContactLine(basics.contact)

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '11pt',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  }

  const roleTitleStyle: React.CSSProperties = {
    fontSize: '9.5pt',
    fontWeight: 700,
  }

  return (
    <div
      className="cv-print-root bg-white text-black"
      style={{ fontFamily, fontSize, lineHeight: 1.35 }}
    >
      {/* Print styles */}
      <style>{`
        @page {
          margin: 0;
          size: A4 portrait;
        }
        @media print {
          html, body {
            height: auto;
            overflow-y: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          body * { visibility: hidden; }
          .cv-print-root,
          .cv-print-root * {
            visibility: visible;
          }
          .cv-print-root {
            position: relative;
            width: 210mm;
            margin: 0 auto;
            padding: 40px 45px;
            background: white;
            font-size: ${fontSize};
            color: #111;
            box-sizing: border-box;
          }
          .cv-print-section {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
        .cv-print-root { color: #111; }
      `}</style>

      {/* ── Header ── */}
      <div className="text-center" style={{ marginBottom: 4 }}>
        <h1
          style={{
            fontSize: '18pt',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 4,
            textTransform: 'capitalize',
          }}
        >
          {capitalize(basics.fullName)}
        </h1>
        <p style={{ fontSize: '9pt', color: '#555', textAlign: 'center', marginBottom: 6 }}>
          {contactLine}
        </p>
      </div>
      <div style={{ borderBottom: '1px solid #000', marginBottom: 8 }} />

      {/* ── Educación ── */}
      {validEducation.length > 0 && (
        <div className="cv-print-section">
          <h2 style={sectionTitleStyle}>Educación</h2>
          {validEducation
            .sort((a, b) => a.order - b.order)
            .map((edu) => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '10pt' }}>{edu.institution}</span>
                  {edu.location && (
                    <span style={{ fontSize: '9pt', color: '#555' }}>{edu.location}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>
                    {edu.degree}
                    {edu.concentration ? ` — ${edu.concentration}` : ''}
                  </span>
                  <span style={{ fontSize: '9pt', color: '#555' }}>{edu.graduationDate}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Experiencia ── */}
      {expWithBullets.length > 0 && (
        <div className="cv-print-section">
          <h2 style={sectionTitleStyle}>Experiencia</h2>
          {expWithBullets
            .sort((a, b) => a.order - b.order)
            .map((exp) => (
              <div key={exp.id} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '10pt' }}>{exp.organization}</span>
                  {exp.location && (
                    <span style={{ fontSize: '9pt', color: '#555' }}>{exp.location}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                  <span style={roleTitleStyle}>{exp.title}</span>
                  <span style={{ fontSize: '9pt', color: '#555' }}>{exp.dates}</span>
                </div>
                <ul style={{ margin: '3px 0 0 12px', padding: 0, listStyleType: 'disc' }}>
                  {exp.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '9.5pt', marginBottom: 2 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}

      {/* ── Liderazgo y Actividades ── */}
      {leadWithBullets.length > 0 && (
        <div className="cv-print-section">
          <h2 style={sectionTitleStyle}>Liderazgo y Actividades</h2>
          {leadWithBullets
            .sort((a, b) => a.order - b.order)
            .map((lead) => (
              <div key={lead.id} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '10pt' }}>{lead.organization}</span>
                  {lead.location && (
                    <span style={{ fontSize: '9pt', color: '#555' }}>{lead.location}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                  <span style={roleTitleStyle}>{lead.role}</span>
                  <span style={{ fontSize: '9pt', color: '#555' }}>{lead.dates}</span>
                </div>
                <ul style={{ margin: '3px 0 0 12px', padding: 0, listStyleType: 'disc' }}>
                  {lead.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '9.5pt', marginBottom: 2 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}

      {/* ── Habilidades e Intereses ── */}
      {hasSkills && (
        <div className="cv-print-section">
          <h2 style={sectionTitleStyle}>Habilidades e Intereses</h2>
          {hasTechnical && (
            <p style={{ fontSize: '9.5pt', marginBottom: 3 }}>
              <strong>Técnicas: </strong>
              {skills.technical}
            </p>
          )}
          {hasLanguage && (
            <p style={{ fontSize: '9.5pt', marginBottom: 3 }}>
              <strong>Idiomas: </strong>
              {skills.language}
            </p>
          )}
          {hasLaboratory && showAllSkills && (
            <p style={{ fontSize: '9.5pt', marginBottom: 3 }}>
              <strong>Laboratorio: </strong>
              {skills.laboratory}
            </p>
          )}
          {hasInterests && showAllSkills && (
            <p style={{ fontSize: '9.5pt', marginBottom: 3 }}>
              <strong>Intereses: </strong>
              {skills.interests}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default CvViewer
