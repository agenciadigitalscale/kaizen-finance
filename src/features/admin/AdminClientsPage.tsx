import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box, Typography, Paper, Button, TextField, Chip, IconButton,
  Menu, MenuItem, CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import GroupsIcon    from '@mui/icons-material/Groups'
import RefreshIcon   from '@mui/icons-material/Refresh'
import PaidIcon      from '@mui/icons-material/Paid'
import DeleteIcon    from '@mui/icons-material/Delete'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { api } from '@/shared/lib/api'

interface Client {
  user_id: string
  name: string
  email: string
  created_at: number
  household_id: string
  household_name: string
  plan: string
  sub_paid_until: number | null
  sub_method: string | null
  members: number
}

const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function statusOf(c: Client): { label: string; color: string; paid: boolean } {
  if (c.plan === 'lifetime') return { label: 'Vitalício', color: KZ.gold, paid: true }
  const now = Date.now()
  if (c.sub_paid_until && c.sub_paid_until > now) return { label: `Pago até ${fmtDate(c.sub_paid_until)}`, color: KZ.green, paid: true }
  if (c.sub_paid_until && c.sub_paid_until <= now) return { label: `Vencido em ${fmtDate(c.sub_paid_until)}`, color: KZ.red, paid: false }
  return { label: 'Trial / não pago', color: KZ.t2, paid: false }
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [q, setQ]             = useState('')
  const [menu, setMenu]       = useState<{ el: HTMLElement; hid: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await api.admin.clients() as { ok: boolean; data?: Client[]; error?: string }
      if (res.ok && res.data) setClients(res.data)
      else setError(res.error ?? 'Erro ao carregar')
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function markPaid(hid: string, method: string) {
    setMenu(null)
    await api.admin.markPaid(hid, method).catch(() => {})
    void load()
  }
  async function unpay(hid: string) {
    await api.admin.unpay(hid).catch(() => {})
    void load()
  }
  async function removeClient(c: Client) {
    if (!window.confirm(`Excluir ${c.name} (${c.email}) e TODOS os dados dele? Não dá pra desfazer.`)) return
    await api.admin.remove(c.household_id).catch(() => {})
    void load()
  }

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    return s ? clients.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)) : clients
  }, [clients, q])

  const stats = useMemo(() => ({
    total: clients.length,
    pagantes: clients.filter(c => statusOf(c).paid).length,
    vencidos: clients.filter(c => c.sub_paid_until && c.sub_paid_until <= Date.now() && c.plan !== 'lifetime').length,
  }), [clients])

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsIcon sx={{ color: KZ.green, fontSize: 22 }} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Clientes</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Controle de assinaturas — painel do dono</Typography>
          </Box>
          <IconButton onClick={load} sx={{ color: KZ.t2, border: `1px solid ${KZ.border}` }}><RefreshIcon fontSize="small" /></IconButton>
        </Box>
      </motion.div>

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 2.5 }}>
        {[
          { label: 'Clientes', value: stats.total, color: KZ.blue },
          { label: 'Pagantes', value: stats.pagantes, color: KZ.green },
          { label: 'Vencidos', value: stats.vencidos, color: KZ.red },
        ].map(k => (
          <Paper key={k.label} sx={{ p: 2, border: `1px solid ${k.color}18`, background: `linear-gradient(135deg, ${k.color}06 0%, transparent 100%)` }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: KZ.t2 }}>{k.label}</Typography>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: k.color }}>{k.value}</Typography>
          </Paper>
        ))}
      </Box>

      <TextField size="small" fullWidth placeholder="Buscar por nome ou e-mail…" value={q} onChange={e => setQ(e.target.value)} sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: KZ.green }} /></Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ color: KZ.red, fontSize: '0.85rem' }}>{error}</Typography></Paper>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}><Typography sx={{ color: KZ.t3 }}>Nenhum cliente encontrado.</Typography></Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map(c => {
            const st = statusOf(c)
            return (
              <Paper key={c.user_id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.name}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>{c.email}</Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mt: 0.3 }}>
                    Cadastro: {fmtDate(c.created_at)} · {c.members} membro{c.members > 1 ? 's' : ''}{c.sub_method ? ` · ${c.sub_method}` : ''}
                  </Typography>
                </Box>
                <Chip label={st.label} size="small" sx={{ bgcolor: `${st.color}1A`, color: st.color, border: `1px solid ${st.color}40`, fontWeight: 700, fontSize: '0.66rem' }} />
                {c.plan !== 'lifetime' && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="contained" startIcon={<PaidIcon sx={{ fontSize: 15 }} />}
                      onClick={e => setMenu({ el: e.currentTarget, hid: c.household_id })}
                      sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}>
                      Marcar pago
                    </Button>
                    {st.paid && (
                      <Button size="small" variant="text" onClick={() => unpay(c.household_id)} sx={{ color: KZ.t3, fontSize: '0.68rem', minWidth: 0 }}>
                        Desfazer
                      </Button>
                    )}
                  </Box>
                )}
                <IconButton size="small" onClick={() => removeClient(c)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }} title="Excluir cliente">
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Paper>
            )
          })}
        </Box>
      )}

      <Menu anchorEl={menu?.el} open={!!menu} onClose={() => setMenu(null)}>
        <Typography sx={{ px: 2, py: 0.5, fontSize: '0.62rem', color: KZ.t3, textTransform: 'uppercase' }}>Recebi via…</Typography>
        {['dinheiro', 'pix', 'cartão'].map(m => (
          <MenuItem key={m} onClick={() => menu && markPaid(menu.hid, m)} sx={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{m} · +1 mês</MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
