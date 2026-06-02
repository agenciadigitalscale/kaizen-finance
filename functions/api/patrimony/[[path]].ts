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
  const method = request.method

  if (last === 'patrimony' && method === 'GET') {
    const [assets, liabilities] = await Promise.all([
      env.DB.prepare('SELECT * FROM assets WHERE household_id = ? ORDER BY current_value DESC').bind(householdId).all(),
      env.DB.prepare('SELECT * FROM liabilities WHERE household_id = ? ORDER BY remaining_amount DESC').bind(householdId).all(),
    ])
    return json({ ok: true, data: { assets: assets.results, liabilities: liabilities.results } })
  }

  if (last === 'assets' && prev === 'patrimony' && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO assets (id, household_id, name, type, current_value, purchase_value, purchase_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(nid, householdId, b.name, b.type, b.currentValue, b.purchaseValue ?? null, b.purchaseDate ?? null, b.notes ?? null).run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  if (prev === 'assets' && method === 'PATCH') {
    const id = last
    const b  = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = {
      name: 'name', type: 'type', currentValue: 'current_value',
      purchaseValue: 'purchase_value', purchaseDate: 'purchase_date', notes: 'notes',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(b[k]) }
    }
    sets.push('updated_at = ?'); vals.push(Date.now())
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE assets SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  if (prev === 'assets' && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM assets WHERE id = ? AND household_id = ?').bind(last, householdId).run()
    return json({ ok: true })
  }

  if (last === 'liabilities' && prev === 'patrimony' && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO liabilities (id, household_id, name, total_amount, remaining_amount, monthly_payment, interest_rate, due_date, creditor, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(nid, householdId, b.name, b.totalAmount, b.remainingAmount, b.monthlyPayment,
      b.interestRate ?? null, b.dueDate ?? null, b.creditor, b.notes ?? null).run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  if (prev === 'liabilities' && method === 'PATCH') {
    const id = last
    const b  = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = {
      name: 'name', totalAmount: 'total_amount', remainingAmount: 'remaining_amount',
      monthlyPayment: 'monthly_payment', interestRate: 'interest_rate',
      dueDate: 'due_date', creditor: 'creditor', notes: 'notes',
    }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(b[k]) }
    }
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE liabilities SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  if (prev === 'liabilities' && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM liabilities WHERE id = ? AND household_id = ?').bind(last, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
