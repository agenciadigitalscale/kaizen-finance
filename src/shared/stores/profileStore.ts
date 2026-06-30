import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type HouseholdMode = 'solo' | 'family'

export interface FamilyMember {
  id:    string
  name:  string
  role:  'owner' | 'partner'
  color: string
}

interface ProfileState {
  mode:          HouseholdMode
  monthlyIncome: number          // centavos
  members:       FamilyMember[]
  setMode:        (m: HouseholdMode) => void
  setMonthlyIncome: (cents: number) => void
  addMember:      (name: string) => void
  removeMember:   (id: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      mode: 'solo',
      monthlyIncome: 0,
      members: [],

      setMode: (mode) => set({ mode }),
      setMonthlyIncome: (cents) => set({ monthlyIncome: cents }),
      addMember: (name) => set(s => ({
        members: [...s.members, { id: crypto.randomUUID(), name: name.trim(), role: 'partner', color: '#3B82F6' }],
        mode: 'family',
      })),
      removeMember: (id) => set(s => ({ members: s.members.filter(m => m.id !== id) })),
    }),
    { name: 'kz-profile' }
  )
)
