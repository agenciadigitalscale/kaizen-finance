/// <reference types="@cloudflare/workers-types" />
import type { Env } from './_middleware'

type Ctx = EventContext<Env, string, { userId: string; householdId: string; role: string }>

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const c = ctx as unknown as Ctx
  const { env } = c
  const { householdId } = c.data
  const month = new Date().toISOString().slice(0, 7)

  const [accounts, bills, goals, txStats, assetSum, liabilitySum] = await Promise.all([
    // All accounts
    env.DB.prepare('SELECT * FROM accounts WHERE household_id = ?').bind(householdId).all(),

    // Bills due in next 30 days or overdue
    env.DB.prepare(
      `SELECT * FROM bills WHERE household_id = ? AND status != 'paid'
       ORDER BY due_date ASC LIMIT 10`
    ).bind(householdId).all(),

    // Active goals
    env.DB.prepare(
      "SELECT * FROM goals WHERE household_id = ? AND status = 'active' ORDER BY created_at ASC"
    ).bind(householdId).all(),

    // Current month income/expense
    env.DB.prepare(
      `SELECT
        SUM(CASE WHEN type = 'income'  AND status = 'confirmed' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' AND status = 'confirmed' THEN amount ELSE 0 END) as expense
       FROM transactions WHERE household_id = ? AND date LIKE ?`
    ).bind(householdId, `${month}%`).first<{ income: number; expense: number }>(),

    // Total assets value
    env.DB.prepare('SELECT SUM(current_value) as total FROM assets WHERE household_id = ?')
      .bind(householdId).first<{ total: number }>(),

    // Total liabilities
    env.DB.prepare('SELECT SUM(remaining_amount) as total FROM liabilities WHERE household_id = ?')
      .bind(householdId).first<{ total: number }>(),
  ])

  const totalBalance = (accounts.results as { balance: number }[])
    .reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0)

  const today = new Date().toISOString().slice(0, 10)
  const billsData = (bills.results as { due_date: string; status: string; amount: number }[])
  const overdueBills  = billsData.filter(b => b.due_date < today).length
  const pendingBills  = billsData.filter(b => b.due_date >= today).length

  const netWorth = (assetSum?.total ?? 0) + totalBalance - (liabilitySum?.total ?? 0)

  // Simple health score calculation
  const income  = txStats?.income ?? 0
  const expense = txStats?.expense ?? 0
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0
  const debtPayment = (liabilitySum?.total ?? 0) > 0
    ? Math.min(100, 100 - ((liabilitySum?.total ?? 0) / Math.max(netWorth, 1) * 25))
    : 100

  const scoreComponents = {
    savingsRate:      Math.min(25, Math.max(0, savingsRate / 2)),   // 0-25
    debtRatio:        Math.min(25, Math.max(0, debtPayment / 4)),   // 0-25
    budgetAdherence:  expense <= income ? 25 : Math.max(0, 25 - ((expense - income) / income * 25)), // 0-25
    emergencyFund:    Math.min(25, totalBalance > 0 ? 25 : 0),      // 0-25
  }
  const healthScore = Math.round(
    scoreComponents.savingsRate + scoreComponents.debtRatio +
    scoreComponents.budgetAdherence + scoreComponents.emergencyFund
  )

  return json({
    ok: true,
    data: {
      totalBalance,
      monthIncome:  income,
      monthExpense: expense,
      overdueBills,
      pendingBills,
      healthScore: Math.min(100, Math.max(0, healthScore)),
      netWorth,
      bills:  bills.results,
      goals:  goals.results,
    },
  })
}
