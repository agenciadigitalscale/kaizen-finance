import { useState, useEffect } from 'react'
import {
  Drawer, Box, Typography, IconButton, Button, ToggleButtonGroup, ToggleButton,
  TextField, MenuItem, Chip,
} from '@mui/material'
import CloseIcon  from '@mui/icons-material/Close'
import CheckIcon  from '@mui/icons-material/Check'
import { motion } from 'framer-motion'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type TransactionType } from '@/types'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useAccountsStore } from '@/shared/stores/accountsStore'
import { useUiStore } from '@/shared/stores/uiStore'
import { useAllCategories } from '@/shared/stores/categoriesStore'
import VoiceInput from '@/features/transactions/VoiceInput'

const today = () => new Date().toISOString().slice(0, 10)

// Atalhos rápidos: prefill de tipo + categoria + descrição
const SHORTCUTS: { label: string; icon: string; type: TransactionType; categoryId: string; description: string }[] = [
  { label: 'Mercado',    icon: '🛒', type: 'expense', categoryId: 'alimentacao', description: 'Mercado' },
  { label: 'Gasolina',   icon: '⛽', type: 'expense', categoryId: 'transporte',  description: 'Gasolina' },
  { label: 'Restaurante',icon: '🍕', type: 'expense', categoryId: 'alimentacao', description: 'Restaurante' },
  { label: 'Pix',        icon: '⚡', type: 'expense', categoryId: 'outros',      description: 'Pix' },
  { label: 'Cartão',     icon: '💳', type: 'expense', categoryId: 'outros',      description: 'Cartão' },
  { label: 'Salário',    icon: '💰', type: 'income',  categoryId: 'receita',     description: 'Salário' },
]

export default function QuickLaunchSheet() {
  const open    = useUiStore(s => s.quickLaunchOpen)
  const prefill = useUiStore(s => s.quickLaunchPrefill)
  const close   = useUiStore(s => s.closeQuickLaunch)

  const accounts       = useAccountsStore(s => s.accounts)
  const addTransaction = useTransactionsStore(s => s.addTransaction)

  const [type, setType]               = useState<TransactionType>('expense')
  const [cents, setCents]             = useState(0)
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId]   = useState('outros')
  const [accountId, setAccountId]     = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [date, setDate]               = useState(today())
  const [isRecurring, setIsRecurring] = useState(false)
  const [status, setStatus]           = useState<'confirmed' | 'pending'>('confirmed')
  const [saved, setSaved]             = useState(false)

  const cats = useAllCategories(type === 'income' ? 'income' : 'expense')

  // Default da conta quando carregar / reabrir
  useEffect(() => {
    if (open && accounts.length && !accountId) {
      setAccountId(accounts[0].id)
      setToAccountId(accounts[1]?.id ?? accounts[0].id)
    }
  }, [open, accounts, accountId])

  // Aplica prefill (atalho, voz)
  useEffect(() => {
    if (open && prefill) {
      if (prefill.type) setType(prefill.type)
      if (prefill.amount != null) setCents(prefill.amount)
      if (prefill.description) setDescription(prefill.description)
      if (prefill.categoryId) setCategoryId(prefill.categoryId)
      if (prefill.date) setDate(prefill.date)
    }
  }, [open, prefill])

  function reset() {
    setType('expense'); setCents(0); setDescription(''); setCategoryId('outros')
    setDate(today()); setIsRecurring(false); setStatus('confirmed'); setSaved(false)
  }

  function applyShortcut(s: typeof SHORTCUTS[number]) {
    setType(s.type); setCategoryId(s.categoryId); setDescription(s.description)
  }

  function handleSave() {
    if (cents <= 0) return
    addTransaction({
      type, amount: cents, description: description.trim() || cats.find(c => c.id === categoryId)?.name || 'Lançamento',
      categoryId, accountId, date, status, isRecurring,
      ...(type === 'transfer' ? { toAccountId } : {}),
    })
    setSaved(true)
    setTimeout(() => { close(); reset() }, 750)
  }

  const accentColor = type === 'income' ? KZ.green : type === 'transfer' ? KZ.blue : KZ.red
  const valid = cents > 0 && !!accountId

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={() => { close(); reset() }}
      slotProps={{ paper: {
        sx: {
          background: 'rgba(8,12,18,0.99)', backdropFilter: 'blur(40px)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          border: `1px solid ${KZ.border}`, borderBottom: 'none',
          maxHeight: '92dvh',
        },
      } }}
    >
      {/* Grabber */}
      <Box sx={{ pt: 1.2, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.18)' }} />
      </Box>

      {saved ? (
        <Box sx={{ py: 7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: KZ_GRADIENTS.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon sx={{ fontSize: 36, color: '#fff' }} />
            </Box>
          </motion.div>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Lançamento salvo!</Typography>
          <Typography sx={{ color: KZ.t2, fontSize: '0.85rem' }}>{formatBRL(cents)} · {description}</Typography>
        </Box>
      ) : (
        <Box sx={{ px: 2.2, pb: `calc(env(safe-area-inset-bottom) + 16px)`, pt: 1, overflowY: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Novo lançamento</Typography>
            <IconButton size="small" onClick={() => { close(); reset() }} sx={{ color: KZ.t2 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Tipo */}
          <ToggleButtonGroup
            exclusive fullWidth value={type}
            onChange={(_, v) => v && setType(v)}
            sx={{
              mb: 2,
              '& .MuiToggleButton-root': {
                py: 1, fontWeight: 700, fontSize: '0.82rem', textTransform: 'none',
                border: `1px solid ${KZ.border}`, color: KZ.t2,
                '&.Mui-selected': { bgcolor: `${accentColor}1A`, color: accentColor, borderColor: accentColor },
              },
            }}
          >
            <ToggleButton value="expense">Despesa</ToggleButton>
            <ToggleButton value="income">Receita</ToggleButton>
            <ToggleButton value="transfer">Transferência</ToggleButton>
          </ToggleButtonGroup>

          {/* Valor grande */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Valor</Typography>
            <TextField
              variant="standard" fullWidth value={formatBRL(cents)}
              onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, '')))}
              slotProps={{
                input: { disableUnderline: true },
                htmlInput: { inputMode: 'numeric', style: { textAlign: 'center', fontSize: '2.4rem', fontWeight: 800, color: accentColor, letterSpacing: '-0.03em' } },
              }}
            />
          </Box>

          {/* Atalhos */}
          <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 1, mb: 1.5, '&::-webkit-scrollbar': { display: 'none' } }}>
            {SHORTCUTS.map(s => (
              <Chip
                key={s.label} label={`${s.icon} ${s.label}`} onClick={() => applyShortcut(s)}
                sx={{
                  flexShrink: 0, bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${KZ.border}`,
                  color: KZ.t1, fontWeight: 600, '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' },
                }}
              />
            ))}
          </Box>

          {/* Descrição + voz */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start' }}>
            <TextField
              fullWidth size="small" label="Descrição" value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box sx={{ pt: 0.4 }}>
              <VoiceInput onResult={(tx) => {
                // A IA devolve o valor em reais → converter para centavos
                setType(tx.type); setCents(Math.round((tx.amount ?? 0) * 100)); setDescription(tx.description)
                setCategoryId(tx.categoryId); if (tx.date) setDate(tx.date)
              }} />
            </Box>
          </Box>

          {/* Categoria (chips) */}
          {type !== 'transfer' && (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, mb: 0.6 }}>Categoria</Typography>
              <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
                {cats.map(c => {
                  const active = c.id === categoryId
                  return (
                    <Chip
                      key={c.id} label={`${c.icon} ${c.name}`} onClick={() => setCategoryId(c.id)}
                      sx={{
                        flexShrink: 0, fontWeight: 600,
                        bgcolor: active ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                        color: active ? KZ.green : KZ.t1,
                        border: `1px solid ${active ? KZ.green : KZ.border}`,
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
          )}

          {/* Conta + (conta destino) + data */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <TextField
              select fullWidth size="small" label={type === 'transfer' ? 'De' : 'Conta'}
              value={accountId} onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.icon} {a.name}</MenuItem>)}
            </TextField>
            {type === 'transfer' && (
              <TextField
                select fullWidth size="small" label="Para"
                value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}
              >
                {accounts.map(a => <MenuItem key={a.id} value={a.id}>{a.icon} {a.name}</MenuItem>)}
              </TextField>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              type="date" fullWidth size="small" label="Data" value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {/* Toggles: recorrente + pago/pendente */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2.2 }}>
            <Chip
              label={isRecurring ? '🔁 Recorrente' : 'Único'} onClick={() => setIsRecurring(v => !v)}
              sx={{
                flex: 1, py: 2, borderRadius: 2, fontWeight: 600,
                bgcolor: isRecurring ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.04)',
                color: isRecurring ? KZ.gold : KZ.t2, border: `1px solid ${isRecurring ? KZ.gold : KZ.border}`,
              }}
            />
            <Chip
              label={status === 'confirmed' ? '✅ Pago' : '⏳ Pendente'}
              onClick={() => setStatus(v => v === 'confirmed' ? 'pending' : 'confirmed')}
              sx={{
                flex: 1, py: 2, borderRadius: 2, fontWeight: 600,
                bgcolor: status === 'confirmed' ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
                color: status === 'confirmed' ? KZ.green : KZ.t2, border: `1px solid ${status === 'confirmed' ? KZ.green : KZ.border}`,
              }}
            />
          </Box>

          {/* Salvar */}
          <Button
            fullWidth variant="contained" disabled={!valid} onClick={handleSave}
            sx={{
              py: 1.6, fontSize: '1rem', fontWeight: 800, borderRadius: 3,
              background: valid ? KZ_GRADIENTS.green : 'rgba(255,255,255,0.06)',
              color: valid ? '#fff' : KZ.t3,
            }}
          >
            Salvar lançamento
          </Button>
        </Box>
      )}
    </Drawer>
  )
}
