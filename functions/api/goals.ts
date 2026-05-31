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
  const id     = parts[parts.length - 1] !== 'goals' ? parts[parts.length - 1] : null
  const method = request.method

  // GET /api/goals
  if (!id && method === 'GET') {
    const rows = await env.DB.prepare(
      "SELECT * FROM goals WHERE household_id = ? ORDER BY created_at ASC"
    ).bind(householdId).all()
    return json({ ok: true, data: rows.results })
  }

  // POST /api/goals
  if (!id && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO goals (id, household_id, name, type, target_amount, current_amount, target_date, monthly_contribution, icon, color, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      nid, householdId, b.name, b.type, b.targetAmount, b.currentAmount ?? 0,
      b.targetDate ?? null, b.monthlyContribution ?? 0,
      b.icon ?? '🎯', b.color ?? '#10B981', b.status ?? 'active', b.notes ?? null
    ).run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  // PATCH /api/goals/:id
  if (id && method === 'PATCH') {
    const b = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = {
      name: 'name', type: 'type', targetAmount: 'target_amount',
      currentAmount: 'current_amount', targetDate: 'target_date',
      monthlyContribution: 'monthly_contribution', icon: 'icon',
      color: 'color', status: 'status', notes: 'notes',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(b[k]) }
    }
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE goals SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  // DELETE /api/goals/:id
  if (id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM goals WHERE id = ? AND household_id = ?').bind(id, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
