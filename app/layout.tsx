import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'AI CV Generator — CVs profesionales con IA en minutos',
    template: '%s | AI CV Generator',
  },
  description:
    'Genera CVs optimizados para ATS con inteligencia artificial. Pega la oferta laboral y obtén un CV personalizado, almacenado localmente en tu browser. Privado, rápido y gratuito.',
  keywords: [
    'CV generator',
    'generador de CV',
    'CV con IA',
    'curriculum vitae',
    'ATS',
    'inteligencia artificial',
    'postulaciones laborales',
  ],
  authors: [{ name: 'AI CV Generator' }],
  creator: 'AI CV Generator',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://cvgenerator.app',
    siteName: 'AI CV Generator',
    title: 'AI CV Generator — CVs profesionales con IA en minutos',
    description:
      'Genera CVs optimizados para ATS con IA. Pega la oferta laboral y obtén tu CV personalizado al instante. Privado y local.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI CV Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI CV Generator — CVs profesionales con IA en minutos',
    description:
      'Genera CVs optimizados para ATS con IA. Privado y local — tus datos nunca salen de tu navegador.',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SmoothScrollProvider>
              {children}
              <Toaster />
            </SmoothScrollProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
