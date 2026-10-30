#!/usr/bin/env bash
# ==============================================================================
# UNIMASI — Core Engine Synchronizer
# Syncs the latest SegiaTech Core Engine backend into UNIMASI's dedicated backend
# Preserves local brand seeds, environment files, and local logs.
# ==============================================================================

set -euo pipefail

SOURCE_CORE_DIR="/Users/macprom12020/Code/segiatech-core"
if [ ! -d "$SOURCE_CORE_DIR" ]; then
  SOURCE_CORE_DIR="/Users/macprom12020/Code/segiatech/apps/core"
fi

TARGET_BACKEND_DIR="./backend"

echo "🔄 [UNIMASI Core Sync] Memulai sinkronisasi Engine Core ke ${TARGET_BACKEND_DIR}..."

if [ ! -d "$SOURCE_CORE_DIR" ]; then
  echo "❌ Source Core Engine tidak ditemukan di: $SOURCE_CORE_DIR"
  exit 1
fi

mkdir -p "$TARGET_BACKEND_DIR"

# Rsync core source files while preserving brand seeds, environment, and logs
rsync -av \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude=".env*" \
  --exclude="*.log" \
  --exclude="tsconfig.tsbuildinfo" \
  --exclude="src/data/seed/seed_articles.json" \
  --exclude="src/data/seed/seed_portfolio.json" \
  --exclude="src/data/seed/seed_services.json" \
  --exclude="public/logo" \
  "$SOURCE_CORE_DIR/" "$TARGET_BACKEND_DIR/"

echo "✅ [UNIMASI Core Sync] Sinkronisasi Engine Core selesai!"
echo "📍 Dedicated backend UNIMASI siap dijalankan di ${TARGET_BACKEND_DIR}"
