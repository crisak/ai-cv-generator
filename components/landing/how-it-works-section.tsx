'use client'

import { useRef } from 'react'
import { ClipboardPaste, SlidersHorizontal, Download } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

const steps = [
  {
    number: '1',
    icon: ClipboardPaste,
    title: 'Pega la oferta laboral',
    description:
      'Copia el texto de la oferta de trabajo o pega la URL. La IA extrae automáticamente la empresa, el puesto y los requisitos.',
  },
  {
    number: '2',
    icon: SlidersHorizontal,
    title: 'Revisa y ajusta los objetivos',
    description:
      'La IA genera logros basados en tu experiencia real. Revisa cada uno, edita lo que necesites y ve el CV en tiempo real.',
  },
  {
    number: '3',
    icon: Download,
    title: 'Descarga tu CV optimizado',
    description:
      'Obtén un PDF de una página listo para enviar, optimizado para pasar los filtros automáticos de las empresas (ATS).',
  },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%'])

  return (
    <section id="como-funciona" ref={sectionRef} className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tres pasos simples para generar un CV personalizado
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-4xl">
          {/* Animated connecting line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border/30 lg:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-primary/50"
            />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative flex flex-col items-center gap-8 lg:flex-row ${
                  i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Step content */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    className={i % 2 === 1 ? 'lg:text-right' : ''}
                    whileInView={{ opacity: [0, 1] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                  >
                    <div
                      className={`mb-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground ${
                        i % 2 === 1 ? 'lg:ml-auto' : ''
                      }`}
                    >
                      <step.icon className="h-3.5 w-3.5" />
                      Paso {step.number}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold sm:text-2xl">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </motion.div>
                </div>

                {/* Step number circle — desktop only */}
                <motion.div
                  whileInView={{ scale: [0.5, 1.15, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 hidden shrink-0 lg:block"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                    {step.number}
                  </div>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    whileInView={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-primary"
                  />
                </motion.div>

                {/* Spacer for alternating layout */}
                <div className="hidden flex-1 lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
