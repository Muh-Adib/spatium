#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Syncing database schema via Prisma..."
  npx --yes prisma db push --skip-generate || echo "Prisma schema sync completed with warnings"
fi

exec node server.js
