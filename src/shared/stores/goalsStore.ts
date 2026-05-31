import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Goal } from '@/types'
import { KZ } from '@/theme'
import { api } from '@/shared/lib/api'
import { mapGoal } from '@/shared/lib/mappers'
import { getIsDemo, getHouseholdId } from '@/features/auth/authStore'

const INITIAL: Goal[] = [
  { id: '1', householdId: 'h1', name: 'Fundo de Emergência', type: 'emergency_fund', targetAmount: 2400000, currentAmount: 820000, targetDate: '2026-12-31', monthlyContribution: 100000, icon: '🛡️', color: KZ.green, status: 'active', notes: '6 meses de despesas', createdAt: 0 },
  { id: '2', householdId: 'h1', name: 'Viagem à Europa', type: 'savings', targetAmount: 1500000, currentAmount: 340000, targetDate: '2027-07-01', monthlyContribution: 80000, icon: '✈️', color: KZ.gold, status: 'active', notes: 'Itália + Portugal + Espanha', createdAt: 0 },
  { id: '3', householdId: 'h1', name: 'Trocar de Carro', type: 'purchase', targetAmount: 8000000, currentAmount: 1200000, targetDate: '2028-01-01', monthlyContribution: 200000, icon: '🚗', color: KZ.blue, status: 'active', notes: 'Honda Civic ou Corolla', createdAt: 0 },
  { id: '4', householdId: 'h1', name: 'Notebook novo', type: 'purchase', targetAmount: 800000, currentAmount: 800000, targetDate: '2026-03-01', monthlyContribution: 0, icon: '💻', color: '#8B5CF6', status: 'completed', createdAt: 0 },
  { id: '5', householdId: 'h1', name: 'Pagar financiamento', type: 'debt_payoff', targetAmount: 3600000, currentAmount: 900000, targetDate: '2029-01-01', monthlyContribution: 75000, icon: '🏦', color: KZ.red, status: 'paused', createdAt: 0 },
]

interface GoalsState {
  goals:          Goal[]
  init:           () => Promise<void>
  addGoal:        (data: Partial<Goal>) => void
  updateGoal:     (id: string, data: Partial<Goal>) => void
  deleteGoal:     (id: string) => void
  toggleGoal:     (id: string) => void
  contributeGoal: (id: string, amount: number) => void
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: INITIAL,

      init: async () => {
        if (getIsDemo()) return
        try {
          const res = await api.goals.list() as { ok: boolean; data: unknown[] }
          if (res?.ok) set({ goals: res.data.map(r => mapGoal(r as Record<string, unknown>)) })
        } catch (e) { console.error('[goals] init:', e) }
      },

      addGoal: (data) => {
        const tempId = crypto.randomUUID()
        const goal: Goal = {
          name: '', type: 'savings', targetAmount: 0, currentAmount: 0,
          monthlyContribution: 0, icon: '🎯', color: KZ.green, status: 'active',
          ...data,
          id: tempId, householdId: getHouseholdId(), createdAt: Date.now(),
        }
        set(s => ({ goals: [...s.goals, goal] }))
        if (!getIsDemo()) {
          api.goals.create(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ goals: s.goals.map(g => g.id === tempId ? { ...g, id: r.data.id } : g) }))
              else
                set(s => ({ goals: s.goals.filter(g => g.id !== tempId) }))
            })
            .catch(() => set(s => ({ goals: s.goals.filter(g => g.id !== tempId) })))
        }
      },

      updateGoal: (id, data) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g) }))
        if (!getIsDemo()) api.goals.update(id, data).catch(console.error)
      },

      deleteGoal: (id) => {
        set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
        if (!getIsDemo()) api.goals.delete(id).catch(console.error)
      },

      toggleGoal: (id) => {
        set(s => ({
          goals: s.goals.map(g => {
            if (g.id !== id) return g
            const newStatus = g.status === 'paused' ? 'active' : 'paused'
            if (!getIsDemo()) api.goals.update(id, { status: newStatus }).catch(console.error)
            return { ...g, status: newStatus }
          }),
        }))
      },

      contributeGoal: (id, amount) => {
        set(s => ({
          goals: s.goals.map(g => {
            if (g.id !== id) return g
            const newAmount = g.currentAmount + amount
            const newStatus = newAmount >= g.targetAmount ? 'completed' : g.status
            const data = { currentAmount: newAmount, status: newStatus }
            if (!getIsDemo()) api.goals.update(id, data).catch(console.error)
            return { ...g, ...data }
          }),
        }))
      },
    }),
    { name: 'kz-goals' }
  )
)
