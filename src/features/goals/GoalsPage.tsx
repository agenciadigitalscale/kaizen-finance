import { useState, useMemo } from 'react'
import {
  Box, Typography, Paper, LinearProgress, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Slider,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import AddIcon        from '@mui/icons-material/Add'
import EditIcon       from '@mui/icons-material/Edit'
import DeleteIcon     from '@mui/icons-material/Delete'
import PlayArrowIcon  from '@mui/icons-material/PlayArrow'
import PauseIcon      from '@mui/icons-material/Pause'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalculateIcon  from '@mui/icons-material/Calculate'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { formatBRL, type Goal, type GoalType } from '@/types'
import { useGoalsStore } from '@/shared/stores/goalsStore'

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  savings: 'Poupança', debt_payoff: 'Quitação de dívida', investment: 'Investimento',
  purchase: 'Compra', emergency_fund: 'Fundo emergência',
}

const GOAL_ICONS = ['🛡️', '✈️', '🚗', '💻', '🏦', '🏠', '💍', '🎓', '🚀', '🌴', '💰', '📱']

function monthsToGoal(remaining: number, monthly: number): number | null {
  if (monthly <= 0 || remaining <= 0) return null
  return Math.ceil(remaining / monthly)
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onToggle, onSimulate }: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onSimulate: (g: Goal) => void
}) {
  const pct       = goal.targetAmount > 0 ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0
  const remaining = goal.targetAmount - goal.currentAmount
  const months    = monthsToGoal(remaining, goal.monthlyContribution)
  const isCompleted = goal.status === 'completed'
  const isPaused    = goal.status === 'paused'

  // Atrasada / no prazo (só faz sentido para metas ativas com data alvo)
  const isLate = goal.status === 'active' && !!goal.targetDate && goal.currentAmount < goal.targetAmount && (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(goal.targetDate + 'T12:00')
    if (target < today) return true
    if (months != null) { const proj = new Date(); proj.setMonth(proj.getMonth() + months); return proj > target }
    return false
  })()
  const onTrack = goal.status === 'active' && !!goal.targetDate && !isLate && goal.currentAmount < goal.targetAmount

  const targetDate = goal.targetDate
    ? new Date(goal.targetDate + 'T12:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : null

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.15 }} layout>
      <Paper sx={{
        p: 2.5,
        border: `1px solid ${isCompleted ? KZ.green + '35' : goal.color + '20'}`,
        background: isCompleted
          ? 'rgba(16,185,129,0.04)'
          : `linear-gradient(135deg, ${goal.color}06 0%, transparent 100%)`,
        opacity: isPaused ? 0.7 : 1,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Corner glow */}
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${goal.color}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, mb: 2 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: `${goal.color}12`, border: `1px solid ${goal.color}25`, fontSize: '1.2rem', flexShrink: 0,
          }}>
            {goal.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.2 }}>{goal.name}</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap' }}>
              <Chip label={GOAL_TYPE_LABELS[goal.type]} size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: `${goal.color}10`, color: goal.color, border: `1px solid ${goal.color}25` }} />
              {isPaused && <Chip label="Pausado" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(255,255,255,0.05)', color: KZ.t3 }} />}
              {isCompleted && <Chip label="Concluído ✓" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green }} />}
              {isLate && <Chip label="Atrasada" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(239,68,68,0.12)', color: KZ.red, border: `1px solid rgba(239,68,68,0.3)` }} />}
              {onTrack && <Chip label="No prazo" size="small" sx={{ height: 16, fontSize: '0.5rem', bgcolor: 'rgba(16,185,129,0.1)', color: KZ.green, border: `1px solid rgba(16,185,129,0.25)` }} />}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.2, flexShrink: 0 }}>
            <Tooltip title="Simular">
              <IconButton size="small" onClick={() => onSimulate(goal)} sx={{ color: KZ.gold }}>
                <CalculateIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={isPaused ? 'Retomar' : 'Pausar'}>
              <IconButton size="small" onClick={() => onToggle(goal.id)} sx={{ color: KZ.t3 }}>
                {isPaused ? <PlayArrowIcon sx={{ fontSize: 14 }} /> : <PauseIcon sx={{ fontSize: 14 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(goal)} sx={{ color: KZ.t3 }}>
                <EditIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" onClick={() => onDelete(goal.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
                <DeleteIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>Progresso</Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: goal.color }}>{pct}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct}
            sx={{ height: 7, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': { bgcolor: goal.color, borderRadius: 4, boxShadow: `0 0 8px ${goal.color}50` } }} />
        </Box>

        {/* Amounts */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }}>Acumulado</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: goal.color, letterSpacing: '-0.02em' }}>
              {formatBRL(goal.currentAmount)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.58rem', color: KZ.t3 }}>Meta</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: KZ.t1, letterSpacing: '-0.02em' }}>
              {formatBRL(goal.targetAmount)}
            </Typography>
          </Box>
        </Box>

        {/* Footer info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.2, pt: 1.2, borderTop: `1px solid ${KZ.border}` }}>
          {months !== null && !isCompleted ? (
            <Typography sx={{ fontSize: '0.65rem', color: KZ.t2 }}>
              ~<strong style={{ color: goal.color }}>{months} meses</strong> contribuindo {formatBRL(goal.monthlyContribution)}/mês
            </Typography>
          ) : isCompleted ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 13, color: KZ.green }} />
              <Typography sx={{ fontSize: '0.65rem', color: KZ.green, fontWeight: 700 }}>Meta atingida!</Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.65rem', color: KZ.t3 }}>Contribuição não definida</Typography>
          )}
          {targetDate && <Typography sx={{ fontSize: '0.62rem', color: KZ.t3 }}>até {targetDate}</Typography>}
        </Box>
      </Paper>
    </motion.div>
  )
}

// ── Simulator Dialog ──────────────────────────────────────────────────────────
function SimulatorDialog({ open, goal, onClose }: { open: boolean; goal: Goal | null; onClose: () => void }) {
  const [monthly, setMonthly] = useState(goal?.monthlyContribution ? goal.monthlyContribution / 100 : 500)

  const remaining = goal ? goal.targetAmount - goal.currentAmount : 0
  const months = remaining > 0 && monthly > 0 ? Math.ceil(remaining / (monthly * 100)) : null
  const targetDate = months ? (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + months)
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  })() : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {goal?.icon} Simulador — {goal?.name}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '8px !important' }}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 1 }}>
            Quanto você consegue guardar por mês?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Slider
              value={monthly}
              onChange={(_, v) => setMonthly(v as number)}
              min={50} max={5000} step={50}
              sx={{ flex: 1, color: goal?.color ?? KZ.green }}
            />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: goal?.color ?? KZ.green, minWidth: 80, textAlign: 'right' }}>
              {formatBRL(Math.round(monthly * 100))}
            </Typography>
          </Box>
        </Box>

        <Paper sx={{ p: 2, background: `${goal?.color ?? KZ.green}08`, border: `1px solid ${goal?.color ?? KZ.green}20` }}>
          <Typography sx={{ fontSize: '0.62rem', color: KZ.t3, mb: 0.5 }}>Resultado da simulação</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t2 }}>Falta acumular</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: KZ.t1 }}>{formatBRL(remaining)}</Typography>
          </Box>
          {months !== null ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: KZ.t2 }}>Tempo estimado</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: goal?.color ?? KZ.green }}>
                  {months < 12
                    ? `${months} meses`
                    : `${(months / 12).toFixed(1)} anos`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.75rem', color: KZ.t2 }}>Conclusão prevista</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: goal?.color ?? KZ.green, textTransform: 'capitalize' }}>
                  {targetDate}
                </Typography>
              </Box>
            </>
          ) : (
            <Typography sx={{ fontSize: '0.82rem', color: KZ.red }}>
              Contribuição muito baixa para calcular
            </Typography>
          )}
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────
const EMPTY_GOAL: Partial<Goal> = {
  name: '', type: 'savings', targetAmount: 0, currentAmount: 0,
  monthlyContribution: 0, icon: '🎯', color: KZ.green, status: 'active',
}

function GoalDialog({ open, goal, onClose, onSave }: {
  open: boolean; goal: Partial<Goal> | null; onClose: () => void; onSave: (g: Partial<Goal>) => void
}) {
  const [form, setForm] = useState<Partial<Goal>>(goal ?? EMPTY_GOAL)
  const [targetStr, setTargetStr]   = useState(goal?.targetAmount   ? (goal.targetAmount   / 100).toFixed(2) : '')
  const [currentStr, setCurrentStr] = useState(goal?.currentAmount  ? (goal.currentAmount  / 100).toFixed(2) : '')
  const [monthlyStr, setMonthlyStr] = useState(goal?.monthlyContribution ? (goal.monthlyContribution / 100).toFixed(2) : '')

  const up = <K extends keyof Goal>(k: K, v: Goal[K]) => setForm(p => ({ ...p, [k]: v }))

  function handleSave() {
    onSave({
      ...form,
      targetAmount:        Math.round(parseFloat(targetStr.replace(',', '.'))  * 100) || 0,
      currentAmount:       Math.round(parseFloat(currentStr.replace(',', '.')) * 100) || 0,
      monthlyContribution: Math.round(parseFloat(monthlyStr.replace(',', '.')) * 100) || 0,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {goal?.id ? 'Editar meta' : 'Nova meta financeira'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nome da meta" size="small" fullWidth value={form.name} onChange={e => up('name', e.target.value)} autoFocus />
        <FormControl size="small" fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select value={form.type} label="Tipo" onChange={e => up('type', e.target.value as GoalType)}>
            {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
          {GOAL_ICONS.map(icon => (
            <Box key={icon} onClick={() => up('icon', icon)} sx={{
              width: 36, height: 36, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', cursor: 'pointer', border: `1px solid ${form.icon === icon ? KZ.green : KZ.border}`,
              bgcolor: form.icon === icon ? 'rgba(16,185,129,0.1)' : 'transparent', transition: 'all 0.15s',
            }}>
              {icon}
            </Box>
          ))}
        </Box>
        <TextField label="Valor alvo (R$)" size="small" fullWidth value={targetStr} onChange={e => setTargetStr(e.target.value)} placeholder="0,00" />
        <TextField label="Já tenho guardado (R$)" size="small" fullWidth value={currentStr} onChange={e => setCurrentStr(e.target.value)} placeholder="0,00" />
        <TextField label="Vou guardar por mês (R$)" size="small" fullWidth value={monthlyStr} onChange={e => setMonthlyStr(e.target.value)} placeholder="0,00" />
        <TextField label="Data limite (opcional)" size="small" type="date" fullWidth value={form.targetDate ?? ''} onChange={e => up('targetDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: KZ.t2 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ background: KZ_GRADIENTS.green }}>
          {goal?.id ? 'Salvar' : 'Criar meta'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleGoal } = useGoalsStore()
  const [dialog, setDialog]   = useState<{ open: boolean; goal: Partial<Goal> | null }>({ open: false, goal: null })
  const [simDialog, setSimDialog] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null })
  const [filter, setFilter]   = useState<'all' | 'active' | 'completed' | 'paused'>('all')

  const filtered = useMemo(() =>
    goals.filter(g => filter === 'all' || g.status === filter),
    [goals, filter]
  )

  const totals = useMemo(() => ({
    accumulated: goals.filter(g => g.status !== 'cancelled').reduce((s, g) => s + g.currentAmount, 0),
    target:      goals.filter(g => g.status !== 'cancelled').reduce((s, g) => s + g.targetAmount, 0),
    active:      goals.filter(g => g.status === 'active').length,
    completed:   goals.filter(g => g.status === 'completed').length,
  }), [goals])

  function handleToggle(id: string) { toggleGoal(id) }
  function handleDelete(id: string) { deleteGoal(id) }
  function handleSave(data: Partial<Goal>) {
    if (data.id) updateGoal(data.id, data)
    else addGoal(data)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Metas Financeiras</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>
              {totals.active} ativa{totals.active !== 1 ? 's' : ''} · {totals.completed} concluída{totals.completed !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, goal: EMPTY_GOAL })}
            sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>
            Nova meta
          </Button>
        </Box>
      </motion.div>

      {/* Overview */}
      <Paper sx={{ p: 2.5, mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center',
        background: `linear-gradient(135deg, rgba(245,158,11,0.04) 0%, transparent 100%)`,
        border: `1px solid rgba(245,158,11,0.15)` }}>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total acumulado</Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: KZ.gold, letterSpacing: '-0.03em' }}>{formatBRL(totals.accumulated)}</Typography>
        </Box>
        <Box sx={{ width: 1, height: 40, bgcolor: KZ.border, display: { xs: 'none', sm: 'block' } }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ fontSize: '0.65rem', color: KZ.t2 }}>
              {totals.target > 0 ? Math.round((totals.accumulated / totals.target) * 100) : 0}% do total das metas
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: KZ.t2 }}>Meta total: {formatBRL(totals.target)}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={totals.target > 0 ? Math.min(Math.round((totals.accumulated / totals.target) * 100), 100) : 0}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: KZ.gold } }} />
        </Box>
      </Paper>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.8, mb: 2.5 }}>
        {([['all', 'Todas'], ['active', 'Ativas'], ['completed', 'Concluídas'], ['paused', 'Pausadas']] as const).map(([k, l]) => (
          <Chip key={k} label={l} size="small" onClick={() => setFilter(k)} sx={{
            fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s',
            ...(filter === k
              ? { bgcolor: 'rgba(245,158,11,0.12)', color: KZ.gold, border: `1px solid rgba(245,158,11,0.3)` }
              : { bgcolor: 'rgba(255,255,255,0.04)', color: KZ.t2, border: `1px solid ${KZ.border}` }
            ),
          }} />
        ))}
      </Box>

      {/* Estado vazio */}
      {filtered.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', border: `1px dashed ${KZ.border}` }}>
          <Typography sx={{ fontSize: '2.4rem' }}>🎯</Typography>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, mt: 1 }}>
            {filter === 'all' ? 'Você ainda não criou nenhuma meta' : 'Nenhuma meta neste filtro'}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: KZ.t3, mt: 0.5, maxWidth: 320, mx: 'auto' }}>
            Comece com uma reserva de emergência ou um objetivo importante — tipo uma viagem ou quitar uma dívida.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, goal: EMPTY_GOAL })}
            sx={{ mt: 2.5, background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.82rem' }}>
            Criar primeira meta
          </Button>
        </Paper>
      )}

      {/* Goals grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' }, gap: 2 }}>
        <AnimatePresence>
          {filtered.map((goal, i) => (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.06 }}>
              <GoalCard
                goal={goal}
                onEdit={g  => setDialog({ open: true, goal: g })}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onSimulate={g => setSimDialog({ open: true, goal: g })}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      <GoalDialog
        open={dialog.open} goal={dialog.goal}
        onClose={() => setDialog({ open: false, goal: null })} onSave={handleSave}
      />
      <SimulatorDialog
        open={simDialog.open} goal={simDialog.goal}
        onClose={() => setSimDialog({ open: false, goal: null })}
      />
    </Box>
  )
}
