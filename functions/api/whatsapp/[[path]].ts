/// <reference types="@cloudflare/workers-types" />
// ── /api/whatsapp/* — Envio + robô de lançamentos via Z-API ─────────────────
// Secrets: ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN, ZAPI_WEBHOOK_TOKEN
// Binding opcional: AI (Workers AI) para transcrever áudio com Whisper
import type { Env } from '../_middleware'

interface ZapiEnv extends Env {
  ZAPI_INSTANCE_ID?: string
  ZAPI_TOKEN?: string
  ZAPI_CLIENT_TOKEN?: string
  ZAPI_WEBHOOK_TOKEN?: string
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<{ text?: string }> }
}

type Ctx = EventContext<ZapiEnv, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

// Normaliza para o formato do Z-API: 55 + DDD + número (só dígitos)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

async function sendWhatsApp(env: ZapiEnv, phone: string, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!env.ZAPI_INSTANCE_ID || !env.ZAPI_TOKEN) {
    return { ok: false, error: 'WhatsApp (Z-API) não configurado no servidor.' }
  }
  const url = `https://api.z-api.io/instances/${env.ZAPI_INSTANCE_ID}/token/${env.ZAPI_TOKEN}/send-text`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.ZAPI_CLIENT_TOKEN ? { 'Client-Token': env.ZAPI_CLIENT_TOKEN } : {}),
    },
    body: JSON.stringify({ phone: normalizePhone(phone), message }),
  })
  if (!res.ok) {
    const t = await res.text()
    return { ok: false, error: `Z-API erro ${res.status}: ${t.slice(0, 200)}` }
  }
  return { ok: true }
}

// ── Interpretação da frase → transação (mesmo motor do /api/voice) ──────────
const CATEGORIES = [
  { id: 'moradia',      name: 'Moradia',       keywords: 'aluguel, condomínio, iptu, luz, água, gás, internet' },
  { id: 'alimentacao',  name: 'Alimentação',   keywords: 'restaurante, lanche, comida, delivery, mercado, feira, supermercado' },
  { id: 'transporte',   name: 'Transporte',    keywords: 'uber, táxi, ônibus, gasolina, combustível, estacionamento' },
  { id: 'saude',        name: 'Saúde',         keywords: 'farmácia, remédio, médico, consulta, plano de saúde' },
  { id: 'educacao',     name: 'Educação',      keywords: 'escola, faculdade, curso, livro, mensalidade' },
  { id: 'lazer',        name: 'Lazer',         keywords: 'cinema, show, festa, parque, jogo, bar' },
  { id: 'roupas',       name: 'Roupas',        keywords: 'roupa, sapato, tênis, acessório' },
  { id: 'viagem',       name: 'Viagem',        keywords: 'hotel, passagem, avião, hospedagem' },
  { id: 'assinatura',   name: 'Assinatura',    keywords: 'netflix, spotify, streaming, mensalidade' },
  { id: 'negocio',      name: 'Negócio',       keywords: 'fornecedor, equipamento, serviço' },
  { id: 'outros',       name: 'Outros',        keywords: 'presente, doação, outros' },
  { id: 'receita',      name: 'Receita',       keywords: 'salário, pagamento, freelance, recebimento, pix recebido' },
  { id: 'investimento', name: 'Investimento',  keywords: 'dividendo, rendimento, juros' },
]

interface ParsedTx { type: 'expense' | 'income'; amount: number; description: string; categoryId: string; date: string }

async function parseTransaction(env: ZapiEnv, transcript: string): Promise<ParsedTx | null> {
  if (!env.ANTHROPIC_API_KEY) return null
  const today = new Date().toISOString().slice(0, 10)
  const prompt = `Você é um assistente financeiro brasileiro. O usuário falou: "${transcript}"

Extraia as informações da transação e retorne SOMENTE um JSON válido, sem markdown, sem explicação.

Categorias disponíveis:
${CATEGORIES.map(c => `- "${c.id}": ${c.name} (${c.keywords})`).join('\n')}

Regras:
- type: "expense" para gastos/compras/pagamentos, "income" para recebimentos/salário
- amount: valor numérico em reais (ex: 199.90). Se não mencionado, use 0
- description: nome curto do que foi comprado/pago/recebido (ex: "Mercado", "Salário")
- categoryId: escolha o id mais adequado da lista
- date: "${today}"

Retorne exatamente neste formato:
{"type":"expense","amount":100,"description":"Mercado","categoryId":"alimentacao","date":"${today}"}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) return null
  const data = await response.json() as { content: { type: string; text: string }[] }
  const text = data.content.find(c => c.type === 'text')?.text?.trim() ?? ''
  try {
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(clean) as ParsedTx
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) as ParsedTx } catch { /* noop */ } }
    return null
  }
}

// Transcreve áudio com Workers AI (Whisper), se o binding AI existir
async function transcribeAudio(env: ZapiEnv, audioUrl: string): Promise<string | null> {
  if (!env.AI) return null
  try {
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) return null
    const buf = await audioRes.arrayBuffer()
    const result = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(buf)] })
    return result?.text?.trim() || null
  } catch { return null }
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const onRequest: PagesFunction<ZapiEnv> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const url  = new URL(request.url)
  const last = url.pathname.replace(/\/$/, '').split('/').pop()

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  // ── POST /api/whatsapp/webhook — robô: recebe mensagem da Z-API (PÚBLICO) ──
  if (last === 'webhook') {
    // Segurança: token compartilhado na URL do webhook (?token=...)
    if (!env.ZAPI_WEBHOOK_TOKEN || url.searchParams.get('token') !== env.ZAPI_WEBHOOK_TOKEN) {
      return json({ ok: false, error: 'Token inválido' }, 401)
    }

    const b = await request.json().catch(() => ({})) as {
      phone?: string; fromMe?: boolean; isGroup?: boolean
      text?: { message?: string }
      audio?: { audioUrl?: string }
    }
    // Ignora mensagens enviadas por nós mesmos e grupos
    if (!b.phone || b.fromMe || b.isGroup) return json({ ok: true, skipped: true })

    // 1. Identifica o usuário pelo número vinculado
    const phone = normalizePhone(b.phone)
    const user = await env.DB.prepare(
      `SELECT u.id AS user_id, u.name, hm.household_id
       FROM users u JOIN household_members hm ON hm.user_id = u.id
       WHERE u.whatsapp_phone = ? LIMIT 1`
    ).bind(phone).first<{ user_id: string; name: string; household_id: string }>()

    if (!user) {
      await sendWhatsApp(env, phone,
        '👋 Olá! Este é o assistente do Kaizen Finance.\n\nSeu número ainda não está vinculado a uma conta. Abra o app → Configurações → Alertas no WhatsApp e cadastre este número para lançar gastos por aqui.')
      return json({ ok: true, unlinked: true })
    }

    // 2. Extrai o texto (mensagem de texto ou transcrição de áudio)
    let transcript = b.text?.message?.trim() ?? ''
    if (!transcript && b.audio?.audioUrl) {
      const t = await transcribeAudio(env, b.audio.audioUrl)
      if (t) transcript = t
      else {
        await sendWhatsApp(env, phone, '😕 Não consegui ouvir o áudio. Pode mandar por texto? Ex: "gastei 50 no mercado"')
        return json({ ok: true, transcribeFailed: true })
      }
    }
    if (!transcript) return json({ ok: true, empty: true })

    // 3. IA interpreta a frase → transação
    const parsed = await parseTransaction(env, transcript)
    if (!parsed || !parsed.amount || parsed.amount <= 0) {
      await sendWhatsApp(env, phone,
        `🤔 Não entendi o valor. Tenta assim:\n• "gastei 100 reais no mercado"\n• "recebi 50 de pix"`)
      return json({ ok: true, parseFailed: true })
    }

    // 4. Lança a transação no banco (valor em centavos)
    // account_id é obrigatório — usa a primeira conta da família
    const acc = await env.DB.prepare(
      'SELECT id FROM accounts WHERE household_id = ? ORDER BY created_at ASC LIMIT 1'
    ).bind(user.household_id).first<{ id: string }>()

    const cents = Math.round(parsed.amount * 100)
    const txId = crypto.randomUUID()
    await env.DB.prepare(
      `INSERT INTO transactions (id, household_id, user_id, type, amount, description, category_id, account_id, date, status, is_recurring)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 0)`
    ).bind(txId, user.household_id, user.user_id, parsed.type, cents, parsed.description, parsed.categoryId, acc?.id ?? '', parsed.date).run()

    // 5. Confirma no WhatsApp
    const emoji = parsed.type === 'income' ? '💰' : '✅'
    const tipo  = parsed.type === 'income' ? 'Receita' : 'Despesa'
    await sendWhatsApp(env, phone,
      `${emoji} ${tipo} registrada!\n\n*${parsed.description}* — ${fmtBRL(parsed.amount)}\n📂 ${CATEGORIES.find(cat => cat.id === parsed.categoryId)?.name ?? parsed.categoryId}\n\nJá está no seu painel Kaizen. 📊`)
    return json({ ok: true, data: { id: txId } })
  }

  // ── POST /api/whatsapp/test — mensagem de teste (autenticado) ──
  if (last === 'test') {
    const body = await request.json().catch(() => ({})) as { phone?: string; message?: string }
    if (!body.phone) return json({ ok: false, error: 'Informe o número' }, 400)
    const msg = body.message || '✅ Kaizen Finance: seu alerta de WhatsApp está funcionando!'
    const result = await sendWhatsApp(env, body.phone, msg)
    return json(result, result.ok ? 200 : 503)
  }

  return json({ ok: false, error: 'Rota não encontrada' }, 404)
}
