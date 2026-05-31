import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon    from '@mui/icons-material/Add'
import EditIcon   from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Asset, type AssetType, type Liability } from '@/types'
import { usePatrimonyStore } from '@/shared/stores/patrimonyStore'

const HISTORY_DATA = [
  { month: 'Jan', patrimony: 28500000 },
  { month: 'Fev', patrimony: 29100000 },
  { month: 'Mar', patrimony: 30200000 },
  { month: 'Abr', patrimony: 29800000 },
  { month: 'Mai', patrimony: 31500000 },
  { month: 'Jun', patrimony: 33670000 },
]

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  real_estate: 'Imóvel', vehicle: 'Veículo', investment: 'Investimento',
  savings: 'Poupança', business: 'Negócio', other: 'Outro',
}

const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  real_estate: '🏠', vehicle: '🚗', investment: '📈',
  savings: '💰', business: '💼', other: '📦',
}

// ── Asset Card ────────────────────────────────────────────────────────────────
function AssetCard({ asset, onEdit, onDelete }: {
  asset: Asset; onEdit: (a: Asset) => void; onDelete: (id: string) => void
}) {
  const gain     = asset.purchaseValue ? asset.currentValue - asset.purchaseValue : null
  const gainPct  = gain && asset.purchaseValue ? (gain / asset.purchaseValue * 100).toFixed(1) : null
  const isProfit = gain !== null && gain >= 0

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 1.5, borderRadius: 2,
      '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' }, transition: 'background 0.15s',
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(16,185,129,0.1)', fontSize: '1rem',
      }}>
        {ASSET_TYPE_ICONS[asset.type]}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }} noWrap>{asset.name}</Typography>
        <Chip label={ASSET_TYPE_LABELS[asset.type]} size="small"
          sx={{ height: 15, fontSize: '0.5rem', mt: 0.3, bgcolor: 'rgba(16,185,129,0.08)', color: KZ.green }} />
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: KZ.green }}>{formatBRL(asset.currentValue)}</Typography>
        {gain !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, justifyContent: 'flex-end', mt: 0.2 }}>
            {isProfit
              ? <TrendingUpIcon sx={{ fontSize: 10, color: KZ.green }} />
              : <TrendingDownIcon sx={{ fontSize: 10, color: KZ.red }} />}
            <Typography sx={{ fontSize: '0.6rem', color: isProfit ? KZ.green : KZ.red, fontWeight: 700 }}>
              {gainPct}%
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.2 }}>
        <IconButton size="small" onClick={() => onEdit(asset)} sx={{ color: KZ.t3 }}>
          <EditIcon sx={{ fontSize: 13 }} />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(asset.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
          <DeleteIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>
    </Box>
  )
}

// ── Liability Card ────────────────────────────────────────────────────────────
function LiabilityCard({ liability, onEdit, onDelete }: {
  liability: Liability; onEdit: (l: Liability) => void; onDelete: (id: string) => void
}) {
  const paidPct = Math.round(((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100)

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 1.5, borderRadius: 2,
      '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' }, transition: 'background 0.15s',
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'rgba(239,68,68,0.08)', fontSize: '1rem',
      }}>
        🏦
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }} noWrap>{liability.name}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: KZ.t3, mt: 0.2 }}>
          {liability.creditor} · {paidPct}% quitado · {formatBRL(liability.monthlyPayment)}/mês
          {liability.interestRate && ` · ${liability.interestRate}% a.m.`}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: KZ.red }}>
          -{formatBRL(liability.remainingAmount)}
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: KZ.t3, mt: 0.2 }}>
          total: {formatBRL(liability.totalAmount)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.2 }}>
        <IconButton size="small" onClick={() => onEdit(liability)} sx={{ color: KZ.t3 }}>
          <EditIcon sx={{ fontSize: 13 }} />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(liability.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
          <DeleteIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>
    </Box>
  )
}

// ── Asset Dialog ──────────────────────────────────────────────────────────────
function AssetDialog({ open, asset, onClose, onSave }: {
  open: boolean; asset: Partial<Asset> | null; onClose: () => void; onSave: (a: Partial<Asset>) => void
}) {
  const [form, setForm]       = useState<Partial<Asset>>(asset ?? { type: 'investment' })
  const [curStr, setCurStr]   = useState(asset?.currentValue  ? (asset.currentValue  / 100).toFixed(2) : '')
  const [purStr, setPurStr]   = useState(asset?.purchaseValue ? (asset.purchaseValue / 100).toFixed(2) : '')
  const up = <K extends keyof Asset>(k: K, v: Asset[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    onSave({ ...form, currentValue: Math.round(parseFloat(curStr.replace(',', '.')) * 100) || 0,
      purchaseValue: purStr ? Math.round(parseFloat(purStr.replace(',', '.')) * 100) : undefined })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>{asset?.id ? 'Editar ativo' : 'Novo ativo'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome" size="small" fullWidth value={form.name ?? ''} onChange={e => up('name', e.target.value)} autoFocus />
        <FormControl size="small" fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select value={form.type} label="Tipo" onChange={e => up('type', e.target.value as AssetType)}>
            {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{ASSET_TYPE_ICONS[k as AssetType]} {v}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Valor atual (R$)" size="small" fullWidth value={curStr} onChange={e => setCurStr(e.target.value)} placeholder="0,00" />
        <TextField label="Valor de compra (R$, opcional)" size="small" fullWidth value={purStr} onChange={e => setPurStr(e.target.value)} placeholder="0,00" />
        <TextField label="Data de compra (opcional)" size="small" type="date" fullWidth value={form.purchaseDate ?? ''} onChange={e => up('purchaseDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Observações" size="small" fullWidth multiline rows={2} value={form.notes ?? ''} onChange={e => up('notes', e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>{asset?.id ? 'Salvar' : 'Adicionar'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Liability Dialog ──────────────────────────────────────────────────────────
function LiabilityDialog({ open, liability, onClose, onSave }: {
  open: boolean; liability: Partial<Liability> | null; onClose: () => void; onSave: (l: Partial<Liability>) => void
}) {
  const [form, setForm]         = useState<Partial<Liability>>(liability ?? {})
  const [totalStr, setTotalStr] = useState(liability?.totalAmount   ? (liability.totalAmount   / 100).toFixed(2) : '')
  const [remStr, setRemStr]     = useState(liability?.remainingAmount ? (liability.remainingAmount / 100).toFixed(2) : '')
  const [monthStr, setMonthStr] = useState(liability?.monthlyPayment ? (liability.monthlyPayment / 100).toFixed(2) : '')
  const up = <K extends keyof Liability>(k: K, v: Liability[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    onSave({
      ...form,
      totalAmount:     Math.round(parseFloat(totalStr.replace(',', '.'))  * 100) || 0,
      remainingAmount: Math.round(parseFloat(remStr.replace(',', '.'))    * 100) || 0,
      monthlyPayment:  Math.round(parseFloat(monthStr.replace(',', '.'))  * 100) || 0,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>{liability?.id ? 'Editar dívida' : 'Nova dívida / passivo'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome" size="small" fullWidth value={form.name ?? ''} onChange={e => up('name', e.target.value)} autoFocus />
        <TextField label="Credor" size="small" fullWidth value={form.creditor ?? ''} onChange={e => up('creditor', e.target.value)} />
        <TextField label="Valor total (R$)" size="small" fullWidth value={totalStr} onChange={e => setTotalStr(e.target.value)} placeholder="0,00" />
        <TextField label="Saldo devedor atual (R$)" size="small" fullWidth value={remStr} onChange={e => setRemStr(e.target.value)} placeholder="0,00" />
        <TextField label="Parcela mensal (R$)" size="small" fullWidth value={monthStr} onChange={e => setMonthStr(e.target.value)} placeholder="0,00" />
        <TextField label="Juros (% a.m., opcional)" size="small" type="number" fullWidth value={form.interestRate ?? ''} onChange={e => up('interestRate', parseFloat(e.target.value))} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.danger }}>{liability?.id ? 'Salvar' : 'Adicionar'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Recharts Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'rgba(8,12,18,0.97)', border: `1px solid ${KZ.border}`, borderRadius: 2, p: 1.5 }}>
      <Typography sx={{ fontSize: '0.65rem', color: KZ.t3, mb: 0.3 }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: KZ.green }}>{formatBRL(payload[0].value)}</Typography>
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PatrimonyPage() {
  const { assets, liabilities, addAsset, updateAsset, deleteAsset, addLiability, updateLiability, deleteLiability } = usePatrimonyStore()
  const [assetDialog, setAssetDialog] = useState<{ open: boolean; asset: Partial<Asset> | null }>({ open: false, asset: null })
  const [liabDialog, setLiabDialog]   = useState<{ open: boolean; liability: Partial<Liability> | null }>({ open: false, liability: null })

  const totals = useMemo(() => {
    const totalAssets      = assets.reduce((s, a) => s + a.currentValue, 0)
    const totalLiabilities = liabilities.reduce((s, l) => s + l.remainingAmount, 0)
    return { assets: totalAssets, liabilities: totalLiabilities, net: totalAssets - totalLiabilities }
  }, [assets, liabilities])

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    assets.forEach(a => { map[a.type] = (map[a.type] ?? 0) + a.currentValue })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [assets])

  function saveAsset(data: Partial<Asset>) {
    if (data.id) updateAsset(data.id, data)
    else addAsset(data as Omit<Asset, 'id' | 'householdId' | 'updatedAt' | 'createdAt'>)
  }
  function saveLiability(data: Partial<Liability>) {
    if (data.id) updateLiability(data.id, data)
    else addLiability(data as Omit<Liability, 'id' | 'householdId' | 'createdAt'>)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Patrimônio</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Ativos, dívidas e patrimônio líquido</Typography>
          </Box>
        </Box>
      </motion.div>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Total de Ativos', value: formatBRL(totals.assets), color: KZ.green, icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
          { label: 'Total de Dívidas', value: formatBRL(totals.liabilities), color: KZ.red, icon: <TrendingDownIcon sx={{ fontSize: 18 }} /> },
          { label: 'Patrimônio Líquido', value: formatBRL(totals.net), color: totals.net >= 0 ? KZ.green : KZ.red, icon: <AccountBalanceIcon sx={{ fontSize: 18 }} /> },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Paper sx={{ p: 2.5, border: `1px solid ${kpi.color}18`, background: `linear-gradient(135deg, ${kpi.color}06 0%, transparent 100%)` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{kpi.label}</Typography>
                <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
              </Box>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.03em' }}>{kpi.value}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 2 }}>

        {/* Assets */}
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
              Ativos — {formatBRL(totals.assets)}
            </Typography>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => setAssetDialog({ open: true, asset: {} })}
              sx={{ fontSize: '0.7rem', color: KZ.green, bgcolor: 'rgba(16,185,129,0.06)', px: 1, py: 0.3, minHeight: 0 }}>
              Adicionar
            </Button>
          </Box>

          {/* By type breakdown */}
          <Box sx={{ mb: 2, display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
            {byType.map(([type, val]) => (
              <Tooltip key={type} title={`${ASSET_TYPE_LABELS[type as AssetType]}: ${formatBRL(val)}`}>
                <Chip label={`${ASSET_TYPE_ICONS[type as AssetType]} ${Math.round((val / totals.assets) * 100)}%`} size="small"
                  sx={{ height: 20, fontSize: '0.62rem', bgcolor: 'rgba(16,185,129,0.07)', color: KZ.green }} />
              </Tooltip>
            ))}
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          {assets.map(a => (
            <AssetCard key={a.id} asset={a}
              onEdit={a => setAssetDialog({ open: true, asset: a })}
              onDelete={deleteAsset}
            />
          ))}
        </Paper>

        {/* Liabilities */}
        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
              Dívidas — {formatBRL(totals.liabilities)}
            </Typography>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => setLiabDialog({ open: true, liability: {} })}
              sx={{ fontSize: '0.7rem', color: KZ.red, bgcolor: 'rgba(239,68,68,0.06)', px: 1, py: 0.3, minHeight: 0 }}>
              Adicionar
            </Button>
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          {liabilities.map(l => (
            <LiabilityCard key={l.id} liability={l}
              onEdit={l => setLiabDialog({ open: true, liability: l })}
              onDelete={deleteLiability}
            />
          ))}
        </Paper>

      </Box>

      {/* History chart */}
      <Paper sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 2 }}>
          Evolução do patrimônio
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HISTORY_DATA}>
              <defs>
                <linearGradient id="patriGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={KZ.green} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={KZ.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: KZ.t3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <RTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
              <Area type="monotone" dataKey="patrimony" stroke={KZ.green} strokeWidth={2} fill="url(#patriGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <AssetDialog open={assetDialog.open} asset={assetDialog.asset} onClose={() => setAssetDialog({ open: false, asset: null })} onSave={saveAsset} />
      <LiabilityDialog open={liabDialog.open} liability={liabDialog.liability} onClose={() => setLiabDialog({ open: false, liability: null })} onSave={saveLiability} />
    </Box>
  )
}
