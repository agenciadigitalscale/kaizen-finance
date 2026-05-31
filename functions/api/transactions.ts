/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { householdId, userId } = c.data
  const url    = new URL(request.url)
  const parts  = url.pathname.replace(/\/$/, '').split('/')
  const id     = parts[parts.length - 1] !== 'transactions' ? parts[parts.length - 1] : null
  const method = request.method

  // GET /api/transactions?month=YYYY-MM
  if (!id && method === 'GET') {
    const month = url.searchParams.get('month')
    let query = 'SELECT * FROM transactions WHERE household_id = ?'
    const params: unknown[] = [householdId]
    if (month) { query += " AND date LIKE ?"; params.push(`${month}%`) }
    query += ' ORDER BY date DESC, created_at DESC'
    const rows = await env.DB.prepare(query).bind(...params).all()
    return json({ ok: true, data: rows.results })
  }

  // POST /api/transactions
  if (!id && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO transactions (id, household_id, user_id, type, amount, description, category_id, account_id, to_account_id, date, status, is_recurring, tags, notes, installment_current, installment_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      nid, householdId, userId, b.type, b.amount, b.description, b.categoryId,
      b.accountId, b.toAccountId ?? null, b.date, b.status ?? 'confirmed',
      b.isRecurring ? 1 : 0, b.tags ? JSON.stringify(b.tags) : null, b.notes ?? null,
      (b.installment as { current?: number })?.current ?? null,
      (b.installment as { total?: number })?.total ?? null
    ).run()

    // Update account balance
    if (b.type === 'income') {
      await env.DB.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND household_id = ?')
        .bind(b.amount, b.accountId, householdId).run()
    } else if (b.type === 'expense') {
      await env.DB.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ? AND household_id = ?')
        .bind(b.amount, b.accountId, householdId).run()
    } else if (b.type === 'transfer') {
      await env.DB.batch([
        env.DB.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ? AND household_id = ?').bind(b.amount, b.accountId, householdId),
        env.DB.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND household_id = ?').bind(b.amount, b.toAccountId, householdId),
      ])
    }

    return json({ ok: true, data: { id: nid } }, 201)
  }

  // PATCH /api/transactions/:id
  if (id && method === 'PATCH') {
    const b = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = {
      description: 'description', amount: 'amount', date: 'date',
      categoryId: 'category_id', accountId: 'account_id', status: 'status',
      isRecurring: 'is_recurring', notes: 'notes',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(k === 'isRecurring' ? (b[k] ? 1 : 0) : b[k]) }
    }
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  // DELETE /api/transactions/:id
  if (id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM transactions WHERE id = ? AND household_id = ?').bind(id, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
