'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Monitor,
  Play,
  Pause,
  Plus,
  Minus,
  LayoutDashboard,
  ClipboardPaste,
  SlidersHorizontal,
  Download,
  FileText,
} from 'lucide-react'

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? 16 : -16,
    scale: 0.98,
  }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? -10 : 10,
    scale: 0.98,
  }),
}

const steps = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard de postulaciones',
    shortTitle: 'Dashboard',
    description:
      'Visualiza y organiza todas tus postulaciones. Filtra por estado, empresa, salario y más.',
    video: '/videos/dashboard.mp4',
  },
  {
    id: 'step1',
    icon: ClipboardPaste,
    title: 'Paso 1: Pega la oferta',
    shortTitle: 'Paso 1',
    description:
      'Copia el texto de la oferta o ingresa la URL. La IA analiza los requisitos automáticamente.',
    video: '/videos/step1.mp4',
  },
  {
    id: 'step2',
    icon: SlidersHorizontal,
    title: 'Paso 2: Revisa los objetivos',
    shortTitle: 'Paso 2',
    description:
      'La IA propone logros basados en tu experiencia. Acepta, edita o descarta cada uno en tiempo real.',
    video: '/videos/step2.mp4',
  },
  {
    id: 'step3',
    icon: Download,
    title: 'Paso 3: Descarga el CV',
    shortTitle: 'Paso 3',
    description:
      'Previsualiza el CV optimizado y descárgalo como PDF de una página listo para enviar.',
    video: '/videos/step3.mp4',
  },
  {
    id: 'experience',
    icon: FileText,
    title: 'Editor de experiencia',
    shortTitle: 'Experiencia',
    description:
      'Centraliza tu historial laboral, educación y habilidades. La fuente de verdad para todos tus CVs.',
    video: '/videos/experience.mp4',
  },
]

function VideoPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }, [])

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/30 text-center">
        <Monitor className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/50">Video próximamente</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        autoPlay
        className="h-full w-full object-cover object-top"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        aria-label={playing ? 'Pausar video' : 'Reproducir video'}
        className="absolute bottom-4 right-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border/50 bg-background/80 shadow-lg backdrop-blur-md transition-colors hover:bg-background"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={playing ? 'pause' : 'play'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            {playing ? (
              <Pause className="h-4 w-4 text-foreground" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 text-foreground" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

export function ScreenshotsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const glowY1 = useTransform(scrollYProgress, [0, 1], [-20, 20])
  const glowY2 = useTransform(scrollYProgress, [0, 1], [15, -15])
  const glowX1 = useTransform(scrollYProgress, [0, 1], [10, -10])
  const glowX2 = useTransform(scrollYProgress, [0, 1], [-8, 8])

  const goTo = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      setDirection(index > activeIndex ? 1 : -1)
      setActiveIndex(index)
    },
    [activeIndex],
  )

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-border/50 py-20 sm:py-28"
    >
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mira la plataforma en acción
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Descubre lo fácil que es generar CVs profesionales con IA
          </p>
        </motion.div>

        {/* Slide dots — visible only on desktop alongside accordion */}
        <div className="mb-6 hidden justify-end gap-1 px-1 lg:flex">
          {steps.map((step, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Ver ${step.title}`}
              aria-current={activeIndex === i ? 'true' : undefined}
              className="flex cursor-pointer items-center justify-center p-2"
            >
              <motion.span
                layout
                className={`block h-2 rounded-full transition-colors duration-300 ${
                  activeIndex === i
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            </motion.button>
          ))}
        </div>

        {/* Mobile/tablet: horizontal scrollable pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {steps.map((step, i) => {
            const isActive = activeIndex === i
            return (
              <motion.button
                key={step.id}
                onClick={() => goTo(i)}
                whileTap={{ scale: 0.95 }}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                <step.icon className="h-3.5 w-3.5" />
                {step.shortTitle}
              </motion.button>
            )
          })}
        </div>

        {/* Main layout: left accordion (desktop) + right video */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left: accordion list — desktop only */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            {steps.map((step, i) => {
              const isActive = activeIndex === i
              const isLast = i === steps.length - 1
              return (
                <div key={step.id}>
                  <motion.button
                    onClick={() => goTo(i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left"
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          color: isActive
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--muted-foreground))',
                        }}
                        transition={{ duration: 0.25 }}
                      >
                        <step.icon className="h-4 w-4 shrink-0" />
                      </motion.div>
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    <motion.div className="text-muted-foreground">
                      {isActive ? (
                        <Minus className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </motion.div>
                  </motion.button>

                  {/* Expandable description */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.2, delay: 0.05 },
                        }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 pl-7 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isLast && <div className="border-b border-border/50" />}
                </div>
              )
            })}
          </div>

          {/* Right: browser window with glow effects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            {/* Glow: top-right corner behind browser */}
            <motion.div
              className="pointer-events-none absolute -right-12 -top-10 h-56 w-56 rounded-full bg-primary/25 dark:bg-primary/20"
              style={{
                filter: 'blur(60px)',
                y: glowY1,
                x: glowX1,
              }}
              animate={{
                scale: [1, 1.08, 0.95, 1],
                opacity: [0.7, 0.9, 0.75, 0.7],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Glow: bottom-left corner behind browser */}
            <motion.div
              className="pointer-events-none absolute -bottom-8 -left-10 h-48 w-48 rounded-full bg-primary/20 dark:bg-primary/15"
              style={{
                filter: 'blur(55px)',
                y: glowY2,
                x: glowX2,
              }}
              animate={{
                scale: [1, 0.93, 1.06, 1],
                opacity: [0.6, 0.8, 0.65, 0.6],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Active step description — mobile only */}
            <div className="mb-3 lg:hidden">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {steps[activeIndex].description}
              </p>
            </div>

            {/* Glassmorphism panel */}
            <div className="relative rounded-2xl border border-border/40 bg-card/40 p-3 shadow-xl shadow-primary/5 backdrop-blur-md sm:p-4">
              {/* Browser window */}
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/10 dark:shadow-black/30">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-border/50 bg-muted/60 px-4 py-2.5 backdrop-blur-sm">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-md border border-border/50 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                    <Monitor className="h-3 w-3 shrink-0" />
                    <span>cvgenerator.app</span>
                  </div>
                </div>

                {/* Video area */}
                <div className="relative aspect-video overflow-hidden bg-muted/20">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        opacity: { duration: 0.3, ease: 'easeInOut' },
                        y: {
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1] as const,
                        },
                        scale: {
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1] as const,
                        },
                      }}
                      className="absolute inset-0"
                    >
                      <VideoPlayer
                        src={steps[activeIndex].video}
                        title={steps[activeIndex].title}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
