# StakeKE — Kenyan Staking Platform

A full-stack Kenyan investment/staking platform where users deposit via M-Pesa, stake in tiered plans, earn ROI, and refer others — all in KES.

## Run & Operate

- `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/staking-platform run dev` — frontend dev server
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed staking plans and platform settings

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Wouter routing, custom JWT auth
- API: Express 5 (port 8080 → `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: custom email/password + JWT (`bcryptjs` hash, `jsonwebtoken` HS256 7d, token in `localStorage`)
- Payments: PayHero Kenya (M-Pesa STK Push + B2C) — credentials stored in DB
- Charts: Recharts

## Where things live

- `lib/db/src/schema/` — DB schema (users, staking-plans, stakes, transactions, referrals, notifications, audit-logs, platform-settings + relations)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `artifacts/api-server/src/routes/` — all route handlers
- `artifacts/api-server/src/lib/payhero.ts` — PayHero M-Pesa integration
- `artifacts/api-server/src/lib/auth.ts` — Clerk requireAuth/requireAdmin middleware
- `artifacts/staking-platform/src/pages/` — all frontend pages

## Architecture decisions

- PayHero credentials (username, password, channel_id) stored in `platform_settings` DB table, not env vars — admin manages via `/admin/settings`
- Custom JWT auth: bcryptjs password hashing, jsonwebtoken HS256 7d tokens stored in localStorage
- All KES amounts stored as Postgres `numeric` type — converted with `Number()` in API responses
- Referral system: 2-tier (5% tier-1, 2% tier-2) stored in `platform_settings`
- Admin cron job runs hourly to mature stakes and process auto-invest/early-break

## Product

- Landing page with KES stats and M-Pesa branding
- Multi-step Clerk onboarding (phone, referral code)
- Dashboard: live balance, staking history, deposit/withdraw M-Pesa dialogs
- Staking plans: 4 plans with ROI/duration/auto-invest/early-break options
- Transactions page: full history with filters
- Referrals page: 2-tier tree with earned commissions
- Notifications: real-time updates for deposits, matured stakes, withdrawals
- Admin panel at `/admin`: analytics (Recharts), user management, withdrawal approvals, PayHero settings, audit logs

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The `restart_workflow` tool and `configureWorkflow` with `waitForPort` both fail for this project due to a Replit environment port-detection bug. Use `configureWorkflow` WITHOUT `waitForPort` to start the frontend — the workflow is named **"Staking Platform"** with command `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/staking-platform run dev`.
- The artifact-managed workflow "artifacts/staking-platform: web" will always show as FAILED — ignore it; use the "Staking Platform" workflow instead.
- `pnpm --filter @workspace/scripts run seed` must be run with `@workspace/db` as a dependency in `scripts/package.json` (already done).
- Numeric DB columns (roiPercent, minAmount, etc.) need `Number()` coercion when returning from API.
- Clerk `@clerk/react/internal` exports `publishableKeyFromHost` as a subpath — do NOT add `"internal": "link:@clerk/react/internal"` to package.json (this was a bug that was fixed).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
