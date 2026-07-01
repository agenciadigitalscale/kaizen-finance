// ── Kaizen — Tipos ────────────────────────────────────────────────────────────

// ── Usuários & Auth ───────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: number
}

export interface AuthClaims {
  sub: string       // userId
  householdId: string
  role: 'owner' | 'partner' | 'viewer'
  exp: number
}

// ── Casa / Família ────────────────────────────────────────────────────────────

export interface Household {
  id: string
  name: string          // ex: "Família Kaique"
  currency: 'BRL'
  createdAt: number
}

export interface HouseholdMember {
  householdId: string
  userId: string
  role: 'owner' | 'partner' | 'viewer'
  name: string
  color: string         // cor para identificar na UI
  joinedAt: number
}

// ── Categorias ────────────────────────────────────────────────────────────────

export type CategoryType = 'income' | 'expense'
export type CategoryGroup =
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'roupas'
  | 'viagem'
  | 'investimento'
  | 'negocio'
  | 'assinatura'
  | 'receita'
  | 'outros'

export interface Category {
  id: string
  householdId: string
  name: string
  type: CategoryType
  group: CategoryGroup
  icon: string          // emoji
  color: string         // hex
  isDefault: boolean
  createdAt: number
}

// ── Contas bancárias & cartões ────────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'investment' | 'credit_card' | 'cash' | 'wallet'

export interface Account {
  id: string
  householdId: string
  name: string
  type: AccountType
  bank?: string
  balance: number           // saldo atual (centavos)
  creditLimit?: number      // para cartão de crédito (centavos)
  closingDay?: number       // dia de fechamento da fatura
  dueDay?: number           // dia de vencimento da fatura
  color: string
  icon: string
  isShared: boolean         // conta compartilhada do casal
  ownerId?: string          // userId do dono (se não compartilhada)
  createdAt: number
}

// ── Transações ────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Transaction {
  id: string
  householdId: string
  userId: string            // quem lançou
  type: TransactionType
  amount: number            // centavos (sempre positivo)
  description: string
  categoryId: string
  accountId: string
  toAccountId?: string      // para transferências
  date: string              // YYYY-MM-DD
  status: TransactionStatus
  isRecurring: boolean
  recurringId?: string      // vincula ao registro recorrente
  tags?: string[]
  notes?: string
  installment?: { current: number; total: number }
  createdAt: number
}

// ── Contas a Pagar (Bills) ────────────────────────────────────────────────────

export type BillFrequency = 'once' | 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'
export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface Bill {
  id: string
  householdId: string
  name: string
  amount: number            // centavos
  dueDate: string           // YYYY-MM-DD (próximo vencimento)
  endDate?: string          // YYYY-MM-DD — data de quitação/fim (opcional)
  frequency: BillFrequency
  categoryId: string
  accountId?: string        // conta para débito
  status: BillStatus
  isShared: boolean
  reminderDays: number      // dias antes para alertar (padrão: 3)
  whatsappAlert: boolean    // enviar alerta no WhatsApp
  whatsappNumber?: string
  notes?: string
  paidAt?: string           // data do último pagamento
  createdAt: number
}

// ── Orçamento ─────────────────────────────────────────────────────────────────

export interface Budget {
  id: string
  householdId: string
  categoryId: string
  month: string             // YYYY-MM
  amount: number            // centavos — limite planejado
  spent?: number            // calculado dinamicamente
  createdAt: number
}

// ── Metas Financeiras ─────────────────────────────────────────────────────────

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled'
export type GoalType = 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency_fund'

export interface Goal {
  id: string
  householdId: string
  name: string
  type: GoalType
  targetAmount: number      // centavos
  currentAmount: number     // centavos acumulados
  targetDate?: string       // YYYY-MM-DD
  monthlyContribution: number // centavos/mês planejado
  icon: string
  color: string
  status: GoalStatus
  notes?: string
  createdAt: number
}

// ── Patrimônio ────────────────────────────────────────────────────────────────

export type AssetType = 'real_estate' | 'vehicle' | 'investment' | 'savings' | 'business' | 'other'

export interface Asset {
  id: string
  householdId: string
  name: string
  type: AssetType
  currentValue: number      // centavos
  purchaseValue?: number
  purchaseDate?: string
  notes?: string
  updatedAt: number
  createdAt: number
}

export interface Liability {
  id: string
  householdId: string
  name: string
  totalAmount: number       // centavos — valor total da dívida
  remainingAmount: number   // centavos — saldo devedor atual
  monthlyPayment: number    // centavos — parcela mensal
  interestRate?: number     // % ao mês
  dueDate?: string
  creditor: string
  notes?: string
  createdAt: number
}

// ── Score de Saúde Financeira ─────────────────────────────────────────────────

export interface HealthScore {
  score: number             // 0-100
  label: 'crítico' | 'preocupante' | 'regular' | 'bom' | 'excelente'
  details: {
    emergencyFund: number   // 0-25
    debtRatio: number       // 0-25
    budgetAdherence: number // 0-25
    savingsRate: number     // 0-25
  }
  generatedAt: number
}

// ── Previsão de Caixa ─────────────────────────────────────────────────────────

export interface CashFlowForecast {
  date: string              // YYYY-MM-DD
  projectedBalance: number  // centavos
  events: Array<{
    type: 'bill' | 'income' | 'goal_contribution'
    name: string
    amount: number
    isPositive: boolean
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatBRLCompact(cents: number): string {
  const val = cents / 100
  if (Math.abs(val) >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`
  if (Math.abs(val) >= 1_000)     return `R$ ${(val / 1_000).toFixed(1)}K`
  return formatBRL(cents)
}

export function parseBRL(str: string): number {
  const cleaned = str.replace(/[R$\s.]/g, '').replace(',', '.')
  return Math.round(parseFloat(cleaned) * 100) || 0
}

// Categorias padrão do sistema
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'householdId' | 'createdAt'>[] = [
  // Despesas
  { name: 'Moradia',        type: 'expense', group: 'moradia',      icon: '🏠', color: '#6366F1', isDefault: true },
  { name: 'Alimentação',    type: 'expense', group: 'alimentacao',  icon: '🍕', color: '#F97316', isDefault: true },
  { name: 'Mercado',        type: 'expense', group: 'alimentacao',  icon: '🛒', color: '#FB923C', isDefault: true },
  { name: 'Transporte',     type: 'expense', group: 'transporte',   icon: '🚗', color: '#8B5CF6', isDefault: true },
  { name: 'Combustível',    type: 'expense', group: 'transporte',   icon: '⛽', color: '#A78BFA', isDefault: true },
  { name: 'Saúde',          type: 'expense', group: 'saude',        icon: '💊', color: '#EF4444', isDefault: true },
  { name: 'Educação',       type: 'expense', group: 'educacao',     icon: '📚', color: '#3B82F6', isDefault: true },
  { name: 'Lazer',          type: 'expense', group: 'lazer',        icon: '🎬', color: '#EC4899', isDefault: true },
  { name: 'Roupas',         type: 'expense', group: 'roupas',       icon: '👕', color: '#14B8A6', isDefault: true },
  { name: 'Viagem',         type: 'expense', group: 'viagem',       icon: '✈️', color: '#06B6D4', isDefault: true },
  { name: 'Assinatura',     type: 'expense', group: 'assinatura',   icon: '📱', color: '#84CC16', isDefault: true },
  { name: 'Negócio',        type: 'expense', group: 'negocio',      icon: '💼', color: '#F59E0B', isDefault: true },
  { name: 'Outros',         type: 'expense', group: 'outros',       icon: '📦', color: '#6B7280', isDefault: true },
  // Receitas
  { name: 'Salário',        type: 'income',  group: 'receita',      icon: '💰', color: '#10B981', isDefault: true },
  { name: 'Freelance',      type: 'income',  group: 'receita',      icon: '💻', color: '#34D399', isDefault: true },
  { name: 'Investimentos',  type: 'income',  group: 'investimento', icon: '📈', color: '#059669', isDefault: true },
  { name: 'Aluguel',        type: 'income',  group: 'receita',      icon: '🏢', color: '#047857', isDefault: true },
  { name: 'Outros',         type: 'income',  group: 'receita',      icon: '🪙', color: '#065F46', isDefault: true },
]
