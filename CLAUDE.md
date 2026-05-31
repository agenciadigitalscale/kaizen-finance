# CLAUDE.md — Kaizen Finance
**App de finanças pessoais/familiares premium — "nada jamais visto no Brasil"**

---

## Status do projeto
🟡 Frontend 100% completo em modo demo — backend ainda não conectado

## Frontend — tudo implementado ✅
- `src/main.tsx` + `src/App.tsx` — Entry point, ThemeProvider, Router, AppShell com sidebar responsiva
- `src/features/auth/LoginPage.tsx` + `authStore.ts` — Login/signup premium + modo demo sem backend
- `src/shared/lib/api.ts` — HTTP client com auto-refresh JWT
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
- `src/shared/stores/` — 6 stores Zustand com dados demo (bills, transactions, budget, goals, patrimony, accounts)
- `src/theme.ts` + `src/types.ts` — Design system e tipos completos

## Backend — `functions/api/` (Cloudflare Workers) já existe, falta conectar
- `schema.sql` — Schema D1 completo (multi-household)
- `_middleware.ts` — JWT middleware
- `auth.ts` — Signup, Login, Refresh, Logout (PBKDF2 + JWT HS256)
- **Faltam**: endpoints de transactions, bills, accounts, goals, budgets, patrimony

## Arquitetura de dados (como funciona)
- **Demo mode** (`accessToken === 'demo-token'`): stores usam dados locais (Zustand + localStorage)
- **Real mode** (após login real): `StoreInitializer` em App.tsx chama `init()` em cada store ao logar
- **Stores API-aware**: cada CRUD action faz update otimista local + chama API async (reverte em erro)
- **Mappers** em `src/shared/lib/mappers.ts`: convertem snake_case do DB → camelCase do frontend

## Deploy no Cloudflare Pages (passo a passo)

### 1. Criar D1 Database
```bash
npx wrangler d1 create kaizen-db
# Copiar o database_id retornado e colar em wrangler.toml
npx wrangler d1 execute kaizen-db --file=functions/api/schema.sql
```

### 2. Configurar secrets
```bash
npx wrangler secret put JWT_SECRET
# Digite uma string aleatória longa (ex: openssl rand -base64 32)
```

### 3. Deploy
```bash
npm run deploy
# = npm run build + wrangler pages deploy dist
```

### 4. Configurar no Cloudflare Dashboard
- Pages → kaizen → Settings → Functions → D1 database bindings
- Binding name: `DB`, database: `kaizen-db`

### Opcional: IA financeira
- Adicionar `ANTHROPIC_API_KEY` como secret: `npx wrangler secret put ANTHROPIC_API_KEY`

## Próximos passos
1. Implementar WhatsApp alerts via Z-API (já tem campo whatsappNumber nas contas)
2. Landing page (/landing) — já existe `LandingPage.tsx`
3. Onboarding wizard para novos usuários — já existe `OnboardingWizard.tsx`
4. Modo parceria (owner + partner view)

## Stack
- Frontend: React 18 + TypeScript + Vite + MUI v6
- Backend: Cloudflare Pages Functions (Workers)
- Banco: Cloudflare D1 (SQLite no edge)
- Charts: Recharts
- Animations: Framer Motion (seletivo — não excessivo)
- State: Zustand + TanStack Query
- Router: React Router DOM v6
- Auth: JWT (15min) + httpOnly cookie refresh (30 dias)

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
7. **IA financeira** — análise mensal automática

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
│   └── subscriptions/  ✅ SubscriptionsPage
├── shared/
│   ├── lib/            ✅ api.ts (HTTP client com auto-refresh)
│   └── stores/         ✅ 6 stores Zustand com dados demo
├── theme.ts            ✅
├── types.ts            ✅
├── main.tsx            ✅
└── App.tsx             ✅ AppShell + sidebar + mobile nav
```

## Comandos
```bash
npm run dev      # Vite em :5173
npm run build    # tsc + vite build
npm run deploy   # build + wrangler pages deploy dist
```
