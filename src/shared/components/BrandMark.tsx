import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { KZ } from '@/theme'

interface Props {
  size?: number       // tamanho base da palavra KAIZEN (px)
  showFinance?: boolean
}

/**
 * Wordmark "KAIZEN FINANCE" — extrusão 3D + brilho animado (shimmer) + flutuação sutil.
 * Front: gradiente esmeralda→dourado com clip de texto. Back: camada de profundidade 3D.
 */
export default function BrandMark({ size = 22, showFinance = true }: Props) {
  const wordStyle = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontWeight: 900,
    fontSize: `${size}px`,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    margin: 0,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', perspective: '600px' }}>
      <Box
        component={motion.div}
        initial={{ rotateX: 0, y: 0 }}
        animate={{ rotateX: [0, 6, 0, -3, 0], y: [0, -1.5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        sx={{ position: 'relative', display: 'inline-block', transformStyle: 'preserve-3d' }}
      >
        {/* Camada de profundidade (extrusão 3D) */}
        <Box
          aria-hidden
          sx={{
            ...wordStyle,
            position: 'absolute', inset: 0,
            color: '#053826',
            textShadow: [
              '0 1px 0 #064e3b',
              '0 2px 0 #053826',
              '0 3px 0 #04231a',
              '0 4px 0 #03190f',
              '0 6px 10px rgba(0,0,0,0.55)',
            ].join(','),
          }}
        >
          KAIZEN
        </Box>

        {/* Camada frontal com gradiente + shimmer */}
        <Box
          sx={{
            ...wordStyle,
            position: 'relative',
            background: 'linear-gradient(100deg, #059669 0%, #10B981 25%, #6EE7B7 45%, #FCD34D 60%, #10B981 80%, #059669 100%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            filter: 'drop-shadow(0 1px 1px rgba(16,185,129,0.35))',
            animation: 'kzShimmer 5s linear infinite',
            '@keyframes kzShimmer': {
              '0%':   { backgroundPosition: '0% 50%' },
              '100%': { backgroundPosition: '250% 50%' },
            },
          }}
        >
          KAIZEN
        </Box>
      </Box>

      {showFinance && (
        <Box
          sx={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: `${size * 0.34}px`,
            letterSpacing: `${size * 0.18}px`,
            paddingLeft: `${size * 0.18}px`,
            marginTop: `${size * 0.16}px`,
            color: KZ.t2,
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          Finance
        </Box>
      )}
    </Box>
  )
}
