import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Asset, Liability } from '@/types'
import { api } from '@/shared/lib/api'
import { mapAsset, mapLiability } from '@/shared/lib/mappers'
import { getIsDemo, getHouseholdId } from '@/features/auth/authStore'

const INITIAL_ASSETS: Asset[] = [
  { id: '1', householdId: 'h1', name: 'Apartamento', type: 'real_estate', currentValue: 55000000, purchaseValue: 48000000, purchaseDate: '2020-03-15', notes: 'Apartamento 2 quartos', updatedAt: Date.now(), createdAt: 0 },
  { id: '2', householdId: 'h1', name: 'Corsa Sedan', type: 'vehicle', currentValue: 3800000, purchaseValue: 4200000, purchaseDate: '2022-07-01', updatedAt: Date.now(), createdAt: 0 },
  { id: '3', householdId: 'h1', name: 'Carteira de Ações', type: 'investment', currentValue: 4200000, purchaseValue: 3500000, notes: 'ITSA4, PETR4, VALE3', updatedAt: Date.now(), createdAt: 0 },
  { id: '4', householdId: 'h1', name: 'Tesouro Direto', type: 'savings', currentValue: 1850000, purchaseValue: 1600000, updatedAt: Date.now(), createdAt: 0 },
  { id: '5', householdId: 'h1', name: 'Poupança', type: 'savings', currentValue: 820000, updatedAt: Date.now(), createdAt: 0 },
]

const INITIAL_LIABILITIES: Liability[] = [
  { id: '1', householdId: 'h1', name: 'Financiamento Imóvel', totalAmount: 28000000, remainingAmount: 22400000, monthlyPayment: 280000, interestRate: 0.65, creditor: 'Caixa Econômica', createdAt: 0 },
  { id: '2', householdId: 'h1', name: 'Financiamento Carro', totalAmount: 5000000, remainingAmount: 3600000, monthlyPayment: 75000, interestRate: 1.2, creditor: 'Bradesco', createdAt: 0 },
  { id: '3', householdId: 'h1', name: 'Cartão de Crédito', totalAmount: 125000, remainingAmount: 125000, monthlyPayment: 125000, creditor: 'Nubank', createdAt: 0 },
]

interface PatrimonyState {
  assets:           Asset[]
  liabilities:      Liability[]
  init:             () => Promise<void>
  addAsset:         (data: Partial<Asset>) => void
  updateAsset:      (id: string, data: Partial<Asset>) => void
  deleteAsset:      (id: string) => void
  addLiability:     (data: Partial<Liability>) => void
  updateLiability:  (id: string, data: Partial<Liability>) => void
  deleteLiability:  (id: string) => void
}

export const usePatrimonyStore = create<PatrimonyState>()(
  persist(
    (set) => ({
      assets:      INITIAL_ASSETS,
      liabilities: INITIAL_LIABILITIES,

      init: async () => {
        if (getIsDemo()) return
        try {
          const res = await api.patrimony.list() as { ok: boolean; data: { assets: unknown[]; liabilities: unknown[] } }
          if (res?.ok) set({
            assets:      res.data.assets.map(r => mapAsset(r as Record<string, unknown>)),
            liabilities: res.data.liabilities.map(r => mapLiability(r as Record<string, unknown>)),
          })
        } catch (e) { console.error('[patrimony] init:', e) }
      },

      addAsset: (data) => {
        const tempId = crypto.randomUUID()
        const asset: Asset = {
          name: '', type: 'investment', currentValue: 0,
          ...data,
          id: tempId, householdId: getHouseholdId(), updatedAt: Date.now(), createdAt: Date.now(),
        }
        set(s => ({ assets: [...s.assets, asset] }))
        if (!getIsDemo()) {
          api.patrimony.createAsset(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ assets: s.assets.map(a => a.id === tempId ? { ...a, id: r.data.id } : a) }))
              else
                set(s => ({ assets: s.assets.filter(a => a.id !== tempId) }))
            })
            .catch(() => set(s => ({ assets: s.assets.filter(a => a.id !== tempId) })))
        }
      },

      updateAsset: (id, data) => {
        set(s => ({ assets: s.assets.map(a => a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a) }))
        if (!getIsDemo()) api.patrimony.updateAsset(id, data).catch(console.error)
      },

      deleteAsset: (id) => {
        set(s => ({ assets: s.assets.filter(a => a.id !== id) }))
        if (!getIsDemo()) api.patrimony.deleteAsset(id).catch(console.error)
      },

      addLiability: (data) => {
        const tempId = crypto.randomUUID()
        const liability: Liability = {
          name: '', totalAmount: 0, remainingAmount: 0, monthlyPayment: 0, creditor: '',
          ...data,
          id: tempId, householdId: getHouseholdId(), createdAt: Date.now(),
        }
        set(s => ({ liabilities: [...s.liabilities, liability] }))
        if (!getIsDemo()) {
          api.patrimony.createLiability(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ liabilities: s.liabilities.map(l => l.id === tempId ? { ...l, id: r.data.id } : l) }))
              else
                set(s => ({ liabilities: s.liabilities.filter(l => l.id !== tempId) }))
            })
            .catch(() => set(s => ({ liabilities: s.liabilities.filter(l => l.id !== tempId) })))
        }
      },

      updateLiability: (id, data) => {
        set(s => ({ liabilities: s.liabilities.map(l => l.id === id ? { ...l, ...data } : l) }))
        if (!getIsDemo()) api.patrimony.updateLiability(id, data).catch(console.error)
      },

      deleteLiability: (id) => {
        set(s => ({ liabilities: s.liabilities.filter(l => l.id !== id) }))
        if (!getIsDemo()) api.patrimony.deleteLiability(id).catch(console.error)
      },
    }),
    { name: 'kz-patrimony' }
  )
)
