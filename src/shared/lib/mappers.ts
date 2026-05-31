import type { Transaction, Bill, Account, Goal, Asset, Liability } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export function mapTransaction(r: Row): Transaction {
  return {
    id:           r.id,
    householdId:  r.household_id,
    userId:       r.user_id,
    type:         r.type,
    amount:       r.amount,
    description:  r.description,
    categoryId:   r.category_id,
    accountId:    r.account_id,
    toAccountId:  r.to_account_id ?? undefined,
    date:         r.date,
    status:       r.status,
    isRecurring:  Boolean(r.is_recurring),
    notes:        r.notes ?? undefined,
    createdAt:    r.created_at,
  }
}

export function mapBill(r: Row): Bill {
  return {
    id:             r.id,
    householdId:    r.household_id,
    name:           r.name,
    amount:         r.amount,
    dueDate:        r.due_date,
    frequency:      r.frequency,
    categoryId:     r.category_id ?? 'outros',
    accountId:      r.account_id ?? undefined,
    status:         r.status,
    isShared:       Boolean(r.is_shared),
    reminderDays:   r.reminder_days,
    whatsappAlert:  Boolean(r.whatsapp_alert),
    whatsappNumber: r.whatsapp_number ?? undefined,
    notes:          r.notes ?? undefined,
    paidAt:         r.paid_at ?? undefined,
    createdAt:      r.created_at,
  }
}

export function mapAccount(r: Row): Account {
  return {
    id:          r.id,
    householdId: r.household_id,
    name:        r.name,
    type:        r.type,
    bank:        r.bank ?? undefined,
    balance:     r.balance,
    creditLimit: r.credit_limit ?? undefined,
    closingDay:  r.closing_day ?? undefined,
    dueDay:      r.due_day ?? undefined,
    color:       r.color,
    icon:        r.icon,
    isShared:    Boolean(r.is_shared),
    ownerId:     r.owner_id ?? undefined,
    createdAt:   r.created_at,
  }
}

export function mapGoal(r: Row): Goal {
  return {
    id:                  r.id,
    householdId:         r.household_id,
    name:                r.name,
    type:                r.type,
    targetAmount:        r.target_amount,
    currentAmount:       r.current_amount,
    targetDate:          r.target_date ?? undefined,
    monthlyContribution: r.monthly_contribution,
    icon:                r.icon,
    color:               r.color,
    status:              r.status,
    notes:               r.notes ?? undefined,
    createdAt:           r.created_at,
  }
}

export function mapAsset(r: Row): Asset {
  return {
    id:            r.id,
    householdId:   r.household_id,
    name:          r.name,
    type:          r.type,
    currentValue:  r.current_value,
    purchaseValue: r.purchase_value ?? undefined,
    purchaseDate:  r.purchase_date ?? undefined,
    notes:         r.notes ?? undefined,
    updatedAt:     r.updated_at,
    createdAt:     r.created_at,
  }
}

export function mapLiability(r: Row): Liability {
  return {
    id:              r.id,
    householdId:     r.household_id,
    name:            r.name,
    totalAmount:     r.total_amount,
    remainingAmount: r.remaining_amount,
    monthlyPayment:  r.monthly_payment,
    interestRate:    r.interest_rate ?? undefined,
    dueDate:         r.due_date ?? undefined,
    creditor:        r.creditor,
    notes:           r.notes ?? undefined,
    createdAt:       r.created_at,
  }
}
