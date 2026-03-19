'use client'

import { Heart, Lock, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

export function InspirationSection() {
  return (
    <section className="border-t border-border/50 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Inspiration */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="h-full"
            >
              <Card className="h-full border-border/50 bg-background/60 transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10"
                  >
                    <Heart className="h-6 w-6 text-pink-500" />
                  </motion.div>
                  <h3 className="mb-3 text-xl font-semibold">Inspirado en los mejores</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Este proyecto nació inspirado en{' '}
                    <a
                      href="https://buildresume.work/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      buildresume.work
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    , una herramienta increíble para crear CVs. Tomamos esa idea
                    y la llevamos más allá con IA, seguimiento de postulaciones
                    y la filosofía de que tus datos son solo tuyos.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="h-full"
            >
              <Card className="h-full border-border/50 bg-background/60 transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10"
                  >
                    <Lock className="h-6 w-6 text-green-500" />
                  </motion.div>
                  <h3 className="mb-3 text-xl font-semibold">Tus datos, en tu computadora</h3>
                  <p className="leading-relaxed text-muted-foreground">
                    Tu información nunca sale de tu navegador. No usamos servidores
                    para almacenar tus datos — todo queda guardado directamente en
                    tu computadora. Si borras los datos del navegador, se eliminan
                    por completo. Sin rastro, sin servidores, sin preocupaciones.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
