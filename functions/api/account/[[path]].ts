/// <reference types="@cloudflare/workers-types" />
// ── /api/account/* — Perfil e senha (autenticado) ───────────────────────────
import type { Env } from '../_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

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
  if (!saltHex || !storedHash) return false
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  const hash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
  return hash === storedHash
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { userId, householdId } = c.data
  const url   = new URL(request.url)
  const last  = url.pathname.replace(/\/$/, '').split('/').pop()
  const body  = await request.json().catch(() => ({})) as Record<string, string>

  // ── PATCH /api/account/profile — atualizar nome (e nome da família) ──
  if (last === 'profile' && (request.method === 'PATCH' || request.method === 'POST')) {
    const name = (body.name ?? '').trim()
    const householdName = (body.householdName ?? '').trim()
    if (!name) return json({ ok: false, error: 'Nome obrigatório' }, 400)

    await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, userId).run()
    await env.DB.prepare('UPDATE household_members SET name = ? WHERE user_id = ? AND household_id = ?')
      .bind(name, userId, householdId).run()
    if (householdName) {
      await env.DB.prepare('UPDATE households SET name = ? WHERE id = ?').bind(householdName, householdId).run()
    }
    return json({ ok: true, data: { name, householdName: householdName || undefined } })
  }

  // ── POST /api/account/password — trocar senha ──
  if (last === 'password' && request.method === 'POST') {
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword) return json({ ok: false, error: 'Preencha a senha atual e a nova' }, 400)
    if (newPassword.length < 8) return json({ ok: false, error: 'A nova senha deve ter no mínimo 8 caracteres' }, 400)

    const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(userId).first<{ password_hash: string }>()
    if (!user) return json({ ok: false, error: 'Usuário não encontrado' }, 404)

    const valid = await verifyPassword(currentPassword, user.password_hash)
    if (!valid) return json({ ok: false, error: 'Senha atual incorreta' }, 401)

    const newHash = await hashPassword(newPassword)
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, userId).run()
    // Invalida outras sessões por segurança
    await env.DB.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').bind(userId).run()
    return json({ ok: true })
  }

  // ── POST /api/account/delete — excluir conta e todos os dados (LGPD) ──
  if (last === 'delete' && request.method === 'POST') {
    const { password } = body
    if (!password) return json({ ok: false, error: 'Confirme com sua senha' }, 400)

    const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(userId).first<{ password_hash: string }>()
    if (!user) return json({ ok: false, error: 'Usuário não encontrado' }, 404)
    if (!(await verifyPassword(password, user.password_hash)))
      return json({ ok: false, error: 'Senha incorreta' }, 401)

    // Apaga tudo da família + o usuário (batch atômico)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM transactions WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM bills WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM budgets WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM goals WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM assets WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM liabilities WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM accounts WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM categories WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM household_members WHERE household_id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').bind(userId),
      env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(userId),
      env.DB.prepare('DELETE FROM households WHERE id = ?').bind(householdId),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
    ])
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'kz_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0',
      },
    })
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
