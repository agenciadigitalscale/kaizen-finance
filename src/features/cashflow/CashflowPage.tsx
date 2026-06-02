import { useMemo, useState } from 'react'
import {
  Box, Typography, Paper, Chip, ToggleButton, ToggleButtonGroup,
} from '@mui/material'
import { motion } from 'framer-motion'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import TrendingDownIcon  from '@mui/icons-material/TrendingDown'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { useIsDemo }            from '@/features/auth/authStore'
import { useAccountsStore }     from '@/shared/stores/accountsStore'
import { useBillsStore }        from '@/shared/stores/billsStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import type { Bill, Transaction, Account } from '@/types'
import { KZ } from '@/theme'
import { formatBRL } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CashEvent {
  name:   string
  amount: number
  type:   'bill' | 'income' | 'transfer'
}

interface DayForecast {
  date:    string
  label:   string
  balance: number
  events:  CashEvent[]
  isNeg:   boolean
  isToday: boolean
}

// ── Demo forecast (static) ────────────────────────────────────────────────────
function generateDemoForecast(days: number): DayForecast[] {
  const startBalance = 12548000
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const RECURRING: { day: number; name: string; amount: number; type: 'bill' | 'income' }[] = [
    { day:  1, name: 'Salário',          amount:  850000, type: 'income' },
    { day:  1, name: 'Aluguel',          amount: -180000, type: 'bill'   },
    { day:  5, name: 'Internet Vivo',    amount:  -11990, type: 'bill'   },
    { day:  8, name: 'Energia',          amount:  -23400, type: 'bill'   },
    { day: 10, name: 'Cartão Nubank',    amount: -125000, type: 'bill'   },
    { day: 15, name: 'Netflix',          amount:   -5490, type: 'bill'   },
    { day: 18, name: 'Academia',         amount:   -8990, type: 'bill'   },
    { day: 20, name: 'Spotify',          amount:   -2190, type: 'bill'   },
    { day: 25, name: 'IPTU (parcela)',   amount:  -45000, type: 'bill'   },
    { day: 28, name: 'Meta: Emergência', amount: -100000, type: 'bill'   },
  ]
  const DAILY_SPEND = 2200

  const result: DayForecast[] = []
  let balance = startBalance

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dom = d.getDate()
    const isToday = i === 0
    const events: CashEvent[] = []
    let dayDelta = -DAILY_SPEND

    for (const r of RECURRING) {
      if (r.day === dom) {
        events.push({ name: r.name, amount: r.amount, type: r.type })
        dayDelta += r.amount
      }
    }

    balance += dayDelta
    const label = isToday ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    result.push({ date: d.toISOString().slice(0, 10), label, balance, events, isNeg: balance < 0, isToday })
  }
  return result
}

// ── Real forecast (from stores) ───────────────────────────────────────────────
function generateRealForecast(
  days: number,
  accounts: Account[],
  bills: Bill[],
  transactions: Transaction[],
): DayForecast[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().slice(0, 10)

  const startBalance = accounts.reduce((s, a) => s + a.balance, 0)

  // Average daily expense from last 30 days
  const thirtyAgo = new Date(today)
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const thirtyAgoStr = thirtyAgo.toISOString().slice(0, 10)
  const recentExpense = transactions
    .filter(t => t.type === 'expense' && t.status === 'confirmed' && t.date >= thirtyAgoStr)
    .reduce((s, t) => s + t.amount, 0)
  const dailyAvg = Math.max(Math.round(recentExpense / 30), 500) // min R$ 5/day

  // Build event map: dateStr → events[]
  const eventMap: Record<string, CashEvent[]> = {}
  const addEvent = (date: string, ev: CashEvent) => {
    if (!eventMap[date]) eventMap[date] = []
    eventMap[date].push(ev)
  }

  const unpaidBills = bills.filter(b => b.status !== 'paid')
  const maxMonths = Math.ceil(days / 28) + 1

  for (const bill of unpaidBills) {
    if (!bill.dueDate) continue
    const billD = new Date(bill.dueDate)
    billD.setHours(0, 0, 0, 0)

    // Add on the actual due date (if within horizon)
    const dateStr = bill.dueDate
    if (dateStr >= todayStr) {
      addEvent(dateStr, { name: bill.name, amount: -bill.amount, type: 'bill' })
    }

    // For monthly bills, project for subsequent months
    if (bill.frequency === 'monthly') {
      for (let m = 1; m <= maxMonths; m++) {
        const projected = new Date(billD)
        projected.setMonth(projected.getMonth() + m)
        const projStr = projected.toISOString().slice(0, 10)
        if (projStr > todayStr) {
          addEvent(projStr, { name: bill.name, amount: -bill.amount, type: 'bill' })
        }
      }
    }
  }

  const result: DayForecast[] = []
  let balance = startBalance

  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const isToday = i === 0
    const events = eventMap[dateStr] ?? []

    // Bill events already deducted via eventMap; add daily average on top
    const billsDelta = events.reduce((s, e) => s + e.amount, 0)
    balance += billsDelta - dailyAvg

    const label = isToday ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    result.push({ date: dateStr, label, balance, events, isNeg: balance < 0, isToday })
  }

  return result
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CashTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const color = val >= 0 ? KZ.green : KZ.red
  return (
    <Box sx={{ bgcolor: 'rgba(8,12,18,0.97)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 2, p: 1.5 }}>
      <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color }}>{formatBRL(val)}</Typography>
    </Box>
  )
}

// ── Day row ───────────────────────────────────────────────────────────────────
function DayRow({ day }: { day: DayForecast }) {
  if (day.events.length === 0) return null
  return (
    <Box sx={{
      py: 1.2, px: 1.5, borderRadius: 2, mb: 0.5,
      bgcolor: day.isNeg ? 'rgba(239,68,68,0.04)' : day.isToday ? 'rgba(16,185,129,0.04)' : 'transparent',
      border: `1px solid ${day.isNeg ? 'rgba(239,68,68,0.15)' : day.isToday ? 'rgba(16,185,129,0.12)' : KZ.border}`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: day.events.length > 0 ? 0.8 : 0 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: day.isToday ? KZ.green : KZ.t2 }}>
          {day.label}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: day.balance >= 0 ? KZ.green : KZ.red }}>
          {formatBRL(day.balance)}
        </Typography>
      </Box>
      {day.events.map((ev, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
          <Typography sx={{ fontSize: '0.7rem' }}>{ev.type === 'income' ? '📈' : '📤'}</Typography>
          <Typography sx={{ fontSize: '0.72rem', flex: 1, color: KZ.t2 }}>{ev.name}</Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: ev.amount > 0 ? KZ.green : KZ.red }}>
            {ev.amount > 0 ? '+' : ''}{formatBRL(Math.abs(ev.amount))}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CashflowPage() {
  const isDemo       = useIsDemo()
  const accounts     = useAccountsStore(s => s.accounts)
  const bills        = useBillsStore(s => s.bills)
  const transactions = useTransactionsStore(s => s.transactions)

  const [horizon, setHorizon] = useState<30 | 60 | 90>(30)

  const forecast = useMemo(
    () => isDemo
      ? generateDemoForecast(horizon)
      : generateRealForecast(horizon, accounts, bills, transactions),
    [isDemo, horizon, accounts, bills, transactions],
  )

  const negDays  = forecast.filter(d => d.isNeg)
  const minDay   = forecast.reduce((m, d) => d.balance < m.balance ? d : m, forecast[0])
  const firstNeg = negDays[0]
  const endBal   = forecast[forecast.length - 1]?.balance ?? 0
  const peakBal  = Math.max(...forecast.map(d => d.balance))
  const chartMin = Math.min(...forecast.map(d => d.balance)) * 1.05
  const chartMax = Math.max(...forecast.map(d => d.balance)) * 1.05
  const chartData = forecast.filter((_, i) => i % (horizon <= 30 ? 2 : 3) === 0)

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Previsão de Caixa</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>
              Simulação dia a dia — baseada em contas e receitas programadas
            </Typography>
          </Box>
          <ToggleButtonGroup value={horizon} exclusive size="small" onChange={(_, v) => v && setHorizon(v)}
            sx={{ '& .MuiToggleButton-root': { fontWeight: 600, fontSize: '0.72rem', px: 1.5, py: 0.5, borderColor: KZ.border,
              '&.Mui-selected': { bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, borderColor: 'rgba(16,185,129,0.3)' } } }}>
            <ToggleButton value={30}>30 dias</ToggleButton>
            <ToggleButton value={60}>60 dias</ToggleButton>
            <ToggleButton value={90}>90 dias</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </motion.div>

      {/* Alert banner */}
      {firstNeg ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, mb: 2.5, borderRadius: 2,
            bgcolor: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.2)` }}>
            <WarningAmberIcon sx={{ color: KZ.red, fontSize: 20 }} />
            <Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: KZ.red }}>
                Atenção: saldo negativo previsto em {firstNeg.label}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: KZ.t2, mt: 0.2 }}>
                Menor saldo: {formatBRL(minDay.balance)} em {minDay.label}. Considere adiar gastos ou aumentar a reserva.
              </Typography>
            </Box>
          </Box>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, mb: 2.5, borderRadius: 2,
            bgcolor: 'rgba(16,185,129,0.06)', border: `1px solid rgba(16,185,129,0.2)` }}>
            <CheckCircleIcon sx={{ color: KZ.green, fontSize: 20 }} />
            <Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: KZ.green }}>
                Fluxo saudável nos próximos {horizon} dias
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: KZ.t2, mt: 0.2 }}>
                Saldo projetado em {horizon} dias: {formatBRL(endBal)}. Pico de saldo: {formatBRL(peakBal)}.
              </Typography>
            </Box>
          </Box>
        </motion.div>
      )}

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
        {[
          { label: `Saldo em ${horizon} dias`, value: formatBRL(endBal),           color: endBal >= 0 ? KZ.green : KZ.red },
          { label: 'Menor saldo previsto',     value: formatBRL(minDay?.balance ?? 0), color: (minDay?.balance ?? 0) < 0 ? KZ.red : KZ.gold },
          { label: 'Dias negativos',           value: String(negDays.length),       color: negDays.length > 0 ? KZ.red : KZ.green },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Paper sx={{ p: 2, border: `1px solid ${kpi.color}18`, background: `linear-gradient(135deg, ${kpi.color}06 0%, transparent 100%)` }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2, mb: 1 }}>{kpi.label}</Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Chart */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
            Curva de saldo projetado
          </Typography>
          <Chip label="Simulação" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(59,130,246,0.08)', color: KZ.blue, ml: 1 }} />
        </Box>
        <Box sx={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cashGradPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={KZ.green} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={KZ.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: KZ.t3, fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis hide domain={[chartMin, chartMax]} />
              <RTooltip content={<CashTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <ReferenceLine y={0} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="balance" name="Saldo" stroke={KZ.green} strokeWidth={2} fill="url(#cashGradPos)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 2, bgcolor: KZ.green, borderRadius: 1 }} />
            <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>Saldo positivo</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 1, bgcolor: KZ.red, borderRadius: 1 }} />
            <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>Linha zero</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Day-by-day events */}
      <Paper sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
            Eventos agendados
          </Typography>
          <Box sx={{ flex: 1 }} />
          <TrendingDownIcon sx={{ fontSize: 14, color: KZ.t3 }} />
          <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>apenas dias com eventos</Typography>
        </Box>
        <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 0.5 }}>
          {forecast
            .filter(d => d.events.length > 0)
            .slice(0, 20)
            .map(day => <DayRow key={day.date} day={day} />)
          }
        </Box>
      </Paper>

    </Box>
  )
}
