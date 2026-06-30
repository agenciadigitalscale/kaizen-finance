import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Paper, LinearProgress, Chip, Button, CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'
import TrendingUpIcon    from '@mui/icons-material/TrendingUp'
import TrendingDownIcon  from '@mui/icons-material/TrendingDown'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SmartToyIcon      from '@mui/icons-material/SmartToy'
import ChevronRightIcon  from '@mui/icons-material/ChevronRight'
import { useHousehold, useUser, useIsDemo } from '@/features/auth/authStore'
import { useAccountsStore }     from '@/shared/stores/accountsStore'
import { useBillsStore }        from '@/shared/stores/billsStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useGoalsStore }        from '@/shared/stores/goalsStore'
import { useBudgetStore }       from '@/shared/stores/budgetStore'
import { api } from '@/shared/lib/api'
import { KZ } from '@/theme'
import { formatBRL, DEFAULT_CATEGORIES } from '@/types'

// Mapa grupo → {nome, ícone} (primeiro de cada grupo)
const CAT_MAP: Record<string, { name: string; icon: string }> = {}
for (const c of DEFAULT_CATEGORIES) if (!CAT_MAP[c.group]) CAT_MAP[c.group] = { name: c.name, icon: c.icon }

interface AttentionItem {
  id: string; icon: string; title: string; sub: string; color: string; path: string
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color, icon, trend }: {
  label: string; value: string; sub?: string
  color: string; icon: React.ReactNode; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Paper sx={{
        p: { xs: 1.8, md: 2.2 },
        border: `1px solid ${color}18`,
        background: `linear-gradient(135deg, ${color}06 0%, rgba(6,10,14,0) 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.65rem', color: KZ.t2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
          </Typography>
          <Box sx={{ color, fontSize: '1.1rem', lineHeight: 1 }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </Typography>
        {sub && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8 }}>
            {trend === 'up'   && <TrendingUpIcon   sx={{ fontSize: 13, color: KZ.green }} />}
            {trend === 'down' && <TrendingDownIcon sx={{ fontSize: 13, color: KZ.red }} />}
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>{sub}</Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  )
}

// ── Health Score Ring ─────────────────────────────────────────────────────────
function HealthScore({ score }: { score: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const progress = (score / 100) * circ
  const color = score >= 80 ? KZ.green : score >= 60 ? KZ.gold : KZ.red
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Regular' : 'Atenção'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${progress} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.02em' }}>{score}</Typography>
          <Typography sx={{ fontSize: '0.5rem', color: KZ.t3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>score</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color }}>{label}</Typography>
    </Box>
  )
}

// ── Bill Row ──────────────────────────────────────────────────────────────────
function BillRow({ name, amount, dueDate, daysLeft }: {
  name: string; amount: number; dueDate: string; daysLeft: number
}) {
  const isOverdue = daysLeft < 0
  const isToday   = daysLeft === 0
  const isUrgent  = daysLeft <= 3 && daysLeft >= 0
  const color = isOverdue ? KZ.red : isToday ? '#F97316' : isUrgent ? KZ.gold : KZ.t2
  const label = isOverdue ? `${Math.abs(daysLeft)}d atrasado` : isToday ? 'Hoje' : daysLeft === 1 ? 'Amanhã' : `${daysLeft} dias`

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
      borderBottom: `1px solid ${KZ.border}`,
      '&:last-child': { borderBottom: 0 },
    }}>
      <Box sx={{ width: 4, height: 32, borderRadius: 2, bgcolor: color, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: KZ.t1, lineHeight: 1.2 }} noWrap>{name}</Typography>
        <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mt: 0.2 }}>{dueDate}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: KZ.t1, lineHeight: 1 }}>{formatBRL(amount)}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color, fontWeight: 700, mt: 0.2 }}>{label}</Typography>
      </Box>
    </Box>
  )
}

// ── Kaizen Insights — perguntas prontas ───────────────────────────────────────
const INSIGHT_QUESTIONS = [
  'Como economizar este mês?',
  'Vou ficar no vermelho?',
  'Onde estou gastando demais?',
  'Como melhorar meu score?',
  'Criar plano para guardar dinheiro.',
]

const DEMO_ANSWERS: Record<string, string> = {
  'Como economizar este mês?': '**Você pode economizar cerca de R$ 350 este mês.**\n• Lazer estourou R$ 120 — segure as saídas nas próximas 2 semanas.\n• Revise assinaturas: são R$ 209/mês e há 1 pouco usada.\n• Troque 2 deliveries por refeições em casa (~R$ 120).',
  'Vou ficar no vermelho?': '**Não nos próximos 30 dias.** Seu saldo projetado se mantém positivo, com o menor ponto em R$ 4.200 por volta do dia 25 (IPTU). Evite compras grandes entre os dias 23 e 26.',
  'Onde estou gastando demais?': '**Suas 3 maiores saídas são Moradia, Saúde e Alimentação.**\nO ponto de atenção é **Lazer**, que passou do orçamento em R$ 120. Alimentação também subiu — vale planejar o mercado da semana.',
  'Como melhorar meu score?': '**Seu score é 72 (Bom).** Para subir:\n• Quite a conta atrasada (impacto imediato).\n• Mantenha o uso do cartão abaixo de 30% do limite.\n• Aumente a reserva de emergência para 3 meses de despesas.',
  'Criar plano para guardar dinheiro.': '**Plano sugerido: guardar R$ 500/mês.**\n• Automatize uma transferência no dia do salário.\n• Direcione metade para a reserva de emergência e metade para sua meta.\n• Em 12 meses isso vira R$ 6.000 sem contar rendimentos.',
}

function demoAnswer(question?: string): string {
  if (question) return DEMO_ANSWERS[question] ?? 'Análise gerada para sua pergunta (modo demonstração).'
  return `**Resumo geral**\nSua saúde financeira está em nível Bom (72/100). Você está poupando 37% da sua renda, o que é excelente.\n\n**Pontos positivos**\n• Taxa de poupança acima de 30% — parabéns!\n• Nenhuma conta em atraso crítico\n• Fundo de emergência em crescimento\n\n**Alertas**\n• Aluguel em atraso — regularize o quanto antes\n• Categoria Lazer estourou o orçamento em R$ 120,00\n\n**Recomendações**\n1. Pagar o aluguel hoje para evitar multa\n2. Reduzir lazer em R$ 200 no próximo mês\n3. Aumentar aporte no fundo de emergência para R$ 1.500/mês\n4. Revisar assinaturas — R$ 209/mês pode ser reduzido\n\n**Meta do mês**\nQuitar o aluguel atrasado e manter despesas de lazer abaixo de R$ 500.`
}

// ── AI Analysis Panel ─────────────────────────────────────────────────────────
function AIAnalysisPanel({ financialData }: { financialData: unknown }) {
  const isDemo = useIsDemo()
  const [loading, setLoading]   = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError]       = useState('')

  async function ask(question?: string) {
    if (isDemo) { setAnalysis(demoAnswer(question)); return }
    setLoading(true); setError('')
    try {
      const res = await api.ai.analyze(financialData, question) as { ok: boolean; data?: { analysis: string }; error?: string }
      if (res.ok && res.data) setAnalysis(res.data.analysis)
      else setError(res.error ?? 'Erro ao gerar análise')
    } catch {
      setError('ANTHROPIC_API_KEY não configurada no servidor.')
    } finally { setLoading(false) }
  }

  const lines = analysis?.split('\n') ?? []

  return (
    <Paper sx={{
      p: 2.5,
      background: `linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(6,10,14,0) 60%)`,
      border: `1px solid rgba(59,130,246,0.15)`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: analysis ? 2 : 0 }}>
        <SmartToyIcon sx={{ fontSize: 16, color: KZ.blue }} />
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, flex: 1 }}>
          Análise IA — Kaizen Insights
        </Typography>
        {!analysis ? (
          <Button
            size="small" variant="outlined" onClick={() => ask()} disabled={loading}
            startIcon={loading ? <CircularProgress size={12} /> : <SmartToyIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '0.72rem', borderColor: 'rgba(59,130,246,0.3)', color: KZ.blue, borderRadius: 1.5,
              '&:hover': { borderColor: KZ.blue, bgcolor: 'rgba(59,130,246,0.06)' } }}
          >
            {loading ? 'Analisando...' : 'Analisar meu mês'}
          </Button>
        ) : (
          <Button size="small" variant="text" onClick={() => setAnalysis(null)}
            sx={{ fontSize: '0.65rem', color: KZ.t3 }}>Fechar</Button>
        )}
      </Box>

      {!analysis && !loading && !error && (
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, mb: 1.5 }}>
          Pergunte ao Kaizen ou peça uma análise completa do seu mês.
        </Typography>
      )}

      {/* Kaizen Insights — perguntas prontas */}
      {!analysis && !loading && (
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          {INSIGHT_QUESTIONS.map(q => (
            <Box
              key={q} component={motion.div} whileTap={{ scale: 0.95 }} onClick={() => ask(q)}
              sx={{
                cursor: 'pointer', px: 1.4, py: 0.7, borderRadius: 2, fontSize: '0.72rem', fontWeight: 600,
                color: KZ.blue, bgcolor: 'rgba(59,130,246,0.06)', border: `1px solid rgba(59,130,246,0.2)`,
                '&:hover': { bgcolor: 'rgba(59,130,246,0.12)' },
              }}
            >
              {q}
            </Box>
          ))}
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <CircularProgress size={14} sx={{ color: KZ.blue }} />
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>Pensando…</Typography>
        </Box>
      )}

      {error && <Typography sx={{ fontSize: '0.72rem', color: KZ.red }}>{error}</Typography>}

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
            {lines.map((line, i) => {
              if (!line.trim()) return null
              const isBold = line.startsWith('**')
              const text = line.replace(/\*\*/g, '')
              return (
                <Typography key={i} sx={{
                  fontSize: isBold ? '0.78rem' : '0.73rem',
                  fontWeight: isBold ? 700 : 400,
                  color: isBold ? KZ.blue : KZ.t2,
                  mt: isBold ? 0.8 : 0,
                  lineHeight: 1.6,
                }}>
                  {text}
                </Typography>
              )
            })}
          </Box>
        </motion.div>
      )}
    </Paper>
  )
}

// ── Card "Resumo do mês" — frase inteligente ──────────────────────────────────
function MonthSummaryCard({ sentence, positive }: { sentence: string; positive: boolean }) {
  const color = positive ? KZ.green : KZ.red
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Paper sx={{
        p: { xs: 2.2, md: 2.6 }, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${color}0E 0%, rgba(6,10,14,0) 65%)`,
        border: `1px solid ${color}2A`,
      }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 8px ${color}` }} />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: KZ.t2 }}>
            Resumo do mês
          </Typography>
        </Box>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.12rem' }, fontWeight: 700, color: KZ.t1, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
          {sentence}
        </Typography>
      </Paper>
    </motion.div>
  )
}

// ── Card de atenção (clicável) ────────────────────────────────────────────────
function AttentionCard({ item, onClick }: { item: AttentionItem; onClick: () => void }) {
  return (
    <Box
      component={motion.div} whileTap={{ scale: 0.97 }} onClick={onClick}
      sx={{
        flexShrink: 0, width: { xs: 230, md: 250 }, cursor: 'pointer',
        p: 1.6, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.3,
        background: `linear-gradient(135deg, ${item.color}12 0%, rgba(6,10,14,0) 70%)`,
        border: `1px solid ${item.color}33`,
      }}
    >
      <Box sx={{
        width: 38, height: 38, flexShrink: 0, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.15rem', bgcolor: `${item.color}1A`, border: `1px solid ${item.color}33`,
      }}>
        {item.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: KZ.t1, lineHeight: 1.2 }} noWrap>{item.title}</Typography>
        <Typography sx={{ fontSize: '0.66rem', color: KZ.t2, mt: 0.3, lineHeight: 1.25 }}>{item.sub}</Typography>
      </Box>
      <ChevronRightIcon sx={{ color: item.color, fontSize: 18, flexShrink: 0 }} />
    </Box>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
interface DashboardData {
  totalBalance:  number
  monthIncome:   number
  monthExpense:  number
  overdueBills:  number
  pendingBills:  number
  score:         number
  bills:  { name: string; amount: number; dueDate: string; daysLeft: number }[]
  goals:  { name: string; current: number; target: number; color: string; icon: string }[]
}

function computeHealthScore(totalBalance: number, monthIncome: number, monthExpense: number): number {
  const savingsRate    = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0
  const savingsPoints  = Math.min(25, Math.max(0, savingsRate / 2))
  const debtPoints     = 25
  const budgetPoints   = monthExpense <= monthIncome ? 25 : Math.max(0, 25 - ((monthExpense - monthIncome) / Math.max(monthIncome, 1) * 25))
  const reservePoints  = totalBalance > 0 ? 25 : 0
  return Math.min(100, Math.max(0, Math.round(savingsPoints + debtPoints + budgetPoints + reservePoints)))
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user      = useUser()
  const household = useHousehold()
  const isDemo    = useIsDemo()
  const now       = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthStr  = now.toISOString().slice(0, 7)
  const today     = now.toISOString().slice(0, 10)

  const navigate = useNavigate()

  // Stores
  const accounts     = useAccountsStore(s => s.accounts)
  const storeBills   = useBillsStore(s => s.bills)
  const transactions = useTransactionsStore(s => s.transactions)
  const storeGoals   = useGoalsStore(s => s.goals)
  const budgets      = useBudgetStore(s => s.budgets)

  // Demo data
  const demoData = useMemo<DashboardData>(() => ({
    totalBalance:  12548000,
    monthIncome:   850000,
    monthExpense:  534200,
    overdueBills:  1,
    pendingBills:  3,
    score:         72,
    bills: [
      { name: 'Aluguel',       amount: 180000, dueDate: '01/06/2026', daysLeft: -2  },
      { name: 'Internet',      amount:  11990, dueDate: '05/06/2026', daysLeft: 2   },
      { name: 'Energia',       amount:  23400, dueDate: '08/06/2026', daysLeft: 5   },
      { name: 'Cartão Nubank', amount: 125000, dueDate: '10/06/2026', daysLeft: 7   },
      { name: 'Netflix',       amount:   5490, dueDate: '15/06/2026', daysLeft: 12  },
    ],
    goals: [
      { name: 'Fundo emergência', current: 800000,  target: 2400000, color: KZ.green, icon: '🛡️' },
      { name: 'Viagem Europa',    current: 320000,  target: 1500000, color: KZ.gold,  icon: '✈️' },
      { name: 'Carro novo',       current: 1200000, target: 8000000, color: KZ.blue,  icon: '🚗' },
    ],
  }), [])

  // Real data from stores
  const realData = useMemo<DashboardData>(() => {
    const totalBalance = accounts.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0)

    const monthTx      = transactions.filter(t => t.date.startsWith(monthStr) && t.status === 'confirmed')
    const monthIncome  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const unpaidBills  = storeBills.filter(b => b.status !== 'paid')
    const overdueBills = unpaidBills.filter(b => b.dueDate < today).length
    const pendingBills = unpaidBills.filter(b => b.dueDate >= today).length

    const bills = unpaidBills
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
      .map(b => {
        const daysLeft = Math.round((new Date(b.dueDate).getTime() - new Date(today).getTime()) / 86_400_000)
        return { name: b.name, amount: b.amount, dueDate: new Date(b.dueDate).toLocaleDateString('pt-BR'), daysLeft }
      })

    const goals = storeGoals
      .filter(g => g.status === 'active')
      .slice(0, 3)
      .map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount, color: g.color, icon: g.icon }))

    return {
      totalBalance, monthIncome, monthExpense, overdueBills, pendingBills,
      score: computeHealthScore(totalBalance, monthIncome, monthExpense),
      bills, goals,
    }
  }, [accounts, storeBills, transactions, storeGoals, monthStr, today])

  const data    = isDemo ? demoData : realData
  const cashflow = data.monthIncome - data.monthExpense
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  // ── O que precisa da sua atenção ──
  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = []

    const overdue = data.bills.filter(b => b.daysLeft < 0)
    if (data.overdueBills > 0) {
      const total = overdue.reduce((s, b) => s + b.amount, 0)
      items.push({
        id: 'overdue', icon: '🚨', color: KZ.red,
        title: `${data.overdueBills} conta${data.overdueBills > 1 ? 's' : ''} atrasada${data.overdueBills > 1 ? 's' : ''}`,
        sub: total > 0 ? `${formatBRL(total)} · toque para regularizar` : 'Toque para regularizar',
        path: '/app/bills',
      })
    }

    const soon = data.bills.filter(b => b.daysLeft >= 0 && b.daysLeft <= 7)
    if (soon.length > 0) {
      const total = soon.reduce((s, b) => s + b.amount, 0)
      items.push({
        id: 'soon', icon: '📅', color: KZ.gold,
        title: `${soon.length} vencendo em 7 dias`,
        sub: `${formatBRL(total)} a pagar em breve`,
        path: '/app/bills',
      })
    }

    const over = budgets.filter(b => b.planned > 0 && b.spent > b.planned)
    if (over.length > 0) {
      const worst = [...over].sort((a, b) => (b.spent - b.planned) - (a.spent - a.planned))[0]
      const cat = CAT_MAP[worst.categoryId]
      items.push({
        id: 'budget', icon: cat?.icon ?? '📊', color: KZ.red,
        title: `${cat?.name ?? 'Categoria'} estourou`,
        sub: `Passou ${formatBRL(worst.spent - worst.planned)} do limite`,
        path: '/app/budget',
      })
    }

    const lateGoal = storeGoals.find(g => g.status === 'active' && g.targetDate && g.targetDate < today && g.currentAmount < g.targetAmount)
    if (lateGoal) {
      items.push({
        id: 'goal', icon: lateGoal.icon || '🎯', color: KZ.gold,
        title: `Meta "${lateGoal.name}" atrasada`,
        sub: 'Revise o aporte mensal',
        path: '/app/goals',
      })
    }

    const subsMap = new Map<string, number>()
    for (const t of transactions) {
      if (t.isRecurring && t.type === 'expense' && !subsMap.has(t.description)) subsMap.set(t.description, t.amount)
    }
    if (subsMap.size > 0) {
      const total = [...subsMap.values()].reduce((s, a) => s + a, 0)
      items.push({
        id: 'subs', icon: '📡', color: KZ.blue,
        title: `${subsMap.size} assinatura${subsMap.size > 1 ? 's' : ''} recorrente${subsMap.size > 1 ? 's' : ''}`,
        sub: `${formatBRL(total)}/mês · toque para revisar`,
        path: '/app/subscriptions',
      })
    }

    return items
  }, [data, budgets, storeGoals, transactions, today])

  // ── Frase do resumo do mês ──
  const summary = useMemo(() => {
    const positive = cashflow >= 0
    const soonCount = data.bills.filter(b => b.daysLeft >= 0 && b.daysLeft <= 7).length
    let s = positive
      ? `Você está com saldo positivo de ${formatBRL(cashflow)} este mês`
      : `Atenção: suas despesas superaram as receitas em ${formatBRL(Math.abs(cashflow))} este mês`
    const tails: string[] = []
    if (data.overdueBills > 0) tails.push(`${data.overdueBills} conta${data.overdueBills > 1 ? 's' : ''} atrasada${data.overdueBills > 1 ? 's' : ''}`)
    if (soonCount > 0) tails.push(`${soonCount} vencendo nos próximos dias`)
    if (tails.length) s += `, mas tem ${tails.join(' e ')}`
    else if (positive) s += ' e nenhuma conta pendente urgente'
    return { sentence: s + '.', positive }
  }, [cashflow, data.bills, data.overdueBills])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 900, letterSpacing: '-0.03em', mt: 0.3 }}>
              {household?.name ?? 'Kaizen Finance'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {data.overdueBills > 0 && (
              <Chip
                icon={<WarningAmberIcon />}
                label={`${data.overdueBills} conta${data.overdueBills > 1 ? 's' : ''} atrasada${data.overdueBills > 1 ? 's' : ''}`}
                size="small" color="error" variant="outlined"
                sx={{ fontSize: '0.65rem', fontWeight: 700 }}
              />
            )}
            <Chip
              label={monthName}
              size="small"
              sx={{ fontSize: '0.65rem', bgcolor: 'rgba(16,185,129,0.08)', color: KZ.green, border: `1px solid rgba(16,185,129,0.2)` }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* ── Resumo do mês ── */}
      <MonthSummaryCard sentence={summary.sentence} positive={summary.positive} />

      {/* ── KPI Row ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5 }}>
        {[
          { label: 'Saldo total',   value: formatBRL(data.totalBalance),  color: KZ.green, icon: <AccountBalanceIcon sx={{ fontSize: 18 }} />, sub: 'todas as contas',  trend: 'up' as const },
          { label: 'Receitas/mês',  value: formatBRL(data.monthIncome),   color: KZ.green, icon: '📈', sub: `mês de ${now.toLocaleDateString('pt-BR', { month: 'short' })}`, trend: 'up' as const },
          { label: 'Despesas/mês',  value: formatBRL(data.monthExpense),  color: KZ.red,   icon: '📉', sub: data.monthIncome > 0 ? `${Math.round((data.monthExpense / data.monthIncome) * 100)}% da receita` : '', trend: 'neutral' as const },
          { label: 'Fluxo do mês',  value: formatBRL(cashflow), color: cashflow >= 0 ? KZ.green : KZ.red, icon: cashflow >= 0 ? '✅' : '⚠️', sub: cashflow >= 0 ? 'saldo positivo' : 'saldo negativo', trend: cashflow >= 0 ? 'up' as const : 'down' as const },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}>
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </Box>

      {/* ── O que precisa da sua atenção ── */}
      {attention.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
            <WarningAmberIcon sx={{ fontSize: 15, color: KZ.gold }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
              O que precisa da sua atenção
            </Typography>
          </Box>
          <Box sx={{
            display: 'flex', gap: 1.2, overflowX: 'auto', pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
            // Em telas grandes, quebra em grade
            '@media (min-width:900px)': { flexWrap: 'wrap', overflowX: 'visible' },
          }}>
            {attention.map(item => (
              <AttentionCard key={item.id} item={item} onClick={() => navigate(item.path)} />
            ))}
          </Box>
        </motion.div>
      )}

      {/* ── Grid principal ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr', xl: '2fr 1.2fr 1fr' }, gap: 2 }}>

        {/* Contas a pagar */}
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, flex: 1 }}>
              Próximas contas
            </Typography>
            {data.pendingBills > 0 && (
              <Chip label={`${data.pendingBills} pendente${data.pendingBills > 1 ? 's' : ''}`} size="small"
                sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(245,158,11,0.1)', color: KZ.gold, border: `1px solid rgba(245,158,11,0.2)` }} />
            )}
          </Box>
          {data.bills.length > 0
            ? data.bills.map(b => <BillRow key={b.name} {...b} />)
            : <Typography sx={{ fontSize: '0.78rem', color: KZ.t3 }}>Nenhuma conta a pagar</Typography>
          }
        </Paper>

        {/* Metas */}
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Metas financeiras
          </Typography>
          {data.goals.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data.goals.map(g => {
                const pct = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0
                return (
                  <Box key={g.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                      <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{g.icon}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, flex: 1 }}>{g.name}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: g.color }}>{pct}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': { bgcolor: g.color, borderRadius: 3 } }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                      <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }}>{formatBRL(g.current)}</Typography>
                      <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }}>{formatBRL(g.target)}</Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.78rem', color: KZ.t3 }}>Nenhuma meta criada ainda</Typography>
          )}
        </Paper>

        {/* Score de saúde */}
        <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, alignSelf: 'flex-start' }}>
            Saúde financeira
          </Typography>
          <HealthScore score={data.score} />
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: 'Reserva emergência', score: data.totalBalance > 0 ? 40 : 0, color: data.totalBalance > 0 ? KZ.gold : KZ.red },
              { label: 'Proporção dívidas',  score: 75, color: KZ.green },
              { label: 'Disciplina orçamento', score: data.monthExpense <= data.monthIncome ? 80 : 30, color: data.monthExpense <= data.monthIncome ? KZ.green : KZ.red },
              { label: 'Taxa de poupança', score: data.monthIncome > 0 ? Math.min(100, Math.round(((data.monthIncome - data.monthExpense) / data.monthIncome) * 100)) : 0, color: KZ.gold },
            ].map(item => (
              <Box key={item.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: item.color, fontWeight: 700 }}>{item.score}/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, item.score))}
                  sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 2 } }} />
              </Box>
            ))}
          </Box>
        </Paper>

      </Box>

      {/* ── Previsão de caixa ── */}
      <Paper sx={{
        p: 2.5,
        background: `linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(6,10,14,0) 60%)`,
        border: `1px solid rgba(16,185,129,0.15)`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
            Previsão de caixa — próximos 30 dias
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip label="Beta" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green }} />
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: KZ.t3 }}>
          Com base nas suas contas e receitas programadas, seu saldo projetado em 30 dias é{' '}
          <Typography component="span" sx={{ color: KZ.green, fontWeight: 700 }}>{formatBRL(data.totalBalance + cashflow * 0.8)}</Typography>.
          {' '}{data.overdueBills > 0 ? `⚠️ Você tem ${data.overdueBills} conta${data.overdueBills > 1 ? 's' : ''} em atraso.` : 'Nenhum mês crítico detectado no horizonte.'}
        </Typography>
      </Paper>

      {/* ── IA Financeira ── */}
      <AIAnalysisPanel financialData={data} />

    </Box>
  )
}
