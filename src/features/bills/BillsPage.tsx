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

type TabKey = 'overdue' | 'today' | 'week' | 'month' | 'paid'

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
            {bill.endDate && (
              <Typography sx={{ fontSize: '0.62rem', color: KZ.gold, fontWeight: 600, ml: 0.5 }}>
                🏁 quita {new Date(bill.endDate + 'T12:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </Typography>
            )}
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
              <IconButton size="small" onClick={() => onPay(bill.id)}
                sx={{ color: KZ.t3, '&:hover': { color: KZ.green, bgcolor: 'rgba(16,185,129,0.12)' } }}>
                <CheckCircleIcon sx={{ fontSize: 17 }} />
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
export const EMPTY_BILL: Partial<Bill> = {
  name: '', amount: 0, dueDate: new Date().toISOString().slice(0, 10),
  frequency: 'monthly', categoryId: 'outros', isShared: false,
  reminderDays: 3, whatsappAlert: false, status: 'pending',
}

export function BillDialog({ open, bill, onClose, onSave }: {
  open: boolean; bill: Partial<Bill> | null; onClose: () => void; onSave: (b: Partial<Bill>) => void
}) {
  const [form, setForm] = useState<Partial<Bill>>(bill ?? EMPTY_BILL)
  const [amountStr, setAmountStr] = useState(bill?.amount ? (bill.amount / 100).toFixed(2) : '')

  const up = <K extends keyof Bill>(k: K, v: Bill[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    const amount = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0
    onSave({ ...form, amount, endDate: form.endDate || undefined })
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
        {form.frequency !== 'once' && (
          <TextField label="Data de quitação (opcional)" size="small" fullWidth type="date" value={form.endDate ?? ''}
            onChange={e => up('endDate', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Quando termina de pagar (ex: financiamento até dez/2027)."
          />
        )}
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

// ── Calendário mensal ─────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function BillsCalendar({ bills, onPay, onEdit, onDelete }: {
  bills: Bill[]
  onPay: (id: string) => void
  onEdit: (b: Bill) => void
  onDelete: (id: string) => void
}) {
  const [offset, setOffset]     = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const base = useMemo(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d }, [offset])
  const year = base.getFullYear(), month = base.getMonth()
  const monthKey  = `${year}-${pad2(month + 1)}`
  const todayStr  = new Date().toISOString().slice(0, 10)
  const firstDay  = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()

  const dueByDate = useMemo(() => {
    const m: Record<string, Bill[]> = {}
    for (const b of bills) if (b.dueDate.slice(0, 7) === monthKey) (m[b.dueDate] ??= []).push(b)
    return m
  }, [bills, monthKey])
  const endDates = useMemo(() => new Set(bills.filter(b => b.endDate?.slice(0, 7) === monthKey).map(b => b.endDate!)), [bills, monthKey])

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)]
  const selectedBills = selected ? (dueByDate[selected] ?? []) : []

  return (
    <Paper sx={{ p: 2 }}>
      {/* Nav do mês */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <IconButton size="small" onClick={() => { setOffset(o => o - 1); setSelected(null) }} sx={{ color: KZ.t2 }}>‹</IconButton>
        <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize' }}>{base.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Typography>
        <IconButton size="small" onClick={() => { setOffset(o => o + 1); setSelected(null) }} sx={{ color: KZ.t2 }}>›</IconButton>
      </Box>
      {/* Cabeçalho dias da semana */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', mb: 0.5 }}>
        {WEEKDAYS.map((w, i) => <Typography key={i} sx={{ textAlign: 'center', fontSize: '0.6rem', color: KZ.t3, fontWeight: 700 }}>{w}</Typography>)}
      </Box>
      {/* Grade */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.4 }}>
        {cells.map((day, i) => {
          if (day === null) return <Box key={i} />
          const dateStr = `${monthKey}-${pad2(day)}`
          const dayBills = dueByDate[dateStr] ?? []
          const isToday = dateStr === todayStr
          const hasEnd  = endDates.has(dateStr)
          const unpaid  = dayBills.filter(b => b.status !== 'paid')
          const overdue = unpaid.some(() => dateStr < todayStr)
          const dot = overdue ? KZ.red : isToday ? '#F97316' : unpaid.length ? KZ.gold : dayBills.length ? KZ.green : null
          const isSel = selected === dateStr
          return (
            <Box key={i} component={motion.div} whileTap={{ scale: 0.9 }} onClick={() => setSelected(isSel ? null : dateStr)}
              sx={{ aspectRatio: '1', borderRadius: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                bgcolor: isSel ? 'rgba(16,185,129,0.16)' : isToday ? 'rgba(249,115,22,0.08)' : 'transparent',
                border: `1px solid ${isSel ? KZ.green : isToday ? 'rgba(249,115,22,0.3)' : 'transparent'}` }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#F97316' : KZ.t1 }}>{day}</Typography>
              <Box sx={{ display: 'flex', gap: 0.3, mt: 0.2, height: 5, alignItems: 'center' }}>
                {dot && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dot }} />}
                {hasEnd && <Typography sx={{ fontSize: '0.5rem' }}>🏁</Typography>}
              </Box>
            </Box>
          )
        })}
      </Box>
      {/* Contas do dia selecionado */}
      {selected && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${KZ.border}` }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: KZ.t2, mb: 1 }}>
            {new Date(selected + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </Typography>
          {selectedBills.length > 0
            ? selectedBills.map(b => <BillCard key={b.id} bill={b} onPay={onPay} onEdit={onEdit} onDelete={onDelete} />)
            : <Typography sx={{ fontSize: '0.75rem', color: KZ.t3 }}>Nenhuma conta neste dia.</Typography>}
        </Box>
      )}
    </Paper>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BillsPage() {
  const { bills, addBill, updateBill, deleteBill, payBill } = useBillsStore()
  const [dialog, setDialog]     = useState<{ open: boolean; bill: Partial<Bill> | null }>({ open: false, bill: null })
  const [tab, setTab]           = useState<TabKey>('month')
  const [view, setView]         = useState<'list' | 'calendar'>('list')
  const monthStr = new Date().toISOString().slice(0, 7)

  const stats = useMemo(() => {
    let overdueCount = 0, todayCount = 0, weekCount = 0, monthCount = 0, paidCount = 0
    let totalOverdue = 0, totalMonth = 0
    for (const b of bills) {
      if (b.status === 'paid') { paidCount++; continue }
      const d = getDaysLeft(b.dueDate)
      if (d < 0)       { overdueCount++; totalOverdue += b.amount }
      else if (d === 0) todayCount++
      else if (d <= 7)  weekCount++
      if (b.dueDate.slice(0, 7) === monthStr) { monthCount++; totalMonth += b.amount }
    }
    return { overdueCount, todayCount, weekCount, monthCount, paidCount, totalOverdue, totalMonth }
  }, [bills, monthStr])

  const filtered = useMemo(() => {
    const sorted = [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    switch (tab) {
      case 'overdue': return sorted.filter(b => b.status !== 'paid' && getDaysLeft(b.dueDate) < 0)
      case 'today':   return sorted.filter(b => b.status !== 'paid' && getDaysLeft(b.dueDate) === 0)
      case 'week':    return sorted.filter(b => { const d = getDaysLeft(b.dueDate); return b.status !== 'paid' && d >= 1 && d <= 7 })
      case 'month':   return sorted.filter(b => b.status !== 'paid' && b.dueDate.slice(0, 7) === monthStr)
      case 'paid':    return sorted.filter(b => b.status === 'paid')
    }
  }, [bills, tab, monthStr])

  const TABS: { key: TabKey; label: string; count: number; danger?: boolean }[] = [
    { key: 'overdue', label: 'Atrasadas', count: stats.overdueCount, danger: true },
    { key: 'today',   label: 'Hoje',      count: stats.todayCount },
    { key: 'week',    label: '7 dias',    count: stats.weekCount },
    { key: 'month',   label: 'Este mês',  count: stats.monthCount },
    { key: 'paid',    label: 'Pagas',     count: stats.paidCount },
  ]

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
          { label: 'A pagar (mês)', value: formatBRL(stats.totalMonth), color: KZ.gold, icon: '📋', sub: `${stats.monthCount} conta${stats.monthCount !== 1 ? 's' : ''}` },
          { label: 'Em atraso', value: formatBRL(stats.totalOverdue), color: KZ.red, icon: '⚠️', sub: `${stats.overdueCount} conta${stats.overdueCount !== 1 ? 's' : ''}` },
          { label: 'Próximos 7 dias', value: String(stats.weekCount), color: KZ.blue, icon: '📅', sub: 'vencimentos' },
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

      {/* Toggle Lista / Calendário */}
      <Box sx={{ display: 'flex', gap: 0.8, mb: 2 }}>
        {(['list', 'calendar'] as const).map(v => (
          <Box key={v} component={motion.div} whileTap={{ scale: 0.95 }} onClick={() => setView(v)}
            sx={{ px: 1.6, py: 0.7, borderRadius: 2, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
              ...(view === v ? { bgcolor: 'rgba(16,185,129,0.16)', color: KZ.green, border: `1px solid ${KZ.green}` }
                             : { bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}` }) }}>
            {v === 'list' ? '☰ Lista' : '🗓️ Calendário'}
          </Box>
        ))}
      </Box>

      {view === 'calendar' && (
        <BillsCalendar bills={bills} onPay={handlePay} onEdit={b => setDialog({ open: true, bill: b })} onDelete={handleDelete} />
      )}

      {/* Abas */}
      {view === 'list' && <Box sx={{
        display: 'flex', gap: 0.8, mb: 2, overflowX: 'auto', pb: 0.5,
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        {TABS.map(t => {
          const active = tab === t.key
          const isDanger = t.danger && t.count > 0
          const activeColor = isDanger ? KZ.red : KZ.green
          return (
            <Box
              key={t.key} component={motion.div} whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.key)}
              sx={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.7, cursor: 'pointer',
                px: 1.6, py: 0.9, borderRadius: 2.5, transition: 'all 0.15s',
                ...(active
                  ? { bgcolor: `${activeColor}26`, border: `1px solid ${activeColor}` }
                  : { bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${KZ.border}` }),
              }}
            >
              <Typography sx={{ fontSize: '0.78rem', fontWeight: active ? 700 : 600, color: active ? activeColor : KZ.t2 }}>
                {t.label}
              </Typography>
              {t.count > 0 && (
                <Box sx={{
                  minWidth: 18, height: 18, px: 0.5, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isDanger ? KZ.red : active ? KZ.green : 'rgba(255,255,255,0.12)',
                  color: (isDanger || active) ? '#fff' : KZ.t2,
                }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, lineHeight: 1 }}>{t.count}</Typography>
                </Box>
              )}
            </Box>
          )
        })}
      </Box>}

      {/* Bills list */}
      {view === 'list' && (
      <Paper sx={{ p: 1.5 }}>
        {stats.overdueCount > 0 && tab !== 'paid' && tab !== 'overdue' && (
          <Box
            component={motion.div} whileTap={{ scale: 0.99 }} onClick={() => setTab('overdue')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.2, py: 1, mb: 1, borderRadius: 2, cursor: 'pointer',
              bgcolor: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.25)` }}>
            <WarningAmberIcon sx={{ fontSize: 16, color: KZ.red }} />
            <Typography sx={{ fontSize: '0.74rem', color: KZ.red, fontWeight: 700, flex: 1 }}>
              {stats.overdueCount} conta{stats.overdueCount > 1 ? 's' : ''} em atraso — {formatBRL(stats.totalOverdue)}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: KZ.red, fontWeight: 700 }}>ver →</Typography>
          </Box>
        )}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.8rem' }}>{tab === 'overdue' || tab === 'today' ? '🎉' : tab === 'paid' ? '🧾' : '✅'}</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: KZ.t2, mt: 1, fontWeight: 600 }}>
                {tab === 'overdue' ? 'Nenhuma conta atrasada' :
                 tab === 'today'   ? 'Nada vence hoje' :
                 tab === 'week'    ? 'Nada nos próximos 7 dias' :
                 tab === 'paid'    ? 'Nenhuma conta paga ainda' :
                                     'Nenhuma conta neste mês'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: KZ.t3, mt: 0.5 }}>
                {tab === 'paid' ? 'Marque uma conta como paga para vê-la aqui.' : 'Tudo em dia por aqui. 👌'}
              </Typography>
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
      )}

      <BillDialog
        open={dialog.open}
        bill={dialog.bill}
        onClose={() => setDialog({ open: false, bill: null })}
        onSave={handleSave}
      />
    </Box>
  )
}
