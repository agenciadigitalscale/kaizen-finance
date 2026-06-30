import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Drawer, Avatar, Snackbar, Button } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import MicIcon           from '@mui/icons-material/Mic'
import HomeIcon          from '@mui/icons-material/Home'
import ReceiptLongIcon   from '@mui/icons-material/ReceiptLong'
import EmojiEventsIcon   from '@mui/icons-material/EmojiEvents'
import AppsIcon          from '@mui/icons-material/Apps'
import AddIcon           from '@mui/icons-material/Add'
import DonutLargeIcon    from '@mui/icons-material/DonutLarge'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BarChartIcon      from '@mui/icons-material/BarChart'
import WaterfallChartIcon from '@mui/icons-material/WaterfallChart'
import CreditCardIcon    from '@mui/icons-material/CreditCard'
import RadarIcon         from '@mui/icons-material/Radar'
import GroupsIcon        from '@mui/icons-material/Groups'
import SettingsIcon      from '@mui/icons-material/Settings'
import LogoutIcon        from '@mui/icons-material/Logout'
import ChevronRightIcon  from '@mui/icons-material/ChevronRight'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Transaction } from '@/types'
import { api } from '@/shared/lib/api'
import { useUiStore } from '@/shared/stores/uiStore'
import { useAuthStore, useUser, useHousehold } from '@/features/auth/authStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useVoiceCapture } from '@/shared/lib/useVoiceCapture'

type ParsedTx = Pick<Transaction, 'type' | 'amount' | 'description' | 'categoryId' | 'date'>
const HOLD_MS = 220  // tempo para diferenciar toque de "segurar"

const PRIMARY = [
  { label: 'Início', icon: <HomeIcon />,        path: '/app' },
  { label: 'Contas', icon: <ReceiptLongIcon />, path: '/app/bills' },
]
const PRIMARY_RIGHT = [
  { label: 'Metas', icon: <EmojiEventsIcon />, path: '/app/goals' },
]

const MORE_ITEMS = [
  { label: 'Orçamento',        icon: <DonutLargeIcon />,     path: '/app/budget',        desc: 'Controle de gastos do mês' },
  { label: 'Patrimônio',       icon: <AccountBalanceIcon />, path: '/app/patrimony',     desc: 'O que você tem e o que deve' },
  { label: 'Relatórios',       icon: <BarChartIcon />,       path: '/app/reports',       desc: 'Resumo e análise do mês' },
  { label: 'Previsão de caixa',icon: <WaterfallChartIcon />, path: '/app/cashflow',      desc: 'Seu dinheiro nos próximos dias' },
  { label: 'Minhas contas',    icon: <CreditCardIcon />,     path: '/app/accounts',      desc: 'Carteiras, bancos e cartões' },
  { label: 'Assinaturas',      icon: <RadarIcon />,          path: '/app/subscriptions', desc: 'Radar de cobranças recorrentes' },
  { label: 'Família',          icon: <GroupsIcon />,         path: '/app/family',        desc: 'Membros e visão compartilhada' },
  { label: 'Configurações',    icon: <SettingsIcon />,       path: '/app/settings',      desc: 'Perfil, senha e conta' },
]

const isActive = (path: string, pathname: string) =>
  path === '/app' ? pathname === '/app' : pathname.startsWith(path)

function NavBtn({ label, icon, path }: { label: string; icon: React.ReactNode; path: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const active = isActive(path, location.pathname)
  return (
    <Box
      onClick={() => navigate(path)}
      sx={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0.3, cursor: 'pointer', py: 0.5, color: active ? KZ.green : KZ.t2,
        transition: 'color 0.15s', '& svg': { fontSize: 23 },
      }}
    >
      {icon}
      <Typography sx={{ fontSize: '0.62rem', fontWeight: active ? 700 : 500 }}>{label}</Typography>
    </Box>
  )
}

export default function MobileBottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const openQuick = useUiStore(s => s.openQuickLaunch)
  const moreOpen  = useUiStore(s => s.moreOpen)
  const setMore   = useUiStore(s => s.setMoreOpen)
  const logout    = useAuthStore(s => s.logout)
  const user      = useUser()
  const household = useHousehold()
  const addTransaction = useTransactionsStore(s => s.addTransaction)
  const deleteTransaction = useTransactionsStore(s => s.deleteTransaction)

  const voice = useVoiceCapture()
  const holdTimer  = useRef<number | null>(null)
  const isHolding  = useRef(false)
  const [recording, setRecording] = useState(false)
  const [snack, setSnack] = useState<{ msg: string; txId?: string; error?: boolean } | null>(null)

  const moreActive = MORE_ITEMS.some(m => isActive(m.path, location.pathname))

  // Processa o texto reconhecido → IA → lança a transação
  async function processTranscript(text: string) {
    try {
      const res = await api.voice.parse(text) as { ok: boolean; data?: ParsedTx; error?: string }
      if (res.ok && res.data) {
        // A IA devolve o valor em reais → o app trabalha em centavos
        const d = { ...res.data, amount: Math.round((res.data.amount ?? 0) * 100) }
        if (d.amount > 0) {
          addTransaction(d)
          const txId = useTransactionsStore.getState().transactions[0]?.id
          const tipo = d.type === 'income' ? 'Receita' : d.type === 'transfer' ? 'Transferência' : 'Despesa'
          setSnack({ msg: `✅ ${tipo} de ${formatBRL(d.amount)} — ${d.description}`, txId })
        } else {
          // IA entendeu mas faltou valor → abre o lançamento pré-preenchido
          openQuick(d)
        }
        voice.setState('idle')
      } else {
        setSnack({ msg: res.error ?? 'Não entendi. Tente de novo.', error: true })
        voice.setState('idle')
      }
    } catch {
      setSnack({ msg: 'Erro de conexão. Tente de novo.', error: true })
      voice.setState('idle')
    }
  }

  function handlePressStart(e: React.PointerEvent) {
    e.preventDefault()
    isHolding.current = false
    holdTimer.current = window.setTimeout(() => {
      if (!voice.supported) { openQuick(); return }
      isHolding.current = true
      setRecording(true)
      voice.start()
    }, HOLD_MS)
  }

  function handlePressEnd() {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    if (isHolding.current) {
      isHolding.current = false
      setRecording(false)
      voice.stop(processTranscript)
    } else {
      openQuick()
    }
  }

  function handlePressCancel() {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    if (isHolding.current) { isHolding.current = false; setRecording(false); voice.abort() }
  }

  return (
    <>
      <Box
        sx={{
          position: 'relative', height: 64, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          bgcolor: 'rgba(6,10,14,0.98)', backdropFilter: 'blur(24px)',
          borderTop: `1px solid ${KZ.border}`,
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        {PRIMARY.map(item => <NavBtn key={item.path} {...item} />)}

        {/* Espaço central para o FAB */}
        <Box sx={{ flex: 1 }} />

        {PRIMARY_RIGHT.map(item => <NavBtn key={item.path} {...item} />)}

        {/* Mais */}
        <Box
          onClick={() => setMore(true)}
          sx={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 0.3, cursor: 'pointer', py: 0.5, color: moreActive ? KZ.green : KZ.t2, '& svg': { fontSize: 23 },
          }}
        >
          <AppsIcon />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: moreActive ? 700 : 500 }}>Mais</Typography>
        </Box>

        {/* FAB central — Lançar (assentado num encaixe) */}
        <Box sx={{
          position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
          width: 76, height: 64, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        }}>
          {/* Encaixe (cradle) — combina com o fundo da barra */}
          <Box sx={{
            position: 'absolute', top: -22, width: 70, height: 70, borderRadius: '50%',
            bgcolor: 'rgba(6,10,14,0.98)', border: `1px solid ${KZ.border}`,
          }} />
          {/* Halo pulsante */}
          <Box
            component={motion.div}
            animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              position: 'absolute', top: -18, width: 62, height: 62, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16,185,129,0.55) 0%, transparent 70%)',
            }}
          />
          {/* Botão — toque abre, segurar grava voz */}
          <Box
            component={motion.div} whileTap={{ scale: 0.88 }}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressCancel}
            onPointerCancel={handlePressCancel}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
            sx={{
              pointerEvents: 'auto', position: 'absolute', top: -16,
              width: 56, height: 56, borderRadius: '50%', cursor: 'pointer',
              touchAction: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
              background: recording ? KZ_GRADIENTS.danger : KZ_GRADIENTS.green,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: recording
                ? '0 6px 22px rgba(239,68,68,0.6), inset 0 1px 1px rgba(255,255,255,0.25)'
                : '0 6px 18px rgba(16,185,129,0.5), inset 0 1px 1px rgba(255,255,255,0.25)',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            {recording
              ? <MicIcon sx={{ fontSize: 26, color: '#fff' }} />
              : <>
                  <AddIcon sx={{ fontSize: 24, color: '#fff' }} />
                  <Typography sx={{ fontSize: '0.46rem', fontWeight: 900, color: '#fff', mt: -0.4, letterSpacing: '0.04em' }}>LANÇAR</Typography>
                </>
            }
          </Box>
        </Box>
      </Box>

      {/* Overlay de gravação / processamento (estilo WhatsApp) */}
      <AnimatePresence>
        {(recording || voice.state === 'processing') && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            sx={{
              position: 'fixed', left: 16, right: 16, bottom: 92, zIndex: 1400,
              px: 2, py: 1.5, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 1.5,
              background: 'rgba(8,12,18,0.98)', backdropFilter: 'blur(24px)',
              border: `1px solid ${recording ? KZ.red : KZ.border}`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            {recording ? (
              <>
                <Box component={motion.div}
                  animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: KZ.red, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: KZ.red, fontWeight: 700 }}>Ouvindo… solte para lançar</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: KZ.t1 }} noWrap>
                    {voice.transcript || 'Fale o que você gastou ou recebeu…'}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <Box component={motion.div}
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  sx={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${KZ.green}`, borderTopColor: 'transparent', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.82rem', color: KZ.t1 }}>Interpretando com a IA…</Typography>
              </>
            )}
          </Box>
        )}
      </AnimatePresence>

      {/* Confirmação do lançamento por voz */}
      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 84, md: 24 } }}
      >
        <Box sx={{
          px: 2, py: 1.4, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, maxWidth: 460,
          background: 'rgba(8,12,18,0.98)', backdropFilter: 'blur(24px)',
          border: `1px solid ${snack?.error ? KZ.red : KZ.borderGreen}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}>
          <Typography sx={{ flex: 1, fontSize: '0.82rem', color: KZ.t1 }}>{snack?.msg}</Typography>
          {snack?.txId && (
            <Button
              size="small"
              onClick={() => { deleteTransaction(snack.txId!); setSnack(null) }}
              sx={{ color: KZ.gold, fontWeight: 700, minWidth: 0 }}
            >
              Desfazer
            </Button>
          )}
        </Box>
      </Snackbar>

      {/* Drawer "Mais" */}
      <Drawer
        anchor="bottom" open={moreOpen} onClose={() => setMore(false)}
        slotProps={{ paper: { sx: {
          background: 'rgba(8,12,18,0.99)', backdropFilter: 'blur(40px)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22, border: `1px solid ${KZ.border}`, borderBottom: 'none',
        } } }}
      >
        <Box sx={{ pt: 1.2, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.18)' }} />
        </Box>

        <Box sx={{ px: 2, pt: 1.5, pb: `calc(env(safe-area-inset-bottom) + 16px)` }}>
          {/* Perfil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 2, px: 0.5 }}>
            <Avatar sx={{ width: 42, height: 42, bgcolor: 'rgba(16,185,129,0.15)', color: KZ.green, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }} noWrap>{user?.name}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }} noWrap>{household?.name ?? 'Finance'}</Typography>
            </Box>
            <Box
              onClick={() => { logout(); navigate('/login') }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: KZ.t2, cursor: 'pointer', px: 1, py: 0.8, borderRadius: 2, '&:active': { color: KZ.red } }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Sair</Typography>
            </Box>
          </Box>

          {/* Itens */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {MORE_ITEMS.map(item => {
              const active = isActive(item.path, location.pathname)
              return (
                <Box
                  key={item.path}
                  onClick={() => { navigate(item.path); setMore(false) }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 1.4, py: 1.3, borderRadius: 3, cursor: 'pointer',
                    bgcolor: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${active ? KZ.borderGreen : KZ.border}`,
                  }}
                >
                  <Box sx={{ color: active ? KZ.green : KZ.t1, display: 'flex', '& svg': { fontSize: 22 } }}>{item.icon}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: active ? KZ.green : KZ.t1 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: KZ.t3 }} noWrap>{item.desc}</Typography>
                  </Box>
                  <ChevronRightIcon sx={{ color: KZ.t3, fontSize: 20 }} />
                </Box>
              )
            })}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
