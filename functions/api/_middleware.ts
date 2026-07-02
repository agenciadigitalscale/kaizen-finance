/// <reference types="@cloudflare/workers-types" />
// ── Middleware global — JWT em todas as rotas /api/* ─────────────────────────

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  ANTHROPIC_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  RESEND_API_KEY?: string
  WHATSAPP_TOKEN?: string
}

interface JwtPayload {
  sub: string
  householdId: string
  role: string
  exp: number
}

const PUBLIC = ['/api/auth/', '/api/whatsapp/webhook']

async function verifyJWT(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const [header, body, sig] = token.split('.')
    const data   = `${header}.${body}`
    const key    = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid  = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data))
    if (!valid) return null
    const payload = JSON.parse(atob(body)) as JwtPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}

const ALLOWED_ORIGINS = [
  'https://kaizen-43x.pages.dev',
  'https://app.kaizen.com.br',
  'https://kaizen.com.br',
  'https://www.kaizen.com.br',
  'http://localhost:5173',
  'http://localhost:8788',
  // Apps nativos (Capacitor) — Android usa https://localhost, iOS capacitor://localhost
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.kaizen-43x.pages.dev'))
    ? origin
    : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':      allowed,
    'Access-Control-Allow-Methods':     'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':     'Authorization, Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary':                             'Origin',
  }
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, next, data } = ctx
  const url    = new URL(request.url)
  const origin = request.headers.get('Origin')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (PUBLIC.some(p => url.pathname.startsWith(p))) {
    const response = await next()
    const cors     = corsHeaders(origin)
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v))
    return response
  }

  const authHeader = request.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Não autenticado', code: 'UNAUTHORIZED' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })
  }

  const claims = await verifyJWT(token, env.JWT_SECRET)
  if (!claims) {
    return new Response(JSON.stringify({ ok: false, error: 'Token inválido ou expirado', code: 'UNAUTHORIZED' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    })
  }

  data.userId      = claims.sub
  data.householdId = claims.householdId
  data.role        = claims.role

  const response = await next()
  const cors     = corsHeaders(origin)
  Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v))
  return response
}
