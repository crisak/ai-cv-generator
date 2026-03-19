'use client'

import { useRef } from 'react'
import { Clock, Sparkles, Shield, Code } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

const benefits = [
  {
    icon: Clock,
    title: 'De 60 a 10 minutos',
    description:
      'Reduce drásticamente el tiempo que dedicas a personalizar cada CV para cada oferta.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Sparkles,
    title: 'IA Multi-modelo',
    description:
      'Elige entre Claude, GPT-4o, DeepSeek, Gemini o Grok. Tú decides qué modelo usar.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Privacidad total',
    description:
      'Tu información nunca sale de tu navegador. No usamos servidores para guardar tus datos.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Code,
    title: 'Gratis y open source',
    description:
      'Sin costos ocultos ni suscripciones. El código es público y cualquiera puede contribuir.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

export function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section ref={sectionRef} className="relative border-t border-border/50 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ¿Por qué usar CV Generator?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Herramientas pensadas para que consigas tu próximo empleo más rápido
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="h-full"
              >
                <Card className="group h-full border-border/50 bg-background/60 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="pt-6">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${benefit.bg}`}
                    >
                      <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                    </motion.div>
                    <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
