'use client'

import { useRef } from 'react'
import {
  GitFork,
  GitBranch,
  Code,
  GitCommitHorizontal,
  GitPullRequest,
  ExternalLink,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    icon: GitFork,
    title: 'Fork del repositorio',
    description: 'Haz un fork del proyecto en GitHub para tener tu propia copia.',
  },
  {
    icon: GitBranch,
    title: 'Crea una rama',
    code: 'git checkout -b feature/nombre',
  },
  {
    icon: Code,
    title: 'Formatea el código',
    code: 'pnpm format',
  },
  {
    icon: GitCommitHorizontal,
    title: 'Commits semánticos',
    description: 'Usa prefijos como feat:, fix:, refactor:, docs: en tus mensajes de commit.',
  },
  {
    icon: GitPullRequest,
    title: 'Abre un Pull Request',
    description: 'Envía tus cambios para revisión y serán integrados al proyecto.',
  },
]

export function ContributingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const rotateCard = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -2])

  return (
    <section ref={sectionRef} className="border-t border-border/50 bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Contribuye al proyecto
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            CV Generator es open source. Cualquier contribución es bienvenida.
          </p>
        </motion.div>

        <motion.div
          style={{ rotateY: rotateCard }}
          className="mx-auto max-w-2xl perspective-[1000px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="border-border/50 bg-background/60 shadow-xl shadow-black/5 dark:shadow-black/20">
              <CardContent className="pt-6">
                <ol className="space-y-6">
                  {steps.map((step, i) => (
                    <motion.li
                      key={step.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="group flex items-start gap-4"
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        {i + 1}
                      </motion.div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2">
                          <step.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{step.title}</span>
                        </div>
                        {step.description && (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                        {step.code && (
                          <motion.code
                            whileHover={{ scale: 1.02 }}
                            className="mt-1.5 inline-block cursor-default rounded-md bg-muted px-3 py-1.5 text-sm font-mono transition-colors hover:bg-muted/80"
                          >
                            {step.code}
                          </motion.code>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ol>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 flex flex-col items-center gap-3 border-t border-border/50 pt-6 sm:flex-row sm:justify-center sm:gap-6"
                >
                  <motion.a
                    href="https://github.com/crisak/ai-cv-generator/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Guía completa de contribución
                    <ExternalLink className="h-3.5 w-3.5" />
                  </motion.a>
                  <motion.a
                    href="https://github.com/crisak/ai-cv-generator"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Ver repositorio en GitHub
                    <ExternalLink className="h-3.5 w-3.5" />
                  </motion.a>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
