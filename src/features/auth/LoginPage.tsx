import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, TextField, Button, CircularProgress, Alert, Tab, Tabs } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from './authStore'
import { api } from '@/shared/lib/api'
import { KZ, KZ_GRADIENTS } from '@/theme'

type Mode = 'login' | 'signup'

interface AuthResponse {
  ok: boolean
  error?: string
  data?: {
    user: { id: string; email: string; name: string }
    household: { id: string; name: string }
    role: string
    color?: string
    accessToken: string
  }
}

export default function LoginPage() {
  const navigate   = useNavigate()
  const setAuth    = useAuthStore(s => s.setAuth)
  const [mode, setMode]         = useState<Mode>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({ name: '', email: '', password: '', householdName: '' })

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let res: AuthResponse
      if (mode === 'login') {
        res = await api.auth.login(form.email, form.password) as AuthResponse
      } else {
        if (!form.name || !form.householdName)
          { setError('Preencha todos os campos'); setLoading(false); return }
        res = await api.auth.signup({
          name: form.name, email: form.email, password: form.password, householdName: form.householdName,
        }) as AuthResponse
      }
      if (res.ok && res.data) {
        setAuth(
          { ...res.data.user, color: res.data.color },
          res.data.household,
          res.data.role,
          res.data.accessToken,
        )
        navigate('/app', { replace: true })
      } else {
        setError(res.error ?? 'Erro ao autenticar')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100dvh', bgcolor: KZ.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      p: 2,
      // Glow verde sutil no fundo
      background: `radial-gradient(ellipse 800px 600px at 50% 40%, rgba(16,185,129,0.06) 0%, ${KZ.bg} 65%)`,
    }}>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: '16px', mb: 2,
            background: KZ_GRADIENTS.green,
            boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
          }}>
            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>💹</Typography>
          </Box>
          <Typography sx={{
            fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.04em',
            background: KZ_GRADIENTS.green,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Kaizen
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: KZ.t3, mt: 0.4, letterSpacing: '0.04em' }}>
            Melhoria contínua das suas finanças
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{
          bgcolor: KZ.surface,
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Tabs */}
          <Tabs
            value={mode}
            onChange={(_, v) => { setMode(v); setError('') }}
            sx={{
              borderBottom: `1px solid ${KZ.border}`,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
              '& .MuiTabs-indicator': { background: KZ_GRADIENTS.green, height: 2 },
            }}
          >
            <Tab label="Entrar" value="login" />
            <Tab label="Criar conta" value="signup" />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}
                >
                  <TextField label="Seu nome" size="small" fullWidth value={form.name} onChange={update('name')} autoFocus />
                  <TextField label="Nome da família" size="small" fullWidth value={form.householdName} onChange={update('householdName')}
                    helperText='Ex: "Família Silva" ou "Kaique & Ana"' />
                </motion.div>
              )}
            </AnimatePresence>

            <TextField
              label="E-mail" type="email" size="small" fullWidth required
              value={form.email} onChange={update('email')}
              autoFocus={mode === 'login'}
            />
            <TextField
              label="Senha" type="password" size="small" fullWidth required
              value={form.password} onChange={update('password')}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e as never)}
            />

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Alert severity="error" sx={{ py: 0.5, fontSize: '0.78rem' }}>{error}</Alert>
              </motion.div>
            )}

            <Button
              type="submit" variant="contained" fullWidth
              disabled={loading}
              sx={{
                mt: 0.5, py: 1.2, fontWeight: 700, fontSize: '0.9rem', borderRadius: 2,
                background: KZ_GRADIENTS.green,
                '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' },
                '&:disabled': { background: 'rgba(255,255,255,0.08)', color: KZ.t3 },
              }}
            >
              {loading
                ? <CircularProgress size={18} sx={{ color: '#000' }} />
                : mode === 'login' ? 'Entrar' : 'Criar conta gratuita'
              }
            </Button>
          </Box>
        </Box>

        {/* Demo mode button */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text" fullWidth size="small"
            onClick={() => {
              setAuth(
                { id: 'demo', email: 'demo@kaizen.app', name: 'Kaique' },
                { id: 'h1', name: 'Família Kaique' },
                'owner',
                'demo-token',
              )
              navigate('/app', { replace: true })
            }}
            sx={{
              fontSize: '0.75rem', color: KZ.t2, border: `1px dashed ${KZ.border}`,
              borderRadius: 2, py: 0.8,
              '&:hover': { borderColor: KZ.green, color: KZ.green, bgcolor: 'rgba(16,185,129,0.05)' },
            }}
          >
            Entrar em modo demo (sem backend)
          </Button>
        </Box>

        <Typography sx={{ textAlign: 'center', mt: 1.5, fontSize: '0.68rem', color: KZ.t3 }}>
          Seus dados são privados e criptografados.
        </Typography>
      </motion.div>
    </Box>
  )
}
