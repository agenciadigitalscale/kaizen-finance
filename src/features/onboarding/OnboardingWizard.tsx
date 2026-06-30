import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Chip,
  LinearProgress, Paper,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon  from '@mui/icons-material/CheckCircle'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { useAccountsStore } from '@/shared/stores/accountsStore'
import { useBillsStore } from '@/shared/stores/billsStore'
import { useGoalsStore } from '@/shared/stores/goalsStore'
import { useTransactionsStore } from '@/shared/stores/transactionsStore'
import { useProfileStore, type HouseholdMode } from '@/shared/stores/profileStore'
import type { AccountType } from '@/types'

// ── Step types ────────────────────────────────────────────────────────────────
interface OnboardingState {
  income:        string
  mode:          HouseholdMode
  partnerName:   string
  accountName:   string
  accountType:   AccountType
  accountBank:   string
  balance:       string
  billName:      string
  billAmount:    string
  billDueDate:   string
  goalName:      string
  goalTarget:    string
  goalMonthly:   string
}

const INIT: OnboardingState = {
  income: '', mode: 'solo', partnerName: '',
  accountName: 'Conta Principal', accountType: 'checking', accountBank: 'Nubank', balance: '',
  billName: '', billAmount: '', billDueDate: '',
  goalName: '', goalTarget: '', goalMonthly: '',
}

const STEPS = [
  { id: 'welcome',  title: 'Bem-vindo ao Kaizen!',  icon: '💹' },
  { id: 'income',   title: 'Sua renda mensal',       icon: '💰' },
  { id: 'account',  title: 'Sua primeira conta',     icon: '🏦' },
  { id: 'bill',     title: 'Primeira conta a pagar', icon: '📋' },
  { id: 'goal',     title: 'Sua primeira meta',      icon: '🎯' },
  { id: 'family',   title: 'Sozinho ou em família?', icon: '👨‍👩‍👧' },
  { id: 'done',     title: 'Tudo pronto!',           icon: '🎉' },
]

const BANKS = ['Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 'Inter', 'C6 Bank', 'Caixa', 'XP', 'BTG', 'Outro']
const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Conta corrente', icon: '🏦' },
  { value: 'savings',  label: 'Poupança',        icon: '🐷' },
  { value: 'credit_card', label: 'Cartão de crédito', icon: '💳' },
  { value: 'investment', label: 'Investimentos', icon: '📈' },
]

// ── Step: Welcome ─────────────────────────────────────────────────────────────
function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
        <Typography sx={{ fontSize: '4rem', mb: 2 }}>💹</Typography>
      </motion.div>
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', mb: 1 }}>
        Boa vinda, {name}!
      </Typography>
      <Typography sx={{ fontSize: '0.95rem', color: KZ.t2, mb: 3, lineHeight: 1.7 }}>
        Vamos configurar o Kaizen em <strong style={{ color: KZ.t1 }}>menos de 2 minutos</strong>.
        São 3 passos simples para você ter uma visão completa das suas finanças hoje mesmo.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
        {[
          { icon: '🏦', text: 'Adicionar sua conta bancária' },
          { icon: '📋', text: 'Cadastrar uma conta a pagar' },
          { icon: '🎯', text: 'Criar sua primeira meta financeira' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: `1px solid ${KZ.border}` }}>
              <Typography sx={{ fontSize: '1.2rem' }}>{item.icon}</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: KZ.t1 }}>{item.text}</Typography>
              <CheckCircleIcon sx={{ fontSize: 16, color: KZ.t3, ml: 'auto' }} />
            </Box>
          </motion.div>
        ))}
      </Box>
      <Button variant="contained" size="large" fullWidth onClick={onNext} endIcon={<ArrowForwardIcon />}
        sx={{ background: KZ_GRADIENTS.green, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', py: 1.5 }}>
        Começar configuração
      </Button>
    </Box>
  )
}

// ── Step: Account ─────────────────────────────────────────────────────────────
function StepAccount({ state, onChange, onNext, onSkip }: {
  state: OnboardingState; onChange: (k: keyof OnboardingState, v: string) => void; onNext: () => void; onSkip: () => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>
        Qual é a sua conta principal? Pode ser qualquer conta onde você recebe seu salário.
      </Typography>

      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, fontWeight: 600, mb: 1 }}>Tipo de conta</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {ACCOUNT_TYPES.map(t => (
            <Box key={t.value} onClick={() => onChange('accountType', t.value)} sx={{
              p: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
              border: `1px solid ${state.accountType === t.value ? KZ.green : KZ.border}`,
              bgcolor: state.accountType === t.value ? 'rgba(16,185,129,0.08)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <Typography sx={{ fontSize: '1.3rem' }}>{t.icon}</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: state.accountType === t.value ? 700 : 400, color: state.accountType === t.value ? KZ.green : KZ.t2, mt: 0.4 }}>
                {t.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <TextField label="Nome da conta" size="small" fullWidth value={state.accountName}
        onChange={e => onChange('accountName', e.target.value)} />

      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, fontWeight: 600, mb: 1 }}>Banco</Typography>
        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
          {BANKS.map(b => (
            <Chip key={b} label={b} size="small" onClick={() => onChange('accountBank', b)}
              sx={{
                cursor: 'pointer', fontWeight: state.accountBank === b ? 700 : 400, transition: 'all 0.15s',
                ...(state.accountBank === b
                  ? { bgcolor: 'rgba(16,185,129,0.12)', color: KZ.green, border: `1px solid rgba(16,185,129,0.3)` }
                  : { bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}` }
                ),
              }} />
          ))}
        </Box>
      </Box>

      <TextField label="Saldo atual (R$) — opcional" size="small" fullWidth
        value={state.balance} onChange={e => onChange('balance', e.target.value)}
        placeholder="0,00" helperText="Pode ajustar depois" />

      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button variant="text" onClick={onSkip} sx={{ color: KZ.t3, flex: 0.5 }}>Pular</Button>
        <Button variant="contained" onClick={onNext} endIcon={<ArrowForwardIcon />}
          sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, flex: 1 }}>
          Continuar
        </Button>
      </Box>
    </Box>
  )
}

// ── Step: Bill ────────────────────────────────────────────────────────────────
function StepBill({ state, onChange, onNext, onSkip }: {
  state: OnboardingState; onChange: (k: keyof OnboardingState, v: string) => void; onNext: () => void; onSkip: () => void
}) {
  const SUGGESTIONS = ['Aluguel', 'Financiamento', 'Internet', 'Energia', 'Cartão de crédito', 'Plano de saúde']
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>
        Qual é a primeira conta a pagar que você quer acompanhar?
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
        {SUGGESTIONS.map(s => (
          <Chip key={s} label={s} size="small" onClick={() => onChange('billName', s)}
            sx={{ cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}`, '&:hover': { borderColor: KZ.green, color: KZ.green } }} />
        ))}
      </Box>
      <TextField label="Nome da conta" size="small" fullWidth value={state.billName}
        onChange={e => onChange('billName', e.target.value)} autoFocus />
      <TextField label="Valor (R$)" size="small" fullWidth value={state.billAmount}
        onChange={e => onChange('billAmount', e.target.value)} placeholder="0,00" />
      <TextField label="Vencimento" type="date" size="small" fullWidth value={state.billDueDate}
        onChange={e => onChange('billDueDate', e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }} />
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button variant="text" onClick={onSkip} sx={{ color: KZ.t3, flex: 0.5 }}>Pular</Button>
        <Button variant="contained" onClick={onNext} endIcon={<ArrowForwardIcon />}
          sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, flex: 1 }}>
          Continuar
        </Button>
      </Box>
    </Box>
  )
}

// ── Step: Goal ────────────────────────────────────────────────────────────────
function StepGoal({ state, onChange, onNext, onSkip }: {
  state: OnboardingState; onChange: (k: keyof OnboardingState, v: string) => void; onNext: () => void; onSkip: () => void
}) {
  const SUGGESTIONS = ['Fundo de emergência', 'Viagem', 'Trocar de carro', 'Reforma da casa', 'Notebook novo']
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>
        Qual é o seu sonho financeiro mais próximo? Vamos criar uma meta para chegar lá.
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
        {SUGGESTIONS.map(s => (
          <Chip key={s} label={s} size="small" onClick={() => onChange('goalName', s)}
            sx={{ cursor: 'pointer', bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}`, '&:hover': { borderColor: KZ.gold, color: KZ.gold } }} />
        ))}
      </Box>
      <TextField label="Nome da meta" size="small" fullWidth value={state.goalName}
        onChange={e => onChange('goalName', e.target.value)} autoFocus />
      <TextField label="Valor alvo (R$)" size="small" fullWidth value={state.goalTarget}
        onChange={e => onChange('goalTarget', e.target.value)} placeholder="0,00" />
      <TextField label="Vou guardar por mês (R$)" size="small" fullWidth value={state.goalMonthly}
        onChange={e => onChange('goalMonthly', e.target.value)} placeholder="0,00"
        helperText={
          state.goalTarget && state.goalMonthly
            ? `~${Math.ceil(parseFloat(state.goalTarget.replace(',','.')) / parseFloat(state.goalMonthly.replace(',','.')||'1'))} meses para atingir`
            : 'Quanto você consegue separar todo mês?'
        }
      />
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button variant="text" onClick={onSkip} sx={{ color: KZ.t3, flex: 0.5 }}>Pular</Button>
        <Button variant="contained" onClick={onNext} endIcon={<ArrowForwardIcon />}
          sx={{ background: KZ_GRADIENTS.gold, borderRadius: 2, fontWeight: 700, flex: 1, color: '#000' }}>
          Finalizar setup
        </Button>
      </Box>
    </Box>
  )
}

// ── Step: Income ──────────────────────────────────────────────────────────────
function StepIncome({ state, onChange, onNext, onSkip }: {
  state: OnboardingState; onChange: (k: keyof OnboardingState, v: string) => void; onNext: () => void; onSkip: () => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>
        Quanto entra de dinheiro por mês? Pode ser salário, pró-labore ou renda média. Isso ajuda o Kaizen a calcular sua saúde financeira.
      </Typography>
      <TextField
        label="Renda mensal (R$)" size="small" fullWidth value={state.income} autoFocus
        onChange={e => onChange('income', e.target.value)} placeholder="0,00"
        helperText="Você pode ajustar depois — fica entre você e o app."
      />
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button variant="text" onClick={onSkip} sx={{ color: KZ.t3, flex: 0.5 }}>Pular</Button>
        <Button variant="contained" onClick={onNext} endIcon={<ArrowForwardIcon />}
          sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, flex: 1 }}>
          Continuar
        </Button>
      </Box>
    </Box>
  )
}

// ── Step: Family ──────────────────────────────────────────────────────────────
function StepFamily({ state, onChange, onNext }: {
  state: OnboardingState; onChange: (k: keyof OnboardingState, v: string) => void; onNext: () => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>
        Você vai usar o Kaizen sozinho(a) ou junto com a família/parceiro(a)?
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
        {([
          { value: 'solo',   icon: '🧑', label: 'Só eu',        desc: 'Controle individual' },
          { value: 'family', icon: '👨‍👩‍👧', label: 'Em família', desc: 'Compartilhar com parceiro(a)' },
        ] as const).map(opt => (
          <Box key={opt.value} onClick={() => onChange('mode', opt.value)} sx={{
            p: 2, borderRadius: 2.5, cursor: 'pointer', textAlign: 'center',
            border: `1px solid ${state.mode === opt.value ? KZ.green : KZ.border}`,
            bgcolor: state.mode === opt.value ? 'rgba(16,185,129,0.08)' : 'transparent', transition: 'all 0.15s',
          }}>
            <Typography sx={{ fontSize: '1.8rem' }}>{opt.icon}</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: state.mode === opt.value ? KZ.green : KZ.t1, mt: 0.5 }}>{opt.label}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: KZ.t3, mt: 0.3 }}>{opt.desc}</Typography>
          </Box>
        ))}
      </Box>
      {state.mode === 'family' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <TextField label="Nome do parceiro(a) — opcional" size="small" fullWidth value={state.partnerName}
            onChange={e => onChange('partnerName', e.target.value)} placeholder="Ex: Ana" />
          <Typography sx={{ fontSize: '0.65rem', color: KZ.t3, mt: 1 }}>
            Você poderá convidá-lo(a) depois em <strong>Mais → Família</strong>.
          </Typography>
        </motion.div>
      )}
      <Button variant="contained" onClick={onNext} endIcon={<ArrowForwardIcon />}
        sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, mt: 1 }}>
        Finalizar
      </Button>
    </Box>
  )
}

// ── Step: Done ────────────────────────────────────────────────────────────────
function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}>
        <Typography sx={{ fontSize: '4rem', mb: 2 }}>🎉</Typography>
      </motion.div>
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', mb: 1.5 }}>
        Tudo configurado!
      </Typography>
      <Typography sx={{ fontSize: '0.92rem', color: KZ.t2, mb: 4, lineHeight: 1.7 }}>
        Seu Kaizen está pronto. Você já pode ver o seu <strong style={{ color: KZ.t1 }}>dashboard completo</strong>,
        acompanhar contas, metas e a previsão de caixa dos próximos 30 dias.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
        {[
          '✅ Conta bancária cadastrada',
          '✅ Conta a pagar adicionada',
          '✅ Meta financeira criada',
          '✅ Dashboard ativo',
        ].map(item => (
          <Typography key={item} sx={{ fontSize: '0.85rem', color: KZ.green, fontWeight: 600 }}>{item}</Typography>
        ))}
      </Box>
      <Button variant="contained" size="large" fullWidth onClick={onFinish}
        sx={{ background: KZ_GRADIENTS.green, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', py: 1.5,
          boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}>
        Ir para o dashboard
      </Button>
    </Box>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function OnboardingWizard({ userName }: { userName: string }) {
  const navigate = useNavigate()
  const { addAccount }  = useAccountsStore()
  const { addBill }     = useBillsStore()
  const { addGoal }     = useGoalsStore()
  const addTransaction  = useTransactionsStore(s => s.addTransaction)
  const { setMode, setMonthlyIncome, addMember } = useProfileStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OnboardingState>(INIT)

  const progress = (step / (STEPS.length - 1)) * 100

  function onChange(k: keyof OnboardingState, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleIncome() {
    if (form.income) {
      const cents = Math.round(parseFloat(form.income.replace(',', '.')) * 100) || 0
      if (cents > 0) {
        setMonthlyIncome(cents)
        // Lança a renda do mês como receita recorrente — o app já mostra movimento
        addTransaction({
          type: 'income', amount: cents, description: 'Salário', categoryId: 'receita',
          date: new Date().toISOString().slice(0, 8) + '05', status: 'confirmed', isRecurring: true,
        })
      }
    }
    setStep(2)
  }

  function handleAccount() {
    if (form.accountName) {
      addAccount({
        name: form.accountName, type: form.accountType, bank: form.accountBank,
        balance: form.balance ? Math.round(parseFloat(form.balance.replace(',', '.')) * 100) : 0,
        color: KZ.green, icon: '🏦', isShared: form.mode === 'family',
      })
    }
    setStep(3)
  }

  function handleBill() {
    if (form.billName && form.billAmount) {
      addBill({
        name: form.billName,
        amount: Math.round(parseFloat(form.billAmount.replace(',', '.')) * 100),
        dueDate: form.billDueDate || new Date().toISOString().slice(0, 10),
        frequency: 'monthly', categoryId: 'outros', status: 'pending',
        isShared: form.mode === 'family', reminderDays: 3, whatsappAlert: false,
      })
    }
    setStep(4)
  }

  function handleGoal() {
    if (form.goalName && form.goalTarget) {
      addGoal({
        name: form.goalName, type: 'savings',
        targetAmount: Math.round(parseFloat(form.goalTarget.replace(',', '.')) * 100),
        currentAmount: 0,
        monthlyContribution: form.goalMonthly ? Math.round(parseFloat(form.goalMonthly.replace(',', '.')) * 100) : 0,
        icon: '🎯', color: KZ.gold, status: 'active',
      })
    }
    setStep(5)
  }

  function handleFamily() {
    setMode(form.mode)
    if (form.mode === 'family' && form.partnerName.trim()) addMember(form.partnerName)
    setStep(6)
  }

  const stepProps = { state: form, onChange, onSkip: () => setStep(s => s + 1) }

  return (
    <Box sx={{
      minHeight: '100dvh', bgcolor: KZ.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      p: 2,
      background: `radial-gradient(ellipse 800px 600px at 50% 30%, rgba(16,185,129,0.05) 0%, ${KZ.bg} 65%)`,
    }}>
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Progress */}
        {step > 0 && step < STEPS.length - 1 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.65rem', color: KZ.t3 }}>Passo {step} de {STEPS.length - 2}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: KZ.green, fontWeight: 700 }}>{Math.round(progress)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress}
              sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: KZ.green } }} />
          </Box>
        )}

        <Paper sx={{ p: { xs: 3, md: 4 }, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step header */}
              {step > 0 && step < STEPS.length - 1 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{STEPS[step].icon}</Typography>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {STEPS[step].title}
                  </Typography>
                </Box>
              )}

              {step === 0 && <StepWelcome name={userName} onNext={() => setStep(1)} />}
              {step === 1 && <StepIncome  {...stepProps} onNext={handleIncome} />}
              {step === 2 && <StepAccount {...stepProps} onNext={handleAccount} />}
              {step === 3 && <StepBill    {...stepProps} onNext={handleBill} />}
              {step === 4 && <StepGoal    {...stepProps} onNext={handleGoal} />}
              {step === 5 && <StepFamily  {...stepProps} onNext={handleFamily} />}
              {step === 6 && <StepDone onFinish={() => navigate('/app', { replace: true })} />}
            </motion.div>
          </AnimatePresence>
        </Paper>
      </Box>
    </Box>
  )
}
