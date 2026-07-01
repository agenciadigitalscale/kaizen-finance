import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Tooltip, Divider, Menu,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import AddIcon          from '@mui/icons-material/Add'
import EditIcon         from '@mui/icons-material/Edit'
import DeleteIcon       from '@mui/icons-material/Delete'
import CreditCardIcon   from '@mui/icons-material/CreditCard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Account, type AccountType } from '@/types'
import { useAccountsStore, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_ICONS } from '@/shared/stores/accountsStore'

const ACCOUNT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#6B7280',
]

const BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil',
  'Caixa Econômica', 'Inter', 'C6 Bank', 'XP Investimentos',
  'BTG Pactual', 'Sicoob', 'Sicredi', 'Outros',
]

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete, onGuardar }: {
  account: Account; onEdit: (a: Account) => void; onDelete: (id: string) => void
  onGuardar: (a: Account, e: HTMLElement) => void
}) {
  const isCredit = account.type === 'credit_card'
  const isInvest = account.type === 'investment'
  const isSavings = account.type === 'savings' || account.type === 'cash' || account.type === 'wallet'
  const balance  = account.balance
  const isNeg    = balance < 0
  const used     = isCredit && account.creditLimit ? Math.abs(balance) / account.creditLimit * 100 : 0

  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.15 }}>
      <Paper sx={{
        p: 0, overflow: 'hidden', position: 'relative',
        border: `1px solid ${account.color}22`,
        background: `linear-gradient(135deg, ${account.color}0A 0%, rgba(6,10,14,0) 100%)`,
      }}>
        {/* Color strip */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${account.color}, ${account.color}60)` }} />

        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: 2, display: 'flex', alignItems: 'center',
                justifyContent: 'center', bgcolor: `${account.color}15`, fontSize: '1.1rem',
                border: `1px solid ${account.color}25`,
              }}>
                {account.icon}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{account.name}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mt: 0.2 }}>
                  {account.bank && `${account.bank} · `}{ACCOUNT_TYPE_LABELS[account.type]}
                  {account.isShared ? ' · Compartilhado' : ''}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.3 }}>
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => onEdit(account)} sx={{ color: KZ.t3 }}>
                  <EditIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton size="small" onClick={() => onDelete(account.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
                  <DeleteIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Balance */}
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: isNeg ? KZ.red : isInvest ? KZ.gold : KZ.green, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {formatBRL(Math.abs(balance))}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mt: 0.4 }}>
            {isNeg ? 'fatura aberta' : isCredit ? 'disponível' : 'saldo disponível'}
          </Typography>

          {/* Guardar dinheiro (cofrinho) — acumula na conta */}
          {isSavings && (
            <Button size="small" fullWidth startIcon={<span>🐷</span>}
              onClick={e => onGuardar(account, e.currentTarget)}
              sx={{ mt: 1.5, borderRadius: 2, fontWeight: 700, fontSize: '0.76rem', color: KZ.green,
                bgcolor: 'rgba(16,185,129,0.08)', border: `1px solid ${account.color}30`,
                '&:hover': { bgcolor: 'rgba(16,185,129,0.14)' } }}>
              Guardar dinheiro
            </Button>
          )}

          {/* Credit card usage bar */}
          {isCredit && account.creditLimit && (
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>Limite utilizado</Typography>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: used > 80 ? KZ.red : used > 60 ? KZ.gold : KZ.green }}>
                  {Math.round(used)}%
                </Typography>
              </Box>
              <Box sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <Box sx={{
                  height: '100%', borderRadius: 2, transition: 'width 0.6s ease',
                  width: `${Math.min(used, 100)}%`,
                  bgcolor: used > 80 ? KZ.red : used > 60 ? KZ.gold : KZ.green,
                }} />
              </Box>
              <Typography sx={{ fontSize: '0.58rem', color: KZ.t3, mt: 0.4 }}>
                Limite total: {formatBRL(account.creditLimit)} · fecha dia {account.closingDay} · vence dia {account.dueDay}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </motion.div>
  )
}

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────
const EMPTY: Partial<Account> = {
  name: '', type: 'checking', color: KZ.green, icon: '🏦',
  balance: 0, isShared: true,
}

function AccountDialog({ open, account, onClose, onSave }: {
  open: boolean; account: Partial<Account> | null; onClose: () => void; onSave: (a: Partial<Account>) => void
}) {
  const [form, setForm] = useState<Partial<Account>>(account ?? EMPTY)
  const [balStr, setBalStr]   = useState(account?.balance !== undefined ? (Math.abs(account.balance) / 100).toFixed(2) : '')
  const [limStr, setLimStr]   = useState(account?.creditLimit ? (account.creditLimit / 100).toFixed(2) : '')
  const up = <K extends keyof Account>(k: K, v: Account[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    const balance     = Math.round(parseFloat(balStr.replace(',', '.'))  * 100) || 0
    const creditLimit = limStr ? Math.round(parseFloat(limStr.replace(',', '.')) * 100) : undefined
    onSave({ ...form, balance, creditLimit })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {account?.id ? 'Editar conta' : 'Nova conta / cartão'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome" size="small" fullWidth value={form.name ?? ''} onChange={e => up('name', e.target.value)} autoFocus />
        <FormControl size="small" fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select value={form.type} label="Tipo" onChange={e => up('type', e.target.value as AccountType)}>
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{ACCOUNT_TYPE_ICONS[k as AccountType]} {v}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Banco</InputLabel>
          <Select value={form.bank ?? ''} label="Banco" onChange={e => up('bank', e.target.value)}>
            {BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label={form.type === 'credit_card' ? 'Fatura atual (R$)' : 'Saldo atual (R$)'}
          size="small" fullWidth value={balStr} onChange={e => setBalStr(e.target.value)} placeholder="0,00"
        />
        {form.type === 'credit_card' && (
          <>
            <TextField label="Limite total (R$)" size="small" fullWidth value={limStr} onChange={e => setLimStr(e.target.value)} placeholder="0,00" />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField label="Dia fechamento" size="small" type="number" value={form.closingDay ?? ''} onChange={e => up('closingDay', Number(e.target.value))} />
              <TextField label="Dia vencimento" size="small" type="number" value={form.dueDay ?? ''} onChange={e => up('dueDay', Number(e.target.value))} />
            </Box>
          </>
        )}
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 0.8 }}>Ícone</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {['🏦', '💳', '🐷', '📈', '💵', '📱', '🏧', '💰', '🏛️', '💼'].map(icon => (
              <Box key={icon} onClick={() => up('icon', icon)} sx={{
                width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', cursor: 'pointer', border: `1px solid ${form.icon === icon ? KZ.green : KZ.border}`,
                bgcolor: form.icon === icon ? 'rgba(16,185,129,0.1)' : 'transparent', transition: 'all 0.15s',
              }}>
                {icon}
              </Box>
            ))}
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 0.8 }}>Cor</Typography>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            {ACCOUNT_COLORS.map(color => (
              <Box key={color} onClick={() => up('color', color)} sx={{
                width: 24, height: 24, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                border: form.color === color ? `3px solid white` : '3px solid transparent',
                boxShadow: form.color === color ? `0 0 0 1px ${color}` : 'none',
                transition: 'all 0.15s',
              }} />
            ))}
          </Box>
        </Box>
        <Divider />
        <FormControlLabel
          control={<Switch checked={form.isShared} onChange={e => up('isShared', e.target.checked)} size="small" />}
          label={<Typography sx={{ fontSize: '0.82rem' }}>Conta compartilhada com parceiro(a)</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>
          {account?.id ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccountsStore()
  const [dialog, setDialog] = useState<{ open: boolean; account: Partial<Account> | null }>({ open: false, account: null })
  const [guardarMenu, setGuardarMenu] = useState<{ el: HTMLElement; account: Account } | null>(null)
  const [customOpen, setCustomOpen]   = useState(false)
  const [customVal, setCustomVal]     = useState('')

  function guardar(amountCents: number) {
    const acc = guardarMenu?.account
    if (!acc || amountCents <= 0) return
    updateAccount(acc.id, { balance: acc.balance + amountCents })
    setGuardarMenu(null); setCustomOpen(false); setCustomVal('')
  }

  const totals = useMemo(() => {
    const liquid   = accounts.filter(a => ['checking','savings','cash','wallet'].includes(a.type))
    const invest   = accounts.filter(a => a.type === 'investment')
    const credit   = accounts.filter(a => a.type === 'credit_card')
    return {
      liquid:   liquid.reduce((s, a) => s + Math.max(a.balance, 0), 0),
      invest:   invest.reduce((s, a) => s + a.balance, 0),
      debt:     credit.reduce((s, a) => s + Math.max(-a.balance, 0), 0),
      total:    accounts.reduce((s, a) => s + a.balance, 0),
    }
  }, [accounts])

  function handleSave(data: Partial<Account>) {
    if (data.id) updateAccount(data.id, data)
    else addAccount(data as Omit<Account, 'id' | 'householdId' | 'createdAt'>)
  }

  const grouped = useMemo(() => {
    const order: AccountType[] = ['checking', 'savings', 'investment', 'credit_card', 'cash', 'wallet']
    return order.map(type => ({
      type,
      label: ACCOUNT_TYPE_LABELS[type],
      accounts: accounts.filter(a => a.type === type),
    })).filter(g => g.accounts.length > 0)
  }, [accounts])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Minhas Contas</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''} cadastrada{accounts.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, account: EMPTY })}
            sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>
            Nova conta
          </Button>
        </Box>
      </motion.div>

      {/* Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 1.5, mb: 3 }}>
        {[
          { label: 'Saldo total', value: formatBRL(totals.total), color: totals.total >= 0 ? KZ.green : KZ.red, icon: <AccountBalanceIcon sx={{ fontSize: 18 }} /> },
          { label: 'Dinheiro liquid.', value: formatBRL(totals.liquid), color: KZ.green, icon: '💵' },
          { label: 'Investimentos', value: formatBRL(totals.invest), color: KZ.gold, icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
          { label: 'Fatura aberta', value: formatBRL(totals.debt), color: KZ.red, icon: <CreditCardIcon sx={{ fontSize: 18 }} /> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Paper sx={{ p: 2, border: `1px solid ${kpi.color}18`, background: `linear-gradient(135deg, ${kpi.color}06 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{kpi.label}</Typography>
                <Box sx={{ color: kpi.color, fontSize: typeof kpi.icon === 'string' ? '0.9rem' : undefined }}>{kpi.icon}</Box>
              </Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Estado vazio */}
      {accounts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${KZ.border}` }}>
          <Typography sx={{ fontSize: '2.4rem' }}>🏦</Typography>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, mt: 1 }}>Nenhuma conta cadastrada</Typography>
          <Typography sx={{ fontSize: '0.78rem', color: KZ.t3, mt: 0.5, maxWidth: 320, mx: 'auto' }}>
            Adicione sua conta do banco, cartão de crédito, dinheiro ou investimentos para acompanhar seus saldos.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, account: EMPTY })}
            sx={{ mt: 2.5, background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.82rem' }}>
            Adicionar primeira conta
          </Button>
        </Paper>
      )}

      {/* Groups */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AnimatePresence>
          {grouped.map(group => (
            <motion.div key={group.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
                    {group.label}
                  </Typography>
                  <Chip label={group.accounts.length} size="small"
                    sx={{ height: 16, fontSize: '0.55rem', bgcolor: 'rgba(255,255,255,0.05)', color: KZ.t3 }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 1.5 }}>
                  {group.accounts.map((account, i) => (
                    <motion.div key={account.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <AccountCard
                        account={account}
                        onEdit={a => setDialog({ open: true, account: a })}
                        onDelete={deleteAccount}
                        onGuardar={(a, el) => setGuardarMenu({ el, account: a })}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      <AccountDialog
        open={dialog.open} account={dialog.account}
        onClose={() => setDialog({ open: false, account: null })}
        onSave={handleSave}
      />

      {/* Menu Guardar dinheiro — valores rápidos */}
      <Menu anchorEl={guardarMenu?.el} open={!!guardarMenu} onClose={() => setGuardarMenu(null)}>
        <Typography sx={{ px: 2, py: 0.5, fontSize: '0.62rem', color: KZ.t3, textTransform: 'uppercase' }}>
          Guardar em {guardarMenu?.account.name}
        </Typography>
        {[5000, 10000, 20000, 50000, 100000].map(v => (
          <MenuItem key={v} onClick={() => guardar(v)} sx={{ fontSize: '0.9rem', fontWeight: 700, color: KZ.green }}>
            + {formatBRL(v)}
          </MenuItem>
        ))}
        <MenuItem onClick={() => { setCustomOpen(true) }} sx={{ fontSize: '0.85rem', color: KZ.t2 }}>Outro valor…</MenuItem>
      </Menu>

      {/* Valor custom */}
      <Dialog open={customOpen} onClose={() => setCustomOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>🐷 Quanto guardar?</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField label="Valor (R$)" size="small" fullWidth autoFocus value={customVal}
            onChange={e => setCustomVal(e.target.value)} placeholder="0,00"
            onKeyDown={e => e.key === 'Enter' && guardar(Math.round(parseFloat(customVal.replace(',', '.')) * 100) || 0)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCustomOpen(false)} sx={{ color: KZ.t2 }}>Cancelar</Button>
          <Button variant="contained" onClick={() => guardar(Math.round(parseFloat(customVal.replace(',', '.')) * 100) || 0)}
            sx={{ background: KZ_GRADIENTS.green }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
