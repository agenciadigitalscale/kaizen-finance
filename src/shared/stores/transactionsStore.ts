import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '@/types'
import { api } from '@/shared/lib/api'
import { mapTransaction } from '@/shared/lib/mappers'
import { getIsDemo, getHouseholdId, getUserId } from '@/features/auth/authStore'

const INITIAL: Transaction[] = [
  { id: '1',  householdId: 'h1', userId: 'u1', type: 'income',   amount: 850000, description: 'Salário',            categoryId: 'receita',      accountId: 'a1', date: '2026-06-01', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '2',  householdId: 'h1', userId: 'u1', type: 'income',   amount: 125000, description: 'Freelance design',   categoryId: 'receita',      accountId: 'a1', date: '2026-06-03', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '3',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 38000,  description: 'Supermercado',       categoryId: 'alimentacao',  accountId: 'a2', date: '2026-06-04', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '4',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 11990,  description: 'Netflix',            categoryId: 'assinatura',   accountId: 'a2', date: '2026-06-05', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '5',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 65000,  description: 'Conta de luz',       categoryId: 'moradia',      accountId: 'a1', date: '2026-06-06', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '6',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 25000,  description: 'Gasolina',           categoryId: 'transporte',   accountId: 'a2', date: '2026-06-07', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '7',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 18000,  description: 'Restaurante',        categoryId: 'alimentacao',  accountId: 'a2', date: '2026-06-08', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '8',  householdId: 'h1', userId: 'u1', type: 'expense',  amount: 89000,  description: 'Farmácia',           categoryId: 'saude',        accountId: 'a2', date: '2026-06-09', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '9',  householdId: 'h1', userId: 'u1', type: 'income',   amount: 45000,  description: 'Dividendos ITSA4',   categoryId: 'investimento', accountId: 'a1', date: '2026-06-10', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '10', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 12000,  description: 'Uber',               categoryId: 'transporte',   accountId: 'a2', date: '2026-06-11', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '11', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 55000,  description: 'Camiseta + shorts',  categoryId: 'roupas',       accountId: 'a2', date: '2026-06-12', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '12', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 8990,   description: 'Spotify',            categoryId: 'assinatura',   accountId: 'a2', date: '2026-06-12', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '13', householdId: 'h1', userId: 'u1', type: 'transfer', amount: 200000, description: 'Transferência poupança', categoryId: 'investimento', accountId: 'a1', toAccountId: 'a3', date: '2026-06-13', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '14', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 43000,  description: 'Mercado Extra',      categoryId: 'alimentacao',  accountId: 'a2', date: '2026-06-14', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '15', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 98000,  description: 'Plano de saúde',     categoryId: 'saude',        accountId: 'a1', date: '2026-06-15', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  // Maio
  { id: '16', householdId: 'h1', userId: 'u1', type: 'income',   amount: 850000, description: 'Salário',            categoryId: 'receita',      accountId: 'a1', date: '2026-05-01', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '17', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 420000, description: 'Aluguel',            categoryId: 'moradia',      accountId: 'a1', date: '2026-05-05', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '18', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 95000,  description: 'Mercado',            categoryId: 'alimentacao',  accountId: 'a2', date: '2026-05-10', status: 'confirmed', isRecurring: false, createdAt: 0 },
  { id: '19', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 11990,  description: 'Netflix',            categoryId: 'assinatura',   accountId: 'a2', date: '2026-05-15', status: 'confirmed', isRecurring: true,  createdAt: 0 },
  { id: '20', householdId: 'h1', userId: 'u1', type: 'expense',  amount: 8990,   description: 'Spotify',            categoryId: 'assinatura',   accountId: 'a2', date: '2026-05-20', status: 'confirmed', isRecurring: true,  createdAt: 0 },
]

interface TxState {
  transactions:      Transaction[]
  init:              () => Promise<void>
  addTransaction:    (data: Partial<Transaction>) => void
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
}

export const useTransactionsStore = create<TxState>()(
  persist(
    (set) => ({
      transactions: INITIAL,

      init: async () => {
        if (getIsDemo()) return
        try {
          // Load last 3 months
          const months: string[] = []
          for (let i = 0; i < 3; i++) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            months.push(d.toISOString().slice(0, 7))
          }
          const results = await Promise.all(months.map(m => api.transactions.list(m) as Promise<{ ok: boolean; data: unknown[] }>))
          const all: Transaction[] = []
          const seen = new Set<string>()
          for (const res of results) {
            if (res?.ok) {
              for (const r of res.data) {
                const tx = mapTransaction(r as Record<string, unknown>)
                if (!seen.has(tx.id)) { seen.add(tx.id); all.push(tx) }
              }
            }
          }
          set({ transactions: all })
        } catch (e) { console.error('[transactions] init:', e) }
      },

      addTransaction: (data) => {
        const tempId = crypto.randomUUID()
        const tx: Transaction = {
          type: 'expense', amount: 0, description: '', categoryId: 'outros',
          accountId: 'a1', date: new Date().toISOString().slice(0, 10),
          status: 'confirmed', isRecurring: false,
          ...data,
          id: tempId, householdId: getHouseholdId(), userId: getUserId(), createdAt: Date.now(),
        }
        set(s => ({ transactions: [tx, ...s.transactions] }))
        if (!getIsDemo()) {
          api.transactions.create(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ transactions: s.transactions.map(t => t.id === tempId ? { ...t, id: r.data.id } : t) }))
              else
                set(s => ({ transactions: s.transactions.filter(t => t.id !== tempId) }))
            })
            .catch(() => set(s => ({ transactions: s.transactions.filter(t => t.id !== tempId) })))
        }
      },

      updateTransaction: (id, data) => {
        set(s => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t) }))
        if (!getIsDemo()) api.transactions.update(id, data).catch(console.error)
      },

      deleteTransaction: (id) => {
        set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }))
        if (!getIsDemo()) api.transactions.delete(id).catch(console.error)
      },
    }),
    { name: 'kz-transactions' }
  )
)
