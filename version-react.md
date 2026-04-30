# BarcoStop - Inventario React Native vs Java Nativo

Este documento resume, pantalla por pantalla, qué incluye la versión React Native (`mobile/src/screens`) y el delta actual frente a la app Java nativa (`app/app/src/main/java/...`).

## Navegación base (React Native)

- Root Stack: `Home`, `Auth`, `MainApp`, `UserPublicProfile`.
- Main tabs por rol:
- `viajero`: `Trips`, `Reservations`, `Messages`, `Favorites`, `Share`, `Profile`.
- `patron`: `Trips`, `PatronRequests`, `Messages`, `Favorites`, `Share`, `Profile`.
- `Share` no abre una screen completa: intercepta el tab y abre `ShareTabModal`.
- Stacks internos relevantes:
- Trips: `TripListScreen`, `TripDetailScreen`, `CreateTripScreen`.
- Messages: `MessagesScreen`, `ChatScreen`.
- Profile: `ProfileScreen`.
- Legacy/placeholder en código RN:
- `BookingsScreen` y `UsersScreen` existen como archivos, pero no están conectadas al flujo principal actual de tabs/stacks.

## Delta global RN vs Java

- Java usa navegación nativa con `MainAppActivity` + `BottomNavigationView` y fragments (`Trips`, `Secondary`, `Messages`, `Favorites`, `Profile`).
- En Java no existe pestaña dedicada `Share`; el compartir está distribuido en detalle de viaje/perfil.
- React tiene más capa visual custom en cards/espaciados/gradientes; Java es más Material nativo y más sobrio.
- React mantiene más lógica avanzada en una sola screen (sobre todo `TripDetailScreen`); Java repartió parte de esa lógica y simplificó ciertos flujos.
- React incluye un flujo explícito de campaña en `ShareTabModal` (WhatsApp/Instagram/QR/contador/donación PayPal) que en Java no está como modal de tab.

---

## 1) HomeScreen.tsx

### React Native incluye
- Hero con logo, título/subtítulo, CTA por rol (capitán/viajero).
- Botón `Continuar sesión` si hay sesión.
- Selector de idioma (EN/ES/FR/PT).
- Claim animado tipo “Anímate viajero”.
- Build/version en esquina inferior izquierda (`APP_BUILD_LABEL`).

### Delta con Java
- Java `HomeActivity` ya tiene: logo, roles, idiomas, autoredirección con sesión activa y build/version/date.
- Delta visual: RN usa composición más “card/gradient”; Java es más nativo.

---

## 2) AuthScreen.tsx

### React Native incluye
- Login/registro en misma pantalla con toggle.
- Campos nombre/email/password/confirmación, mostrar/ocultar password.
- Registro + login automático posterior.
- Etiqueta por rol (capitán/viajero).

### Delta con Java
- Java `AuthActivity` cubre login/registro, toggle, rol y validaciones.
- Java añade `Login with Google` (botón y flujo con `GoogleAuthHelper`), ausente en RN original.
- Delta visual: RN más minimal custom; Java más formulario Material.

---

## 3) TripListScreen.tsx

### React Native incluye
- Listado de viajes con cards ricas y acceso a detalle.
- Buscador plegable/desplegable (origen/destino/fecha, hoy/mañana, limpiar).
- Flujo viajero: reservar/cancelar según estado, ver estado de reserva.
- Flujo capitán: crear viaje/regata, editar/eliminar viaje.
- Favoritos sobre capitán desde card.
- Rating al capitán desde la card y control de usuarios ya puntuados.
- Pull-to-refresh y resumen/estado de carga.
- Barra de acciones rápidas (home/perfil/logout y CTAs rápidos de creación en rol capitán).

### Delta con Java
- Java `TripsFragment` cubre listado, buscador plegable, crear, editar, borrar, refresco y filtros.
- Java también parsea `descriptionMeta`/`[BSMETA]` para datos extendidos.
- Delta funcional: RN tiene más microdetalles visuales y UX (estrellas/rating inline más visible, acciones más densas en card).

---

## 4) TripDetailScreen.tsx

### React Native incluye
- Cabecera rica del viaje, ruta, fecha/hora, plazas/precio/estado.
- Favorito de capitán, apertura de chat, reservar/cancelar reserva.
- Estados de reserva y CTA según rol/ownership.
- Checkpoints de viaje y compartir experiencia.
- Share del viaje (incluye WhatsApp).
- Apertura de ruta en Google Maps.
- Valoraciones del capitán y listado de reseñas.
- Donación/PayPal modal.
- Modo regata con participantes, gestión de estado y chat de regata.
- Acciones de capitán: editar/cancelar/eliminar/autopublish Reddit.

### Delta con Java
- Java `TripDetailActivity` cubre base completa: detalle, reserva/cancelación, chat, perfil capitán, favoritos, compartir, maps, reviews, editar/cancelar/eliminar, Reddit flag.
- Java también parsea metadatos de descripción (`BSMETA` y `descriptionMeta`).
- Delta funcional: RN conserva más lógica específica de regata (grupo/participantes/chat regata) y más bloque de UI detallada en la misma pantalla.
- Delta visual: RN más “hero + cards custom”; Java más toolbar + secciones Material.

---

## 5) CreateTripScreen.tsx

### React Native incluye
- Crear/editar viaje o regata en una sola screen.
- Campos: título, descripción, origen, destino, fecha, franja horaria, plazas, precio.
- Si precio 0: tipo de contribución + nota.
- Carga/selección de imagen (galería) y metadatos.
- Validaciones de negocio.

### Delta con Java
- Java `CreateTripActivity` y `EditTripActivity` cubren creación/edición y metadatos (`[BSMETA]`).
- Java soporta viaje/regata, time-window, contribución y validación.
- Delta funcional: RN tiene experiencia de imagen más integrada desde picker.
- Delta visual: RN formulario más estilizado; Java más nativo/form clásico.

---

## 6) ReservationsScreen.tsx

### React Native incluye
- Listado de reservas del usuario con estado.
- Cancelar reserva cuando aplica.
- Abrir chat con capitán según estado.
- CTA de pago/donación en contextos aprobados/confirmados (PayPal).
- Modal WebView para PayPal integrado desde la screen.

### Delta con Java
- Java `ReservationsFragment` cubre listado, estados, cancelar y abrir chat.
- Delta funcional: RN muestra capa visual más rica y flujos de pago más explícitos en esta screen.

---

## 7) PatronRequestsScreen.tsx

### React Native incluye
- Listado de solicitudes recibidas para viajes del capitán.
- Aprobar/rechazar solicitud.
- Al aprobar, intenta crear conversación y permite abrir chat directo.
- Pull-to-refresh y estados visuales.

### Delta con Java
- Java `PatronRequestsFragment` cubre carga secuencial por viajes propios, aprobar/rechazar y apertura de chat.
- Paridad funcional alta.
- Delta visual: RN con card más rica y mayor densidad de detalle por solicitud.

---

## 8) MessagesScreen.tsx

### React Native incluye
- Listado de conversaciones con último mensaje, hora y no leídos.
- Buscador por conversación/usuario.
- User picker para iniciar chat nuevo.

### Delta con Java
- Java `MessagesFragment` cubre listado, último mensaje, no leídos, refresh y botón `Nuevo chat`.
- Java separa `NewChatActivity` para iniciar conversación.
- Paridad funcional alta; delta visual moderado (RN más estilo WhatsApp custom).

---

## 9) ChatScreen.tsx

### React Native incluye
- Chat 1:1 con polling/suscripción.
- Envío de mensajes + estado de carga.
- Moderación: bloquear/desbloquear/reportar.
- Gestión teclado/scroll y estado de app activa.

### Delta con Java
- Java `ChatActivity` cubre mensajes, polling, toolbar con nombre, bloquear/desbloquear/reportar y banner de bloqueo.
- Paridad funcional alta en moderación y chat base.
- Delta visual: RN más personalizable en composición; Java más patrón nativo clásico.

---

## 10) FavoritesScreen.tsx

### React Native incluye
- Mis favoritos con buscador.
- Búsqueda global de usuarios para añadir a favoritos.
- Top 10 usuarios por rating.
- Abrir perfil público, iniciar chat, eliminar favorito.

### Delta con Java
- Java `FavoritesFragment` cubre lista de favoritos, chat y eliminar favorito.
- Delta funcional relevante: faltan en Java la búsqueda global avanzada y top-10 dentro de favoritos.
- También Java tiene `UsersActivity` que cubre búsqueda general fuera de esta tab.

---

## 11) ProfileScreen.tsx

### React Native incluye
- Edición de perfil (nombre, bio, avatar, etc.).
- Campos extendidos para viajero/capitán.
- Soporte donaciones (PayPal) y resumen de actividad.
- Mensajes de soporte (crear/listar/eliminar).
- Sección “mis viajes” y opciones de compartir.

### Delta con Java
- Java `ProfileFragment` cubre edición amplia, avatar upload, campos de capitán y viajero, resumen de rating/donaciones, soporte y “mis viajes” + share.
- Java además sincroniza datos de barco mediante `BoatActions` con meta (`BSBOATMETA`).
- Paridad funcional alta.
- Delta visual: RN más custom en bloques y tipografía; Java más formulario extenso nativo.

---

## 12) UserPublicProfileScreen.tsx

### React Native incluye
- Perfil público con avatar, rol, rating medio y reseñas.
- Secciones de bio, experiencia y datos de barco (si capitán).

### Delta con Java
- Java `UserPublicProfileActivity` existe y cubre vista pública.
- Delta visual: RN presenta bloques más “carded”; Java más Material clásico.

---

## 13) BoatsScreen.tsx

### React Native incluye
- CRUD de barcos (listar/crear/editar/eliminar).
- Form modal con campos de barco, seguridad y descripción.

### Delta con Java
- Java `BoatsActivity` cubre CRUD completo con formulario inline.
- Paridad funcional alta.
- Delta visual: RN usa modal dedicado; Java usa formulario expandible en la misma activity.

---

## 14) UsersScreen.tsx

### React Native incluye
- Placeholder “Coming soon”.

### Delta con Java
- Java `UsersActivity` está implementada y funcional: buscar usuarios, abrir perfil, iniciar chat, toggle favorito.
- Java supera a RN en esta parte.

---

## 15) BookingsScreen.tsx

### React Native incluye
- Placeholder “Coming soon”.

### Delta con Java
- No hay equivalente funcional específico separado en Java para “Bookings” porque el flujo real está en `Reservations`/`PatronRequests`.
- Además, en RN actual no está enlazada al flujo principal (archivo legado).

---

## 16) ShareTabModal (desde tab Share)

### React Native incluye
- Modal de compartir campaña BarcoStop (no screen de navegación completa).
- Compartir genérico, WhatsApp e Instagram.
- QR con enlace de testing de Google Play.
- Contador local de compartidos (AsyncStorage).
- CTA de donación PayPal.

### Delta con Java
- Java no tiene modal equivalente atado al tab inferior.
- En Java el compartir existe en puntos concretos (detalle/perfil), no como hub único.

---

## Resumen rápido de paridad

- Paridad alta: `Home`, `Auth`, `Trips`, `TripDetail`, `Create/Edit Trip`, `Reservations`, `PatronRequests`, `Messages`, `Chat`, `Profile`, `Boats`, `UserPublicProfile`.
- Paridad parcial: `Favorites` (falta en Java top-10 y búsqueda global dentro de la misma tab).
- Sin paridad directa RN: `ShareTabModal` como hub dedicado de campaña/QR.
- RN con placeholders legacy: `UsersScreen`, `BookingsScreen` (Java sí tiene `Users` funcional vía `UsersActivity`).

## Criterio Gonzalo (mínimo cambio percibido)

Objetivo: que al cambiar de React Native a Java, Gonzalo solo note una diferencia visual/estilo, pero no pérdida de funcionalidades ni de flujos.

### Gaps críticos a cerrar primero

- `Favorites`: replicar en la misma pantalla Java la búsqueda global de usuarios + bloque “Top 10 por puntuación”.
- `TripDetail`: asegurar todos los microdetalles de regata y estados (participantes, chat regata y acciones de capitán) con el mismo orden mental del RN.
- `Share`: decidir si se crea tab dedicada en Java o se replica el acceso exactamente donde estaba en RN para no romper hábito.

### Gaps de experiencia (menos críticos)

- Ajustar copy, jerarquía de textos, etiquetas y posiciones de CTA para que coincidan con RN.
- Igualar patrones de cards/listados en `Reservations`, `Messages`, `Favorites` para que el escaneo visual sea equivalente.
