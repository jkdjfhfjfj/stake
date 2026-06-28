#!/usr/bin/env bash
set -e

echo "==> Installing pnpm..."
npm install -g pnpm@10

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Pushing DB schema to Neon..."
pnpm --filter @workspace/db run push

echo "==> Seeding staking plans (if first deploy)..."
pnpm --filter @workspace/scripts run seed || echo "Seed skipped (already seeded)"

echo "==> Building frontend..."
pnpm --filter @workspace/staking-platform run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Copying frontend build into API dist..."
mkdir -p artifacts/api-server/dist/public
cp -r artifacts/staking-platform/dist/public/. artifacts/api-server/dist/public/

echo "==> Build complete!"
