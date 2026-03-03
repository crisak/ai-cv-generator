import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { verifyCredentials } from '@/lib/auth'

interface AuthState {
  isAuthenticated: boolean
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      login: (email, password) => {
        const valid = verifyCredentials(email, password)
        if (valid) set({ isAuthenticated: true })
        return valid
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'cv-auth',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
