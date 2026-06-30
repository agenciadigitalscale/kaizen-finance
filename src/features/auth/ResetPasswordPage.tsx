import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import { motion } from 'framer-motion'
import { KZ, KZ_GRADIENTS } from '@/theme'
import KaizenEmblem from '@/shared/components/KaizenEmblem'
import { api } from '@/shared/lib/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [pw, setPw]       = useState('')
  const [conf, setConf]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone]   = useState(false)

  async function handleReset() {
    setError('')
    if (!token) { setError('Link inválido. Solicite um novo na tela de login.'); return }
    if (pw.length < 8) { setError('A senha precisa de no mínimo 8 caracteres.'); return }
    if (pw !== conf) { setError('A confirmação não confere.'); return }
    setLoading(true)
    try {
      const res = await api.auth.reset(token, pw) as { ok: boolean; error?: string }
      if (res.ok) setDone(true)
      else setError(res.error ?? 'Não foi possível redefinir a senha.')
    } catch { setError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <Box sx={{
      minHeight: '100dvh', bgcolor: KZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      background: `radial-gradient(ellipse 800px 600px at 50% 40%, rgba(16,185,129,0.06) 0%, ${KZ.bg} 65%)`,
    }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'inline-flex', mb: 1.5 }}><KaizenEmblem size={64} /></Box>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Criar nova senha</Typography>
        </Box>

        <Box sx={{ bgcolor: KZ.surface, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 3, p: 3 }}>
          {done ? (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography sx={{ fontSize: '2.4rem' }}>✅</Typography>
              <Typography sx={{ fontWeight: 700, mt: 1 }}>Senha redefinida!</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: KZ.t2, mt: 0.5, mb: 2.5 }}>Já pode entrar com a nova senha.</Typography>
              <Button variant="contained" fullWidth onClick={() => navigate('/login', { replace: true })}
                sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700 }}>Ir para o login</Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <TextField label="Nova senha" type="password" size="small" fullWidth value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" autoFocus helperText="Mínimo 8 caracteres." />
              <TextField label="Confirmar nova senha" type="password" size="small" fullWidth value={conf} onChange={e => setConf(e.target.value)} autoComplete="new-password"
                onKeyDown={e => e.key === 'Enter' && handleReset()} />
              {error && <Alert severity="error" sx={{ py: 0.5, fontSize: '0.78rem' }}>{error}</Alert>}
              <Button variant="contained" fullWidth disabled={loading} onClick={handleReset}
                sx={{ mt: 0.5, py: 1.2, fontWeight: 700, borderRadius: 2, background: KZ_GRADIENTS.green }}>
                {loading ? <CircularProgress size={18} sx={{ color: '#000' }} /> : 'Redefinir senha'}
              </Button>
              <Typography component="span" onClick={() => navigate('/login')}
                sx={{ fontSize: '0.72rem', color: KZ.t2, cursor: 'pointer', textAlign: 'center', '&:hover': { color: KZ.green } }}>
                Voltar ao login
              </Typography>
            </Box>
          )}
        </Box>
      </motion.div>
    </Box>
  )
}
