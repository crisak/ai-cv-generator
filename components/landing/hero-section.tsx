'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Shield, ArrowRight, ChevronDown } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -50])

  function scrollToHowItWorks() {
    document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <motion.div
        style={{ y: backgroundY }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </motion.div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40"
      >
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Privacy badge */}
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="mb-6 gap-2 border border-border/50 px-4 py-1.5 text-sm font-medium shadow-sm"
            >
              <Shield className="h-3.5 w-3.5" />
              Tus datos se guardan solo en tu navegador
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Genera CVs perfectos para cada oferta laboral{' '}
            <span className="relative inline-block text-primary">
              en minutos
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-primary/30"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Pega la oferta de trabajo y deja que la IA cree un CV optimizado que
            destaque tus fortalezas. Gratis, open source y sin necesidad de
            servidor.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            {isAuthenticated ? (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="lg" className="gap-2 text-base shadow-lg shadow-primary/25">
                  <Link href="/applications">
                    Ir a la app
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button asChild size="lg" className="gap-2 text-base shadow-lg shadow-primary/25">
                  <Link href="/sign-up">
                    Comenzar ahora
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base"
                onClick={scrollToHowItWorks}
              >
                Ver cómo funciona
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
