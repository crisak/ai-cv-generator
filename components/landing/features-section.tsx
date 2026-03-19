'use client'

import { useRef } from 'react'
import { Zap, Cloud, Briefcase, Palette, BarChart3 } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

const upcomingFeatures = [
  {
    icon: Zap,
    title: 'Modelos de IA gratuitos',
    description: 'Usa la app sin necesidad de configurar una API key. Modelos gratuitos incluidos.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Cloud,
    title: 'Sincronización en la nube',
    description: 'Accede a tus datos desde cualquier dispositivo con sincronización automática.',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Briefcase,
    title: 'Importar ofertas de LinkedIn e Indeed',
    description: 'Importa ofertas laborales directamente desde las plataformas más populares.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Palette,
    title: 'Plantillas visuales de CV',
    description: 'Nuevos diseños de CV más allá del formato estándar optimizado para ATS.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: BarChart3,
    title: 'Análisis salarial con IA',
    description: 'Compara salarios y obtén información del mercado laboral con inteligencia artificial.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
]

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const bgX = useTransform(scrollYProgress, [0, 1], [-30, 30])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-20 sm:py-28">
      {/* Parallax glow */}
      <motion.div
        style={{ x: bgX }}
        className="pointer-events-none absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Próximamente
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos trabajando en nuevas funcionalidades para mejorar tu experiencia
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl space-y-4">
          {upcomingFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                whileHover={{ x: 8, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-5 transition-shadow hover:shadow-md hover:shadow-primary/5"
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </motion.div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      Próximo
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
