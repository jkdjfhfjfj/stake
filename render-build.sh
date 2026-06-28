#!/usr/bin/env bash
set -e

echo "==> Node $(node --version) | npm $(npm --version)"

# Render's system dirs (/usr/bin, /usr/lib) are read-only.
# npx downloads and runs pnpm without touching any system directory.
echo "==> Installing pnpm into writable home prefix..."
mkdir -p "$HOME/.npm-global"
npm install --prefix "$HOME/.npm-global" pnpm@10.26.1
export PATH="$HOME/.npm-global/node_modules/.bin:$PATH"
echo "==> pnpm $(pnpm --version)"

echo "==> Installing workspace dependencies..."
pnpm install --frozen-lockfile

echo "==> Pushing DB schema to Neon (auto-migrate)..."
pnpm --filter @workspace/db run push

echo "==> Seeding staking plans (safe to re-run)..."
pnpm --filter @workspace/scripts run seed || echo "Seed skipped"

echo "==> Building frontend..."
pnpm --filter @workspace/staking-platform run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Copying frontend into API dist..."
mkdir -p artifacts/api-server/dist/public
cp -r artifacts/staking-platform/dist/public/. artifacts/api-server/dist/public/

echo "==> Build complete!"
