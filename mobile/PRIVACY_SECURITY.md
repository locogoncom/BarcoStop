# BarcoStop - Privacidad y Seguridad

Este documento resume las medidas tecnicas activas en la app para cumplimiento de Google Play.

## 1) Datos y permisos

- Permiso de red: `INTERNET` para consumir la API.
- Permiso de imagen: `READ_MEDIA_IMAGES` (Android 13+) y `READ_EXTERNAL_STORAGE` (hasta SDK 32) para seleccionar avatar.
- No se solicita camara, microfono ni contactos.

## 2) Seguridad de acceso

- La app requiere autenticacion por email + contrasena.
- En cada reinicio de app se solicita login de nuevo (sin sesion persistente automatica).
- Tokens se validan en backend con expiracion.

## 3) Seguridad de API

- Validacion de payloads y limites de longitud de mensajes.
- Encabezados HTTP de seguridad:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 4) Antiabuso en chat

- Bloqueo entre usuarios (`user_blocks`).
- Reportes de abuso (`user_reports`).
- Si existe bloqueo, se impide crear chat y enviar mensajes.
- Desde la pantalla de chat se puede:
  - Reportar usuario.
  - Bloquear o desbloquear usuario.

## 5) Moderacion recomendada

- Revisar periodicamente reportes `user_reports` en estado `open`.
- Definir SLA de revision (ejemplo: 24-72 horas).
- Aplicar acciones: advertencia, bloqueo temporal o suspension de cuenta.
