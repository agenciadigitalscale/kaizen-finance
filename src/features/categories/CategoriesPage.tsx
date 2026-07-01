import { useState } from 'react'
import {
  Box, Typography, Paper, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon    from '@mui/icons-material/Add'
import EditIcon   from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CategoryIcon from '@mui/icons-material/Category'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { useAllCategories, useCategoriesStore, type AppCategory } from '@/shared/stores/categoriesStore'

const ICONS = ['📦','🍕','🛒','🚗','⛽','🏠','💊','📚','🎬','👕','✈️','📱','💼','💰','💻','📈','🎮','☕','🐶','🎁','💡','🏋️','✂️','🎨']
const COLORS = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16']

type Draft = { id?: string; name: string; type: 'income' | 'expense'; icon: string; color: string }
const EMPTY: Draft = { name: '', type: 'expense', icon: '📦', color: '#10B981' }

export default function CategoriesPage() {
  const all       = useAllCategories()
  const { addCategory, updateCategory, deleteCategory } = useCategoriesStore()
  const [dialog, setDialog] = useState<{ open: boolean; draft: Draft }>({ open: false, draft: EMPTY })

  const custom  = all.filter(c => c.custom)
  const builtin = all.filter(c => !c.custom)

  function save() {
    const d = dialog.draft
    if (!d.name.trim()) return
    if (d.id) updateCategory(d.id, { name: d.name.trim(), type: d.type, icon: d.icon, color: d.color })
    else addCategory({ name: d.name.trim(), type: d.type, group: 'outros', icon: d.icon, color: d.color })
    setDialog({ open: false, draft: EMPTY })
  }

  const CatChip = ({ c, editable }: { c: AppCategory; editable?: boolean }) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1.3, borderRadius: 2,
      border: `1px solid ${c.color}30`, bgcolor: `${c.color}0C`,
    }}>
      <Typography sx={{ fontSize: '1.1rem' }}>{c.icon}</Typography>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, flex: 1 }}>{c.name}</Typography>
      {editable ? (
        <>
          <IconButton size="small" onClick={() => setDialog({ open: true, draft: { id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color } })} sx={{ color: KZ.t3 }}>
            <EditIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton size="small" onClick={() => deleteCategory(c.id)} sx={{ color: KZ.t3, '&:hover': { color: KZ.red } }}>
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </>
      ) : (
        <Chip label="padrão" size="small" sx={{ height: 16, fontSize: '0.52rem', bgcolor: 'rgba(255,255,255,0.05)', color: KZ.t3 }} />
      )}
    </Box>
  )

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon sx={{ color: KZ.green, fontSize: 22 }} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Categorias</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Crie categorias do seu jeito</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ open: true, draft: EMPTY })}
            sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>Nova</Button>
        </Box>
      </motion.div>

      {custom.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 1.5 }}>Suas categorias</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 1 }}>
            {custom.map(c => <CatChip key={c.id} c={c} editable />)}
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: KZ.t2, mb: 1.5 }}>Categorias padrão</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 1 }}>
          {builtin.map(c => <CatChip key={c.id} c={c} />)}
        </Box>
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, draft: EMPTY })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>{dialog.draft.id ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="Nome" size="small" fullWidth autoFocus value={dialog.draft.name}
            onChange={e => setDialog(d => ({ ...d, draft: { ...d.draft, name: e.target.value } }))} />
          <ToggleButtonGroup exclusive fullWidth value={dialog.draft.type}
            onChange={(_, v) => v && setDialog(d => ({ ...d, draft: { ...d.draft, type: v } }))}
            sx={{ '& .MuiToggleButton-root': { py: 0.7, fontSize: '0.8rem', textTransform: 'none' } }}>
            <ToggleButton value="expense">Despesa</ToggleButton>
            <ToggleButton value="income">Receita</ToggleButton>
          </ToggleButtonGroup>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 0.8 }}>Ícone</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <Box key={ic} onClick={() => setDialog(d => ({ ...d, draft: { ...d.draft, icon: ic } }))} sx={{
                  width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', cursor: 'pointer', border: `1px solid ${dialog.draft.icon === ic ? KZ.green : KZ.border}`,
                  bgcolor: dialog.draft.icon === ic ? 'rgba(16,185,129,0.1)' : 'transparent',
                }}>{ic}</Box>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', color: KZ.t2, mb: 0.8 }}>Cor</Typography>
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
              {COLORS.map(col => (
                <Box key={col} onClick={() => setDialog(d => ({ ...d, draft: { ...d.draft, color: col } }))} sx={{
                  width: 24, height: 24, borderRadius: '50%', bgcolor: col, cursor: 'pointer',
                  border: dialog.draft.color === col ? '3px solid white' : '3px solid transparent',
                  boxShadow: dialog.draft.color === col ? `0 0 0 1px ${col}` : 'none',
                }} />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog({ open: false, draft: EMPTY })} sx={{ color: KZ.t2 }}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={!dialog.draft.name.trim()} sx={{ background: KZ_GRADIENTS.green }}>
            {dialog.draft.id ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
