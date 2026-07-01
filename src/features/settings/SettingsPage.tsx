import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Paper, TextField, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { motion } from 'framer-motion'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon   from '@mui/icons-material/Person'
import LockIcon     from '@mui/icons-material/Lock'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import DownloadIcon from '@mui/icons-material/Download'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL } from '@/types'
import { useUser, useHousehold, useIsDemo, useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { downloadCsv } from '@/shared/lib/exportCsv'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useBillsStore } from '@/shared/stores/billsStore'

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
  const navigate    = useNavigate()
  const user        = useUser()
  const household   = useHousehold()
  const isDemo      = useIsDemo()
  const patchProfile = useAuthStore(s => s.patchProfile)
  const logout       = useAuthStore(s => s.logout)

  const [delOpen, setDelOpen]     = useState(false)
  const [delPw, setDelPw]         = useState('')
  const [delErr, setDelErr]       = useState('')
  const [delLoading, setDelLoad]  = useState(false)

  async function deleteAccount() {
    setDelErr('')
    if (isDemo) { setDelErr('Indisponível no modo demo.'); return }
    if (!delPw) { setDelErr('Digite sua senha para confirmar.'); return }
    setDelLoad(true)
    try {
      const res = await api.account.deleteAccount(delPw) as { ok: boolean; error?: string }
      if (res.ok) { logout(); navigate('/', { replace: true }) }
      else setDelErr(res.error ?? 'Erro ao excluir.')
    } catch { setDelErr('Erro de conexão.') }
    finally { setDelLoad(false) }
  }

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

  const transactions = useTransactionsStore(s => s.transactions)
  const bills        = useBillsStore(s => s.bills)

  function exportTransactions() {
    const rows: (string | number)[][] = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Status']]
    for (const t of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
      const tipo = t.type === 'income' ? 'Receita' : t.type === 'transfer' ? 'Transferência' : 'Despesa'
      rows.push([t.date, tipo, t.description, t.categoryId, formatBRL(t.amount).replace('R$', '').trim(), t.status])
    }
    downloadCsv(`kaizen-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  function exportBills() {
    const rows: (string | number)[][] = [['Nome', 'Valor (R$)', 'Vencimento', 'Frequência', 'Categoria', 'Status']]
    for (const b of [...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
      rows.push([b.name, formatBRL(b.amount).replace('R$', '').trim(), b.dueDate, b.frequency, b.categoryId, b.status])
    }
    downloadCsv(`kaizen-contas-${new Date().toISOString().slice(0, 10)}.csv`, rows)
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

      {/* Seus dados */}
      <Paper sx={{ p: 2.5, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DownloadIcon sx={{ fontSize: 18, color: KZ.t2 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>Seus dados</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.74rem', color: KZ.t2, mb: 2, lineHeight: 1.5 }}>
          Seus dados são seus. Baixe tudo em CSV (abre no Excel) quando quiser.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} onClick={exportTransactions}
            sx={{ borderColor: KZ.border, color: KZ.t1, borderRadius: 2, fontSize: '0.78rem', '&:hover': { borderColor: KZ.green } }}>
            Lançamentos (CSV)
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} onClick={exportBills}
            sx={{ borderColor: KZ.border, color: KZ.t1, borderRadius: 2, fontSize: '0.78rem', '&:hover': { borderColor: KZ.green } }}>
            Contas a pagar (CSV)
          </Button>
        </Box>
      </Paper>

      {/* Privacidade + Zona de perigo */}
      <Paper sx={{ p: 2.5, mt: 2, border: `1px solid rgba(239,68,68,0.2)` }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 1 }}>Privacidade e conta</Typography>
        <Typography component="span" onClick={() => navigate('/privacidade')}
          sx={{ fontSize: '0.76rem', color: KZ.green, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          Ler a Política de Privacidade
        </Typography>
        <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${KZ.border}` }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: KZ.red }}>Excluir minha conta</Typography>
          <Typography sx={{ fontSize: '0.7rem', color: KZ.t3, mt: 0.5, mb: 1.5 }}>
            Apaga permanentemente sua conta e todos os dados (contas, lançamentos, metas). Não dá pra desfazer.
          </Typography>
          <Button variant="outlined" onClick={() => { setDelOpen(true); setDelErr(''); setDelPw('') }}
            sx={{ borderColor: 'rgba(239,68,68,0.4)', color: KZ.red, borderRadius: 2, fontSize: '0.76rem', '&:hover': { borderColor: KZ.red, bgcolor: 'rgba(239,68,68,0.06)' } }}>
            Excluir conta e dados
          </Button>
        </Box>
      </Paper>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={delOpen} onClose={() => setDelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: KZ.red }}>Excluir conta permanentemente?</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: '0.8rem', color: KZ.t2, mb: 2, lineHeight: 1.5 }}>
            Isso apaga <strong>todos</strong> os seus dados e não pode ser desfeito. Digite sua senha para confirmar.
          </Typography>
          <TextField label="Sua senha" type="password" size="small" fullWidth autoFocus value={delPw}
            onChange={e => setDelPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && deleteAccount()} />
          {delErr && <Alert severity="error" sx={{ mt: 1.5, py: 0.5, fontSize: '0.76rem' }}>{delErr}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDelOpen(false)} sx={{ color: KZ.t2 }}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={delLoading} onClick={deleteAccount} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {delLoading ? 'Excluindo…' : 'Excluir tudo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
