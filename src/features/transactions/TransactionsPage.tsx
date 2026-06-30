import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, ToggleButton, ToggleButtonGroup, Tooltip, Snackbar,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import AddIcon          from '@mui/icons-material/Add'
import EditIcon         from '@mui/icons-material/Edit'
import DeleteIcon       from '@mui/icons-material/Delete'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SyncAltIcon      from '@mui/icons-material/SyncAlt'
import SearchIcon       from '@mui/icons-material/Search'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon   from '@mui/icons-material/NavigateNext'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Transaction, type TransactionType, DEFAULT_CATEGORIES } from '@/types'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import VoiceInput from './VoiceInput'

const CAT_MAP = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.group, c]))

function getCatIcon(categoryId: string) {
  return CAT_MAP[categoryId]?.icon ?? '📦'
}
function getCatColor(categoryId: string) {
  return CAT_MAP[categoryId]?.color ?? KZ.t3
}

const TYPE_ICON = {
  income:   <TrendingUpIcon sx={{ fontSize: 14 }} />,
  expense:  <TrendingDownIcon sx={{ fontSize: 14 }} />,
  transfer: <SyncAltIcon sx={{ fontSize: 14 }} />,
}

// ── Transaction Row ───────────────────────────────────────────────────────────
function TxRow({ tx, onEdit, onDelete }: {
  tx: Transaction
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}) {
  const isIncome   = tx.type === 'income'
  const isTransfer = tx.type === 'transfer'
  const color      = isIncome ? KZ.green : isTransfer ? KZ.blue : KZ.red
  const catColor   = getCatColor(tx.categoryId)

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, px: 1.5,
        borderRadius: 2, mb: 0.3,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' },
        transition: 'background 0.15s',
      }}>
        {/* Category icon */}
        <Box sx={{
          width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${catColor}12`, fontSize: '0.9rem',
        }}>
          {getCatIcon(tx.categoryId)}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: KZ.t1 }} noWrap>
            {tx.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
            <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>
              {new Date(tx.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </Typography>
            {tx.isRecurring && (
              <Chip label="Recorrente" size="small" sx={{ height: 14, fontSize: '0.5rem', bgcolor: 'rgba(59,130,246,0.08)', color: KZ.blue, px: 0.3 }} />
            )}
          </Box>
        </Box>

        {/* Amount */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, justifyContent: 'flex-end' }}>
            <Box sx={{ color, display: 'flex' }}>{TYPE_ICON[tx.type]}</Box>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
              {isIncome ? '+' : isTransfer ? '' : '-'}{formatBRL(tx.amount)}
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0 }}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(tx)} sx={{ color: KZ.t3 }}>
              <EditIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" onClick={() => onDelete(tx.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
              <DeleteIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  )
}

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────
const EMPTY_TX: Partial<Transaction> = {
  type: 'expense', amount: 0, description: '', categoryId: 'alimentacao',
  accountId: 'a1', date: new Date().toISOString().slice(0, 10), status: 'confirmed', isRecurring: false,
}

function TxDialog({ open, tx, onClose, onSave }: {
  open: boolean; tx: Partial<Transaction> | null; onClose: () => void; onSave: (t: Partial<Transaction>) => void
}) {
  const [form, setForm] = useState<Partial<Transaction>>(tx ?? EMPTY_TX)
  const [amountStr, setAmountStr] = useState(tx?.amount ? (tx.amount / 100).toFixed(2) : '')

  const up = <K extends keyof Transaction>(k: K, v: Transaction[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    const amount = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0
    onSave({ ...form, amount })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {tx?.id ? 'Editar lançamento' : 'Novo lançamento'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <ToggleButtonGroup value={form.type} exclusive size="small" fullWidth
          onChange={(_, v) => v && up('type', v as TransactionType)}
          sx={{ '& .MuiToggleButton-root': { fontWeight: 600, fontSize: '0.75rem', borderColor: KZ.border, flex: 1,
            '&.Mui-selected': { bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, borderColor: 'rgba(16,185,129,0.3)' } } }}>
          <ToggleButton value="income">Receita</ToggleButton>
          <ToggleButton value="expense">Despesa</ToggleButton>
          <ToggleButton value="transfer">Transferência</ToggleButton>
        </ToggleButtonGroup>
        <TextField label="Descrição" size="small" fullWidth value={form.description} onChange={e => up('description', e.target.value)} autoFocus />
        <TextField label="Valor (R$)" size="small" fullWidth value={amountStr} onChange={e => setAmountStr(e.target.value)} placeholder="0,00" />
        <TextField label="Data" size="small" fullWidth type="date" value={form.date} onChange={e => up('date', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <FormControl size="small" fullWidth>
          <InputLabel>Categoria</InputLabel>
          <Select value={form.categoryId} label="Categoria" onChange={e => up('categoryId', e.target.value)}>
            {DEFAULT_CATEGORIES.filter(c => form.type === 'income' ? c.type === 'income' : c.type === 'expense').map(c => (
              <MenuItem key={c.group} value={c.group}>{c.icon} {c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>
          {tx?.id ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionsStore()
  const [dialog, setDialog]     = useState<{ open: boolean; tx: Partial<Transaction> | null }>({ open: false, tx: null })
  const [voiceToast, setVoiceToast] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [search, setSearch]     = useState('')
  const [monthOffset, setMonthOffset] = useState(0)

  const currentDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const monthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthKey   = currentDate.toISOString().slice(0, 7)

  const filtered = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(monthKey))
      .filter(t => typeFilter === 'all' || t.type === typeFilter)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, monthKey, typeFilter, search])

  const stats = useMemo(() => {
    const month = transactions.filter(t => t.date.startsWith(monthKey))
    return {
      income:  month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: month.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      count:   month.length,
    }
  }, [transactions, monthKey])

  function handleDelete(id: string) { deleteTransaction(id) }
  function handleSave(data: Partial<Transaction>) {
    if (data.id) updateTransaction(data.id, data)
    else addTransaction(data)
  }

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    filtered.forEach(t => {
      const arr = map.get(t.date) ?? []
      arr.push(t)
      map.set(t.date, arr)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Lançamentos</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>{stats.count} transações em {monthLabel}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VoiceInput onResult={tx => {
              const amount = Math.round(tx.amount * 100)
              addTransaction({ ...EMPTY_TX, ...tx, amount })
              const label = tx.type === 'income' ? 'Receita' : 'Despesa'
              setVoiceToast(`${label} salva: ${tx.description} — R$ ${tx.amount.toFixed(2).replace('.', ',')}`)
            }} />
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => setDialog({ open: true, tx: { ...EMPTY_TX, date: new Date().toISOString().slice(0, 10) } })}
              sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>
              Novo lançamento
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Month nav + summary */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
        {[
          { label: 'Receitas', value: formatBRL(stats.income),  color: KZ.green, icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> },
          { label: 'Despesas', value: formatBRL(stats.expense), color: KZ.red,   icon: <TrendingDownIcon sx={{ fontSize: 16 }} /> },
          { label: 'Saldo',    value: formatBRL(stats.income - stats.expense), color: stats.income >= stats.expense ? KZ.green : KZ.red, icon: <SyncAltIcon sx={{ fontSize: 16 }} /> },
        ].map(s => (
          <Paper key={s.label} sx={{ p: 1.5, border: `1px solid ${s.color}18`, background: `linear-gradient(135deg, ${s.color}06 0%, transparent 100%)` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6, color: s.color }}>{s.icon}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{s.label}</Typography>
            </Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${KZ.border}`, borderRadius: 2, px: 1.2, py: 0.6, gap: 0.6, flex: 1, maxWidth: 300 }}>
          <SearchIcon sx={{ fontSize: 14, color: KZ.t3 }} />
          <TextField variant="standard" placeholder="Buscar..." size="small" value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: { disableUnderline: true, sx: { fontSize: '0.8rem', color: KZ.t1 } } }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.6 }}>
          {(['all', 'income', 'expense', 'transfer'] as const).map(t => (
            <Chip key={t} size="small" onClick={() => setTypeFilter(t)}
              label={t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : t === 'expense' ? 'Despesas' : 'Transferências'}
              sx={{
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                ...(typeFilter === t
                  ? { bgcolor: 'rgba(16,185,129,0.12)', color: KZ.green, border: `1px solid rgba(16,185,129,0.3)` }
                  : { bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}` }
                ),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Grouped list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <AnimatePresence>
          {grouped.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📭</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: KZ.t3 }}>Nenhuma transação encontrada</Typography>
            </Paper>
          ) : (
            grouped.map(([date, txs]) => (
              <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.08em', px: 1.5, mb: 0.5 }}>
                    {new Date(date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </Typography>
                  <Paper sx={{ p: 0.5 }}>
                    {txs.map(tx => (
                      <TxRow key={tx.id} tx={tx}
                        onEdit={t => setDialog({ open: true, tx: t })}
                        onDelete={handleDelete}
                      />
                    ))}
                  </Paper>
                </Box>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </Box>

      <TxDialog
        open={dialog.open}
        tx={dialog.tx}
        onClose={() => setDialog({ open: false, tx: null })}
        onSave={handleSave}
      />

      <Snackbar
        open={!!voiceToast}
        autoHideDuration={4000}
        onClose={() => setVoiceToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{
          bgcolor: 'rgba(16,185,129,0.97)', color: '#fff', fontWeight: 700,
          fontSize: '0.82rem', borderRadius: 2, px: 2.5, py: 1.2,
          boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          ✅ {voiceToast}
        </Box>
      </Snackbar>
    </Box>
  )
}
