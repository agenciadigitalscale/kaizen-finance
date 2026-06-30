/// <reference types="@cloudflare/workers-types" />
// ── /api/whatsapp/* — Envio de mensagens via Z-API (autenticado) ────────────
// Requer secrets: ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN
import type { Env } from '../_middleware'

interface ZapiEnv extends Env {
  ZAPI_INSTANCE_ID?: string
  ZAPI_TOKEN?: string
  ZAPI_CLIENT_TOKEN?: string
}

type Ctx = EventContext<ZapiEnv, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

// Normaliza para o formato do Z-API: 55 + DDD + número (só dígitos)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

async function sendWhatsApp(env: ZapiEnv, phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!env.ZAPI_INSTANCE_ID || !env.ZAPI_TOKEN) {
    return { ok: false, error: 'WhatsApp (Z-API) não configurado no servidor.' }
  }
  const url = `https://api.z-api.io/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}/send-text`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.ZAPI_CLIENT_TOKEN ? { 'Client-Token': env.ZAPI_CLIENT_TOKEN } : {}),
    },
    body: JSON.stringify({ phone: normalizePhone(phone), message }),
  })
  if (!res.ok) {
    const t = await res.text()
    return { ok: false, error: `Z-API erro ${res.status}: ${t.slice(0, 200)}` }
  }
  return { ok: true }
}

export const onRequest: PagesFunction<ZapiEnv> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const url  = new URL(request.url)
  const last = url.pathname.replace(/\/$/, '').split('/').pop()

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const body = await request.json().catch(() => ({})) as { phone?: string; message?: string }

  // POST /api/whatsapp/test — enviar uma mensagem de teste
  if (last === 'test') {
    if (!body.phone) return json({ ok: false, error: 'Informe o número' }, 400)
    const msg = body.message || '✅ Kaizen Finance: seu alerta de WhatsApp está funcionando!'
    const result = await sendWhatsApp(env, body.phone, msg)
    return json(result, result.ok ? 200 : 503)
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
