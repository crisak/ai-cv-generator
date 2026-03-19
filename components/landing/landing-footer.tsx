'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'
import { motion } from 'framer-motion'
import { Separator } from '@/components/ui/separator'

export function LandingFooter() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-border/50"
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Image
              src="/images/logo-white.png"
              alt="AI CV Generator"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span>AI CV Generator &copy; {new Date().getFullYear()} · MPL-2.0</span>
          </motion.div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <motion.a
              href="https://github.com/crisak/ai-cv-generator"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, color: 'hsl(var(--foreground))' }}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </motion.a>
            <Separator orientation="vertical" className="h-4" />
            <Link href="/login" className="transition-colors hover:text-foreground">
              Iniciar sesión
            </Link>
            <Link href="/sign-up" className="transition-colors hover:text-foreground">
              Registrarse
            </Link>
          </nav>
        </div>
      </div>
    </motion.footer>
  )
}
