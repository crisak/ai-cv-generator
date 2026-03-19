'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Monitor, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const screenshots = [
  {
    id: 'dashboard',
    title: 'Dashboard de postulaciones',
    description:
      'Visualiza todas tus postulaciones en un solo lugar. Filtra por estado, empresa, salario y más.',
    image: '/images/screenshots/dashboard.png',
  },
  {
    id: 'cv-generator-step1',
    title: 'Paso 1: Pega la oferta',
    description:
      'Copia y pega el texto de la oferta laboral o ingresa la URL. La IA analiza los requisitos automáticamente.',
    image: '/images/screenshots/cv-generator-step1.png',
  },
  {
    id: 'cv-generator-step2',
    title: 'Paso 2: Revisa los objetivos',
    description:
      'La IA genera logros personalizados. Acepta, rechaza o edita cada uno con vista previa en tiempo real.',
    image: '/images/screenshots/cv-generator-step2.png',
  },
  {
    id: 'cv-generator-step3',
    title: 'Paso 3: Descarga el CV',
    description:
      'Previsualiza el CV optimizado y descárgalo como PDF de una página, listo para enviar.',
    image: '/images/screenshots/cv-generator-step3.png',
  },
  {
    id: 'experience',
    title: 'Editor de experiencia',
    description:
      'Centraliza toda tu experiencia laboral, educación y habilidades en un solo lugar editable.',
    image: '/images/screenshots/experience.png',
  },
]

export function ScreenshotsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], [40, -40])

  const goTo = (index: number) => {
    setActiveIndex((index + screenshots.length) % screenshots.length)
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden border-t border-border/50 py-20 sm:py-28">
      {/* Parallax background element */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mira la plataforma en acción
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubre lo fácil que es generar CVs profesionales con IA
          </p>
        </motion.div>

        {/* Tab navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          {screenshots.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveIndex(i)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeIndex === i
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {item.title}
            </motion.button>
          ))}
        </motion.div>

        {/* Screenshot display */}
        <div className="relative">
          {/* Browser frame */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/10 dark:shadow-black/30"
          >
            {/* Browser top bar */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Monitor className="h-3 w-3" />
                <span>cvgenerator.app</span>
              </div>
            </div>

            {/* Screenshot content */}
            <div className="relative aspect-video bg-muted/20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative h-full w-full"
                >
                  {/* Placeholder — replace with real screenshots */}
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Monitor className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{screenshots[activeIndex].title}</p>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {screenshots[activeIndex].description}
                      </p>
                    </div>
                    <p className="mt-2 rounded-lg bg-muted px-4 py-2 text-xs text-muted-foreground font-mono">
                      Reemplazar con: {screenshots[activeIndex].image}
                    </p>
                  </div>

                  {/*
                    Para usar las imágenes reales, descomenta esto y elimina el placeholder:
                    <Image
                      src={screenshots[activeIndex].image}
                      alt={screenshots[activeIndex].title}
                      fill
                      className="object-cover object-top"
                      priority={activeIndex === 0}
                    />
                  */}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation arrows */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goTo(activeIndex - 1)}
                className="h-9 w-9 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Dot indicators */}
            <div className="flex gap-2">
              {screenshots.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    activeIndex === i ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                  }`}
                  whileHover={{ scale: 1.3 }}
                  layout
                />
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goTo(activeIndex + 1)}
                className="h-9 w-9 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4 text-center text-sm text-muted-foreground"
            >
              {screenshots[activeIndex].description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
