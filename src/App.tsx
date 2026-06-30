import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Box, Typography, useMediaQuery, Tooltip, Avatar } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import DashboardIcon      from '@mui/icons-material/Dashboard'
import ReceiptIcon        from '@mui/icons-material/Receipt'
import SyncAltIcon        from '@mui/icons-material/SyncAlt'
import DonutLargeIcon     from '@mui/icons-material/DonutLarge'
import EmojiEventsIcon    from '@mui/icons-material/EmojiEvents'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import BarChartIcon       from '@mui/icons-material/BarChart'
import WaterfallChartIcon from '@mui/icons-material/WaterfallChart'
import CreditCardIcon     from '@mui/icons-material/CreditCard'
import RadarIcon          from '@mui/icons-material/Radar'
import GroupsIcon         from '@mui/icons-material/Groups'
import LogoutIcon         from '@mui/icons-material/Logout'
import { useAuthStore, useUser, useHousehold, useIsDemo } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { useBillsStore }        from '@/shared/stores/billsStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useAccountsStore }     from '@/shared/stores/accountsStore'
import { useGoalsStore }        from '@/shared/stores/goalsStore'
import { useBudgetStore }       from '@/shared/stores/budgetStore'
import { usePatrimonyStore }    from '@/shared/stores/patrimonyStore'
import LoginPage            from '@/features/auth/LoginPage'
import LandingPage          from '@/features/landing/LandingPage'
import OnboardingWizard     from '@/features/onboarding/OnboardingWizard'
import DashboardPage        from '@/features/dashboard/DashboardPage'
import BillsPage            from '@/features/bills/BillsPage'
import TransactionsPage     from '@/features/transactions/TransactionsPage'
import BudgetPage           from '@/features/budget/BudgetPage'
import GoalsPage            from '@/features/goals/GoalsPage'
import PatrimonyPage        from '@/features/patrimony/PatrimonyPage'
import ReportsPage          from '@/features/reports/ReportsPage'
import CashflowPage         from '@/features/cashflow/CashflowPage'
import AccountsPage         from '@/features/accounts/AccountsPage'
import SubscriptionsPage    from '@/features/subscriptions/SubscriptionsPage'
import FamilyPage           from '@/features/family/FamilyPage'
import QuickLaunchSheet     from '@/shared/components/QuickLaunchSheet'
import MobileBottomNav      from '@/shared/components/MobileBottomNav'
import BrandMark            from '@/shared/components/BrandMark'
import KaizenEmblem         from '@/shared/components/KaizenEmblem'
import { KZ, KZ_GRADIENTS } from '@/theme'

const NAV = [
  { label: 'Início',             icon: <DashboardIcon />,      path: '/app' },
  { label: 'Contas a pagar',     icon: <ReceiptIcon />,         path: '/app/bills' },
  { label: 'Entradas e saídas',  icon: <SyncAltIcon />,         path: '/app/transactions' },
  { label: 'Orçamento',          icon: <DonutLargeIcon />,      path: '/app/budget' },
  { label: 'Metas',              icon: <EmojiEventsIcon />,     path: '/app/goals' },
  { label: 'Patrimônio',         icon: <AccountBalanceIcon />,  path: '/app/patrimony' },
  { label: 'Relatórios',         icon: <BarChartIcon />,        path: '/app/reports' },
  { label: 'Previsão de caixa',  icon: <WaterfallChartIcon />,  path: '/app/cashflow' },
  { label: 'Minhas contas',      icon: <CreditCardIcon />,      path: '/app/accounts' },
  { label: 'Assinaturas',        icon: <RadarIcon />,           path: '/app/subscriptions' },
  { label: 'Família',            icon: <GroupsIcon />,          path: '/app/family' },
]

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useUser()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppShell() {
  const theme     = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const location  = useLocation()
  const navigate  = useNavigate()
  const user      = useUser()
  const household = useHousehold()
  const logout    = useAuthStore(s => s.logout)

  const activeIdx = NAV.findIndex(n =>
    n.path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(n.path)
  )

  const sidebar = (
    <Box sx={{
      width: { md: 220, lg: 240 }, height: '100%', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(8,12,18,0.99)', borderRight: `1px solid ${KZ.border}`,
    }}>
      {/* Logo */}
      <Box sx={{ px: 2.2, py: 2, borderBottom: `1px solid ${KZ.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ flexShrink: 0, display: 'flex' }}>
          <KaizenEmblem size={36} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '-0.02em', background: KZ_GRADIENTS.green, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kaizen
          </Typography>
          <Typography sx={{ fontSize: '0.5rem', color: KZ.t3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {household?.name ?? 'Finance'}
          </Typography>
        </Box>
      </Box>

      {/* Nav items */}
      <Box sx={{ flex: 1, px: 1, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.2, overflowY: 'auto' }}>
        {NAV.map((item, i) => {
          const isActive = i === activeIdx
          return (
            <Box key={item.path} onClick={() => navigate(item.path)} sx={{
              display: 'flex', alignItems: 'center', gap: 1.2, px: 1.4, py: 0.9, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
              bgcolor: isActive ? 'rgba(16,185,129,0.1)' : 'transparent',
              borderLeft: isActive ? `2.5px solid ${KZ.green}` : '2.5px solid transparent',
              '&:hover': { bgcolor: isActive ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)' },
            }}>
              <Box sx={{ color: isActive ? KZ.green : 'rgba(255,255,255,0.3)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
                {item.icon}
              </Box>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 400, color: isActive ? KZ.green : KZ.t2, transition: 'color 0.15s' }}>
                {item.label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* User footer */}
      <Box sx={{ px: 1.8, py: 1.4, borderTop: `1px solid ${KZ.border}`, display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'rgba(16,185,129,0.15)', color: KZ.green, border: '1px solid rgba(16,185,129,0.25)' }}>
          {user?.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }} noWrap>{user?.name}</Typography>
          <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }} noWrap>{user?.email}</Typography>
        </Box>
        <Tooltip title="Sair">
          <Box onClick={() => { logout(); navigate('/login') }} sx={{ cursor: 'pointer', color: KZ.t3, display: 'flex', '&:hover': { color: KZ.red }, transition: 'color 0.15s' }}>
            <LogoutIcon sx={{ fontSize: 16 }} />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100dvh', bgcolor: KZ.bg }}>
      {isDesktop && sidebar}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Barra superior com a marca — só mobile */}
        {!isDesktop && (
          <Box sx={{
            height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: `1px solid ${KZ.border}`,
            background: 'rgba(6,10,14,0.92)', backdropFilter: 'blur(20px)',
            pt: 'env(safe-area-inset-top)', gap: 1,
          }}>
            <KaizenEmblem size={30} />
            <BrandMark size={20} />
          </Box>
        )}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Routes>
                <Route path="/"              element={<DashboardPage />} />
                <Route path="/bills"         element={<BillsPage />} />
                <Route path="/transactions"  element={<TransactionsPage />} />
                <Route path="/budget"        element={<BudgetPage />} />
                <Route path="/goals"         element={<GoalsPage />} />
                <Route path="/patrimony"     element={<PatrimonyPage />} />
                <Route path="/reports"       element={<ReportsPage />} />
                <Route path="/cashflow"      element={<CashflowPage />} />
                <Route path="/accounts"      element={<AccountsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/family"        element={<FamilyPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Mobile bottom nav com FAB central + drawer "Mais" */}
        {!isDesktop && <MobileBottomNav />}
      </Box>

      {/* Lançamento rápido — disponível em todas as telas do app */}
      <QuickLaunchSheet />
    </Box>
  )
}

function StoreInitializer() {
  const isDemo   = useIsDemo()
  const user     = useUser()
  const navigate = useNavigate()
  const logout   = useAuthStore(s => s.logout)
  const accounts       = useAccountsStore(s => s.accounts)
  const initBills        = useBillsStore(s => s.init)
  const initTransactions = useTransactionsStore(s => s.init)
  const initAccounts     = useAccountsStore(s => s.init)
  const initGoals        = useGoalsStore(s => s.init)
  const initBudget       = useBudgetStore(s => s.init)
  const initPatrimony    = usePatrimonyStore(s => s.init)

  useEffect(() => {
    if (!user || isDemo) return
    void (async () => {
      // On page reload the access token lives only in memory — refresh it before initializing stores
      if (!useAuthStore.getState().accessToken) {
        type RefreshRes = { ok: boolean; data?: { accessToken: string } }
        const res = await api.auth.refresh().catch(() => null) as RefreshRes | null
        if (res?.ok && res.data?.accessToken) {
          useAuthStore.getState().setToken(res.data.accessToken)
        } else {
          logout()
          return
        }
      }
      await Promise.all([
        initAccounts(), initBills(), initTransactions(),
        initGoals(), initBudget(), initPatrimony(),
      ])
      // New user with no accounts → onboarding
      const currentAccounts = useAccountsStore.getState().accounts
      if (currentAccounts.length === 0) {
        navigate('/onboarding', { replace: true })
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isDemo])

  // Suppress unused warning — accounts used to re-render after init
  void accounts

  return null
}

export default function AppRoot() {
  const user = useUser()
  return (
    <>
      <StoreInitializer />
      <Routes>
        <Route path="/"           element={user ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingWrapper /></RequireAuth>} />
        <Route path="/app/*"      element={<RequireAuth><AppShell /></RequireAuth>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function OnboardingWrapper() {
  const user = useUser()
  return <OnboardingWizard userName={user?.name?.split(' ')[0] ?? 'você'} />
}
