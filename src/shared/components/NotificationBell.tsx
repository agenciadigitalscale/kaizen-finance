import { useState, useEffect } from 'react'
import { Box, Typography, IconButton, Badge, Drawer, TextField, Button } from '@mui/material'
import { motion } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CloseIcon from '@mui/icons-material/Close'
import CampaignIcon from '@mui/icons-material/Campaign'
import { KZ, KZ_GRADIENTS } from '@/theme'
import { useAnnouncementsStore } from '@/shared/stores/announcementsStore'

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d atrás`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h}h atrás`
  const m = Math.floor(diff / 60000)
  return m > 0 ? `${m}min atrás` : 'agora'
}

export default function NotificationBell({ color = KZ.t2 }: { color?: string }) {
  const { items, unread, isAdmin, markAllRead, create } = useAnnouncementsStore()
  const initAnnouncements = useAnnouncementsStore(s => s.init)
  useEffect(() => { void initAnnouncements() }, [initAnnouncements])
  const [open, setOpen]   = useState(false)
  const [wasUnread, setWU] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [body, setBody]   = useState('')
  const [posting, setPosting] = useState(false)
  const [compose, setCompose] = useState(false)

  function handleOpen() {
    setWU(new Set(items.filter(a => !a.read).map(a => a.id)))
    setOpen(true)
    if (unread > 0) markAllRead()
  }

  async function publish() {
    if (!title.trim() || !body.trim()) return
    setPosting(true)
    const ok = await create(title.trim(), body.trim())
    setPosting(false)
    if (ok) { setTitle(''); setBody(''); setCompose(false) }
  }

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color }}>
        <Badge badgeContent={unread} color="error"
          sx={{ '& .MuiBadge-badge': { fontSize: '0.55rem', height: 16, minWidth: 16, fontWeight: 800 } }}>
          <NotificationsIcon sx={{ fontSize: 22 }} />
        </Badge>
      </IconButton>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: {
          width: { xs: '88vw', sm: 380 }, background: 'rgba(8,12,18,0.99)', backdropFilter: 'blur(30px)',
          borderLeft: `1px solid ${KZ.border}`, pt: 'env(safe-area-inset-top)',
        } } }}>
        <Box sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${KZ.border}` }}>
          <NotificationsIcon sx={{ fontSize: 20, color: KZ.green }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, flex: 1 }}>Novidades</Typography>
          {isAdmin && (
            <IconButton size="small" onClick={() => setCompose(v => !v)} sx={{ color: KZ.green }} title="Publicar aviso">
              <CampaignIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: KZ.t2 }}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* Compose (admin) */}
        {isAdmin && compose && (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2, borderBottom: `1px solid ${KZ.border}`, bgcolor: 'rgba(16,185,129,0.03)' }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: KZ.green }}>Publicar nova atualização</Typography>
            <TextField size="small" label="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <TextField size="small" label="Conteúdo" value={body} onChange={e => setBody(e.target.value)} multiline rows={3} />
            <Button variant="contained" size="small" onClick={publish} disabled={posting || !title.trim() || !body.trim()}
              sx={{ background: KZ_GRADIENTS.green, fontWeight: 700 }}>
              {posting ? 'Publicando…' : 'Publicar para todos'}
            </Button>
          </Box>
        )}

        {/* Lista */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2rem' }}>🔔</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: KZ.t3, mt: 1 }}>Nenhuma novidade por enquanto.</Typography>
            </Box>
          ) : items.map(a => {
            const isNew = wasUnread.has(a.id)
            return (
              <Box key={a.id} component={motion.div} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                sx={{ p: 1.6, mb: 1, borderRadius: 2.5,
                  bgcolor: isNew ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isNew ? KZ.borderGreen : KZ.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isNew && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: KZ.green, flexShrink: 0 }} />}
                  <Typography sx={{ fontSize: '0.86rem', fontWeight: 800, flex: 1 }}>{a.title}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: KZ.t3 }}>{timeAgo(a.created_at)}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', color: KZ.t2, mt: 0.6, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</Typography>
              </Box>
            )
          })}
        </Box>
      </Drawer>
    </>
  )
}
