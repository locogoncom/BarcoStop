# BarcoStop Handoff (2026-03-10)

## Ruta canonica
- Proyecto: `C:\Apps\BarcoStop` (junction a `C:\BarcoStop`)
- Mobile: `C:\Apps\BarcoStop\mobile`

## Abrir app Android correcta
```powershell
powershell -ExecutionPolicy Bypass -File C:\Apps\Open-App.ps1 -App BarcoStop
```

## Activacion total recomendada
```powershell
cd C:\BarcoStop\mobile
npm run android:activate
```
Este flujo levanta backend (si falta) y abre `com.barcostop.app` en el emulador.

## Comando de build release
```powershell
cd C:\Apps\BarcoStop\mobile
npm run build:aab:release
```

## Artefacto Play Console
- `C:\BarcoStop\mobile\android\app\build\outputs\bundle\release\app-release.aab`
- Version actual detectada: `versionCode=3`, `versionName=1.0.2`

## Estado de pruebas internas (resumen)
- Upload AAB hecho.
- Bloqueo principal fue flujo de testers en Play Console UI nueva.
- Se generaron CSV compatibles para testers:
  - `C:\BarcoStop\testers_playconsole.csv`
  - `C:\BarcoStop\testers_playconsole_header.csv`

## Nota de aislamiento
- Para BarcoStop no usar scripts de KeepPlaying.
- Lanzamiento forzado por paquete: `com.barcostop.app`.
