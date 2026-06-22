---
name: Clerk dev-mode bypass
description: publishableKeyFromHost doesn't work for Replit's janeway.replit.dev domains; full bypass pattern for development without Clerk keys.
---

## Problem
`publishableKeyFromHost` constructs a Clerk key pointing to `clerk.<hostname>`. For Replit's dev domains (`*.janeway.replit.dev`), this domain doesn't exist as a Clerk frontend API, so Clerk JS fails to load.

## Solution: DEV_MODE flag + three-layer bypass

### 1. Frontend (App.tsx)
- `DEV_MODE = !clerkPubKey` (true when hostname is localhost OR publishableKeyFromHost returns empty)
- Call `setAuthTokenGetter(() => Promise.resolve("dev-token"))` **synchronously at module level** (not in useEffect — race condition causes first API calls to be unauthenticated)
- Render `DevRouter` (no ClerkProvider) vs `ClerkRouter` (with ClerkProvider) based on `DEV_MODE`
- `DevRouter` wraps in `DevAuthProvider` (provides mock user to context)

### 2. Auth context (lib/auth-context.tsx)
- `DevAuthProvider` + `ClerkAuthProvider` (uses `useUser()` inside Clerk tree) — both write to same `AuthContext`
- `useAppUser()` and `useDevMode()` hooks consumed by layout/pages — no direct Clerk hook calls outside ClerkProvider

### 3. API server (lib/auth.ts + app.ts)
- `app.ts`: only apply `clerkMiddleware` when `CLERK_SECRET_KEY` is set (otherwise it crashes on every request)
- `auth.ts`: `DEV_MODE = NODE_ENV=development AND !CLERK_SECRET_KEY` — in dev mode ONLY accept `Bearer dev-token`, skip `getAuth()` entirely (getAuth throws without clerkMiddleware applied)
- Dev user: clerkId=`dev_local_user`, email=`dev@stakeke.local`, auto-provisioned in DB on first request

**Why:** `getAuth(req)` from `@clerk/express` throws (500) if `clerkMiddleware` wasn't applied to the request. Must be guarded.

## Activation
When user adds real `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` as Replit secrets, `DEV_MODE` becomes `false` automatically and full Clerk auth restores.
