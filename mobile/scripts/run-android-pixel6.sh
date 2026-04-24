#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${MOBILE_ROOT}/.." && pwd)"
AVD_NAME="${AVD_NAME:-Pixel_6_2}"

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
  if [[ -d "${HOME}/Android/sdk" ]]; then
    echo "${HOME}/Android/sdk"
    return 0
  fi
  return 1
}

test_metro_ready() {
  curl -fsS "http://127.0.0.1:8081/status" >/dev/null 2>&1
}

wait_metro_ready() {
  local timeout="${1:-120}"
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

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/jlink" ]]; then
    echo "${JAVA_HOME}"
    return 0
  fi
  for candidate in \
    "/usr/lib/jvm/java-17-openjdk-amd64" \
    "/usr/lib/jvm/java-21-openjdk-amd64" \
    "/usr/lib/jvm/default-java"; do
    if [[ -x "${candidate}/bin/jlink" ]]; then
      echo "${candidate}"
      return 0
    fi
  done
  return 1
}

wait_device_ready() {
  local device_id="$1"
  local timeout="${2:-120}"
  local elapsed=0

  "${ADB}" -s "${device_id}" wait-for-device >/dev/null 2>&1 || true

  while (( elapsed < timeout )); do
    local boot
    local sdk
    boot="$("${ADB}" -s "${device_id}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r\n')"
    sdk="$("${ADB}" -s "${device_id}" shell getprop ro.build.version.sdk 2>/dev/null | tr -d '\r\n')"
    if [[ "${boot}" == "1" && "${sdk}" =~ ^[0-9]+$ ]]; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done

  return 1
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

if ! wait_device_ready "${DEVICE_ID}" 140; then
  echo "El dispositivo ${DEVICE_ID} no termino de arrancar correctamente." >&2
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

GRADLE_JAVA_HOME="$(resolve_java_home || true)"
if [[ -n "${GRADLE_JAVA_HOME}" ]]; then
  echo "[barcostop] Usando JAVA_HOME=${GRADLE_JAVA_HOME}"
fi

(
  cd "${MOBILE_ROOT}/android"
  if [[ -n "${GRADLE_JAVA_HOME}" ]]; then
    JAVA_HOME="${GRADLE_JAVA_HOME}" ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
  else
    ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
  fi
) || {
  if grep -q 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' "${INSTALL_LOG}"; then
    echo "[barcostop] Firma incompatible para ${APP_ID}. Desinstalando y reintentando..."
    "${ADB}" -s "${DEVICE_ID}" uninstall "${APP_ID}" >/dev/null 2>&1 || true
    (
      cd "${MOBILE_ROOT}/android"
      if [[ -n "${GRADLE_JAVA_HOME}" ]]; then
        JAVA_HOME="${GRADLE_JAVA_HOME}" ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
      else
        ./gradlew installDebug >"${INSTALL_LOG}" 2>&1
      fi
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
"${ADB}" -s "${DEVICE_ID}" shell monkey -p "${APP_ID}" -c android.intent.category.LAUNCHER 1 >/dev/null

echo "BarcoStop abierto en ${DEVICE_ID} con paquete ${APP_ID}"
