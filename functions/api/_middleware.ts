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

const PUBLIC = ['/api/auth/']

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

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env, next, data } = ctx
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
  }

  if (PUBLIC.some(p => url.pathname.startsWith(p))) return next()

  const authHeader = request.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'Não autenticado', code: 'UNAUTHORIZED' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const claims = await verifyJWT(token, env.JWT_SECRET)
  if (!claims) {
    return new Response(JSON.stringify({ ok: false, error: 'Token inválido ou expirado', code: 'UNAUTHORIZED' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  data.userId      = claims.sub
  data.householdId = claims.householdId
  data.role        = claims.role

  return next()
}
