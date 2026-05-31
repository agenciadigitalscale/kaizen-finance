import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, LinearProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import EditIcon        from '@mui/icons-material/Edit'
import AddIcon         from '@mui/icons-material/Add'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon   from '@mui/icons-material/NavigateNext'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, DEFAULT_CATEGORIES } from '@/types'
import { useBudgetStore, type BudgetItem } from '@/shared/stores/budgetStore'

// ── Budget Card ───────────────────────────────────────────────────────────────
function BudgetCard({ item, onEdit }: {
  item: BudgetItem & { name: string; icon: string; color: string }
  onEdit: (item: BudgetItem) => void
}) {
  const pct     = Math.min(Math.round((item.spent / item.planned) * 100), 100)
  const isOver  = item.spent > item.planned
  const isWarn  = pct >= 85 && !isOver
  const barColor = isOver ? KZ.red : isWarn ? KZ.gold : KZ.green
  const remaining = item.planned - item.spent

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Paper sx={{
        p: 2, height: '100%',
        border: `1px solid ${isOver ? KZ.red + '25' : isWarn ? KZ.gold + '20' : KZ.border}`,
        background: isOver ? 'rgba(239,68,68,0.03)' : 'none',
        transition: 'all 0.2s',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Typography sx={{ fontSize: '1.1rem' }}>{item.icon}</Typography>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isOver && <Chip label="Estourou" size="small" color="error" sx={{ height: 18, fontSize: '0.55rem' }} />}
            {isWarn && !isOver && <Chip label="Atenção" size="small" color="warning" sx={{ height: 18, fontSize: '0.55rem' }} />}
            <Tooltip title="Editar limite">
              <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: KZ.t3 }}>
                <EditIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min(pct, 100)}
          sx={{
            height: 6, borderRadius: 3, mb: 1,
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>Gasto</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: isOver ? KZ.red : KZ.t1, letterSpacing: '-0.02em' }}>
              {formatBRL(item.spent)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: barColor }}>{pct}%</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>{isOver ? 'Excedido' : 'Disponível'}</Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: isOver ? KZ.red : KZ.green, letterSpacing: '-0.02em' }}>
              {isOver ? '+' : ''}{formatBRL(Math.abs(remaining))}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.8 }}>
          <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }}>Limite: {formatBRL(item.planned)}</Typography>
        </Box>
      </Paper>
    </motion.div>
  )
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────
function BudgetDialog({ open, item, onClose, onSave }: {
  open: boolean; item: BudgetItem | null; onClose: () => void; onSave: (categoryId: string, planned: number) => void
}) {
  const cat = DEFAULT_CATEGORIES.find(c => c.group === item?.categoryId)
  const [val, setVal] = useState(item?.planned ? (item.planned / 100).toFixed(2) : '')

  function handleSave() {
    if (!item) return
    const amount = Math.round(parseFloat(val.replace(',', '.')) * 100) || 0
    onSave(item.categoryId, amount)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {cat?.icon ?? '📦'} Limite de {cat?.name ?? 'Categoria'}
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField
          label="Limite mensal (R$)" size="small" fullWidth autoFocus
          value={val} onChange={e => setVal(e.target.value)} placeholder="0,00"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>Salvar</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const { budgets, updateBudget } = useBudgetStore()
  const [dialog, setDialog]       = useState<{ open: boolean; item: BudgetItem | null }>({ open: false, item: null })
  const [monthOffset, setMonthOffset] = useState(0)

  const currentDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])
  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const enriched = useMemo(() =>
    budgets.map(b => {
      const cat = DEFAULT_CATEGORIES.find(c => c.group === b.categoryId)
      return { ...b, name: cat?.name ?? b.categoryId, icon: cat?.icon ?? '📦', color: cat?.color ?? KZ.t2 }
    }),
    [budgets]
  )

  const totals = useMemo(() => ({
    planned: budgets.reduce((s, b) => s + b.planned, 0),
    spent:   budgets.reduce((s, b) => s + b.spent,   0),
    over:    budgets.filter(b => b.spent > b.planned).length,
  }), [budgets])

  function handleSave(categoryId: string, planned: number) {
    updateBudget(categoryId, planned)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Orçamento</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Controle de gastos por categoria</Typography>
          </Box>
          <Button variant="outlined" startIcon={<AddIcon />} size="small"
            sx={{ borderColor: KZ.border, color: KZ.t2, fontSize: '0.75rem' }}>
            Nova categoria
          </Button>
        </Box>
      </motion.div>

      {/* Month nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
        <IconButton size="small" onClick={() => setMonthOffset(p => p - 1)} sx={{ color: KZ.t2, border: `1px solid ${KZ.border}` }}>
          <NavigateBeforeIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
          {monthLabel}
        </Typography>
        <IconButton size="small" onClick={() => setMonthOffset(p => p + 1)} sx={{ color: KZ.t2, border: `1px solid ${KZ.border}` }}>
          <NavigateNextIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Overview */}
      <Paper sx={{ p: 2.5, mb: 3, background: `linear-gradient(135deg, rgba(16,185,129,0.04) 0%, transparent 100%)`, border: `1px solid rgba(16,185,129,0.12)` }}>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.68rem', color: KZ.t2, fontWeight: 600 }}>
                Total gasto: {formatBRL(totals.spent)}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: KZ.t2, fontWeight: 600 }}>
                Limite: {formatBRL(totals.planned)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.round((totals.spent / totals.planned) * 100), 100)}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)',
                '& .MuiLinearProgress-bar': { bgcolor: totals.over > 0 ? KZ.red : KZ.green } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: KZ.green, letterSpacing: '-0.03em' }}>
                {formatBRL(totals.planned - totals.spent)}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>disponível</Typography>
            </Box>
            {totals.over > 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: KZ.red }}>{totals.over}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>estourado{totals.over > 1 ? 's' : ''}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Category grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' }, gap: 1.5 }}>
        {enriched.map((item, i) => (
          <motion.div key={item.categoryId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <BudgetCard item={item} onEdit={b => setDialog({ open: true, item: b })} />
          </motion.div>
        ))}
      </Box>

      <BudgetDialog
        open={dialog.open}
        item={dialog.item}
        onClose={() => setDialog({ open: false, item: null })}
        onSave={handleSave}
      />
    </Box>
  )
}
