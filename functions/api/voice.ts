/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

interface EnvWithAI extends Env { ANTHROPIC_API_KEY: string }
type Ctx = EventContext<EnvWithAI, string, { userId: string; householdId: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const CATEGORIES = [
  { id: 'moradia',      name: 'Moradia',       keywords: 'aluguel, condomínio, iptu, luz, água, gás, internet, reforma' },
  { id: 'alimentacao',  name: 'Alimentação',   keywords: 'restaurante, lanche, pizza, comida, delivery, refeição, mercado, feira, supermercado' },
  { id: 'transporte',   name: 'Transporte',    keywords: 'uber, táxi, ônibus, metrô, gasolina, combustível, estacionamento, pedágio, passagem' },
  { id: 'saude',        name: 'Saúde',         keywords: 'farmácia, remédio, médico, consulta, exame, plano de saúde, dentista' },
  { id: 'educacao',     name: 'Educação',      keywords: 'escola, faculdade, curso, livro, material escolar, mensalidade' },
  { id: 'lazer',        name: 'Lazer',         keywords: 'cinema, show, festa, viagem, parque, jogo, bar, balada' },
  { id: 'roupas',       name: 'Roupas',        keywords: 'roupa, sapato, tênis, vestuário, moda, acessório, bolsa, camiseta, calça' },
  { id: 'viagem',       name: 'Viagem',        keywords: 'hotel, passagem, avião, hospedagem, turismo' },
  { id: 'assinatura',   name: 'Assinatura',    keywords: 'netflix, spotify, amazon, apple, mensalidade, assinatura, streaming' },
  { id: 'negocio',      name: 'Negócio',       keywords: 'fornecedor, equipamento, serviço, investimento no negócio' },
  { id: 'outros',       name: 'Outros',        keywords: 'presente, doação, outros gastos' },
  { id: 'receita',      name: 'Receita',       keywords: 'salário, pagamento, freelance, renda, recebimento, pix recebido' },
  { id: 'investimento', name: 'Investimento',  keywords: 'dividendo, rendimento, juros, aplicação, resgate' },
]

export const onRequest: PagesFunction<EnvWithAI> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: 'ANTHROPIC_API_KEY não configurada' }, 503)

  const body = await request.json().catch(() => ({})) as { transcript?: string }
  const { transcript } = body

  if (!transcript?.trim()) return json({ ok: false, error: 'Transcrição vazia' }, 400)

  const today = new Date().toISOString().slice(0, 10)

  const prompt = `Você é um assistente financeiro brasileiro. O usuário falou: "${transcript}"

Extraia as informações da transação e retorne SOMENTE um JSON válido, sem markdown, sem explicação.

Categorias disponíveis:
${CATEGORIES.map(c => `- "${c.id}": ${c.name} (${c.keywords})`).join('\n')}

Regras:
- type: "expense" para gastos/compras/pagamentos, "income" para recebimentos/salário
- amount: valor numérico em reais (ex: 199.90). Se não mencionado, use 0
- description: nome curto e claro do que foi comprado/pago (ex: "Tênis Nike", "Conta de Luz", "Salário")
- categoryId: escolha o id mais adequado da lista acima
- date: "${today}"

Retorne exatamente neste formato:
{"type":"expense","amount":199.90,"description":"Tênis","categoryId":"roupas","date":"${today}"}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return json({ ok: false, error: `Anthropic error: ${err}` }, 502)
  }

  const data = await response.json() as { content: { type: string; text: string }[] }
  const text = data.content.find(c => c.type === 'text')?.text?.trim() ?? ''

  try {
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(clean)
    return json({ ok: true, data: parsed })
  } catch {
    // Try to extract JSON object from anywhere in the text
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return json({ ok: true, data: parsed })
      } catch { /* fall through */ }
    }
    return json({ ok: false, error: 'Falha ao interpretar resposta da IA', raw: text }, 500)
  }
}
