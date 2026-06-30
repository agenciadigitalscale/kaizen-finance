import { create } from 'zustand'
import type { TransactionType } from '@/types'

// Prefill opcional ao abrir o lançamento rápido (atalhos, voz, estados vazios)
export interface QuickLaunchPrefill {
  type?: TransactionType
  amount?: number          // centavos
  description?: string
  categoryId?: string
  date?: string            // YYYY-MM-DD
}

interface UiState {
  quickLaunchOpen: boolean
  quickLaunchPrefill: QuickLaunchPrefill | null
  openQuickLaunch: (prefill?: QuickLaunchPrefill) => void
  closeQuickLaunch: () => void

  moreOpen: boolean
  setMoreOpen: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  quickLaunchOpen: false,
  quickLaunchPrefill: null,
  openQuickLaunch: (prefill) => set({ quickLaunchOpen: true, quickLaunchPrefill: prefill ?? null }),
  closeQuickLaunch: () => set({ quickLaunchOpen: false, quickLaunchPrefill: null }),

  moreOpen: false,
  setMoreOpen: (v) => set({ moreOpen: v }),
}))
