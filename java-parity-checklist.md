# Java Parity Checklist (React -> Nativo)

Estado inicial para ejecutar la migración funcional 1:1 descrita en `version-react.md`.

## Convención de estado

- `TODO`: pendiente
- `WIP`: en curso
- `DONE`: implementado y probado
- `PARTIAL`: implementado parcialmente
- `N/A`: no aplica

## Checklist por bloque

| Bloque | React (referencia) | Java (target) | Estado | Notas |
|---|---|---|---|---|
| Home | `HomeScreen.tsx` | `HomeActivity` | DONE | Microcopy final + claim rotativo animado + build/version fijo |
| Auth | `AuthScreen.tsx` | `AuthActivity` | DONE | Login/registro paridad UX + submit contextual + Google + mejoras teclado |
| Trips list | `TripListScreen.tsx` | `TripsFragment` | DONE | Buscador plegable + cards + saneado `[BSMETA]` + flujo detalle/editar/eliminar |
| Trip detail | `TripDetailScreen.tsx` | `TripDetailActivity` | DONE | Snapshot + chat grupal regata + checkpoints + mejoras estado/share + toolbar integrado + pulido visual final |
| Create/Edit trip | `CreateTripScreen.tsx` | `CreateTripActivity`/`EditTripActivity` | DONE | Toolbars nativas + i18n completa + validaciones/meta/campos |
| Reservations | `ReservationsScreen.tsx` | `ReservationsFragment` | DONE | CTA PayPal contextual + chat/cancelar + saneado título `[BSMETA]` + header/resumen visual |
| Patron requests | `PatronRequestsScreen.tsx` | `PatronRequestsFragment` | DONE | Saneado título `[BSMETA]` + aprobar/rechazar/chat + cabecera/resumen |
| Messages list | `MessagesScreen.tsx` | `MessagesFragment` | DONE | Búsqueda local + último mensaje/truncado + densidad estilo WhatsApp |
| Chat | `ChatScreen.tsx` | `ChatActivity` | DONE | Toolbar con contacto + reportar/bloquear fuera del input + estado bloqueo |
| Favorites | `FavoritesScreen.tsx` | `FavoritesFragment` | DONE | Búsqueda global + top10 + añadir/quitar/chat/perfil en una sola pantalla |
| Share hub | `ShareTabModal.tsx` | `ShareFragment` (nuevo) | DONE | Integrado como pantalla dedicada (acceso por menú superior) con share/WhatsApp/Instagram/QR/contador/PayPal |
| Profile | `ProfileScreen.tsx` | `ProfileFragment` | DONE | Borrado soporte + campos extendidos + resumen trips/reputación + pulido visual final |
| User public profile | `UserPublicProfileScreen.tsx` | `UserPublicProfileActivity` | DONE | i18n + toolbar nativa + rating/reseñas + pulido de bloques |
| Boats | `BoatsScreen.tsx` | `BoatsActivity` | DONE | Toolbar nativa + UX formulario/listado + validaciones y feedback |
| Users (legacy RN placeholder) | `UsersScreen.tsx` | `UsersActivity` | DONE | Java ya supera RN |
| Bookings (legacy RN placeholder) | `BookingsScreen.tsx` | n/a | N/A | No usado en flujo RN actual |

## Revisión visual final (26-04-2026)

- Doble pasada de capturas de referencia completada (2x).
- Ajustes finales cerrados en `Trips`, `Trip detail`, `Messages`, `Favorites`, `Reservations` y `Profile traveler`.
- Build local OK (`:app:assembleDebug`).
- Pendiente solo `run` en dispositivo cuando vuelva a estar detectado por ADB.

## Smoke test manual por pantalla

- Home: cambiar idioma, entrar por capitán/viajero, continuar sesión.
- Auth: login, registro, login Google (si credenciales), manejo de errores.
- Trips: filtros, abrir detalle, crear/editar/eliminar (capitán), reservar/cancelar (viajero).
- Trip detail: chat/favorito/perfil capitán/share/maps/estado reserva.
- Messages/Chat: abrir conversación, enviar mensaje, reportar/bloquear/desbloquear.
- Favorites: listar, añadir/quitar, abrir chat/perfil.
- Profile: guardar perfil, cerrar teclado al guardar, avatar, soporte, compartir viaje.
- Share hub: compartir genérico, WhatsApp, Instagram, QR, contador, donación PayPal.
