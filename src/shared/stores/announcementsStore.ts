import { create } from 'zustand'
import { api } from '@/shared/lib/api'
import { getIsDemo } from '@/features/auth/authStore'

export interface Announcement {
  id: string
  title: string
  body: string
  created_at: number
  read: boolean
}

interface AnnouncementsState {
  items:   Announcement[]
  unread:  number
  isAdmin: boolean
  init:      () => Promise<void>
  markAllRead: () => void
  create:    (title: string, body: string) => Promise<boolean>
}

const DEMO: Announcement[] = [
  { id: 'demo1', title: '🎉 Bem-vindo ao Kaizen Finance!', body: 'Seu copiloto financeiro está no ar. Lance gastos por voz segurando o botão Lançar e acompanhe sua previsão de caixa.', created_at: Date.now(), read: false },
]

export const useAnnouncementsStore = create<AnnouncementsState>((set, get) => ({
  items: [],
  unread: 0,
  isAdmin: false,

  init: async () => {
    if (getIsDemo()) { set({ items: DEMO, unread: 1, isAdmin: false }); return }
    try {
      const res = await api.announcements.list() as { ok: boolean; data?: { items: Announcement[]; unread: number; isAdmin: boolean } }
      if (res?.ok && res.data) set({ items: res.data.items, unread: res.data.unread, isAdmin: res.data.isAdmin })
    } catch (e) { console.error('[announcements] init:', e) }
  },

  markAllRead: () => {
    set(s => ({ items: s.items.map(a => ({ ...a, read: true })), unread: 0 }))
    if (!getIsDemo()) api.announcements.markRead().catch(console.error)
  },

  create: async (title, body) => {
    if (getIsDemo()) return false
    try {
      const res = await api.announcements.create(title, body) as { ok: boolean }
      if (res?.ok) { await get().init(); return true }
      return false
    } catch { return false }
  },
}))
