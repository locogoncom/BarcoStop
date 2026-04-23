#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

resolve_sdk_dir() {
  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    echo "${ANDROID_SDK_ROOT}"
    return 0
  fi
  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    echo "${ANDROID_HOME}"
    return 0
  fi
  if [[ -d "${HOME}/Android/Sdk" ]]; then
    echo "${HOME}/Android/Sdk"
    return 0
  fi
  return 1
}

test_metro_ready() {
  curl -fsS "http://127.0.0.1:8081/status" >/dev/null 2>&1
}

wait_metro_ready() {
  local timeout="${1:-90}"
  local elapsed=0
  until test_metro_ready; do
    sleep 1
    elapsed=$((elapsed + 1))
    if (( elapsed >= timeout )); then
      return 1
    fi
  done
  return 0
}

SDK_DIR="$(resolve_sdk_dir || true)"
if [[ -z "${SDK_DIR}" ]]; then
  echo "No se encontro Android SDK. Define ANDROID_SDK_ROOT o ANDROID_HOME." >&2
  exit 1
fi

ADB="${SDK_DIR}/platform-tools/adb"
if [[ ! -x "${ADB}" ]]; then
  echo "No se encontro adb en: ${ADB}" >&2
  exit 1
fi

DEVICE_ID="$("${ADB}" devices -l | awk '/\sdevice(\s|$)/ && $1 != "List" { if ($0 ~ /usb:/) { print $1; exit } }')"
if [[ -z "${DEVICE_ID}" ]]; then
  DEVICE_ID="$("${ADB}" devices | awk '/\sdevice$/{print $1; exit}')"
fi

if [[ -z "${DEVICE_ID}" ]]; then
  echo "No hay telefono Android conectado por USB (o autorizado)." >&2
  echo "Revisa 'adb devices' y acepta el prompt de depuracion USB en el telefono." >&2
  exit 1
fi

echo "[barcostop] Usando dispositivo: ${DEVICE_ID}"

if ! test_metro_ready; then
  (
    cd "${MOBILE_ROOT}"
    nohup npm run start >/tmp/barcostop-metro.log 2>&1 &
  )
  echo "[barcostop] Metro no estaba activo, iniciando..."
fi

if ! wait_metro_ready 120; then
  echo "Metro no responde en http://127.0.0.1:8081/status." >&2
  echo "Revisa /tmp/barcostop-metro.log." >&2
  exit 1
fi

"${ADB}" -s "${DEVICE_ID}" reverse --remove tcp:8081 >/dev/null 2>&1 || true
"${ADB}" -s "${DEVICE_ID}" reverse tcp:8081 tcp:8081 >/dev/null
"${ADB}" -s "${DEVICE_ID}" reverse --remove tcp:5000 >/dev/null 2>&1 || true
"${ADB}" -s "${DEVICE_ID}" reverse tcp:5000 tcp:5000 >/dev/null 2>&1 || true

(
  cd "${MOBILE_ROOT}"
  npx react-native run-android --deviceId "${DEVICE_ID}"
)
