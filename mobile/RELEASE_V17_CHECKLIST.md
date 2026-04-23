# Release Checklist - BarcoStop v17

## 1) Codigo y seguridad

- [ ] Validar login obligatorio al abrir app.
- [ ] Validar registro en primer uso.
- [ ] Validar bloqueo y reporte en chat.
- [ ] Verificar backend activo con tablas `user_blocks` y `user_reports`.

## 2) Build Android (AAB)

- [ ] Incrementar `versionCode` y `versionName` en `android/app/build.gradle`.
- [ ] Limpiar build:
  - `cd mobile/android`
  - `./gradlew clean` (Windows: `gradlew clean`)
- [ ] Generar AAB release:
  - `./gradlew bundleRelease` (Windows: `gradlew bundleRelease`)
- [ ] Ubicar archivo:
  - `mobile/android/app/build/outputs/bundle/release/app-release.aab`

## 3) Play Console

- [ ] Subir `app-release.aab` en track interno/cerrado.
- [ ] Completar Data Safety con `PLAY_CONSOLE_DATA_SAFETY.md`.
- [ ] Configurar App Content (UGC moderacion: bloquear/reportar).
- [ ] Publicar URL de politica de privacidad.
- [ ] Revisar cuestionario de permisos y declarar solo lo necesario.

## 4) QA minimo antes de publicar

- [ ] Registro nuevo usuario.
- [ ] Login con usuario existente.
- [ ] Cerrar app y comprobar que pide login.
- [ ] Enviar/recibir mensaje en chat.
- [ ] Bloquear usuario y comprobar que no deja chatear.
- [ ] Reportar usuario y verificar registro en backend.

## 5) Evidencia para auditoria interna

- [ ] Capturas de flujo login/registro.
- [ ] Capturas de bloqueo y reporte.
- [ ] Captura de formulario Data Safety completado.
- [ ] Nota interna de cambios de seguridad v17.
