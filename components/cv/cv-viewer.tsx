import type { CvData } from '@/types/experience'

interface CvViewerProps {
  cv: CvData
}

export function CvViewer({ cv }: CvViewerProps) {
  const { basics, experience, leadership, education, skills, settings } = cv
  const fontFamily = settings.fontFamily === 'Times New Roman' ? '"Times New Roman", serif' : 'Calibri, "Segoe UI", Arial, sans-serif'
  const fontSize = `${settings.fontSize}pt`

  const expWithBullets = experience.filter((e) => e.bullets.length > 0)
  const leadWithBullets = leadership.filter((l) => l.bullets.length > 0)

  return (
    <div
      className="cv-print-root bg-white text-black"
      style={{ fontFamily, fontSize, lineHeight: 1.35 }}
    >
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .cv-print-root, .cv-print-root * { visibility: visible; }
          .cv-print-root {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            padding: 18mm 16mm;
            font-size: ${fontSize};
          }
        }
        .cv-print-root { color: #111; }
        .cv-section-line { border: none; border-top: 1.5px solid #111; margin: 3px 0 6px; }
      `}</style>

      <div className="mx-auto max-w-[720px] px-8 py-8">
        {/* ── Header ── */}
        <div className="mb-4 text-center">
          <h1 style={{ fontSize: '16pt', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
            {basics.fullName}
          </h1>
          <p style={{ fontSize: '9pt', color: '#444' }}>
            {[
              basics.contact.city && basics.contact.state
                ? `${basics.contact.city}, ${basics.contact.state}`
                : basics.contact.city || basics.contact.state,
              basics.contact.phone,
              basics.contact.email,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
        </div>

        {/* ── Experience ── */}
        {expWithBullets.length > 0 && (
          <Section title="Experiencia Profesional">
            {expWithBullets
              .sort((a, b) => a.order - b.order)
              .map((exp) => (
                <RoleEntry
                  key={exp.id}
                  org={exp.organization}
                  role={exp.title}
                  location={exp.location}
                  dates={exp.dates}
                  bullets={exp.bullets}
                />
              ))}
          </Section>
        )}

        {/* ── Leadership ── */}
        {leadWithBullets.length > 0 && (
          <Section title="Liderazgo y Mentoría">
            {leadWithBullets
              .sort((a, b) => a.order - b.order)
              .map((lead) => (
                <RoleEntry
                  key={lead.id}
                  org={lead.organization}
                  role={lead.role}
                  location={lead.location}
                  dates={lead.dates}
                  bullets={lead.bullets}
                />
              ))}
          </Section>
        )}

        {/* ── Education ── */}
        {education.length > 0 && (
          <Section title="Educación">
            {education
              .sort((a, b) => a.order - b.order)
              .map((edu) => (
                <div key={edu.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '10pt' }}>{edu.institution}</span>
                    <span style={{ fontSize: '9pt', color: '#555' }}>{edu.location}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>
                      {edu.degree}
                      {edu.concentration ? ` — ${edu.concentration}` : ''}
                    </span>
                    <span style={{ fontSize: '9pt', color: '#555' }}>{edu.graduationDate}</span>
                  </div>
                  {(edu.coursework || edu.thesis) && (
                    <p style={{ fontSize: '9pt', color: '#333', marginTop: 2 }}>
                      {edu.coursework || edu.thesis}
                    </p>
                  )}
                </div>
              ))}
          </Section>
        )}

        {/* ── Skills ── */}
        {(skills.technical || skills.language) && (
          <Section title="Habilidades">
            {skills.technical && (
              <p style={{ fontSize: '9.5pt', marginBottom: 4 }}>
                <strong>Técnicas: </strong>{skills.technical}
              </p>
            )}
            {skills.language && (
              <p style={{ fontSize: '9.5pt', marginBottom: 4 }}>
                <strong>Idiomas: </strong>{skills.language}
              </p>
            )}
            {!settings.hideOptionalEmpty || skills.interests ? (
              <p style={{ fontSize: '9.5pt' }}>
                <strong>Intereses: </strong>{skills.interests}
              </p>
            ) : null}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: '10.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
        {title}
      </h2>
      <hr className="cv-section-line" />
      {children}
    </div>
  )
}

function RoleEntry({
  org,
  role,
  location,
  dates,
  bullets,
}: {
  org: string
  role: string
  location: string
  dates: string
  bullets: string[]
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontWeight: 700, fontSize: '10pt' }}>{org}</span>
        <span style={{ fontSize: '9pt', color: '#555' }}>{location}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontStyle: 'italic', fontSize: '9.5pt' }}>{role}</span>
        <span style={{ fontSize: '9pt', color: '#555' }}>{dates}</span>
      </div>
      <ul style={{ margin: '0 0 0 16px', padding: 0, listStyleType: 'disc' }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ fontSize: '9.5pt', marginBottom: 2, lineHeight: 1.4 }}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}
