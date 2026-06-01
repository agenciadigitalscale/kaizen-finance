import { useMemo, useState } from 'react'
import { Box, Typography, Paper, LinearProgress, Chip, Button, CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'
import TrendingUpIcon    from '@mui/icons-material/TrendingUp'
import TrendingDownIcon  from '@mui/icons-material/TrendingDown'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SmartToyIcon      from '@mui/icons-material/SmartToy'
import { useHousehold, useUser, useIsDemo } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { KZ } from '@/theme'
import { formatBRL } from '@/types'

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
        {/* Glow corner */}
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

// ── AI Analysis Panel ─────────────────────────────────────────────────────────
function AIAnalysisPanel({ financialData }: { financialData: unknown }) {
  const isDemo = useIsDemo()
  const [loading, setLoading]   = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError]       = useState('')

  async function handleAnalyze() {
    if (isDemo) {
      setAnalysis(`**Resumo geral**\nSua saúde financeira está em nível Bom (72/100). Você está poupando 37% da sua renda, o que é excelente.\n\n**Pontos positivos**\n• Taxa de poupança acima de 30% — parabéns!\n• Nenhuma conta em atraso crítico\n• Fundo de emergência em crescimento\n\n**Alertas**\n• Aluguel em atraso — regularize o quanto antes\n• Categoria Lazer estourou o orçamento em R$ 120,00\n\n**Recomendações**\n1. Pagar o aluguel hoje para evitar multa\n2. Reduzir lazer em R$ 200 no próximo mês\n3. Aumentar aporte no fundo de emergência para R$ 1.500/mês\n4. Revisar assinaturas — R$ 209/mês pode ser reduzido\n\n**Meta do mês**\nQuitar o aluguel atrasado e manter despesas de lazer abaixo de R$ 500.`)
      return
    }
    setLoading(true); setError('')
    try {
      const res = await api.ai.analyze(financialData) as { ok: boolean; data?: { analysis: string }; error?: string }
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
            size="small" variant="outlined" onClick={handleAnalyze} disabled={loading}
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
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>
          Claude analisa seus dados financeiros e gera recomendações personalizadas para este mês.
        </Typography>
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user      = useUser()
  const household = useHousehold()
  const now       = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Dados de demonstração enquanto backend não está conectado
  const demo = useMemo(() => ({
    totalBalance:   125_48000,   // R$ 12.548,00
    monthIncome:    850_000,     // R$ 8.500,00
    monthExpense:   534_200,     // R$ 5.342,00
    pendingBills:   3,
    overdueBills:   1,
    score:          72,
    bills: [
      { name: 'Aluguel',        amount: 180000, dueDate: '01/06/2026', daysLeft: -2  },
      { name: 'Internet',       amount:  11990, dueDate: '05/06/2026', daysLeft: 2   },
      { name: 'Energia',        amount:  23400, dueDate: '08/06/2026', daysLeft: 5   },
      { name: 'Cartão Nubank',  amount: 125000, dueDate: '10/06/2026', daysLeft: 7   },
      { name: 'Netflix',        amount:   5490, dueDate: '15/06/2026', daysLeft: 12  },
    ],
    goals: [
      { name: 'Fundo emergência', current: 800000, target: 2400000, color: KZ.green, icon: '🛡️' },
      { name: 'Viagem Europa',    current: 320000, target: 1500000, color: KZ.gold,  icon: '✈️' },
      { name: 'Carro novo',       current: 1200000, target: 8000000, color: KZ.blue, icon: '🚗' },
    ],
  }), [])

  const balance = demo.totalBalance
  const cashflow = demo.monthIncome - demo.monthExpense

  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

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
            {demo.overdueBills > 0 && (
              <Chip
                icon={<WarningAmberIcon />}
                label={`${demo.overdueBills} conta atrasada`}
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

      {/* ── KPI Row ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5 }}>
        {[
          { label: 'Saldo total',    value: formatBRL(balance),        color: KZ.green, icon: <AccountBalanceIcon sx={{ fontSize: 18 }} />, sub: 'todas as contas', trend: 'up' as const },
          { label: 'Receitas/mês',   value: formatBRL(demo.monthIncome),   color: KZ.green, icon: '📈', sub: `mês de ${now.toLocaleDateString('pt-BR', { month: 'short' })}`, trend: 'up' as const },
          { label: 'Despesas/mês',   value: formatBRL(demo.monthExpense),  color: KZ.red,   icon: '📉', sub: `${Math.round((demo.monthExpense/demo.monthIncome)*100)}% da receita`, trend: 'neutral' as const },
          { label: 'Fluxo do mês',   value: formatBRL(cashflow),       color: cashflow >= 0 ? KZ.green : KZ.red, icon: cashflow >= 0 ? '✅' : '⚠️', sub: cashflow >= 0 ? 'saldo positivo' : 'saldo negativo', trend: cashflow >= 0 ? 'up' as const : 'down' as const },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}>
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </Box>

      {/* ── Grid principal ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr', xl: '2fr 1.2fr 1fr' }, gap: 2 }}>

        {/* Contas a pagar */}
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, flex: 1 }}>
              Próximas contas
            </Typography>
            <Chip label={`${demo.pendingBills} pendentes`} size="small"
              sx={{ height: 18, fontSize: '0.58rem', bgcolor: 'rgba(245,158,11,0.1)', color: KZ.gold, border: `1px solid rgba(245,158,11,0.2)` }} />
          </Box>
          {demo.bills.map(b => <BillRow key={b.name} {...b} />)}
        </Paper>

        {/* Metas */}
        <Paper sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
            Metas financeiras
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {demo.goals.map(g => {
              const pct = Math.min(Math.round((g.current / g.target) * 100), 100)
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
        </Paper>

        {/* Score de saúde */}
        <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, alignSelf: 'flex-start' }}>
            Saúde financeira
          </Typography>
          <HealthScore score={demo.score} />
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: 'Reserva emergência', score: 40, color: KZ.gold },
              { label: 'Proporção dívidas', score: 75, color: KZ.green },
              { label: 'Disciplina orçamento', score: 80, color: KZ.green },
              { label: 'Taxa de poupança', score: 55, color: KZ.gold },
            ].map(item => (
              <Box key={item.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: item.color, fontWeight: 700 }}>{item.score}/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={item.score}
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
          <Typography component="span" sx={{ color: KZ.green, fontWeight: 700 }}>{formatBRL(balance + cashflow * 0.8)}</Typography>.
          {' '}Nenhum mês crítico detectado no horizonte.
        </Typography>
      </Paper>

      {/* ── IA Financeira ── */}
      <AIAnalysisPanel financialData={demo} />

    </Box>
  )
}
