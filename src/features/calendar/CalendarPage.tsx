import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon           from '@mui/icons-material/Add'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { useBillsStore } from '@/shared/stores/billsStore'
import { BillsCalendar, BillDialog, EMPTY_BILL } from '@/features/bills/BillsPage'
import type { Bill } from '@/types'

export default function CalendarPage() {
  const { bills, addBill, updateBill, deleteBill, payBill } = useBillsStore()
  const [dialog, setDialog] = useState<{ open: boolean; bill: Partial<Bill> | null }>({ open: false, bill: null })

  function handleSave(data: Partial<Bill>) {
    if (data.id) updateBill(data.id, data)
    else addBill(data)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ color: KZ.green, fontSize: 20 }} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Calendário</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mt: 0.3 }}>Suas contas no dia do vencimento</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setDialog({ open: true, bill: EMPTY_BILL })}
            sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontSize: '0.78rem' }}>
            Nova conta
          </Button>
        </Box>
      </motion.div>

      <BillsCalendar
        bills={bills}
        onPay={payBill}
        onEdit={b => setDialog({ open: true, bill: b })}
        onDelete={deleteBill}
      />

      <BillDialog
        open={dialog.open} bill={dialog.bill}
        onClose={() => setDialog({ open: false, bill: null })}
        onSave={handleSave}
      />
    </Box>
  )
}
