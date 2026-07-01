import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_CATEGORIES } from '@/types'
import { api } from '@/shared/lib/api'
import { getIsDemo } from '@/features/auth/authStore'

export interface AppCategory {
  id:    string          // built-in: o próprio grupo; personalizada: uuid do banco
  name:  string
  type:  'income' | 'expense'
  group: string
  icon:  string
  color: string
  custom?: boolean
}

// Categorias embutidas (deduplicadas por grupo — id = grupo)
const BUILT_IN: AppCategory[] = (() => {
  const seen = new Set<string>()
  const out: AppCategory[] = []
  for (const c of DEFAULT_CATEGORIES) {
    if (seen.has(c.group)) continue
    seen.add(c.group)
    out.push({ id: c.group, name: c.name, type: c.type, group: c.group, icon: c.icon, color: c.color })
  }
  return out
})()

interface CategoriesState {
  custom: AppCategory[]
  init:   () => Promise<void>
  addCategory:    (data: Omit<AppCategory, 'id' | 'custom'>) => void
  updateCategory: (id: string, data: Partial<AppCategory>) => void
  deleteCategory: (id: string) => void
}

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set) => ({
      custom: [],

      init: async () => {
        if (getIsDemo()) return
        try {
          const res = await api.categories.list() as { ok: boolean; data: { id: string; name: string; type: 'income' | 'expense'; grp: string; icon: string; color: string }[] }
          if (res?.ok) set({ custom: res.data.map(r => ({ id: r.id, name: r.name, type: r.type, group: r.grp, icon: r.icon, color: r.color, custom: true })) })
        } catch (e) { console.error('[categories] init:', e) }
      },

      addCategory: (data) => {
        const tempId = crypto.randomUUID()
        set(s => ({ custom: [...s.custom, { ...data, id: tempId, custom: true }] }))
        if (!getIsDemo()) {
          api.categories.create(data)
            .then((res: unknown) => {
              const r = res as { ok: boolean; data: { id: string } }
              if (r?.ok && r.data?.id) set(s => ({ custom: s.custom.map(c => c.id === tempId ? { ...c, id: r.data.id } : c) }))
              else set(s => ({ custom: s.custom.filter(c => c.id !== tempId) }))
            })
            .catch(() => set(s => ({ custom: s.custom.filter(c => c.id !== tempId) })))
        }
      },

      updateCategory: (id, data) => {
        set(s => ({ custom: s.custom.map(c => c.id === id ? { ...c, ...data } : c) }))
        if (!getIsDemo()) api.categories.update(id, data).catch(console.error)
      },

      deleteCategory: (id) => {
        set(s => ({ custom: s.custom.filter(c => c.id !== id) }))
        if (!getIsDemo()) api.categories.delete(id).catch(console.error)
      },
    }),
    { name: 'kz-categories' }
  )
)

// Lista completa (built-in + personalizadas) — hook para uso em componentes
export function useAllCategories(type?: 'income' | 'expense'): AppCategory[] {
  const custom = useCategoriesStore(s => s.custom)
  const all = [...BUILT_IN, ...custom]
  return type ? all.filter(c => c.type === type) : all
}

// Metadados de qualquer categoria por id — não-hook (uso em código de exibição)
export function getCategoryMeta(id: string): { name: string; icon: string; color: string } {
  const custom = useCategoriesStore.getState().custom
  const found = BUILT_IN.find(c => c.id === id) ?? custom.find(c => c.id === id)
  if (found) return { name: found.name, icon: found.icon, color: found.color }
  // fallback para grupos conhecidos sem entrada única, senão genérico
  return { name: id.charAt(0).toUpperCase() + id.slice(1), icon: '📦', color: '#6B7280' }
}
