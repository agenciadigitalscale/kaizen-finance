/// <reference types="@cloudflare/workers-types" />
import type { Env } from '../_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { householdId } = c.data
  const url    = new URL(request.url)
  const parts  = url.pathname.replace(/\/$/, '').split('/')
  const last   = parts[parts.length - 1]
  const prev   = parts[parts.length - 2]
  const id     = last !== 'bills' && last !== 'pay' ? last : null
  const action = last === 'pay' ? 'pay' : null
  const billId = action === 'pay' ? prev : id
  const method = request.method

  if (!id && !action && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT * FROM bills WHERE household_id = ? ORDER BY due_date ASC'
    ).bind(householdId).all()
    return json({ ok: true, data: rows.results })
  }

  if (!id && !action && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO bills (id, household_id, name, amount, due_date, frequency, category_id, account_id, status, is_shared, reminder_days, whatsapp_alert, whatsapp_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      nid, householdId, b.name, b.amount, b.dueDate, b.frequency ?? 'monthly',
      b.categoryId ?? null, b.accountId ?? null, 'pending',
      b.isShared ? 1 : 0, b.reminderDays ?? 3,
      b.whatsappAlert ? 1 : 0, b.whatsappNumber ?? null, b.notes ?? null
    ).run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  if (billId && action === 'pay' && method === 'POST') {
    const today = new Date().toISOString().slice(0, 10)
    await env.DB.prepare(
      "UPDATE bills SET status = 'paid', paid_at = ? WHERE id = ? AND household_id = ?"
    ).bind(today, billId, householdId).run()
    return json({ ok: true })
  }

  if (id && method === 'PATCH') {
    const b = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = {
      name: 'name', amount: 'amount', dueDate: 'due_date', frequency: 'frequency',
      categoryId: 'category_id', accountId: 'account_id', status: 'status',
      isShared: 'is_shared', reminderDays: 'reminder_days', paidAt: 'paid_at',
      whatsappAlert: 'whatsapp_alert', whatsappNumber: 'whatsapp_number', notes: 'notes',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(['isShared','whatsappAlert'].includes(k) ? (b[k] ? 1 : 0) : b[k]) }
    }
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE bills SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  if (id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM bills WHERE id = ? AND household_id = ?').bind(id, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
