/// <reference types="@cloudflare/workers-types" />
// ── /api/announcements/* — avisos / novidades para os clientes ──────────────
import type { Env } from '../_middleware'

interface AdminEnv extends Env { ADMIN_EMAIL?: string }
type Ctx = EventContext<AdminEnv, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<AdminEnv> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { userId } = c.data
  const url  = new URL(request.url)
  const last = url.pathname.replace(/\/$/, '').split('/').pop()
  const method = request.method

  const me = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>()
  const isAdmin = !!env.ADMIN_EMAIL && me?.email?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()

  // GET /api/announcements — lista com estado de leitura + contagem de não lidos
  if (last === 'announcements' && method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT a.id, a.title, a.body, a.created_at,
              CASE WHEN r.user_id IS NULL THEN 0 ELSE 1 END AS read
       FROM announcements a
       LEFT JOIN announcement_reads r ON r.announcement_id = a.id AND r.user_id = ?
       ORDER BY a.created_at DESC`
    ).bind(userId).all<{ id: string; title: string; body: string; created_at: number; read: number }>()
    const items = (rows.results ?? []).map(a => ({ ...a, read: a.read === 1 }))
    const unread = items.filter(a => !a.read).length
    return json({ ok: true, data: { items, unread, isAdmin } })
  }

  // POST /api/announcements/read — marca tudo como lido
  if (last === 'read' && method === 'POST') {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id) SELECT id, ? FROM announcements'
    ).bind(userId).run()
    return json({ ok: true })
  }

  // POST /api/announcements — criar novo aviso (somente admin)
  if (last === 'announcements' && method === 'POST') {
    if (!isAdmin) return json({ ok: false, error: 'Apenas o administrador pode publicar avisos' }, 403)
    const b = await request.json().catch(() => ({})) as { title?: string; body?: string }
    if (!b.title || !b.body) return json({ ok: false, error: 'Título e conteúdo obrigatórios' }, 400)
    const id = crypto.randomUUID()
    await env.DB.prepare('INSERT INTO announcements (id, title, body) VALUES (?, ?, ?)')
      .bind(id, b.title.trim(), b.body.trim()).run()
    return json({ ok: true, data: { id } }, 201)
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
