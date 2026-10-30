#!/usr/bin/env bash
# ==============================================================================
# UNIMASI — Core Engine Synchronizer
# Syncs the latest SegiaTech Core Engine backend into UNIMASI's dedicated backend
# ==============================================================================

set -euo pipefail

SOURCE_CORE_DIR="/Users/macprom12020/Code/segiatech/apps/core"
TARGET_BACKEND_DIR="./backend"

echo "🔄 [UNIMASI Core Sync] Memulai sinkronisasi Engine Core ke ${TARGET_BACKEND_DIR}..."

if [ ! -d "$SOURCE_CORE_DIR" ]; then
  echo "❌ Source Core Engine tidak ditemukan di: $SOURCE_CORE_DIR"
  exit 1
fi

mkdir -p "$TARGET_BACKEND_DIR"

# Rsync core source files while preserving environment and local logs
rsync -av --delete \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude=".env.local" \
  --exclude=".env.production" \
  --exclude="*.log" \
  --exclude="tsconfig.tsbuildinfo" \
  "$SOURCE_CORE_DIR/" "$TARGET_BACKEND_DIR/"

echo "✅ [UNIMASI Core Sync] Sinkronisasi Engine Core selesai!"
echo "📍 Dedicated backend UNIMASI siap dijalankan di ${TARGET_BACKEND_DIR}"
