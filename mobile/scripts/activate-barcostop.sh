#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${MOBILE_ROOT}"
echo "[barcostop] Activating app..."

"${SCRIPT_DIR}/run-android-pixel6.sh" "${1:-Pixel_6_2}"
