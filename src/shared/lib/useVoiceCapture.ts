import { useRef, useCallback, useState } from 'react'

// ── Captura de voz "segurar para falar" (estilo WhatsApp) ─────────────────────
// Usa a Web Speech API do navegador para transcrever em pt-BR.

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend:    (() => void) | null
  onerror:  ((e: Event) => void) | null
}

function getSR(): (new () => ISpeechRecognition) | null {
  const W = window as Window & {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
  return W.SpeechRecognition ?? W.webkitSpeechRecognition ?? null
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

export function useVoiceCapture() {
  const [state, setState]           = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const recRef   = useRef<ISpeechRecognition | null>(null)
  const finalRef = useRef('')

  const supported = typeof window !== 'undefined' && !!getSR()

  const start = useCallback(() => {
    const SR = getSR()
    if (!SR) return false
    finalRef.current = ''
    setTranscript('')
    setState('listening')

    const rec = new SR()
    rec.lang           = 'pt-BR'
    rec.continuous     = false
    rec.interimResults = true

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      finalRef.current = t
      setTranscript(t)
    }
    rec.onerror = () => setState('error')
    rec.onend   = () => { /* resolvido em stop() */ }

    recRef.current = rec
    try { rec.start() } catch { /* já iniciado */ }
    return true
  }, [])

  // Para a escuta e devolve o texto final reconhecido via callback
  const stop = useCallback((onDone: (text: string) => void) => {
    const rec = recRef.current
    if (!rec) { setState('idle'); return }
    rec.onend = () => {
      const t = finalRef.current.trim()
      recRef.current = null
      if (t) { setState('processing'); onDone(t) }
      else   { setState('idle') }
    }
    try { rec.stop() } catch {
      const t = finalRef.current.trim()
      recRef.current = null
      if (t) { setState('processing'); onDone(t) } else setState('idle')
    }
  }, [])

  // Cancela sem processar (ex: toque rápido)
  const abort = useCallback(() => {
    const rec = recRef.current
    if (rec) { rec.onend = null; try { rec.abort() } catch { /* noop */ } recRef.current = null }
    setState('idle')
    setTranscript('')
  }, [])

  return { state, setState, transcript, supported, start, stop, abort }
}
