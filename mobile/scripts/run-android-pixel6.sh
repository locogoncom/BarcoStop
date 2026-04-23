#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${MOBILE_ROOT}/.." && pwd)"
SERVER_ROOT="${REPO_ROOT}/server"
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

# Check if any device is already connected
DEVICE_ID="$("${ADB}" devices | awk '/\sdevice$/{print $1; exit}')"

if [[ -z "${DEVICE_ID}" ]]; then
  echo "[barcostop] No hay dispositivos conectados, intentando iniciar emulador..."
  "${SCRIPT_DIR}/start-pixel6.sh" "${AVD_NAME}"
  DEVICE_ID="$("${ADB}" devices | awk '/\sdevice$/{print $1; exit}')"
fi

if [[ -z "${DEVICE_ID}" ]]; then
  echo "No hay dispositivo Android conectado (USB o emulador)." >&2
  exit 1
fi
echo "[barcostop] Usando dispositivo: ${DEVICE_ID}"

if ! test_backend_ready; then
  if [[ ! -d "${SERVER_ROOT}" ]]; then
    echo "No se encontro carpeta server: ${SERVER_ROOT}" >&2
    exit 1
  fi
  (
    cd "${SERVER_ROOT}"
    nohup node index.js >/tmp/barcostop-backend.log 2>&1 &
  )
  echo "[barcostop] Backend no estaba activo, iniciando en 5000..."
fi

if ! wait_backend_ready 30; then
  echo "Backend no responde en http://127.0.0.1:5000/." >&2
  echo "Revisa /tmp/barcostop-backend.log y server/index.js." >&2
  exit 1
fi

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

APP_ID="com.barcostop.app"
GRADLE_PROPS="${MOBILE_ROOT}/android/gradle.properties"
if [[ -f "${GRADLE_PROPS}" ]]; then
  ID_LINE="$(grep -m1 '^BARCOSTOP_APPLICATION_ID=' "${GRADLE_PROPS}" || true)"
  if [[ -n "${ID_LINE}" ]]; then
    APP_ID="${ID_LINE#BARCOSTOP_APPLICATION_ID=}"
  fi
fi

INSTALL_LOG="$(mktemp)"
cleanup() {
  rm -f "${INSTALL_LOG}"
}
trap cleanup EXIT

(
  cd "${MOBILE_ROOT}/android"
  ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
) || {
  if grep -q 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' "${INSTALL_LOG}"; then
    echo "[barcostop] Firma incompatible para ${APP_ID}. Desinstalando y reintentando..."
    "${ADB}" -s "${DEVICE_ID}" uninstall "${APP_ID}" >/dev/null 2>&1 || true
    (
      cd "${MOBILE_ROOT}/android"
      ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
    ) || {
      cat "${INSTALL_LOG}" >&2
      echo "installDebug fallo incluso despues de desinstalar la app previa." >&2
      exit 1
    }
  else
    cat "${INSTALL_LOG}" >&2
    echo "installDebug fallo. Revisa la salida anterior." >&2
    exit 1
  fi
}

"${ADB}" -s "${DEVICE_ID}" reverse --remove tcp:8081 >/dev/null 2>&1 || true
"${ADB}" -s "${DEVICE_ID}" reverse tcp:8081 tcp:8081 >/dev/null
"${ADB}" -s "${DEVICE_ID}" reverse --remove tcp:5000 >/dev/null 2>&1 || true
"${ADB}" -s "${DEVICE_ID}" reverse tcp:5000 tcp:5000 >/dev/null
"${ADB}" -s "${DEVICE_ID}" shell monkey -p "${APP_ID}" -c android.intent.category.LAUNCHER 1 >/dev/null

echo "BarcoStop abierto en ${DEVICE_ID} con paquete ${APP_ID}"
