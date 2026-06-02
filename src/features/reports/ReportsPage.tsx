import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, ToggleButton, ToggleButtonGroup, IconButton,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, LineChart, Line, AreaChart, Area, Legend,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
} from 'recharts'
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { Cell } from 'recharts'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon   from '@mui/icons-material/NavigateNext'
import { useIsDemo } from '@/features/auth/authStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useAccountsStore }     from '@/shared/stores/accountsStore'
import { KZ } from '@/theme'
import { formatBRL } from '@/types'

// ── Category metadata ─────────────────────────────────────────────────────────
const CAT: Record<string, { name: string; color: string }> = {
  moradia:      { name: 'Moradia',      color: '#6366F1' },
  alimentacao:  { name: 'Alimentação',  color: '#F97316' },
  transporte:   { name: 'Transporte',   color: '#8B5CF6' },
  saude:        { name: 'Saúde',        color: '#EF4444' },
  lazer:        { name: 'Lazer',        color: '#EC4899' },
  assinatura:   { name: 'Assinatura',   color: '#84CC16' },
  roupas:       { name: 'Roupas',       color: '#14B8A6' },
  investimento: { name: 'Investimento', color: '#10B981' },
  receita:      { name: 'Receita',      color: '#10B981' },
  outros:       { name: 'Outros',       color: '#6B7280' },
}
const catMeta = (id: string) => CAT[id] ?? { name: id, color: '#6B7280' }

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_MONTHLY = [
  { month: 'Jan', income: 850000,  expense: 612000 },
  { month: 'Fev', income: 850000,  expense: 590000 },
  { month: 'Mar', income: 975000,  expense: 701000 },
  { month: 'Abr', income: 850000,  expense: 482000 },
  { month: 'Mai', income: 850000,  expense: 534000 },
  { month: 'Jun', income: 1020000, expense: 578000 },
]
const DEMO_CATEGORIES = [
  { name: 'Moradia',     value: 248000, color: '#6366F1' },
  { name: 'Alimentação', value: 142000, color: '#F97316' },
  { name: 'Transporte',  value:  47000, color: '#8B5CF6' },
  { name: 'Saúde',       value: 116700, color: '#EF4444' },
  { name: 'Lazer',       value:  62000, color: '#EC4899' },
  { name: 'Assinatura',  value:  26670, color: '#84CC16' },
  { name: 'Roupas',      value:  55000, color: '#14B8A6' },
  { name: 'Outros',      value:  14000, color: '#6B7280' },
]
const DEMO_BALANCE = [
  { month: 'Jan', balance:  9820000 },
  { month: 'Fev', balance: 10090000 },
  { month: 'Mar', balance: 10364000 },
  { month: 'Abr', balance: 10732000 },
  { month: 'Mai', balance: 11048000 },
  { month: 'Jun', balance: 12548000 },
]

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, format = 'brl' }: {
  active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string; format?: 'brl' | 'pct'
}) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'rgba(8,12,18,0.97)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 2, p: 1.5, minWidth: 140 }}>
      {label && <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mb: 0.8, fontWeight: 600 }}>{label}</Typography>}
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color ?? KZ.green, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t2 }}>{p.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: KZ.t1, ml: 'auto' }}>
            {format === 'brl' ? formatBRL(p.value) : `${p.value}%`}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function monthLabel(d: Date) {
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}
function monthStr(d: Date) {
  return d.toISOString().slice(0, 7)
}
function offsetDate(months: number): Date {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  return d
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const isDemo       = useIsDemo()
  const transactions = useTransactionsStore(s => s.transactions)
  const accounts     = useAccountsStore(s => s.accounts)

  const [period, setPeriod]           = useState<'month' | 'year'>('month')
  const [monthOffset, setMonthOffset] = useState(0)

  const currentDate = useMemo(() => offsetDate(monthOffset), [monthOffset])
  const currentLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // ── Real data computed from stores ────────────────────────────────────────
  const monthlyData = useMemo(() => {
    if (isDemo) return DEMO_MONTHLY
    return Array.from({ length: 6 }, (_, i) => {
      const d = offsetDate(-(5 - i))
      const ms = monthStr(d)
      const monthTx = transactions.filter(t => t.date.startsWith(ms) && t.status === 'confirmed')
      return {
        month:   monthLabel(d),
        income:  monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [isDemo, transactions])

  const categoryData = useMemo(() => {
    if (isDemo) return DEMO_CATEGORIES
    const ms = monthStr(currentDate)
    const expenseTx = transactions.filter(t => t.date.startsWith(ms) && t.status === 'confirmed' && t.type === 'expense')
    const byCategory: Record<string, number> = {}
    for (const tx of expenseTx) {
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount
    }
    return Object.entries(byCategory)
      .map(([id, value]) => ({ name: catMeta(id).name, value, color: catMeta(id).color }))
      .sort((a, b) => b.value - a.value)
  }, [isDemo, transactions, currentDate])

  const balanceHistory = useMemo(() => {
    if (isDemo) return DEMO_BALANCE
    const totalNow = accounts.reduce((s, a) => s + a.balance, 0)
    return Array.from({ length: 6 }, (_, i) => {
      const monthsAgo = 5 - i
      const d = offsetDate(-monthsAgo)
      // Sum net flows for all months after this one to work back from current balance
      const laterNet = Array.from({ length: monthsAgo }, (_, j) => {
        const ld = offsetDate(-(monthsAgo - 1 - j))
        const ms = monthStr(ld)
        const monthTx = transactions.filter(t => t.date.startsWith(ms) && t.status === 'confirmed')
        const income  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        return income - expense
      }).reduce((a, b) => a + b, 0)
      return { month: monthLabel(d), balance: Math.max(0, totalNow - laterNet) }
    })
  }, [isDemo, accounts, transactions])

  const savingsRate = useMemo(() =>
    monthlyData.map(d => ({
      month: d.month,
      rate: d.income > 0 ? Math.round(((d.income - d.expense) / d.income) * 100) : 0,
    }))
  , [monthlyData])

  const currentMonthData = monthlyData[5] ?? { income: 0, expense: 0 }
  const totalExpense      = categoryData.reduce((s, c) => s + c.value, 0)
  const savingsAvg        = savingsRate.length > 0
    ? Math.round(savingsRate.reduce((s, r) => s + r.rate, 0) / savingsRate.length)
    : 0
  const currentBalance = balanceHistory[5]?.balance ?? 0

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Relatórios</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Análise financeira completa</Typography>
          </Box>
          <ToggleButtonGroup value={period} exclusive size="small" onChange={(_, v) => v && setPeriod(v)}
            sx={{ '& .MuiToggleButton-root': { fontWeight: 600, fontSize: '0.72rem', px: 1.5, py: 0.5, borderColor: KZ.border,
              '&.Mui-selected': { bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, borderColor: 'rgba(16,185,129,0.3)' } } }}>
            <ToggleButton value="month">Mensal</ToggleButton>
            <ToggleButton value="year">Anual</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </motion.div>

      {/* Month nav */}
      {period === 'month' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <IconButton size="small" onClick={() => setMonthOffset(p => p - 1)} sx={{ color: KZ.t2, border: `1px solid ${KZ.border}` }}>
            <NavigateBeforeIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
            {currentLabel}
          </Typography>
          <IconButton size="small" onClick={() => setMonthOffset(p => p + 1)} disabled={monthOffset >= 0}
            sx={{ color: KZ.t2, border: `1px solid ${KZ.border}` }}>
            <NavigateNextIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* KPI row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
        {[
          { label: 'Receita (mês)',    value: formatBRL(currentMonthData.income),  color: KZ.green, icon: '📈' },
          { label: 'Despesa (mês)',    value: formatBRL(currentMonthData.expense), color: KZ.red,   icon: '📉' },
          { label: 'Taxa de poupança', value: `${savingsAvg}%`,                    color: KZ.blue,  icon: '💰' },
          { label: 'Saldo atual',      value: formatBRL(currentBalance),           color: KZ.green, icon: '🏦' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Paper sx={{ p: 2, border: `1px solid ${kpi.color}18`, background: `linear-gradient(135deg, ${kpi.color}06 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{kpi.label}</Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{kpi.icon}</Typography>
              </Box>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Main charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Receitas vs Despesas — últimos 6 meses
          </Typography>
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4} barCategoryGap="28%">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: KZ.t3, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: KZ.t2 }} />
                <Bar dataKey="income"  name="Receita" fill={KZ.green} radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Despesa" fill={KZ.red}   radius={[4,4,0,0]} maxBarSize={40} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Despesas por categoria
          </Typography>
          {categoryData.length > 0 ? (
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {categoryData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.78rem', color: KZ.t3 }}>Nenhum lançamento neste mês</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Balance history */}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
          Evolução do saldo bancário
        </Typography>
        <Box sx={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceHistory}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={KZ.green} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={KZ.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: KZ.t3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <RTooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <Area type="monotone" dataKey="balance" name="Saldo" stroke={KZ.green} strokeWidth={2} fill="url(#balGrad)" dot={{ fill: KZ.green, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Savings rate + Top categories */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Taxa de poupança mensal (%)
          </Typography>
          <Box sx={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savingsRate}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: KZ.t3, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: KZ.t3, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <RTooltip content={<ChartTooltip format="pct" />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Line type="monotone" dataKey="rate" name="Taxa" stroke={KZ.blue} strokeWidth={2} dot={{ fill: KZ.blue, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Top categorias de gasto
          </Typography>
          {categoryData.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {categoryData.slice(0, 6).map((cat, i) => {
                const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0
                return (
                  <Box key={cat.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, width: 14, flexShrink: 0 }}>#{i + 1}</Typography>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.78rem', flex: 1 }}>{cat.name}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cat.color }}>{pct}%</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: KZ.t1, minWidth: 70, textAlign: 'right' }}>
                      {formatBRL(cat.value)}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.78rem', color: KZ.t3 }}>Nenhum lançamento neste mês</Typography>
          )}
        </Paper>
      </Box>

    </Box>
  )
}
