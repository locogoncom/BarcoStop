#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AVD_NAME="${1:-Pixel_6_2}"

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

SDK_DIR="$(resolve_sdk_dir || true)"
if [[ -z "${SDK_DIR}" ]]; then
  echo "No se encontro Android SDK. Define ANDROID_SDK_ROOT o ANDROID_HOME." >&2
  exit 1
fi

EMULATOR="${SDK_DIR}/emulator/emulator"
ADB="${SDK_DIR}/platform-tools/adb"

if [[ ! -x "${EMULATOR}" ]]; then
  echo "No se encontro emulator en: ${EMULATOR}" >&2
  exit 1
fi
if [[ ! -x "${ADB}" ]]; then
  echo "No se encontro adb en: ${ADB}" >&2
  exit 1
fi

if ! "${ADB}" devices | awk '/^emulator-[0-9]+\s+device$/{found=1} END{exit found?0:1}'; then
  if ! "${EMULATOR}" -list-avds | grep -Fxq "${AVD_NAME}"; then
    # Intenta buscar en la ruta de Flatpak si no está en la ruta por defecto
    FLATPAK_AVD_HOME="${HOME}/.var/app/com.google.AndroidStudio/config/.android/avd"
    if [[ -d "${FLATPAK_AVD_HOME}" ]] && ls "${FLATPAK_AVD_HOME}/${AVD_NAME}.ini" >/dev/null 2>&1; then
      export ANDROID_AVD_HOME="${FLATPAK_AVD_HOME}"
    else
      echo "No existe el AVD '${AVD_NAME}'. Crealo en Android Studio Device Manager." >&2
      echo "AVDs disponibles:"
      "${EMULATOR}" -list-avds
      exit 1
    fi
  fi
  nohup "${EMULATOR}" "@${AVD_NAME}" >/tmp/barcostop-emulator.log 2>&1 &
fi

"${ADB}" wait-for-device >/dev/null

for _ in $(seq 1 90); do
  BOOT="$("${ADB}" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | tr -d '\n')"
  if [[ "${BOOT}" == "1" ]]; then
    echo "Emulador ${AVD_NAME} listo."
    exit 0
  fi
  sleep 2
done

echo "El emulador no termino de iniciar dentro del tiempo esperado." >&2
exit 1
