#!/bin/bash

# Script para iniciar emulador y ejecutar BarcoStop en Linux

# 1. Configurar variables del SDK
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

EMULATOR_CMD=$(which emulator)
ADB_CMD=$(which adb)
AVD_NAME="Pixel_6"

if [ -z "$EMULATOR_CMD" ]; then
    echo "❌ No se encontró el comando 'emulator'. Asegúrate de tener el SDK de Android instalado."
    exit 1
fi

# 2. Iniciar emulador si no está corriendo
RUNNING=$(adb devices | grep "emulator-" | grep "device")

if [ -z "$RUNNING" ]; then
    echo "🚀 Iniciando emulador $AVD_NAME..."
    $EMULATOR_CMD "@$AVD_NAME" > /dev/null 2>&1 &

    echo "⏳ Esperando a que el emulador esté listo..."
    $ADB_CMD wait-for-device

    # Esperar a que el sistema operativo termine de cargar
    while [ "$($ADB_CMD shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
        sleep 2
    done
    echo "✅ Emulador listo."
else
    echo "✅ El emulador ya está en ejecución."
fi

# 3. Ejecutar la App (React Native)
echo "📦 Instalando y ejecutando BarcoStop en el emulador..."
cd "$(dirname "$0")/.."
npx react-native run-android
