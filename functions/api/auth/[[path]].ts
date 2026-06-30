/// <reference types="@cloudflare/workers-types" />
// ── /api/auth/* — Login, Signup, Refresh, Logout ────────────────────────────

import type { Env } from '../_middleware'

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  const hash    = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, saltHex, storedHash] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  const hash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
  return hash === storedHash
}

// One-way SHA-256 hash — never reversible, safe to store in DB
async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function signJWT(payload: object, secret: string, expiresInSec: number): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp    = Math.floor(Date.now() / 1000) + expiresInSec
  const body   = btoa(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) }))
  const data   = `${header}.${body}`
  const key    = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${data}.${sigB64}`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const MEMBER_COLORS = ['#10B981','#3B82F6','#F59E0B','#EC4899','#8B5CF6','#14B8A6']

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const url    = new URL(request.url)
  const parts  = url.pathname.split('/')
  const action = parts[parts.length - 1]

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const body = await request.json().catch(() => ({})) as Record<string, string>

  // ── POST /api/auth/signup ────────────────────────────────────────────────────
  if (action === 'signup') {
    const { name, email, password, householdName } = body

    if (!name || !email || !password)
      return json({ ok: false, error: 'Campos obrigatórios faltando' }, 400)

    if (!isValidEmail(email))
      return json({ ok: false, error: 'E-mail inválido' }, 400)

    if (password.length < 8)
      return json({ ok: false, error: 'Senha deve ter no mínimo 8 caracteres' }, 400)

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first()
    if (existing) return json({ ok: false, error: 'E-mail já cadastrado' }, 409)

    const userId      = crypto.randomUUID()
    const householdId = crypto.randomUUID()
    const pwHash      = await hashPassword(password)
    const hName       = householdName?.trim() || name

    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)')
        .bind(userId, email.toLowerCase(), name, pwHash),
      env.DB.prepare('INSERT INTO households (id, name) VALUES (?, ?)')
        .bind(householdId, hName),
      env.DB.prepare('INSERT INTO household_members (household_id, user_id, role, name, color) VALUES (?, ?, ?, ?, ?)')
        .bind(householdId, userId, 'owner', name, MEMBER_COLORS[0]),
    ])

    const accessToken  = await signJWT({ sub: userId, householdId, role: 'owner' }, env.JWT_SECRET, 15 * 60)
    const refreshToken = crypto.randomUUID()
    const tokenHash    = await hashToken(refreshToken)

    await env.DB.prepare(
      'INSERT INTO refresh_tokens (id, user_id, household_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), userId, householdId, tokenHash, Date.now() + 30 * 24 * 60 * 60 * 1000).run()

    return new Response(JSON.stringify({
      ok: true,
      data: {
        user:      { id: userId, email: email.toLowerCase(), name },
        household: { id: householdId, name: hName },
        role:      'owner',
        accessToken,
      },
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `kz_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=${30 * 24 * 3600}`,
      },
    })
  }

  // ── POST /api/auth/login ─────────────────────────────────────────────────────
  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) return json({ ok: false, error: 'E-mail e senha obrigatórios' }, 400)

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email.toLowerCase()).first<{ id: string; email: string; name: string; password_hash: string }>()

    // Always run verifyPassword even when user not found to prevent timing-based user enumeration
    const dummyHash = 'pbkdf2:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000'
    const valid = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, dummyHash).then(() => false)

    if (!user || !valid) return json({ ok: false, error: 'E-mail ou senha incorretos' }, 401)

    const member = await env.DB.prepare(
      'SELECT hm.role, hm.color, h.id as hid, h.name as hname FROM household_members hm JOIN households h ON h.id = hm.household_id WHERE hm.user_id = ? LIMIT 1'
    ).bind(user.id).first<{ role: string; color: string; hid: string; hname: string }>()

    if (!member) return json({ ok: false, error: 'Família não encontrada' }, 403)

    const accessToken  = await signJWT({ sub: user.id, householdId: member.hid, role: member.role }, env.JWT_SECRET, 15 * 60)
    const refreshToken = crypto.randomUUID()
    const tokenHash    = await hashToken(refreshToken)

    await env.DB.prepare(
      'INSERT INTO refresh_tokens (id, user_id, household_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), user.id, member.hid, tokenHash, Date.now() + 30 * 24 * 60 * 60 * 1000).run()

    return new Response(JSON.stringify({
      ok: true,
      data: {
        user:      { id: user.id, email: user.email, name: user.name },
        household: { id: member.hid, name: member.hname },
        role:      member.role,
        color:     member.color,
        accessToken,
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `kz_refresh=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=${30 * 24 * 3600}`,
      },
    })
  }

  // ── POST /api/auth/refresh ───────────────────────────────────────────────────
  if (action === 'refresh') {
    const cookie = request.headers.get('Cookie') ?? ''
    const match  = cookie.match(/kz_refresh=([^;]+)/)
    if (!match) return json({ ok: false, error: 'Sem refresh token', code: 'UNAUTHORIZED' }, 401)

    const tokenHash = await hashToken(match[1])
    const row = await env.DB.prepare(
      'SELECT rt.*, u.name, u.email FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token_hash = ? AND rt.expires_at > ?'
    ).bind(tokenHash, Date.now()).first<{ user_id: string; household_id: string; name: string; email: string }>()

    if (!row) return json({ ok: false, error: 'Token inválido ou expirado', code: 'UNAUTHORIZED' }, 401)

    const member = await env.DB.prepare('SELECT role FROM household_members WHERE user_id = ? AND household_id = ?')
      .bind(row.user_id, row.household_id).first<{ role: string }>()

    const accessToken = await signJWT({ sub: row.user_id, householdId: row.household_id, role: member?.role ?? 'partner' }, env.JWT_SECRET, 15 * 60)
    return json({ ok: true, data: { accessToken } })
  }

  // ── POST /api/auth/logout ────────────────────────────────────────────────────
  if (action === 'logout') {
    const cookie = request.headers.get('Cookie') ?? ''
    const match  = cookie.match(/kz_refresh=([^;]+)/)
    if (match) {
      const tokenHash = await hashToken(match[1])
      await env.DB.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').bind(tokenHash).run()
    }
    return new Response(JSON.stringify({ ok: true, data: undefined }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'kz_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0',
      },
    })
  }

  // ── POST /api/auth/forgot — solicitar redefinição de senha ───────────────────
  if (action === 'forgot') {
    const email = (body.email ?? '').toLowerCase().trim()
    // Sempre responde ok para não revelar se o e-mail existe
    if (!isValidEmail(email)) return json({ ok: true })

    const user = await env.DB.prepare('SELECT id, name FROM users WHERE email = ?')
      .bind(email).first<{ id: string; name: string }>()

    if (user) {
      const rawToken  = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
      const tokenHash = await hashToken(rawToken)
      await env.DB.prepare(
        'INSERT INTO password_resets (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), user.id, tokenHash, Date.now() + 60 * 60 * 1000).run()

      const link = `${url.origin}/reset?token=${rawToken}`
      const resendKey = (env as Env & { RESEND_API_KEY?: string }).RESEND_API_KEY
      if (resendKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Kaizen Finance <onboarding@resend.dev>',
              to: [email],
              subject: 'Redefinir sua senha — Kaizen Finance',
              html: `<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2 style="color:#10B981">Redefinir senha</h2><p>Olá, ${user.name}. Recebemos um pedido para redefinir sua senha no Kaizen Finance.</p><p><a href="${link}" style="display:inline-block;background:#10B981;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Criar nova senha</a></p><p style="color:#888;font-size:13px">O link expira em 1 hora. Se não foi você, ignore este e-mail.</p></div>`,
            }),
          })
        } catch { /* falha de e-mail não revela nada ao cliente */ }
      }
    }
    return json({ ok: true })
  }

  // ── POST /api/auth/reset — redefinir senha com token ─────────────────────────
  if (action === 'reset') {
    const { token, password } = body
    if (!token || !password) return json({ ok: false, error: 'Token e nova senha obrigatórios' }, 400)
    if (password.length < 8) return json({ ok: false, error: 'A senha deve ter no mínimo 8 caracteres' }, 400)

    const tokenHash = await hashToken(token)
    const row = await env.DB.prepare(
      'SELECT id, user_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > ?'
    ).bind(tokenHash, Date.now()).first<{ id: string; user_id: string }>()

    if (!row) return json({ ok: false, error: 'Link inválido ou expirado' }, 400)

    const newHash = await hashPassword(password)
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, row.user_id),
      env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(row.id),
      env.DB.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').bind(row.user_id),
    ])
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
