import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, AccountType } from '@/types'
import { api } from '@/shared/lib/api'
import { mapAccount } from '@/shared/lib/mappers'
import { getIsDemo, getHouseholdId } from '@/features/auth/authStore'

const INITIAL_ACCOUNTS: Account[] = [
  { id: 'a1', householdId: 'h1', name: 'Conta Principal', type: 'checking', bank: 'Nubank', balance: 850000, color: '#8B5CF6', icon: '🏦', isShared: true, createdAt: 0 },
  { id: 'a2', householdId: 'h1', name: 'Cartão Nubank', type: 'credit_card', bank: 'Nubank', balance: -125000, creditLimit: 800000, closingDay: 8, dueDay: 15, color: '#8B5CF6', icon: '💳', isShared: false, ownerId: 'u1', createdAt: 0 },
  { id: 'a3', householdId: 'h1', name: 'Poupança', type: 'savings', bank: 'Itaú', balance: 820000, color: '#10B981', icon: '🐷', isShared: true, createdAt: 0 },
  { id: 'a4', householdId: 'h1', name: 'Carteira Investimentos', type: 'investment', bank: 'XP Investimentos', balance: 4200000, color: '#F59E0B', icon: '📈', isShared: true, createdAt: 0 },
  { id: 'a5', householdId: 'h1', name: 'Dinheiro em Carteira', type: 'cash', balance: 35000, color: '#6B7280', icon: '💵', isShared: false, ownerId: 'u1', createdAt: 0 },
]

interface AccountsState {
  accounts:      Account[]
  init:          () => Promise<void>
  addAccount:    (data: Omit<Account, 'id' | 'householdId' | 'createdAt'>) => void
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void
  updateBalance: (id: string, delta: number) => void
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: INITIAL_ACCOUNTS,

      init: async () => {
        if (getIsDemo()) return
        try {
          const res = await api.accounts.list() as { ok: boolean; data: unknown[] }
          if (res?.ok) set({ accounts: res.data.map(r => mapAccount(r as Record<string, unknown>)) })
        } catch (e) { console.error('[accounts] init:', e) }
      },

      addAccount: (data) => {
        const tempId = crypto.randomUUID()
        const account: Account = { ...data, id: tempId, householdId: getHouseholdId(), createdAt: Date.now() }
        set(s => ({ accounts: [...s.accounts, account] }))
        if (!getIsDemo()) {
          api.accounts.create(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ accounts: s.accounts.map(a => a.id === tempId ? { ...a, id: r.data.id } : a) }))
              else
                set(s => ({ accounts: s.accounts.filter(a => a.id !== tempId) }))
            })
            .catch(() => set(s => ({ accounts: s.accounts.filter(a => a.id !== tempId) })))
        }
      },

      updateAccount: (id, data) => {
        set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a) }))
        if (!getIsDemo()) api.accounts.update(id, data).catch(console.error)
      },

      deleteAccount: (id) => {
        set(s => ({ accounts: s.accounts.filter(a => a.id !== id) }))
        if (!getIsDemo()) api.accounts.delete(id).catch(console.error)
      },

      updateBalance: (id, delta) =>
        set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, balance: a.balance + delta } : a) })),
    }),
    { name: 'kz-accounts' }
  )
)

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente', savings: 'Poupança', investment: 'Investimentos',
  credit_card: 'Cartão de crédito', cash: 'Dinheiro/Carteira', wallet: 'Carteira digital',
}

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  checking: '🏦', savings: '🐷', investment: '📈',
  credit_card: '💳', cash: '💵', wallet: '📱',
}
