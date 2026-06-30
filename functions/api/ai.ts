/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

interface EnvWithAI extends Env {
  ANTHROPIC_API_KEY: string
}

type Ctx = EventContext<EnvWithAI, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<EnvWithAI> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const { householdId } = c.data

  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const body = await request.json() as { financialData: unknown; question?: string }
  const { financialData, question } = body

  if (!env.ANTHROPIC_API_KEY) {
    return json({ ok: false, error: 'ANTHROPIC_API_KEY não configurada' }, 503)
  }

  const prompt = question
    ? `Você é o Kaizen, um consultor financeiro pessoal de finanças familiares brasileiras.
O usuário fez esta pergunta: "${question}"

Responda de forma direta, prática e motivadora, em português, usando os dados financeiros dele abaixo.
Use no máximo 180 palavras. Use **negrito** para destacar o ponto principal e bullets quando útil. Cite valores em reais.

IMPORTANTE: todos os valores monetários abaixo estão em CENTAVOS — divida por 100 para obter o valor em reais (ex: 50000 = R$ 500,00).
Dados financeiros:
${JSON.stringify(financialData, null, 2)}`
    : `Você é um consultor financeiro pessoal especializado em finanças familiares brasileiras.
Analise os dados financeiros abaixo e forneça uma análise detalhada em português, estruturada em:

1. **Resumo geral** (2-3 frases sobre a saúde financeira)
2. **Pontos positivos** (o que estão fazendo bem)
3. **Alertas** (o que precisa de atenção imediata)
4. **Recomendações** (3-5 ações concretas e priorizadas)
5. **Meta do mês** (UMA meta específica e alcançável para o próximo mês)

IMPORTANTE: todos os valores monetários abaixo estão em CENTAVOS — divida por 100 para obter o valor em reais (ex: 50000 = R$ 500,00).
Dados financeiros:
${JSON.stringify(financialData, null, 2)}

Seja específico, use valores em reais quando relevante, e dê conselhos práticos e acionáveis.
Limite a resposta a 400 palavras no máximo.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'x-api-key':            env.ANTHROPIC_API_KEY,
      'anthropic-version':    '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return json({ ok: false, error: `Anthropic API error: ${err}` }, 502)
  }

  const data = await response.json() as { content: { type: string; text: string }[] }
  const text = data.content.find(c => c.type === 'text')?.text ?? ''

  return json({ ok: true, data: { analysis: text, generatedAt: Date.now() } })
}
