import { Component, type ReactNode } from 'react'
import { Box, Typography, Button } from '@mui/material'
import KaizenEmblem from '@/shared/components/KaizenEmblem'
import { KZ, KZ_GRADIENTS } from '@/theme'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

// Captura erros de render e mostra uma tela amigável em vez de tela branca.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box sx={{
        minHeight: '100dvh', bgcolor: KZ.bg, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, gap: 2,
        background: `radial-gradient(ellipse 800px 600px at 50% 40%, rgba(16,185,129,0.05) 0%, ${KZ.bg} 65%)`,
      }}>
        <KaizenEmblem size={72} />
        <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em', mt: 1 }}>
          Algo deu errado
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, maxWidth: 340, lineHeight: 1.6 }}>
          Tivemos um problema inesperado ao carregar esta tela. Seus dados estão seguros — tente recarregar.
        </Typography>
        <Button
          variant="contained"
          onClick={() => { window.location.href = '/app' }}
          sx={{ mt: 1, background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, px: 3, py: 1.2 }}
        >
          Recarregar o app
        </Button>
        <Typography sx={{ fontSize: '0.6rem', color: KZ.t3, mt: 1, maxWidth: 320, wordBreak: 'break-word' }}>
          {this.state.message}
        </Typography>
      </Box>
    )
  }
}
