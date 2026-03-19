'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function FloatingCta({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
  const y = useTransform(scrollYProgress, [0, 0.15], [20, 0])

  return (
    <motion.div
      style={{ opacity, y }}
      className="fixed bottom-6 right-6 z-50 hidden sm:block"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Button
          asChild
          size="lg"
          className="gap-2 rounded-full shadow-lg shadow-primary/30"
        >
          <Link href={isAuthenticated ? '/applications' : '/sign-up'}>
            {isAuthenticated ? 'Ir a la app' : 'Comenzar ahora'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  )
}
