# Play Console - Data Safety (Guia de carga)

Esta guia te ayuda a completar el formulario de Google Play Console en base al estado actual del app.

## 1) Data collected (si, recolecta)

Marcar como recolectados:

- Personal info:
  - Name
  - Email address
- App activity:
  - In-app messages (chat)
  - User generated content (perfil, bio, datos de viaje y reservas)
- App info and performance (si usas logs tecnicos de errores)

## 2) Data shared with third parties

- Marcar **No** si solo usas tu propio backend y no vendes/compartes con terceros fuera de proveedores de infraestructura.
- Si usas terceros (analytics/ads/crash externos), ajustar este punto.

## 3) Security practices

Marcar:

- Data is encrypted in transit: **Yes** (HTTPS requerido).
- Users can request data deletion: **Yes** (por soporte o backend dedicado).
- Account creation/login required for core features: **Yes**.

## 4) Data usage purposes (por categoria)

- Name/Email:
  - App functionality
  - Account management
  - Security/fraud prevention
- Messages / user generated content:
  - App functionality
  - Safety and moderation

## 5) Permissions declaration alignment

Permisos Android actuales:

- `INTERNET`
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_EXTERNAL_STORAGE` (hasta SDK 32, para avatar)

No se declara camara/microfono/contactos.

## 6) UGC policy readiness (contenido generado por usuarios)

Google suele revisar:

- Boton/report flow para denunciar abuso: **Implementado**.
- Opcion de bloqueo: **Implementado**.
- Medidas de enforcement en backend: **Implementado** (bloqueo impide chat y envio).

## 7) Antes de enviar a revision

- Publicar una URL publica de `PRIVACY_POLICY_ES.md` o `PRIVACY_POLICY_EN.md`.
- Verificar que la URL este accesible sin login.
- Revisar que lo declarado en Data Safety coincida con el comportamiento real.
