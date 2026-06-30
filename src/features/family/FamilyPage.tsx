import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, Button, Avatar, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { motion } from 'framer-motion'
import PersonAddIcon  from '@mui/icons-material/PersonAdd'
import DeleteIcon     from '@mui/icons-material/Delete'
import GroupsIcon     from '@mui/icons-material/Groups'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL } from '@/types'
import { useUser, useHousehold } from '@/features/auth/authStore'
import { useProfileStore } from '@/shared/stores/profileStore'
import { useAccountsStore } from '@/shared/stores/accountsStore'

export default function FamilyPage() {
  const user      = useUser()
  const household = useHousehold()
  const { mode, monthlyIncome, members, setMode, addMember, removeMember } = useProfileStore()
  const accounts  = useAccountsStore(s => s.accounts)

  const [addOpen, setAddOpen] = useState(false)
  const [name, setName]       = useState('')

  const sharedAccounts = useMemo(() => accounts.filter(a => a.isShared), [accounts])
  const sharedBalance  = useMemo(() => sharedAccounts.reduce((s, a) => s + Math.max(a.balance, 0), 0), [sharedAccounts])

  function handleAdd() {
    if (name.trim()) { addMember(name); setName(''); setAddOpen(false) }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <GroupsIcon sx={{ color: KZ.green, fontSize: 22 }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Família</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mb: 3 }}>
          {household?.name ?? 'Sua casa'} · {mode === 'family' ? 'modo família' : 'uso individual'}
        </Typography>
      </motion.div>

      {/* Modo */}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 1.5 }}>
          Como você usa o Kaizen
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
          {([
            { value: 'solo',   icon: '🧑', label: 'Só eu' },
            { value: 'family', icon: '👨‍👩‍👧', label: 'Em família' },
          ] as const).map(opt => (
            <Box key={opt.value} component={motion.div} whileTap={{ scale: 0.97 }} onClick={() => setMode(opt.value)} sx={{
              p: 1.8, borderRadius: 2.5, cursor: 'pointer', textAlign: 'center',
              border: `1px solid ${mode === opt.value ? KZ.green : KZ.border}`,
              bgcolor: mode === opt.value ? 'rgba(16,185,129,0.08)' : 'transparent',
            }}>
              <Typography sx={{ fontSize: '1.6rem' }}>{opt.icon}</Typography>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: mode === opt.value ? KZ.green : KZ.t1, mt: 0.4 }}>{opt.label}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Membros */}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2 }}>
            Membros da casa
          </Typography>
          <Button size="small" startIcon={<PersonAddIcon sx={{ fontSize: 15 }} />} onClick={() => setAddOpen(true)}
            sx={{ fontSize: '0.72rem', color: KZ.green, bgcolor: 'rgba(16,185,129,0.06)', px: 1.2 }}>
            Adicionar
          </Button>
        </Box>

        {/* Owner */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, py: 1.2, borderBottom: members.length ? `1px solid ${KZ.border}` : 'none' }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(16,185,129,0.15)', color: KZ.green, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }} noWrap>{user?.name}</Typography>
            <Typography sx={{ fontSize: '0.66rem', color: KZ.t3 }}>{user?.email}</Typography>
          </Box>
          <Chip label="Dono(a)" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, fontSize: '0.6rem', height: 20 }} />
        </Box>

        {/* Partners */}
        {members.map(m => (
          <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.4, py: 1.2 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(59,130,246,0.15)', color: KZ.blue, fontWeight: 700, border: '1px solid rgba(59,130,246,0.25)' }}>
              {m.name[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }} noWrap>{m.name}</Typography>
              <Typography sx={{ fontSize: '0.66rem', color: KZ.t3 }}>Parceiro(a) · convite pendente</Typography>
            </Box>
            <IconButton size="small" onClick={() => removeMember(m.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
              <DeleteIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        ))}

        {members.length === 0 && (
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, mt: 1 }}>
            Adicione seu parceiro(a) para dividir o controle da casa. O convite por e-mail chega em breve.
          </Typography>
        )}
      </Paper>

      {/* Visão compartilhada */}
      <Paper sx={{ p: 2.5, background: `linear-gradient(135deg, rgba(16,185,129,0.04) 0%, transparent 60%)`, border: `1px solid rgba(16,185,129,0.15)` }}>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 1.5 }}>
          Visão da família
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: KZ.green }}>{formatBRL(sharedBalance)}</Typography>
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>saldo em contas compartilhadas</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: KZ.gold }}>{sharedAccounts.length}</Typography>
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>contas compartilhadas</Typography>
          </Box>
          {monthlyIncome > 0 && (
            <Box>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: KZ.blue }}>{formatBRL(monthlyIncome)}</Typography>
              <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>renda mensal</Typography>
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: '0.66rem', color: KZ.t3, mt: 1.5 }}>
          Marque contas e lançamentos como "compartilhados" para que apareçam na visão da família.
        </Typography>
      </Paper>

      {/* Dialog adicionar membro */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Adicionar membro</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField label="Nome do parceiro(a)" size="small" fullWidth autoFocus value={name}
            onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <Typography sx={{ fontSize: '0.66rem', color: KZ.t3, mt: 1.5 }}>
            Por enquanto adicionamos o membro à sua casa. O convite por e-mail (login próprio do parceiro) entra em breve.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ color: KZ.t2 }}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()} sx={{ background: KZ_GRADIENTS.green }}>Adicionar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
