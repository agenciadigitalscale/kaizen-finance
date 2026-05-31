/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { householdId } = c.data
  const url    = new URL(request.url)
  const parts  = url.pathname.replace(/\/$/, '').split('/')
  const id     = parts[parts.length - 1] !== 'accounts' ? parts[parts.length - 1] : null
  const method = request.method

  // GET /api/accounts
  if (!id && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT * FROM accounts WHERE household_id = ? ORDER BY created_at ASC'
    ).bind(householdId).all()
    return json({ ok: true, data: rows.results })
  }

  // POST /api/accounts
  if (!id && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO accounts (id, household_id, name, type, bank, balance, credit_limit, closing_day, due_day, color, icon, is_shared, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(nid, householdId, b.name, b.type, b.bank ?? null, b.balance ?? 0, b.creditLimit ?? null,
      b.closingDay ?? null, b.dueDay ?? null, b.color ?? '#10B981', b.icon ?? '🏦',
      b.isShared ? 1 : 0, b.ownerId ?? null).run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  // PATCH /api/accounts/:id
  if (id && method === 'PATCH') {
    const b = await request.json() as Record<string, unknown>
    const sets: string[] = []
    const vals: unknown[] = []
    const map: Record<string, string> = {
      name: 'name', type: 'type', bank: 'bank', balance: 'balance',
      creditLimit: 'credit_limit', closingDay: 'closing_day', dueDay: 'due_day',
      color: 'color', icon: 'icon', isShared: 'is_shared',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(k === 'isShared' ? (b[k] ? 1 : 0) : b[k]) }
    }
    if (!sets.length) return json({ ok: false, error: 'Nenhum campo para atualizar' }, 400)
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  // DELETE /api/accounts/:id
  if (id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM accounts WHERE id = ? AND household_id = ?').bind(id, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
