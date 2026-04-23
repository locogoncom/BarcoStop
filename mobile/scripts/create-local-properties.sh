#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ANDROID_DIR="${MOBILE_ROOT}/android"
LOCAL_PROPERTIES_PATH="${ANDROID_DIR}/local.properties"

SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [[ -z "${SDK}" ]]; then
  if [[ -d "${HOME}/Library/Android/sdk" ]]; then
    SDK="${HOME}/Library/Android/sdk"
  elif [[ -d "${HOME}/Android/Sdk" ]]; then
    SDK="${HOME}/Android/Sdk"
  fi
fi

if [[ -z "${SDK}" ]]; then
  echo "No se encontro Android SDK. Define ANDROID_SDK_ROOT o ANDROID_HOME." >&2
  exit 1
fi

if [[ ! -d "${SDK}" ]]; then
  echo "La ruta del Android SDK no existe: ${SDK}" >&2
  exit 1
fi

printf 'sdk.dir=%s\n' "${SDK}" > "${LOCAL_PROPERTIES_PATH}"
echo "Archivo creado: ${LOCAL_PROPERTIES_PATH}"
echo "sdk.dir=${SDK}"
