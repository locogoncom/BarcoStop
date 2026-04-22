# Play Store Release Guide (BarcoStop)

## 1) Required one-time setup

1. Create your upload keystore in `mobile/android/`:

```powershell
cd C:\BarcoStop\mobile\android
keytool -genkeypair -v -storetype PKCS12 -keystore barcostop-upload-key.keystore -alias barcostop-key -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `mobile/android/keystore.properties` from `mobile/android/keystore.properties.example` and fill your real passwords.

## 2) Set Play Store app identity/version

Edit `mobile/android/gradle.properties`:

```properties
BARCOSTOP_APPLICATION_ID=com.barcostop.app
BARCOSTOP_VERSION_CODE=1
BARCOSTOP_VERSION_NAME=1.0.0
```

Rules:
- `BARCOSTOP_APPLICATION_ID` must be unique and never change after first publish.
- `BARCOSTOP_VERSION_CODE` must increase on every upload.
- `BARCOSTOP_VERSION_NAME` is user-facing (semantic version style recommended).

## 3) Build release artifacts

From `mobile/`:

```powershell
npm run build:aab:release
npm run build:apk:release
```

Output:
- AAB: `mobile/android/app/build/outputs/bundle/release/app-release.aab`
- APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`

## 4) Upload to Google Play Console

1. Create app in Play Console.
2. Complete mandatory sections:
- App access
- Data safety
- Content rating
- Target audience
- Privacy policy URL
- Store listing (title, short/long description, screenshots, icon)
3. Go to `Testing > Internal testing` (recommended first).
4. Upload `app-release.aab`.
5. Add release notes and rollout.

## 5) Pre-upload checks

- Backend URL is production-ready in mobile config.
- Permissions and policy declarations match app behavior.
- Signed with upload keystore (not debug key).
- App opens, login works, key flows tested on real Android device.

## 6) Next release

Only update in `mobile/android/gradle.properties`:
- `BARCOSTOP_VERSION_CODE` increment by at least +1
- `BARCOSTOP_VERSION_NAME` bump version string

## 7) Release notes ready to paste

### Version 1.0.39

Short release note:

```text
Mejoras en inicio de sesion, navegacion principal y experiencia de chat en tiempo real.
```

Longer release note:

```text
- Nuevo flujo de Inicio y Salir para volver facilmente a Viajes o cerrar sesion y entrar con otra cuenta.
- Home mantiene la opcion de Continuar con la sesion guardada y tambien permite iniciar con otra cuenta o crear una nueva.
- Confirmacion de contrasena activa al registrar nuevos usuarios.
- Mejoras de chat en tiempo real y refuerzo general de rendimiento para mas usuarios concurrentes.
- Compartir experiencia mejorado y acceso a Google Maps ajustado al puerto de salida.
```

Artifacts generated for this version:

- AAB: `C:\BarcoStop\releases\BarcoStop-v1.0.39-release.aab`
- APK: `C:\BarcoStop\releases\BarcoStop-v1.0.39-release.apk`
