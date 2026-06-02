import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  email: string
  name: string
  color?: string
}

interface AuthHousehold {
  id: string
  name: string
}

interface AuthState {
  user:        AuthUser | null
  household:   AuthHousehold | null
  role:        string
  accessToken: string | null   // NÃO persistido — XSS protection

  setAuth: (user: AuthUser, household: AuthHousehold, role: string, token: string) => void
  setToken: (token: string) => void
  logout:  () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      household:   null,
      role:        '',
      accessToken: null,

      setAuth: (user, household, role, token) =>
        set({ user, household, role, accessToken: token }),

      setToken: (token) => set({ accessToken: token }),

      logout: () => set({ user: null, household: null, role: '', accessToken: null }),
    }),
    {
      name: 'kz-auth',
      // Persiste só user/household/role — token sempre em memória
      partialize: (s) => ({ user: s.user, household: s.household, role: s.role }),
    }
  )
)

export const useUser      = () => useAuthStore(s => s.user)
export const useHousehold = () => useAuthStore(s => s.household)
export const useRole      = () => useAuthStore(s => s.role)
export const useToken     = () => useAuthStore(s => s.accessToken)
export const useIsOwner   = () => useAuthStore(s => s.role === 'owner')

// Demo mode: no real backend, uses local store data only
export const useIsDemo    = () => useAuthStore(s => s.accessToken === 'demo-token')

// Helper for stores (non-hook, callable outside React)
export const getIsDemo    = () => useAuthStore.getState().accessToken === 'demo-token'
export const getHouseholdId = () => useAuthStore.getState().household?.id ?? 'h1'
export const getUserId      = () => useAuthStore.getState().user?.id ?? 'u1'
