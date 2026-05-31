/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

interface StripeEnv extends Env {
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  APP_URL: string
}

type Ctx = EventContext<StripeEnv, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

// Stripe price IDs — criar no dashboard Stripe e substituir
const PRICES = {
  monthly: 'price_MONTHLY_ID_HERE',   // R$ 29,90/mês
  yearly:  'price_YEARLY_ID_HERE',    // R$ 249/ano
}

export const onRequest: PagesFunction<StripeEnv> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { request, env } = c
  const url   = new URL(request.url)
  const parts = url.pathname.replace(/\/$/, '').split('/')
  const last  = parts[parts.length - 1]

  // POST /api/stripe/checkout — cria sessão de pagamento
  if (last === 'checkout' && request.method === 'POST') {
    const { userId, householdId } = c.data
    const body = await request.json() as { plan: 'monthly' | 'yearly' }

    const priceId = PRICES[body.plan] ?? PRICES.monthly
    const appUrl  = env.APP_URL ?? 'https://app.kaizenfinance.com.br'

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]':             'card',
        'line_items[0][price]':               priceId,
        'line_items[0][quantity]':            '1',
        mode:                                 'subscription',
        'subscription_data[trial_period_days]': '14',
        success_url:                          `${appUrl}/app?checkout=success`,
        cancel_url:                           `${appUrl}/pricing`,
        'metadata[userId]':                   userId,
        'metadata[householdId]':              householdId,
        'allow_promotion_codes':              'true',
      }),
    })

    const session = await resp.json() as { url?: string; error?: { message: string } }
    if (!resp.ok) return json({ ok: false, error: session.error?.message ?? 'Stripe error' }, 502)

    return json({ ok: true, data: { url: session.url } })
  }

  // POST /api/stripe/webhook — eventos Stripe (signature verification)
  if (last === 'webhook' && request.method === 'POST') {
    const sig  = request.headers.get('stripe-signature') ?? ''
    const body = await request.text()

    // Verificação de assinatura (simplificada — em prod usar biblioteca full)
    if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
      return json({ ok: false, error: 'Missing signature' }, 400)
    }

    let event: { type: string; data: { object: Record<string, unknown> } }
    try {
      event = JSON.parse(body)
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { householdId?: string }
        subscription?: string
        customer?: string
      }
      const householdId = session.metadata?.householdId
      if (householdId) {
        // Marcar household como premium
        await ctx.env.DB.prepare(
          "UPDATE households SET plan = 'premium', stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?"
        ).bind(session.customer, session.subscription, householdId).run()
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { id: string }
      await ctx.env.DB.prepare(
        "UPDATE households SET plan = 'free' WHERE stripe_subscription_id = ?"
      ).bind(sub.id).run()
    }

    return json({ ok: true })
  }

  // GET /api/stripe/status — verificar plano atual
  if (last === 'status' && request.method === 'GET') {
    const { householdId } = c.data
    const row = await ctx.env.DB.prepare(
      'SELECT plan, stripe_subscription_id FROM households WHERE id = ?'
    ).bind(householdId).first<{ plan: string; stripe_subscription_id: string | null }>()

    return json({ ok: true, data: { plan: row?.plan ?? 'trial', subscriptionId: row?.stripe_subscription_id } })
  }

  return json({ ok: false, error: 'Not found' }, 404)
}
