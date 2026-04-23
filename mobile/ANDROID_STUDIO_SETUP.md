# Android Studio + VS Code setup (BarcoStop)

## 1) Instalar lo necesario

1. Android Studio (incluye Android SDK, SDK Platform, Emulator, Platform-tools).
2. JDK 17 (Android Studio normalmente ya lo trae embebido).
3. Node.js 18+ y npm.

## 2) Crear `local.properties`

Desde la raiz del repo:

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\mobile\scripts\create-local-properties.ps1
```

### Linux/macOS

```bash
bash ./mobile/scripts/create-local-properties.sh
```

Si prefieres hacerlo manualmente, copia `mobile/android/local.properties.example` a `mobile/android/local.properties` y ajusta `sdk.dir`.

## 3) Crear emulador Android

1. Abre Android Studio.
2. Ve a Device Manager.
3. Crea un AVD llamado `Pixel_6` (Android 14 recomendado).
4. Inicia el emulador.

## 4) Ejecutar app

En dos terminales:

Terminal 1:

```bash
cd mobile
npm run start
```

Terminal 2:

```bash
cd mobile
npm run android
```

## 5) VS Code tasks

En VS Code puedes lanzar:

- `Mobile: Setup local.properties (Windows)` o `Mobile: Setup local.properties (Linux/macOS)`
- `Mobile: Start Metro`
- `Mobile: Start Android Emulator (Pixel 6, Windows)`
- `Mobile: Run Android (RN CLI)`
- `Mobile: Activate BarcoStop Android (Windows)`

## 6) Si falla

1. Verifica dispositivo:

```bash
adb devices
```

2. Limpia build Android:

```bash
cd mobile/android
./gradlew clean
```

3. Reinstala dependencias:

```bash
cd mobile
rm -rf node_modules
npm install
```
