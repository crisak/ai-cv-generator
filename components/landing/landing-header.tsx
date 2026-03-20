'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Moon, Sun, LogIn, UserPlus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <motion.header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Image
              src="/images/logo-white.png"
              alt="AI CV Generator"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </motion.div>
          <span className="hidden font-semibold tracking-tight transition-colors group-hover:text-primary xs:inline">
            AI CV Generator
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}

          {isAuthenticated ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="sm">
                <Link href="/applications">Ir a la app</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden xs:flex">
                <Link href="/login" className="flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="flex xs:hidden">
                <Link href="/login" aria-label="Iniciar sesión">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="sm">
                  <Link href="/sign-up" className="flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Registrarse</span>
                  </Link>
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.header>
  )
}
