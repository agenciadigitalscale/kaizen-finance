import { useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material'
import { motion } from 'framer-motion'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon   from '@mui/icons-material/Person'
import LockIcon     from '@mui/icons-material/Lock'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { useUser, useHousehold, useIsDemo, useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'

function Feedback({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null
  return (
    <Alert severity={msg.type} sx={{ mt: 1.5, fontSize: '0.78rem', py: 0.5,
      bgcolor: msg.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      color: msg.type === 'success' ? KZ.green : KZ.red, border: `1px solid ${msg.type === 'success' ? KZ.borderGreen : 'rgba(239,68,68,0.25)'}` }}>
      {msg.text}
    </Alert>
  )
}

export default function SettingsPage() {
  const user        = useUser()
  const household   = useHousehold()
  const isDemo      = useIsDemo()
  const patchProfile = useAuthStore(s => s.patchProfile)

  const [name, setName]               = useState(user?.name ?? '')
  const [householdName, setHName]     = useState(household?.name ?? '')
  const [profileMsg, setProfileMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileLoading, setPL]       = useState(false)

  const [curPw, setCurPw]   = useState('')
  const [newPw, setNewPw]   = useState('')
  const [confPw, setConfPw] = useState('')
  const [pwMsg, setPwMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwLoading, setPwL] = useState(false)

  const [waPhone, setWaPhone] = useState('')
  const [waMsg, setWaMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [waLoading, setWaL]   = useState(false)

  async function testWhatsApp() {
    setWaMsg(null)
    if (isDemo) { setWaMsg({ type: 'error', text: 'Indisponível no modo demo.' }); return }
    if (!waPhone.trim()) { setWaMsg({ type: 'error', text: 'Informe seu número com DDD.' }); return }
    setWaL(true)
    try {
      const res = await api.whatsapp.test(waPhone.trim()) as { ok: boolean; error?: string }
      if (res.ok) setWaMsg({ type: 'success', text: 'Mensagem enviada! Confira seu WhatsApp.' })
      else setWaMsg({ type: 'error', text: res.error ?? 'Falha ao enviar.' })
    } catch { setWaMsg({ type: 'error', text: 'Erro de conexão.' }) }
    finally { setWaL(false) }
  }

  async function saveProfile() {
    setProfileMsg(null)
    if (!name.trim()) { setProfileMsg({ type: 'error', text: 'Informe seu nome.' }); return }
    if (isDemo) {
      patchProfile(name.trim(), householdName.trim())
      setProfileMsg({ type: 'success', text: 'Perfil atualizado (modo demo, local).' }); return
    }
    setPL(true)
    try {
      const res = await api.account.updateProfile({ name: name.trim(), householdName: householdName.trim() }) as { ok: boolean; error?: string }
      if (res.ok) { patchProfile(name.trim(), householdName.trim()); setProfileMsg({ type: 'success', text: 'Perfil atualizado!' }) }
      else setProfileMsg({ type: 'error', text: res.error ?? 'Erro ao salvar.' })
    } catch { setProfileMsg({ type: 'error', text: 'Erro de conexão.' }) }
    finally { setPL(false) }
  }

  async function changePassword() {
    setPwMsg(null)
    if (isDemo) { setPwMsg({ type: 'error', text: 'Trocar senha não está disponível no modo demo.' }); return }
    if (!curPw || !newPw) { setPwMsg({ type: 'error', text: 'Preencha a senha atual e a nova.' }); return }
    if (newPw.length < 8) { setPwMsg({ type: 'error', text: 'A nova senha precisa de no mínimo 8 caracteres.' }); return }
    if (newPw !== confPw) { setPwMsg({ type: 'error', text: 'A confirmação não confere.' }); return }
    setPwL(true)
    try {
      const res = await api.account.changePassword(curPw, newPw) as { ok: boolean; error?: string }
      if (res.ok) { setPwMsg({ type: 'success', text: 'Senha alterada com sucesso!' }); setCurPw(''); setNewPw(''); setConfPw('') }
      else setPwMsg({ type: 'error', text: res.error ?? 'Erro ao trocar senha.' })
    } catch { setPwMsg({ type: 'error', text: 'Erro de conexão.' }) }
    finally { setPwL(false) }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 640, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <SettingsIcon sx={{ color: KZ.green, fontSize: 22 }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Configurações</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mb: 3 }}>Seu perfil e segurança da conta</Typography>
      </motion.div>

      {/* Perfil */}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PersonIcon sx={{ fontSize: 18, color: KZ.t2 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Perfil</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Seu nome" size="small" fullWidth value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Nome da família / casa" size="small" fullWidth value={householdName} onChange={e => setHName(e.target.value)} />
          <TextField label="E-mail" size="small" fullWidth value={user?.email ?? ''} disabled
            helperText="O e-mail de login não pode ser alterado por aqui." />
        </Box>
        <Feedback msg={profileMsg} />
        <Button variant="contained" onClick={saveProfile} disabled={profileLoading}
          sx={{ mt: 2, background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700 }}>
          {profileLoading ? 'Salvando…' : 'Salvar perfil'}
        </Button>
      </Paper>

      {/* Senha */}
      <Paper sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon sx={{ fontSize: 18, color: KZ.t2 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Alterar senha</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Senha atual" type="password" size="small" fullWidth value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" />
          <TextField label="Nova senha" type="password" size="small" fullWidth value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" helperText="Mínimo 8 caracteres." />
          <TextField label="Confirmar nova senha" type="password" size="small" fullWidth value={confPw} onChange={e => setConfPw(e.target.value)} autoComplete="new-password" />
        </Box>
        <Feedback msg={pwMsg} />
        <Button variant="contained" onClick={changePassword} disabled={pwLoading}
          sx={{ mt: 2, background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700 }}>
          {pwLoading ? 'Alterando…' : 'Alterar senha'}
        </Button>
        <Typography sx={{ fontSize: '0.66rem', color: KZ.t3, mt: 1.5 }}>
          Por segurança, ao trocar a senha você será desconectado dos outros dispositivos.
        </Typography>
      </Paper>

      {/* WhatsApp */}
      <Paper sx={{ p: 2.5, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WhatsAppIcon sx={{ fontSize: 18, color: '#25D366' }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Alertas no WhatsApp</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.74rem', color: KZ.t2, mb: 2, lineHeight: 1.5 }}>
          Avise antes de cada vencimento direto no seu WhatsApp. Envie uma mensagem de teste para confirmar.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField label="Seu WhatsApp (com DDD)" size="small" fullWidth value={waPhone}
            onChange={e => setWaPhone(e.target.value)} placeholder="11999999999" />
          <Button variant="outlined" onClick={testWhatsApp} disabled={waLoading}
            sx={{ borderColor: '#25D366', color: '#25D366', borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap', '&:hover': { borderColor: '#25D366', bgcolor: 'rgba(37,211,102,0.06)' } }}>
            {waLoading ? 'Enviando…' : 'Testar'}
          </Button>
        </Box>
        <Feedback msg={waMsg} />
        <Typography sx={{ fontSize: '0.66rem', color: KZ.t3, mt: 1.5 }}>
          Requer integração Z-API configurada no servidor. O envio automático antes do vencimento é ativado no lançamento.
        </Typography>
      </Paper>
    </Box>
  )
}
