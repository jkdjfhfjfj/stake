---
name: Auth: email/password + JWT
description: Clerk fully replaced with custom email/password auth. bcryptjs for hashing, jsonwebtoken (HS256, 7d) for tokens stored in localStorage.
---

## Architecture

### DB (`lib/db/src/schema/users.ts`)
- `clerkId` — now nullable (kept for migration safety, not used)
- `passwordHash text` — bcrypt hash, nullable (null for pre-existing users)

### API (`artifacts/api-server/`)
- `src/lib/auth.ts` — `signToken(payload)`, `verifyToken(token)`, `requireAuth`, `requireAdmin` middleware; reads `Authorization: Bearer <jwt>` header
- `src/routes/auth.ts` — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`; sanitize() strips passwordHash + clerkId from responses
- `src/app.ts` — no Clerk middleware at all; plain Express with cors + json
- `JWT_SECRET` env var (falls back to dev default if not set)
- Packages: `bcryptjs`, `jsonwebtoken` (+ their @types)

### Frontend (`artifacts/staking-platform/src/`)
- `lib/auth.ts` — `getToken()`, `setToken()`, `clearToken()`, `isLoggedIn()`, `apiLogin()`, `apiRegister()`, `apiMe()`; token stored in `localStorage` as `stakeke_token`
- `lib/auth-context.tsx` — `AuthProvider`, `useAppAuth()` (returns `{user, loading, refresh, logout}`), `useAppUser()`; wires `setAuthTokenGetter` to send JWT on all API calls
- `pages/login.tsx`, `pages/register.tsx` — standalone pages with email/password forms
- `App.tsx` — `AuthProvider` wraps everything; `ProtectedRoute` redirects to `/login`; `AdminRoute` checks `role === "ADMIN"` and redirects to `/admin-login`

### OpenAPI
- Removed `clerkId` from `User` and `AdminUser` schemas
- Re-ran `pnpm --filter @workspace/api-spec run codegen` to regenerate Zod + React Query hooks

## Admin access
Admin role must be set in DB directly: `UPDATE users SET role = 'ADMIN' WHERE email = '...';`
Then `/admin-login` (same login form) → redirects to `/admin` when role=ADMIN.

**Why:** publishableKeyFromHost() doesn't work for *.janeway.replit.dev domains, and the user didn't want a Clerk account.
