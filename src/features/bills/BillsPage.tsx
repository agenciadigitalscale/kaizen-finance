import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, Tooltip, Divider,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import AddIcon           from '@mui/icons-material/Add'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import EditIcon          from '@mui/icons-material/Edit'
import DeleteIcon        from '@mui/icons-material/Delete'
import WhatsAppIcon      from '@mui/icons-material/WhatsApp'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import RepeatIcon        from '@mui/icons-material/Repeat'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Bill, type BillFrequency } from '@/types'
import { useBillsStore } from '@/shared/stores/billsStore'

const FREQ_LABELS: Record<BillFrequency, string> = {
  once: 'Única vez', weekly: 'Semanal', monthly: 'Mensal',
  bimonthly: 'Bimestral', quarterly: 'Trimestral', yearly: 'Anual',
}

const CATEGORY_ICONS: Record<string, string> = {
  moradia: '🏠', alimentacao: '🍕', transporte: '🚗', saude: '💊',
  educacao: '📚', lazer: '🎬', assinatura: '📱', outros: '📦',
}

function getDaysLeft(dueDate: string): number {
  const due  = new Date(dueDate)
  const now  = new Date()
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / 86400000)
}

// ── Status Chip ───────────────────────────────────────────────────────────────
function StatusBadge({ daysLeft, status }: { daysLeft: number; status: string }) {
  if (status === 'paid') return (
    <Chip label="Pago" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, border: `1px solid rgba(16,185,129,0.2)`, fontSize: '0.62rem', height: 20 }} />
  )
  if (daysLeft < 0)  return <Chip label={`${Math.abs(daysLeft)}d atrasado`} size="small" color="error" sx={{ fontSize: '0.62rem', height: 20 }} />
  if (daysLeft === 0) return <Chip label="Vence hoje" size="small" sx={{ bgcolor: 'rgba(249,115,22,0.12)', color: '#F97316', border: `1px solid rgba(249,115,22,0.3)`, fontSize: '0.62rem', height: 20 }} />
  if (daysLeft <= 3)  return <Chip label={`${daysLeft}d`} size="small" color="warning" sx={{ fontSize: '0.62rem', height: 20 }} />
  return <Chip label={`${daysLeft} dias`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, fontSize: '0.62rem', height: 20 }} />
}

// ── Bill Row ──────────────────────────────────────────────────────────────────
function BillCard({ bill, onPay, onEdit, onDelete }: {
  bill: Bill
  onPay: (id: string) => void
  onEdit: (bill: Bill) => void
  onDelete: (id: string) => void
}) {
  const daysLeft = getDaysLeft(bill.dueDate)
  const isOverdue = daysLeft < 0 && bill.status !== 'paid'
  const isUrgent  = daysLeft <= 3 && daysLeft >= 0 && bill.status !== 'paid'
  const isPaid    = bill.status === 'paid'
  const accentColor = isPaid ? KZ.green : isOverdue ? KZ.red : isUrgent ? KZ.gold : KZ.border

  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 2,
        borderRadius: 2, mb: 0.5,
        bgcolor: isOverdue ? 'rgba(239,68,68,0.04)' : isPaid ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)',
        border: `1px solid ${accentColor}28`,
        opacity: isPaid ? 0.65 : 1,
        transition: 'all 0.2s',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.025)', borderColor: `${accentColor}40` },
      }}>
        {/* Category icon */}
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${accentColor}10`, border: `1px solid ${accentColor}20`,
          fontSize: '1rem',
        }}>
          {CATEGORY_ICONS[bill.categoryId] ?? '📄'}
        </Box>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: isPaid ? KZ.t2 : KZ.t1 }}>
              {bill.name}
            </Typography>
            {bill.whatsappAlert && <WhatsAppIcon sx={{ fontSize: 12, color: '#25D366' }} />}
            {bill.isShared && (
              <Chip label="Compartilhado" size="small" sx={{ height: 16, fontSize: '0.52rem', bgcolor: 'rgba(59,130,246,0.08)', color: KZ.blue, border: `1px solid rgba(59,130,246,0.15)` }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
            <CalendarTodayIcon sx={{ fontSize: 10, color: KZ.t3 }} />
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>
              {new Date(bill.dueDate + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </Typography>
            <RepeatIcon sx={{ fontSize: 10, color: KZ.t3, ml: 0.5 }} />
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>{FREQ_LABELS[bill.frequency]}</Typography>
          </Box>
        </Box>

        {/* Amount + status */}
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: isPaid ? KZ.green : KZ.t1, letterSpacing: '-0.02em' }}>
            {formatBRL(bill.amount)}
          </Typography>
          <Box sx={{ mt: 0.4 }}>
            <StatusBadge daysLeft={daysLeft} status={bill.status} />
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0 }}>
          {!isPaid && (
            <Tooltip title="Marcar como pago">
              <IconButton size="small" onClick={() => onPay(bill.id)} sx={{ color: KZ.green, '&:hover': { bgcolor: 'rgba(16,185,129,0.1)' } }}>
                <CheckCircleIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(bill)} sx={{ color: KZ.t3 }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" onClick={() => onDelete(bill.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  )
}

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────
const EMPTY_BILL: Partial<Bill> = {
  name: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10),
  frequency: 'monthly', categoryId: 'outros', isShared: false,
  reminderDays: 3, whatsappAlert: false, status: 'pending',
}

function BillDialog({ open, bill, onClose, onSave }: {
  open: boolean; bill: Partial<Bill> | null; onClose: () => void; onSave: (b: Partial<Bill>) => void
}) {
  const [form, setForm] = useState<Partial<Bill>>(bill ?? EMPTY_BILL)
  const [amountStr, setAmountStr] = useState(bill?.amount ? (bill.amount / 100).toFixed(2) : '')

  const up = <K extends keyof Bill>(k: K, v: Bill[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    const amount = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0
    onSave({ ...form, amount })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {bill?.id ? 'Editar conta' : 'Nova conta a pagar'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome" size="small" fullWidth value={form.name} onChange={e => up('name', e.target.value)} autoFocus />
        <TextField
          label="Valor (R$)" size="small" fullWidth
          value={amountStr}
          onChange={e => setAmountStr(e.target.value)}
          placeholder="0,00"
        />
        <TextField label="Vencimento" size="small" fullWidth type="date" value={form.dueDate}
          onChange={e => up('dueDate', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl size="small" fullWidth>
          <InputLabel>Frequência</InputLabel>
          <Select value={form.frequency} label="Frequência" onChange={e => up('frequency', e.target.value as BillFrequency)}>
            {Object.entries(FREQ_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Categoria</InputLabel>
          <Select value={form.categoryId} label="Categoria" onChange={e => up('categoryId', e.target.value)}>
            {Object.entries(CATEGORY_ICONS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Lembrete (dias antes)" size="small" type="number" fullWidth
          value={form.reminderDays} onChange={e => up('reminderDays', Number(e.target.value))} />
        <Divider />
        <FormControlLabel control={<Switch checked={form.isShared} onChange={e => up('isShared', e.target.checked)} size="small" />} label={<Typography sx={{ fontSize: '0.82rem' }}>Compartilhado com parceiro(a)</Typography>} />
        <FormControlLabel control={<Switch checked={form.whatsappAlert} onChange={e => up('whatsappAlert', e.target.checked)} size="small" />} label={<Typography sx={{ fontSize: '0.82rem' }}>Alerta no WhatsApp</Typography>} />
        {form.whatsappAlert && (
          <TextField label="Número WhatsApp" size="small" fullWidth
            value={form.whatsappNumber ?? ''} onChange={e => up('whatsappNumber', e.target.value)}
            placeholder="11999999999" />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>
          {bill?.id ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillsPage() {
  const { bills, addBill, updateBill, deleteBill, payBill } = useBillsStore()
  const [dialog, setDialog]     = useState<{ open: boolean; bill: Partial<Bill> | null }>({ open: false, bill: null })
  const [filter, setFilter]     = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')

  const stats = useMemo(() => {
    const pending  = bills.filter(b => b.status === 'pending')
    const overdue  = bills.filter(b => b.status !== 'paid' && getDaysLeft(b.dueDate) < 0)
    const upcoming = bills.filter(b => b.status === 'pending' && getDaysLeft(b.dueDate) >= 0 && getDaysLeft(b.dueDate) <= 7)
    return {
      totalPending:  pending.reduce((s, b) => s + b.amount, 0),
      totalOverdue:  overdue.reduce((s, b) => s + b.amount, 0),
      upcomingCount: upcoming.length,
      overdueCount:  overdue.length,
    }
  }, [bills])

  const filtered = useMemo(() => {
    const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    if (filter === 'overdue') return sorted.filter(b => getDaysLeft(b.dueDate) < 0 && b.status !== 'paid')
    if (filter === 'pending') return sorted.filter(b => b.status === 'pending' && getDaysLeft(b.dueDate) >= 0)
    if (filter === 'paid')    return sorted.filter(b => b.status === 'paid')
    return sorted
  }, [bills, filter])

  function handlePay(id: string) { payBill(id) }
  function handleDelete(id: string) { deleteBill(id) }
  function handleSave(data: Partial<Bill>) {
    if (data.id) updateBill(data.id, data)
    else addBill(data)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Contas a Pagar</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Calendário de vencimentos e pagamentos</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, bill: EMPTY_BILL })}
            sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>
            Nova conta
          </Button>
        </Box>
      </motion.div>

      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2.5 }}>
        {[
          { label: 'A pagar (mês)', value: formatBRL(stats.totalPending), color: KZ.gold, icon: '📋', sub: `${bills.filter(b => b.status === 'pending').length} contas` },
          { label: 'Em atraso', value: formatBRL(stats.totalOverdue), color: KZ.red, icon: '⚠️', sub: `${stats.overdueCount} contas` },
          { label: 'Próximos 7 dias', value: String(stats.upcomingCount), color: KZ.blue, icon: '📅', sub: 'vencimentos' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Paper sx={{ p: 2, border: `1px solid ${card.color}18`, background: `linear-gradient(135deg, ${card.color}06 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.6rem', color: KZ.t2, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{card.label}</Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>{card.icon}</Typography>
              </Box>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: card.color, letterSpacing: '-0.02em' }}>{card.value}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: KZ.t3, mt: 0.4 }}>{card.sub}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap' }}>
        {([['all', 'Todas'], ['pending', 'Pendentes'], ['overdue', 'Atrasadas'], ['paid', 'Pagas']] as const).map(([key, label]) => (
          <Chip key={key} label={label} onClick={() => setFilter(key)} size="small"
            sx={{
              fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s',
              ...(filter === key
                ? { bgcolor: 'rgba(16,185,129,0.15)', color: KZ.green, border: `1px solid rgba(16,185,129,0.35)` }
                : { bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}` }
              ),
            }}
          />
        ))}
      </Box>

      {/* Bills list */}
      <Paper sx={{ p: 1.5 }}>
        {stats.overdueCount > 0 && filter !== 'paid' && filter !== 'pending' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.8, mb: 1, borderRadius: 1.5, bgcolor: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.15)` }}>
            <WarningAmberIcon sx={{ fontSize: 14, color: KZ.red }} />
            <Typography sx={{ fontSize: '0.72rem', color: KZ.red, fontWeight: 600 }}>
              {stats.overdueCount} conta{stats.overdueCount > 1 ? 's' : ''} em atraso — total: {formatBRL(stats.totalOverdue)}
            </Typography>
          </Box>
        )}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5rem' }}>✅</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: KZ.t3, mt: 1 }}>Nenhuma conta neste filtro</Typography>
            </Box>
          ) : (
            filtered.map(bill => (
              <BillCard key={bill.id} bill={bill}
                onPay={handlePay}
                onEdit={b => setDialog({ open: true, bill: b })}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </Paper>

      <BillDialog
        open={dialog.open}
        bill={dialog.bill}
        onClose={() => setDialog({ open: false, bill: null })}
        onSave={handleSave}
      />
    </Box>
  )
}
