import { useAuthStore } from '@/features/auth/authStore'

// No app nativo (Capacitor) o front roda em localhost/capacitor:// — a API precisa
// apontar para o backend de produção. Na web, base vazia = mesma origem (relativo).
const isNative = typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:' ||
   (window.location.hostname === 'localhost' && window.location.port === ''))
export const API_BASE = isNative ? 'https://kaizen-43x.pages.dev' : ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken

  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    const refresh = await fetch(API_BASE + '/api/auth/refresh', { method: 'POST', credentials: 'include' })
    const rd = await refresh.json() as { ok: boolean; data?: { accessToken: string } }
    if (rd.ok && rd.data?.accessToken) {
      useAuthStore.getState().setToken(rd.data.accessToken)
      const retry = await fetch(API_BASE + url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rd.data.accessToken}`,
          ...options?.headers,
        },
        credentials: 'include',
      })
      return retry.json() as Promise<T>
    }
    useAuthStore.getState().logout()
    throw new Error('UNAUTHORIZED')
  }

  return res.json() as Promise<T>
}

export const api = {
  auth: {
    login:   (email: string, password: string) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup:  (data: { name: string; email: string; password: string; householdName: string }) =>
      request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    logout:  () => request('/api/auth/logout', { method: 'POST' }),
    refresh: () => request('/api/auth/refresh', { method: 'POST' }),
    forgot:  (email: string) => request('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
    reset:   (token: string, password: string) => request('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },

  dashboard: {
    get: () => request('/api/dashboard'),
  },

  transactions: {
    list:   (month?: string) => request(`/api/transactions${month ? `?month=${month}` : ''}`),
    create: (data: unknown)  => request('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/api/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)     => request(`/api/transactions/${id}`, { method: 'DELETE' }),
  },

  bills: {
    list:   () => request('/api/bills'),
    create: (data: unknown) => request('/api/bills', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/api/bills/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    pay:    (id: string)    => request(`/api/bills/${id}/pay`, { method: 'POST' }),
    delete: (id: string)    => request(`/api/bills/${id}`, { method: 'DELETE' }),
  },

  accounts: {
    list:   () => request('/api/accounts'),
    create: (data: unknown) => request('/api/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/api/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)    => request(`/api/accounts/${id}`, { method: 'DELETE' }),
  },

  goals: {
    list:   () => request('/api/goals'),
    create: (data: unknown) => request('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)    => request(`/api/goals/${id}`, { method: 'DELETE' }),
  },

  budgets: {
    list:   (month: string) => request(`/api/budgets?month=${month}`),
    upsert: (data: unknown) => request('/api/budgets', { method: 'POST', body: JSON.stringify(data) }),
  },

  patrimony: {
    list:             ()                    => request('/api/patrimony'),
    createAsset:      (data: unknown)       => request('/api/patrimony/assets', { method: 'POST', body: JSON.stringify(data) }),
    updateAsset:      (id: string, data: unknown) => request(`/api/patrimony/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteAsset:      (id: string)          => request(`/api/patrimony/assets/${id}`, { method: 'DELETE' }),
    createLiability:  (data: unknown)       => request('/api/patrimony/liabilities', { method: 'POST', body: JSON.stringify(data) }),
    updateLiability:  (id: string, data: unknown) => request(`/api/patrimony/liabilities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteLiability:  (id: string)          => request(`/api/patrimony/liabilities/${id}`, { method: 'DELETE' }),
  },

  ai: {
    analyze: (financialData: unknown, question?: string) => request('/api/ai', { method: 'POST', body: JSON.stringify({ financialData, question }) }),
  },

  account: {
    updateProfile: (data: { name: string; householdName?: string }) => request('/api/account/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) => request('/api/account/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  },

  whatsapp: {
    test: (phone: string, message?: string) => request('/api/whatsapp/test', { method: 'POST', body: JSON.stringify({ phone, message }) }),
  },

  voice: {
    parse: (transcript: string) => request('/api/voice', { method: 'POST', body: JSON.stringify({ transcript }) }),
  },
}
