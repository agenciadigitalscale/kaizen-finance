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
  const method = request.method

  // GET /api/budgets?month=YYYY-MM
  if (method === 'GET') {
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    // Budgets + computed spending from transactions
    const [budgetRows, spendRows] = await Promise.all([
      env.DB.prepare(
        'SELECT * FROM budgets WHERE household_id = ? AND month = ?'
      ).bind(householdId, month).all(),
      env.DB.prepare(
        `SELECT category_id, SUM(amount) as spent
         FROM transactions
         WHERE household_id = ? AND date LIKE ? AND type = 'expense' AND status != 'cancelled'
         GROUP BY category_id`
      ).bind(householdId, `${month}%`).all(),
    ])
    const spendMap = Object.fromEntries(
      (spendRows.results as { category_id: string; spent: number }[]).map(r => [r.category_id, r.spent])
    )
    const merged = (budgetRows.results as { category_id: string; amount: number }[]).map(b => ({
      ...b,
      spent: spendMap[b.category_id] ?? 0,
    }))
    return json({ ok: true, data: merged })
  }

  // POST /api/budgets (upsert)
  if (method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO budgets (id, household_id, category_id, month, amount)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(household_id, category_id, month) DO UPDATE SET amount = excluded.amount`
    ).bind(nid, householdId, b.categoryId, b.month, b.amount).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
