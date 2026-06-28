#!/usr/bin/env bash
set -e

echo "==> Node version: $(node --version)"
echo "==> npm version: $(npm --version)"

# Render's file system is read-only for system dirs.
# Use corepack (built into Node 16.9+) to activate pnpm from the
# packageManager field in package.json — no global install needed.
echo "==> Enabling pnpm via corepack..."
if command -v corepack &>/dev/null; then
  corepack enable
  corepack prepare pnpm@10.26.1 --activate
else
  # Fallback: install pnpm into the writable home directory
  echo "corepack not available, installing pnpm to ~/.npm-global..."
  mkdir -p "$HOME/.npm-global"
  npm install -g pnpm@10.26.1 --prefix "$HOME/.npm-global"
  export PATH="$HOME/.npm-global/bin:$PATH"
fi

echo "==> pnpm version: $(pnpm --version)"

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Pushing DB schema to Neon (auto-migrate)..."
pnpm --filter @workspace/db run push

echo "==> Seeding staking plans (safe to re-run)..."
pnpm --filter @workspace/scripts run seed || echo "Seed step skipped (already seeded or no plans to add)"

echo "==> Building frontend..."
pnpm --filter @workspace/staking-platform run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Copying frontend build into API server dist..."
mkdir -p artifacts/api-server/dist/public
cp -r artifacts/staking-platform/dist/public/. artifacts/api-server/dist/public/

echo "==> Build complete!"
