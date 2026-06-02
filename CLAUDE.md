# CLAUDE.md — Kaizen Finance
**App de finanças pessoais/familiares premium — "nada jamais visto no Brasil"**
**Objetivo: vender via tráfego pago (Meta/Google Ads) + uso próprio. SaaS de finanças.**

---

## Status do projeto (atualizado: 2026-06-02)
🟢 Frontend 100% completo — Dashboard, Reports, Cashflow conectados ao backend real
🟢 Backend 100% implementado (Cloudflare Workers)
🟢 LandingPage na rota `/` (CTA abre direto em "Criar conta")
🟢 OnboardingWizard integrado ao fluxo de signup (redirect automático)
🟢 Stores API-aware — todos os CRUDs chamam backend em modo real
🟡 Stripe integrado no backend, falta ativar plano de assinaturas no frontend
🔴 D1 database_id ainda é PLACEHOLDER — falta criar no Cloudflare e configurar

---

## Frontend — tudo implementado ✅
- `src/main.tsx` + `src/App.tsx` — Entry point, ThemeProvider, Router, AppShell com sidebar responsiva
- `src/features/auth/LoginPage.tsx` + `authStore.ts` — Login/signup premium + modo demo sem backend
- `src/shared/lib/api.ts` — HTTP client com auto-refresh JWT
- `src/shared/lib/mappers.ts` — snake_case DB → camelCase frontend
- `src/features/dashboard/` — KPIs, próximas contas, metas, score saúde financeira 0-100
- `src/features/bills/` — CRUD completo, filtros, status pago/pendente/atrasado, WhatsApp alert UI
- `src/features/transactions/` — CRUD completo, agrupado por data, busca, filtro por tipo, nav por mês
- `src/features/budget/` — Cards de categoria com progress bar, alertas de estouro
- `src/features/goals/` — CRUD + simulador "guardando X/mês → meta em N meses"
- `src/features/patrimony/` — Ativos + dívidas + gráfico de evolução (Recharts)
- `src/features/reports/` — Bar, Pie, Area, Line charts; receita vs despesa, taxa poupança
- `src/features/cashflow/` — Previsão dia a dia nos próximos 30/60/90 dias, alerta de saldo negativo
- `src/features/accounts/` — Cartões de conta com barra de uso do cartão de crédito
- `src/features/subscriptions/` — Radar: detecta recorrentes automaticamente + manual
- `src/features/landing/LandingPage.tsx` — Landing page existe, falta ativar na rota `/`
- `src/features/onboarding/OnboardingWizard.tsx` — Onboarding existe, falta integrar ao signup
- `src/shared/stores/` — 6 stores Zustand com dados demo (bills, transactions, budget, goals, patrimony, accounts)
- `src/theme.ts` + `src/types.ts` — Design system e tipos completos

## Backend — `functions/api/` (Cloudflare Workers) ✅ COMPLETO
- `schema.sql` — Schema D1 completo (multi-household)
- `_middleware.ts` — JWT middleware
- `auth.ts` — Signup, Login, Refresh, Logout (PBKDF2 + JWT HS256)
- `accounts.ts` — CRUD de contas bancárias/cartões
- `transactions.ts` — CRUD de transações
- `bills.ts` — CRUD de contas a pagar
- `goals.ts` — CRUD de metas
- `budgets.ts` — CRUD de orçamentos por categoria
- `patrimony.ts` — CRUD de ativos e dívidas
- `dashboard.ts` — Agregações para KPIs do dashboard
- `ai.ts` — Análise financeira com Anthropic API (ANTHROPIC_API_KEY via secret)
- `stripe.ts` — Pagamentos/assinaturas (STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET via secret)

## O que falta para ir ao ar (prioridade)
1. **Criar D1 no Cloudflare** e substituir `PLACEHOLDER_REPLACE_WITH_REAL_ID` em `wrangler.toml`
2. **Aplicar schema**: `npx wrangler d1 execute kaizen-db --file=functions/api/schema.sql`
3. **Configurar secrets**: JWT_SECRET, ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
4. **Adicionar `npm run deploy`** ao package.json (falta o script de deploy)
5. **Ativar LandingPage** na rota `/` para tráfego pago
6. **Integrar OnboardingWizard** ao fluxo de signup
7. **Conectar stores frontend ao backend real** (sair do modo demo para usuários logados)
8. **Configurar domínio customizado** no Cloudflare Pages

## Arquitetura de dados (como funciona)
- **Demo mode** (`accessToken === 'demo-token'`): stores usam dados locais (Zustand + localStorage)
- **Real mode** (após login real): `StoreInitializer` em App.tsx chama `init()` em cada store ao logar
- **Stores API-aware**: cada CRUD action faz update otimista local + chama API async (reverte em erro)
- **Mappers** em `src/shared/lib/mappers.ts`: convertem snake_case do DB → camelCase do frontend

## Deploy no Cloudflare Pages (passo a passo)

### 1. Criar D1 Database
```bash
npx wrangler d1 create kaizen-db
# Copiar o database_id retornado e substituir PLACEHOLDER em wrangler.toml
npx wrangler d1 execute kaizen-db --file=functions/api/schema.sql
```

### 2. Configurar secrets
```bash
npx wrangler secret put JWT_SECRET          # string longa aleatória
npx wrangler secret put ANTHROPIC_API_KEY   # para IA financeira
npx wrangler secret put STRIPE_SECRET_KEY   # para assinaturas
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 3. Adicionar script de deploy ao package.json
```json
"deploy": "tsc -b && vite build && wrangler pages deploy dist"
```

### 4. Deploy
```bash
npm run deploy
```

### 5. Configurar no Cloudflare Dashboard
- Pages → kaizen → Settings → Functions → D1 database bindings
- Binding name: `DB`, database: `kaizen-db`

## Estratégia de negócio / monetização
- **Modelo**: SaaS com trial grátis + plano pago (Stripe já integrado no backend)
- **Distribuição**: tráfego pago (Meta Ads + Google Ads) → LandingPage → signup → trial
- **Uso próprio**: o dono usa o app também (dogfooding)
- **Público**: famílias brasileiras que querem controle financeiro premium

## Próximos passos de produto
1. Ativar LandingPage na rota `/` com CTA para signup
2. Configurar planos no Stripe (mensal + anual)
3. Implementar WhatsApp alerts via Z-API (campo whatsappNumber já existe nas contas)
4. Modo parceria (owner + partner view) — arquitetura multi-household já pronta
5. Onboarding wizard para novos usuários — já existe `OnboardingWizard.tsx`

## Stack
- Frontend: React 19 + TypeScript + Vite + MUI v9 + Framer Motion
- Backend: Cloudflare Pages Functions (Workers)
- Banco: Cloudflare D1 (SQLite no edge)
- Charts: Recharts v3
- Payments: Stripe
- State: Zustand v5 + TanStack Query v5
- Router: React Router DOM v7
- Auth: JWT (15min) + httpOnly cookie refresh (30 dias)
- IA: Anthropic API (análise financeira)

## Identidade visual
- Background: `#060A0E` (preto-azulado profundo)
- Primary: `#10B981` (verde esmeralda — dinheiro, crescimento)
- Secondary: `#F59E0B` (dourado — metas, conquistas)
- Cards: sólidos, sem blur excessivo, bordas neutras
- Estética: Bloomberg Terminal + Apple + Stripe + Linear

## Inspiração de design
- Bloomberg Terminal moderno: autoridade nos dados, dense mas legível
- Apple: clareza absoluta, sem ruído
- Stripe: precisão técnica, tipografia forte
- Linear: eficiência, sem decoração desnecessária
- NÃO usar: efeitos game-like, animações excessivas, glassmorphism pesado

## Diferenciais únicos do Kaizen
1. **Previsão de caixa dia a dia** — "no dia 18 você vai ficar no vermelho"
2. **Score de saúde financeira familiar** — 0-100, atualizado em tempo real
3. **Modo parceria** — visão individual + visão conjunta do casal
4. **WhatsApp alerts** — alerta antes do vencimento via WhatsApp
5. **Radar de assinaturas** — detecta cobranças recorrentes esquecidas
6. **Simulador de metas** — "guardando R$800/mês → meta em X meses"
7. **IA financeira** — análise mensal automática (Claude/Anthropic)

## Multi-household
Cada família é um `household` isolado. Dois usuários (owner + partner) compartilham dados da casa. Arquitetura pronta para escalar como SaaS.

## Estrutura de pastas atual
```
src/
├── features/
│   ├── auth/           ✅ LoginPage, authStore
│   ├── dashboard/      ✅ DashboardPage
│   ├── bills/          ✅ BillsPage
│   ├── transactions/   ✅ TransactionsPage
│   ├── budget/         ✅ BudgetPage
│   ├── goals/          ✅ GoalsPage
│   ├── patrimony/      ✅ PatrimonyPage
│   ├── reports/        ✅ ReportsPage
│   ├── cashflow/       ✅ CashflowPage
│   ├── accounts/       ✅ AccountsPage
│   ├── subscriptions/  ✅ SubscriptionsPage
│   ├── landing/        ⚠️  LandingPage.tsx existe — falta ativar na rota /
│   └── onboarding/     ⚠️  OnboardingWizard.tsx existe — falta integrar ao signup
├── shared/
│   ├── lib/            ✅ api.ts + mappers.ts
│   └── stores/         ✅ 6 stores Zustand com dados demo
├── theme.ts            ✅
├── types.ts            ✅
├── main.tsx            ✅
└── App.tsx             ✅ AppShell + sidebar + mobile nav

functions/api/
├── _middleware.ts      ✅ JWT auth
├── auth.ts             ✅ Signup/Login/Refresh/Logout
├── accounts.ts         ✅ CRUD
├── transactions.ts     ✅ CRUD
├── bills.ts            ✅ CRUD
├── goals.ts            ✅ CRUD
├── budgets.ts          ✅ CRUD
├── patrimony.ts        ✅ CRUD
├── dashboard.ts        ✅ Agregações KPI
├── ai.ts               ✅ Anthropic análise financeira
└── stripe.ts           ✅ Pagamentos/assinaturas
```

## Comandos
```bash
npm run dev      # Vite em :5173
npm run build    # tsc + vite build
# npm run deploy — adicionar ao package.json: tsc -b && vite build && wrangler pages deploy dist
```
