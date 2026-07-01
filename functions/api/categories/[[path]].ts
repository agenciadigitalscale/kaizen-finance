/// <reference types="@cloudflare/workers-types" />
// ── /api/categories/* — categorias personalizadas (autenticado) ─────────────
import type { Env } from '../_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { householdId } = c.data
  const url    = new URL(request.url)
  const last   = url.pathname.replace(/\/$/, '').split('/').pop()
  const id     = last !== 'categories' ? last : null
  const method = request.method

  if (!id && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT id, name, type, grp, icon, color FROM categories WHERE household_id = ? ORDER BY created_at ASC'
    ).bind(householdId).all()
    return json({ ok: true, data: rows.results })
  }

  if (!id && method === 'POST') {
    const b = await request.json() as Record<string, unknown>
    if (!b.name || !b.type) return json({ ok: false, error: 'Nome e tipo obrigatórios' }, 400)
    const nid = crypto.randomUUID()
    await env.DB.prepare(
      'INSERT INTO categories (id, household_id, name, type, grp, icon, color, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, 0)'
    ).bind(nid, householdId, b.name, b.type, b.group ?? 'outros', b.icon ?? '📦', b.color ?? '#6B7280').run()
    return json({ ok: true, data: { id: nid } }, 201)
  }

  if (id && method === 'PATCH') {
    const b = await request.json() as Record<string, unknown>
    const sets: string[] = []; const vals: unknown[] = []
    const map: Record<string, string> = { name: 'name', type: 'type', group: 'grp', icon: 'icon', color: 'color' }
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { sets.push(`${col} = ?`); vals.push(b[k]) }
    }
    if (!sets.length) return json({ ok: false, error: 'Nada para atualizar' }, 400)
    vals.push(id, householdId)
    await env.DB.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ? AND household_id = ?`).bind(...vals).run()
    return json({ ok: true })
  }

  if (id && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM categories WHERE id = ? AND household_id = ?').bind(id, householdId).run()
    return json({ ok: true })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
