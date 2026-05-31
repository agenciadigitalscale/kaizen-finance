import { useAuthStore } from '@/features/auth/authStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (res.status === 401) {
    const refresh = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    const rd = await refresh.json() as { ok: boolean; data?: { accessToken: string } }
    if (rd.ok && rd.data?.accessToken) {
      useAuthStore.getState().setToken(rd.data.accessToken)
      const retry = await fetch(url, {
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
    analyze: (financialData: unknown) => request('/api/ai', { method: 'POST', body: JSON.stringify({ financialData }) }),
  },
}
