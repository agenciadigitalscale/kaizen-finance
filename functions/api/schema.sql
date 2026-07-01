-- ── Kaizen Finance — D1 Schema ──────────────────────────────────────────────
-- Multi-household desde o dia 1. Cada família é um household isolado.
-- ────────────────────────────────────────────────────────────────────────────

PRAGMA foreign_keys = ON;

-- ── Usuários ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ── Famílias / Casas ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'BRL',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('owner','partner','viewer')),
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#10B981',
  joined_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (household_id, user_id)
);

-- ── Auth ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_pwreset_token ON password_resets(token_hash);

CREATE TABLE IF NOT EXISTS announcements (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  read_at         INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (announcement_id, user_id)
);

-- ── Categorias ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id           TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('income','expense')),
  grp          TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT '📦',
  color        TEXT NOT NULL DEFAULT '#6B7280',
  is_default   INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_categories_household ON categories(household_id);

-- ── Contas bancárias e cartões ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id            TEXT PRIMARY KEY,
  household_id  TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  bank          TEXT,
  balance       INTEGER NOT NULL DEFAULT 0,
  credit_limit  INTEGER,
  closing_day   INTEGER,
  due_day       INTEGER,
  color         TEXT NOT NULL DEFAULT '#10B981',
  icon          TEXT NOT NULL DEFAULT '🏦',
  is_shared     INTEGER NOT NULL DEFAULT 1,
  owner_id      TEXT REFERENCES users(id),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_accounts_household ON accounts(household_id);

-- ── Transações ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  household_id    TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  amount          INTEGER NOT NULL,
  description     TEXT NOT NULL,
  category_id     TEXT NOT NULL,
  account_id      TEXT NOT NULL,
  to_account_id   TEXT,
  date            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled')),
  is_recurring    INTEGER NOT NULL DEFAULT 0,
  recurring_id    TEXT,
  tags            TEXT,
  notes           TEXT,
  installment_current INTEGER,
  installment_total   INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_transactions_household ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account   ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);

-- ── Contas a pagar ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id               TEXT PRIMARY KEY,
  household_id     TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  amount           INTEGER NOT NULL,
  due_date         TEXT NOT NULL,
  end_date         TEXT,
  frequency        TEXT NOT NULL DEFAULT 'monthly',
  category_id      TEXT,
  account_id       TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  is_shared        INTEGER NOT NULL DEFAULT 1,
  reminder_days    INTEGER NOT NULL DEFAULT 3,
  whatsapp_alert   INTEGER NOT NULL DEFAULT 0,
  whatsapp_number  TEXT,
  notes            TEXT,
  paid_at          TEXT,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_bills_household ON bills(household_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date  ON bills(due_date);

-- ── Orçamentos ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id           TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id  TEXT NOT NULL,
  month        TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE(household_id, category_id, month)
);
CREATE INDEX IF NOT EXISTS idx_budgets_household ON budgets(household_id, month);

-- ── Metas ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id                   TEXT PRIMARY KEY,
  household_id         TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL,
  target_amount        INTEGER NOT NULL,
  current_amount       INTEGER NOT NULL DEFAULT 0,
  target_date          TEXT,
  monthly_contribution INTEGER NOT NULL DEFAULT 0,
  icon                 TEXT NOT NULL DEFAULT '🎯',
  color                TEXT NOT NULL DEFAULT '#10B981',
  status               TEXT NOT NULL DEFAULT 'active',
  notes                TEXT,
  created_at           INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_goals_household ON goals(household_id);

-- ── Patrimônio ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id             TEXT PRIMARY KEY,
  household_id   TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL,
  current_value  INTEGER NOT NULL,
  purchase_value INTEGER,
  purchase_date  TEXT,
  notes          TEXT,
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS liabilities (
  id                TEXT PRIMARY KEY,
  household_id      TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  total_amount      INTEGER NOT NULL,
  remaining_amount  INTEGER NOT NULL,
  monthly_payment   INTEGER NOT NULL,
  interest_rate     REAL,
  due_date          TEXT,
  creditor          TEXT NOT NULL,
  notes             TEXT,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_assets_household      ON assets(household_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_household ON liabilities(household_id);
