import { useState, useRef, useCallback } from 'react'
import { Box, IconButton, Typography, CircularProgress, Tooltip } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import MicIcon  from '@mui/icons-material/Mic'
import StopIcon from '@mui/icons-material/Stop'
import { KZ } from '@/theme'
import { api } from '@/shared/lib/api'
import type { Transaction } from '@/types'

type ParsedTx = Pick<Transaction, 'type' | 'amount' | 'description' | 'categoryId' | 'date'>

interface Props {
  onResult: (tx: ParsedTx) => void
}

type State = 'idle' | 'listening' | 'processing' | 'error'

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult:  ((e: SpeechRecognitionEvent) => void) | null
  onend:     (() => void) | null
  onerror:   ((e: Event) => void) | null
}

// Safely get SpeechRecognition across browsers
function getSpeechRecognition(): (new () => ISpeechRecognition) | null {
  const W = window as Window & {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
  return W.SpeechRecognition ?? W.webkitSpeechRecognition ?? null
}

export default function VoiceInput({ onResult }: Props) {
  const [state, setState]         = useState<State>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError]         = useState('')
  const recognitionRef            = useRef<ISpeechRecognition | null>(null)

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognition()

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return

    setError('')
    setTranscript('')
    setState('listening')

    const recognition = new SR()
    recognition.lang            = 'pt-BR'
    recognition.continuous      = false
    recognition.interimResults  = true
    recognitionRef.current      = recognition

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      setTranscript(text)
    }

    recognition.onend = async () => {
      const final = recognitionRef.current
        ? transcript || ''
        : ''

      if (!final.trim()) {
        setState('idle')
        return
      }

      setState('processing')
      try {
        const res = await api.voice.parse(final) as { ok: boolean; data?: ParsedTx; error?: string }
        if (res.ok && res.data) {
          onResult(res.data)
          setState('idle')
          setTranscript('')
        } else {
          setError(res.error ?? 'Não entendi. Tente novamente.')
          setState('error')
        }
      } catch {
        setError('Erro de conexão. Tente novamente.')
        setState('error')
      }
    }

    recognition.onerror = () => {
      setError('Microfone não acessível. Verifique as permissões.')
      setState('error')
    }

    recognition.start()
  }, [transcript, onResult])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  if (!isSupported) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={state === 'idle' || state === 'error' ? 'Lançar por voz' : 'Parar'} placement="bottom">
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Pulse rings while listening */}
          <AnimatePresence>
            {state === 'listening' && [0, 1].map(i => (
              <motion.div key={i}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${KZ.green}` }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 2.2 + i * 0.4 }}
                transition={{ duration: 1.4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>

          <IconButton
            onClick={state === 'listening' ? stopListening : startListening}
            disabled={state === 'processing'}
            sx={{
              width: 40, height: 40,
              bgcolor: state === 'listening'
                ? 'rgba(16,185,129,0.15)'
                : state === 'error'
                  ? 'rgba(239,68,68,0.10)'
                  : 'rgba(255,255,255,0.06)',
              border: `1px solid ${
                state === 'listening' ? KZ.green
                  : state === 'error' ? KZ.red
                  : KZ.border
              }`,
              color: state === 'listening' ? KZ.green : state === 'error' ? KZ.red : KZ.t2,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(16,185,129,0.12)', borderColor: KZ.green, color: KZ.green },
            }}
          >
            {state === 'processing'
              ? <CircularProgress size={16} sx={{ color: KZ.green }} />
              : state === 'listening'
                ? <StopIcon sx={{ fontSize: 18 }} />
                : <MicIcon sx={{ fontSize: 18 }} />
            }
          </IconButton>
        </Box>
      </Tooltip>

      {/* Live transcript / status */}
      <AnimatePresence mode="wait">
        {state === 'listening' && transcript && (
          <motion.div key="transcript"
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
          >
            <Typography sx={{
              fontSize: '0.72rem', color: KZ.t2, fontStyle: 'italic',
              maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              "{transcript}"
            </Typography>
          </motion.div>
        )}
        {state === 'listening' && !transcript && (
          <motion.div key="listening"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: KZ.green }}>Ouvindo...</Typography>
          </motion.div>
        )}
        {state === 'processing' && (
          <motion.div key="processing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>Interpretando...</Typography>
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div key="error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Typography sx={{ fontSize: '0.72rem', color: KZ.red }}>{error}</Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
