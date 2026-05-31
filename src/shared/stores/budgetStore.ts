import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/shared/lib/api'
import { getIsDemo } from '@/features/auth/authStore'
import { DEFAULT_CATEGORIES } from '@/types'

export interface BudgetItem {
  categoryId: string
  planned:    number
  spent:      number
}

const DEFAULT_BUDGET: BudgetItem[] = DEFAULT_CATEGORIES
  .filter((c, i, arr) => arr.findIndex(x => x.group === c.group) === i) // unique groups
  .filter(c => c.type === 'expense')
  .map(c => ({ categoryId: c.group, planned: 0, spent: 0 }))

const INITIAL: BudgetItem[] = [
  { categoryId: 'moradia',      planned: 220000, spent: 180000 },
  { categoryId: 'alimentacao',  planned: 150000, spent: 99000  },
  { categoryId: 'transporte',   planned:  80000, spent: 37000  },
  { categoryId: 'saude',        planned:  60000, spent: 18700  },
  { categoryId: 'educacao',     planned:  40000, spent: 0      },
  { categoryId: 'lazer',        planned:  50000, spent: 62000  },
  { categoryId: 'assinatura',   planned:  30000, spent: 26670  },
  { categoryId: 'roupas',       planned:  35000, spent: 0      },
  { categoryId: 'negocio',      planned:  20000, spent: 8000   },
  { categoryId: 'outros',       planned:  25000, spent: 14000  },
]

interface BudgetState {
  budgets:      BudgetItem[]
  init:         (month?: string) => Promise<void>
  updateBudget: (categoryId: string, planned: number, month?: string) => void
  addSpending:  (categoryId: string, amount: number) => void
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      budgets: INITIAL,

      init: async (month) => {
        if (getIsDemo()) return
        const m = month ?? new Date().toISOString().slice(0, 7)
        try {
          const res = await api.budgets.list(m) as { ok: boolean; data: { category_id: string; amount: number; spent: number }[] }
          if (res?.ok) {
            if (res.data.length === 0) {
              // New user: show all categories at 0
              set({ budgets: DEFAULT_BUDGET })
            } else {
              // Merge API data with full category list (fill missing with 0)
              const apiMap = Object.fromEntries(res.data.map(r => [r.category_id, { planned: r.amount, spent: r.spent }]))
              const budgets = DEFAULT_BUDGET.map(b => ({
                categoryId: b.categoryId,
                planned: apiMap[b.categoryId]?.planned ?? 0,
                spent:   apiMap[b.categoryId]?.spent   ?? 0,
              }))
              set({ budgets })
            }
          }
        } catch (e) { console.error('[budget] init:', e) }
      },

      updateBudget: (categoryId, planned, month) => {
        set(s => ({ budgets: s.budgets.map(b => b.categoryId === categoryId ? { ...b, planned } : b) }))
        if (!getIsDemo()) {
          const m = month ?? new Date().toISOString().slice(0, 7)
          api.budgets.upsert({ categoryId, month: m, amount: planned }).catch(console.error)
        }
      },

      addSpending: (categoryId, amount) =>
        set(s => ({ budgets: s.budgets.map(b => b.categoryId === categoryId ? { ...b, spent: b.spent + amount } : b) })),
    }),
    { name: 'kz-budget' }
  )
)
