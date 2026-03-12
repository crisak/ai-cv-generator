import { SignUp } from '@clerk/nextjs'
import { FileText } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">CV Generator</h1>
            <p className="text-sm text-muted-foreground">
              Genera CVs optimizados para cada oferta laboral
            </p>
          </div>
        </div>

        <SignUp
          forceRedirectUrl="/applications"
          appearance={{
            variables: {
              colorPrimary: '#1877F2',
              borderRadius: '0.5rem',
            },
            elements: {
              card: 'shadow-lg border border-border/50 bg-card',
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
            },
          }}
        />
      </div>
    </div>
  )
}
