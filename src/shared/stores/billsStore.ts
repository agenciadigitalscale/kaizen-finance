import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bill } from '@/types'
import { api } from '@/shared/lib/api'
import { mapBill } from '@/shared/lib/mappers'
import { getIsDemo, getHouseholdId } from '@/features/auth/authStore'

const INITIAL_BILLS: Bill[] = [
  { id: '1', householdId: 'h1', name: 'Aluguel', amount: 180000, dueDate: '2026-06-01', frequency: 'monthly', categoryId: 'moradia', status: 'pending', isShared: true, reminderDays: 3, whatsappAlert: true, whatsappNumber: '11999999999', createdAt: 0 },
  { id: '2', householdId: 'h1', name: 'Internet Vivo', amount: 11990, dueDate: '2026-06-05', frequency: 'monthly', categoryId: 'assinatura', status: 'pending', isShared: true, reminderDays: 2, whatsappAlert: false, createdAt: 0 },
  { id: '3', householdId: 'h1', name: 'Energia Elétrica', amount: 23400, dueDate: '2026-06-08', frequency: 'monthly', categoryId: 'moradia', status: 'pending', isShared: true, reminderDays: 3, whatsappAlert: false, createdAt: 0 },
  { id: '4', householdId: 'h1', name: 'Cartão Nubank', amount: 125000, dueDate: '2026-06-10', frequency: 'monthly', categoryId: 'outros', status: 'pending', isShared: false, reminderDays: 5, whatsappAlert: true, whatsappNumber: '11999999999', createdAt: 0 },
  { id: '5', householdId: 'h1', name: 'Netflix', amount: 5490, dueDate: '2026-06-15', frequency: 'monthly', categoryId: 'assinatura', status: 'pending', isShared: true, reminderDays: 1, whatsappAlert: false, createdAt: 0 },
  { id: '6', householdId: 'h1', name: 'Academia', amount: 8990, dueDate: '2026-06-18', frequency: 'monthly', categoryId: 'saude', status: 'pending', isShared: false, reminderDays: 3, whatsappAlert: false, createdAt: 0 },
  { id: '7', householdId: 'h1', name: 'Spotify', amount: 2190, dueDate: '2026-06-20', frequency: 'monthly', categoryId: 'assinatura', status: 'pending', isShared: false, reminderDays: 1, whatsappAlert: false, createdAt: 0 },
  { id: '8', householdId: 'h1', name: 'IPTU (parcela)', amount: 45000, dueDate: '2026-06-25', frequency: 'monthly', categoryId: 'moradia', status: 'pending', isShared: true, reminderDays: 7, whatsappAlert: true, whatsappNumber: '11999999999', createdAt: 0 },
  { id: '9', householdId: 'h1', name: 'Seguro Carro', amount: 32000, dueDate: '2026-07-05', frequency: 'monthly', categoryId: 'transporte', status: 'pending', isShared: false, reminderDays: 5, whatsappAlert: false, createdAt: 0 },
  { id: '10', householdId: 'h1', name: 'Plano de Saúde', amount: 98000, dueDate: '2026-07-10', frequency: 'monthly', categoryId: 'saude', status: 'paid', isShared: true, reminderDays: 5, whatsappAlert: false, paidAt: '2026-05-10', createdAt: 0 },
]

interface BillsState {
  bills:      Bill[]
  init:       () => Promise<void>
  addBill:    (data: Partial<Bill>) => void
  updateBill: (id: string, data: Partial<Bill>) => void
  deleteBill: (id: string) => void
  payBill:    (id: string) => void
}

export const useBillsStore = create<BillsState>()(
  persist(
    (set) => ({
      bills: INITIAL_BILLS,

      init: async () => {
        if (getIsDemo()) return
        try {
          const res = await api.bills.list() as { ok: boolean; data: unknown[] }
          if (res?.ok) set({ bills: res.data.map(r => mapBill(r as Record<string, unknown>)) })
        } catch (e) { console.error('[bills] init:', e) }
      },

      addBill: (data) => {
        const tempId = crypto.randomUUID()
        const bill: Bill = {
          name: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10),
          frequency: 'monthly', categoryId: 'outros', status: 'pending',
          isShared: false, reminderDays: 3, whatsappAlert: false,
          ...data,
          id: tempId, householdId: getHouseholdId(), createdAt: Date.now(),
        }
        set(s => ({ bills: [...s.bills, bill] }))
        if (!getIsDemo()) {
          api.bills.create(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id)
                set(s => ({ bills: s.bills.map(b => b.id === tempId ? { ...b, id: r.data.id } : b) }))
              else
                set(s => ({ bills: s.bills.filter(b => b.id !== tempId) }))
            })
            .catch(() => set(s => ({ bills: s.bills.filter(b => b.id !== tempId) })))
        }
      },

      updateBill: (id, data) => {
        set(s => ({ bills: s.bills.map(b => b.id === id ? { ...b, ...data } : b) }))
        if (!getIsDemo()) api.bills.update(id, data).catch(console.error)
      },

      deleteBill: (id) => {
        set(s => ({ bills: s.bills.filter(b => b.id !== id) }))
        if (!getIsDemo()) api.bills.delete(id).catch(console.error)
      },

      payBill: (id) => {
        const today = new Date().toISOString().slice(0, 10)
        set(s => ({
          bills: s.bills.map(b => b.id === id ? { ...b, status: 'paid', paidAt: today } : b),
        }))
        if (!getIsDemo()) api.bills.pay(id).catch(console.error)
      },
    }),
    { name: 'kz-bills' }
  )
)
