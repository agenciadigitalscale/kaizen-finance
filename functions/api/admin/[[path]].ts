/// <reference types="@cloudflare/workers-types" />
// ── /api/admin/* — painel do dono (somente ADMIN_EMAIL) ─────────────────────
import type { Env } from '../_middleware'

interface AdminEnv extends Env { ADMIN_EMAIL?: string }
type Ctx = EventContext<AdminEnv, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

export const onRequest: PagesFunction<AdminEnv> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { userId } = c.data
  const url  = new URL(request.url)
  const last = url.pathname.replace(/\/$/, '').split('/').pop()

  // Gate: só o admin
  const me = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>()
  const isAdmin = !!env.ADMIN_EMAIL && me?.email?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()
  if (!isAdmin) return json({ ok: false, error: 'Acesso restrito ao administrador' }, 403)

  // GET /api/admin/clients — lista todos os clientes cadastrados
  if (last === 'clients' && request.method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT u.id AS user_id, u.name, u.email, u.created_at,
              h.id AS household_id, h.name AS household_name, h.plan, h.sub_paid_until, h.sub_method,
              (SELECT COUNT(*) FROM household_members hm2 WHERE hm2.household_id = h.id) AS members
       FROM household_members hm
       JOIN users u ON u.id = hm.user_id
       JOIN households h ON h.id = hm.household_id
       WHERE hm.role = 'owner'
       ORDER BY u.created_at DESC`
    ).all()
    return json({ ok: true, data: rows.results })
  }

  // POST /api/admin/clients/pay — marcar assinatura como paga (estende +N meses)
  if (last === 'pay' && request.method === 'POST') {
    const b = await request.json().catch(() => ({})) as { householdId?: string; method?: string; months?: number }
    if (!b.householdId) return json({ ok: false, error: 'householdId obrigatório' }, 400)
    const months = b.months && b.months > 0 ? b.months : 1

    const row = await env.DB.prepare('SELECT plan, sub_paid_until FROM households WHERE id = ?')
      .bind(b.householdId).first<{ plan: string; sub_paid_until: number | null }>()
    if (!row) return json({ ok: false, error: 'Cliente não encontrado' }, 404)

    const now = Date.now()
    const base = Math.max(row.sub_paid_until ?? now, now)
    const newUntil = base + months * MONTH_MS
    const newPlan = row.plan === 'lifetime' ? 'lifetime' : 'active'

    await env.DB.prepare('UPDATE households SET sub_paid_until = ?, sub_method = ?, plan = ? WHERE id = ?')
      .bind(newUntil, b.method ?? 'dinheiro', newPlan, b.householdId).run()
    return json({ ok: true, data: { sub_paid_until: newUntil, plan: newPlan } })
  }

  // POST /api/admin/clients/unpay — desfazer (limpar assinatura paga)
  if (last === 'unpay' && request.method === 'POST') {
    const b = await request.json().catch(() => ({})) as { householdId?: string }
    if (!b.householdId) return json({ ok: false, error: 'householdId obrigatório' }, 400)
    await env.DB.prepare("UPDATE households SET sub_paid_until = NULL WHERE id = ? AND plan != 'lifetime'")
      .bind(b.householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
