import { auth } from '@clerk/nextjs/server'
import { SmoothScrollProvider } from '@/components/smooth-scroll-provider'
import { LandingHeader } from '@/components/landing/landing-header'
import { HeroSection } from '@/components/landing/hero-section'
import { BenefitsSection } from '@/components/landing/benefits-section'
import { ScreenshotsSection } from '@/components/landing/screenshots-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { InspirationSection } from '@/components/landing/inspiration-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ScrollProgress } from '@/components/landing/scroll-progress'
import { FloatingCta } from '@/components/landing/floating-cta'

export default async function LandingPage() {
  const { userId } = await auth()
  const isAuthenticated = !!userId

  return (
    <SmoothScrollProvider>
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <BenefitsSection />
        <ScreenshotsSection />
        <HowItWorksSection />
        <InspirationSection />
        <FeaturesSection />
      </main>
      <LandingFooter />
      <FloatingCta isAuthenticated={isAuthenticated} />
    </div>
    </SmoothScrollProvider>
  )
}
