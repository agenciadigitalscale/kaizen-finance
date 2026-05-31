import { useMemo, useState } from 'react'
import {
  Box, Typography, Paper, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tooltip, Switch, FormControlLabel,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import RadarIcon       from '@mui/icons-material/Radar'
import DeleteIcon      from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon  from '@mui/icons-material/CheckCircle'
import AddIcon          from '@mui/icons-material/Add'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL } from '@/types'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useBillsStore } from '@/shared/stores/billsStore'

// ── Subscription type ─────────────────────────────────────────────────────────
interface Subscription {
  id:          string
  name:        string
  amount:      number      // centavos/mês
  category:    string
  icon:        string
  isActive:    boolean
  lastCharged: string      // YYYY-MM-DD
  detectedAt:  string
  source:      'detected' | 'manual'
  isUsed?:     boolean     // user-flagged
}

// ── Detect recurring charges from transactions ─────────────────────────────────
function detectSubscriptions(transactions: { description: string; amount: number; date: string; categoryId: string }[]): Subscription[] {
  const byDesc = new Map<string, { dates: string[]; amounts: number[]; categoryId: string }>()

  transactions.forEach(t => {
    const key = t.description.toLowerCase().trim()
    const existing = byDesc.get(key)
    if (existing) {
      existing.dates.push(t.date)
      existing.amounts.push(t.amount)
    } else {
      byDesc.set(key, { dates: [t.date], amounts: [t.amount], categoryId: t.categoryId })
    }
  })

  const detected: Subscription[] = []
  byDesc.forEach((data, desc) => {
    // Only consider if appeared 2+ times and amounts are similar
    if (data.dates.length < 2) return
    const avgAmt = data.amounts.reduce((s, a) => s + a, 0) / data.amounts.length
    const variance = data.amounts.every(a => Math.abs(a - avgAmt) / avgAmt < 0.05)
    if (!variance) return

    const SUBSCRIPTION_KEYWORDS = ['netflix', 'spotify', 'amazon', 'apple', 'google', 'youtube', 'disney', 'hbo', 'paramount', 'globoplay', 'adobe', 'microsoft', 'office', 'dropbox', 'icloud', 'academia', 'plano']
    const isSubKeyword = SUBSCRIPTION_KEYWORDS.some(k => desc.includes(k))
    if (data.dates.length < 3 && !isSubKeyword) return

    const sorted = [...data.dates].sort()
    detected.push({
      id:          `detected-${desc.replace(/\s+/g, '-')}`,
      name:        desc.charAt(0).toUpperCase() + desc.slice(1),
      amount:      Math.round(avgAmt),
      category:    data.categoryId,
      icon:        getSubIcon(desc),
      isActive:    true,
      lastCharged: sorted[sorted.length - 1],
      detectedAt:  new Date().toISOString().slice(0, 10),
      source:      'detected',
    })
  })

  return detected
}

function getSubIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('netflix'))   return '🎬'
  if (n.includes('spotify'))   return '🎵'
  if (n.includes('amazon'))    return '📦'
  if (n.includes('apple'))     return '🍎'
  if (n.includes('google'))    return '🔍'
  if (n.includes('youtube'))   return '▶️'
  if (n.includes('disney'))    return '🏰'
  if (n.includes('hbo'))       return '🎭'
  if (n.includes('academia'))  return '💪'
  if (n.includes('plano'))     return '💊'
  if (n.includes('internet'))  return '🌐'
  if (n.includes('seguro'))    return '🛡️'
  return '📱'
}

// ── Subscription Card ─────────────────────────────────────────────────────────
function SubCard({ sub, onDelete, onToggleUsed }: {
  sub: Subscription
  onDelete:    (id: string) => void
  onToggleUsed: (id: string) => void
}) {
  const lastDate = new Date(sub.lastCharged + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const daysSince = Math.round((Date.now() - new Date(sub.lastCharged).getTime()) / 86400000)

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <Paper sx={{
        p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
        border: `1px solid ${sub.isUsed === false ? 'rgba(239,68,68,0.2)' : KZ.border}`,
        bgcolor: sub.isUsed === false ? 'rgba(239,68,68,0.03)' : 'none',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'rgba(255,255,255,0.12)' },
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.04)', fontSize: '1.2rem',
          border: `1px solid ${KZ.border}`,
        }}>
          {sub.icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{sub.name}</Typography>
            {sub.source === 'detected' && (
              <Chip label="Detectado" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(59,130,246,0.08)', color: KZ.blue }} />
            )}
            {sub.isUsed === false && (
              <Chip label="Não uso mais?" size="small" color="error" sx={{ height: 16, fontSize: '0.5rem' }} />
            )}
          </Box>
          <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mt: 0.2 }}>
            Último débito: {lastDate} ({daysSince === 0 ? 'hoje' : `${daysSince}d atrás`})
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: KZ.t1 }}>{formatBRL(sub.amount)}/mês</Typography>
          <Typography sx={{ fontSize: '0.58rem', color: KZ.t3, mt: 0.2 }}>{formatBRL(sub.amount * 12)}/ano</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0 }}>
          <Tooltip title={sub.isUsed === false ? 'Marcar como uso' : 'Marcar como não uso'}>
            <IconButton size="small" onClick={() => onToggleUsed(sub.id)}
              sx={{ color: sub.isUsed === false ? KZ.red : KZ.t3 }}>
              {sub.isUsed === false
                ? <WarningAmberIcon sx={{ fontSize: 15 }} />
                : <CheckCircleIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Remover do radar">
            <IconButton size="small" onClick={() => onDelete(sub.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    </motion.div>
  )
}

// ── Add Manual Sub Dialog ─────────────────────────────────────────────────────
function AddSubDialog({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (s: Subscription) => void
}) {
  const [name, setName]   = useState('')
  const [amtStr, setAmt]  = useState('')
  const [icon, setIcon]   = useState('📱')

  const ICONS = ['📱', '🎬', '🎵', '📦', '🍎', '▶️', '🌐', '🏰', '💪', '💊', '🛡️', '📰', '☁️', '🎮']

  function handleAdd() {
    const amount = Math.round(parseFloat(amtStr.replace(',', '.')) * 100) || 0
    onAdd({
      id:          crypto.randomUUID(),
      name,
      amount,
      category:    'assinatura',
      icon,
      isActive:    true,
      lastCharged: new Date().toISOString().slice(0, 10),
      detectedAt:  new Date().toISOString().slice(0, 10),
      source:      'manual',
    })
    setName(''); setAmt(''); setIcon('📱')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Adicionar assinatura manual</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome do serviço" size="small" fullWidth value={name} onChange={e => setName(e.target.value)} autoFocus />
        <TextField label="Valor mensal (R$)" size="small" fullWidth value={amtStr} onChange={e => setAmt(e.target.value)} placeholder="0,00" />
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 0.8 }}>Ícone</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {ICONS.map(ic => (
              <Box key={ic} onClick={() => setIcon(ic)} sx={{
                width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1rem', cursor: 'pointer',
                border: `1px solid ${icon === ic ? KZ.green : KZ.border}`,
                bgcolor: icon === ic ? 'rgba(16,185,129,0.1)' : 'transparent',
              }}>
                {ic}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!name || !amtStr}
          sx={{ background: KZ_GRADIENTS.green }}>Adicionar</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const { transactions } = useTransactionsStore()
  const { bills }        = useBillsStore()
  const [manual, setManual]   = useState<Subscription[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [unusedOnly, setUnusedOnly] = useState(false)

  // Detect from transactions
  const detected = useMemo(() => {
    const expenseTransactions = transactions
      .filter(t => t.type === 'expense')
      .map(t => ({ description: t.description, amount: t.amount, date: t.date, categoryId: t.categoryId }))
    return detectSubscriptions(expenseTransactions).filter(s => !dismissed.has(s.id))
  }, [transactions, dismissed])

  // Also grab subscription bills as reference
  const subBills = useMemo(() =>
    bills.filter(b => b.categoryId === 'assinatura' && b.status !== 'paid'),
    [bills]
  )

  const allSubs = useMemo(() => {
    const all = [...detected, ...manual.filter(m => !dismissed.has(m.id))]
    return unusedOnly ? all.filter(s => s.isUsed === false) : all
  }, [detected, manual, dismissed, unusedOnly])

  const [subsState, setSubsState] = useState<Map<string, Subscription>>(new Map())

  function handleDelete(id: string) {
    setDismissed(prev => new Set([...prev, id]))
    setManual(prev => prev.filter(m => m.id !== id))
  }

  function handleToggleUsed(id: string) {
    setSubsState(prev => {
      const map = new Map(prev)
      const existing = map.get(id)
      map.set(id, { ...(existing ?? allSubs.find(s => s.id === id)!), isUsed: existing?.isUsed === false ? undefined : false })
      return map
    })
  }

  function getSubWithState(sub: Subscription): Subscription {
    const override = subsState.get(sub.id)
    return override ? { ...sub, ...override } : sub
  }

  const totals = useMemo(() => {
    const active = allSubs.map(getSubWithState)
    return {
      monthly: active.reduce((s, sub) => s + sub.amount, 0),
      yearly:  active.reduce((s, sub) => s + sub.amount * 12, 0),
      unused:  active.filter(s => s.isUsed === false).length,
      savings: active.filter(s => s.isUsed === false).reduce((s, sub) => s + sub.amount, 0),
    }
  }, [allSubs, subsState])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RadarIcon sx={{ color: KZ.green, fontSize: 22 }} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Radar de Assinaturas</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>
              Cobranças recorrentes detectadas automaticamente nos seus lançamentos
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} size="small"
            onClick={() => setAddOpen(true)}
            sx={{ borderColor: KZ.border, color: KZ.t2, fontSize: '0.75rem' }}>
            Adicionar manualmente
          </Button>
        </Box>
      </motion.div>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
        {[
          { label: 'Gasto mensal', value: formatBRL(totals.monthly), color: KZ.gold, icon: '📅' },
          { label: 'Gasto anual', value: formatBRL(totals.yearly), color: KZ.red, icon: '📆' },
          { label: 'Assinaturas', value: String(allSubs.length), color: KZ.blue, icon: '📱' },
          { label: 'Possível economia', value: formatBRL(totals.savings), color: KZ.green, icon: '💰' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Paper sx={{ p: 2, border: `1px solid ${kpi.color}18`, background: `linear-gradient(135deg, ${kpi.color}06 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{kpi.label}</Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{kpi.icon}</Typography>
              </Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Alert for savings */}
      {totals.unused > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, mb: 2.5, borderRadius: 2,
            bgcolor: 'rgba(245,158,11,0.06)', border: `1px solid rgba(245,158,11,0.2)` }}>
            <WarningAmberIcon sx={{ color: KZ.gold, fontSize: 20 }} />
            <Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: KZ.gold }}>
                {totals.unused} assinatura{totals.unused > 1 ? 's' : ''} marcada{totals.unused > 1 ? 's' : ''} como não utilizada{totals.unused > 1 ? 's' : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: KZ.t2, mt: 0.2 }}>
                Cancelar estas assinaturas te economizaria {formatBRL(totals.savings)}/mês — {formatBRL(totals.savings * 12)}/ano
              </Typography>
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Bills reference */}
      {subBills.length > 0 && (
        <Paper sx={{ p: 2, mb: 2.5, background: 'rgba(59,130,246,0.03)', border: `1px solid rgba(59,130,246,0.12)` }}>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.blue, mb: 1 }}>
            Também nas suas contas a pagar
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {subBills.map(b => (
              <Chip key={b.id} label={`${b.name} · ${formatBRL(b.amount)}/mês`} size="small"
                sx={{ fontSize: '0.68rem', bgcolor: 'rgba(59,130,246,0.08)', color: KZ.blue, border: `1px solid rgba(59,130,246,0.15)` }} />
            ))}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={<Switch checked={unusedOnly} onChange={e => setUnusedOnly(e.target.checked)} size="small" sx={{ '& .MuiSwitch-thumb': { bgcolor: KZ.gold } }} />}
          label={<Typography sx={{ fontSize: '0.78rem', color: KZ.t2 }}>Mostrar apenas não utilizadas</Typography>}
        />
      </Box>

      {/* List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <AnimatePresence>
          {allSubs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <RadarIcon sx={{ fontSize: 40, color: KZ.t3, mb: 1 }} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: KZ.t2 }}>Nenhuma assinatura detectada</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, mt: 0.5 }}>
                Adicione mais lançamentos ou clique em "Adicionar manualmente"
              </Typography>
            </Paper>
          ) : (
            allSubs.map(sub => (
              <SubCard
                key={sub.id}
                sub={getSubWithState(sub)}
                onDelete={handleDelete}
                onToggleUsed={handleToggleUsed}
              />
            ))
          )}
        </AnimatePresence>
      </Box>

      <AddSubDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={s => setManual(prev => [...prev, s])} />
    </Box>
  )
}
