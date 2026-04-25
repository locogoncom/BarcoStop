## Comandos rápidos Android

Ejecuta desde `mobile/`:

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Generar AAB (Google Play)
npm run build:aab:release

# Generar APK firmado
npm run build:apk:release

# Debug en telefono Android por USB
npm run android:usb
```

## Tests

Ejecuta desde la raiz del repo:

```bash
# Todos (API legacy + API PHPUnit + tests mobile)
npm test

# API completa (legacy + PHPUnit)
npm run test:api

# API legacy (runner propio en tests/api/php/run.php)
npm run test:api:legacy

# API PHP con PHPUnit (suite de contratos mobile)
npm run test:api:phpunit

# API live contra producción (login + CRUD viajes en api.barcostop.net)
npm run test:api:live:prod

# Mobile (Jest)
npm run test:mobile
```

Test live opcional de login contra `https://api.barcostop.net/api/v1`:

```bash
BARCOSTOP_RUN_LIVE_AUTH_TEST=1 \
BARCOSTOP_TEST_EMAIL=betolopezayesa@gmail.com \
BARCOSTOP_TEST_PASSWORD=test22 \
composer --working-dir public_html/api test
```

Si este test live falla por rutas/respuestas, revisa primero que la API desplegada en producción (`api.barcostop.net`) esté actualizada con la última versión.

Test live opcional de CRUD de viajes (crear, listar, detalle y borrar):

```bash
BARCOSTOP_RUN_LIVE_TRIP_CRUD_TEST=1 \
BARCOSTOP_TEST_EMAIL=betolopezayesa@gmail.com \
BARCOSTOP_TEST_PASSWORD=test22 \
composer --working-dir public_html/api test
```

# BarcoStop 🚤

Una plataforma moderna para compartir viajes en barco, conectar navegantes y construir comunidad en el mar.

## Características

✨ **Gestión de Viajes**
- Patrones publican trayectos disponibles
- Viajeros buscan y reservan viajes
- Sistema de clasificación de sitios disponibles y precios

⛵ **Sistema de Usuarios**
- Roles: Patrón (propietario) y Viajero
- Perfiles con habilidades (navegante, cocinero, mecánico, etc.)
- Sistema de calificaciones y reseñas

💬 **Chat Integrado**
- Comunicación directa entre patrones y viajeros
- Conversaciones persistentes
- Historial de mensajes

📍 **Seguimiento de Viajes**
- Compartir progreso del viaje sin GPS
- Notificar a amigos del estado actual
- Estados: iniciado, en trayecto, completado

🤝 **Comunidad**
- Sistema de invitaciones para amigos
- Crecimiento viral de la plataforma
- Valoraciones mutuas para confianza

💙 **Soporte**
- Botón de donación PayPal
- Comisión simbólica futura en reservas
- Transparencia en el modelo de negocio

## Tecnología

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: localStorage (preparado para backend)
- **Build**: Vite

## Instalación

### Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

### Backend (Node.js + MongoDB)
En el directorio `server` hay una API Express mínima. Para usarla necesitas una base de datos MongoDB.

1. Crea un cluster gratuito en MongoDB Atlas o instala Mongo en tu PC (o usa Docker).
2. Copia la URI de conexión (algo como `mongodb+srv://...` o `mongodb://localhost:27017/barcostop`).
3. Crea el archivo `server/.env` o edita el existente:
   ```
   MONGO_URI=<tu_uri>
   PORT=5000
   ```
4. Instala dependencias y arranca:
   ```bash
   cd server
   npm install
   npm run dev      # nodemon sirve para reiniciar automático
   ```
5. Deberías ver en consola:
   ```
   MongoDB connected
   Server running on port 5000
   ```

La API quedará disponible en `http://localhost:5000`.

El frontend ya está preparado para consumirla; en breve haremos las llamadas desde React.

## Estructura del Proyecto

```
BarcoStop/
├── src/
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes base
│   │   ├── Auth.tsx     # Registro/Login
│   │   ├── TripList.tsx # Listado de viajes
│   │   └── ...
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Funciones auxiliares
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globales
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## Próximos Pasos

- [ ] Integración con backend (Node.js + Base de datos)
- [ ] Autenticación real (JWT)
- [ ] Sistema de pagos (Stripe/PayPal)
- [ ] Notificaciones push
- [ ] Versión móvil nativa
- [ ] Sistema de reseñas detalladas
- [ ] Búsqueda avanzada con filtros

## Contribuir

¡Nos encantaría tu ayuda! Abre un issue o pull request.

## Licencia

MIT License - BarcoStop 2026


# Publicar eliminar-cuenta.html en GitHub Pages

Sigue estos pasos para publicar tu página de eliminación de cuenta y obtener una URL pública para Google Play Console:

1. **Sube el archivo** `eliminar-cuenta.html` a tu repositorio de GitHub (por ejemplo, en la raíz o en una carpeta `docs/`).
2. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
3. Busca la sección **Pages** o **GitHub Pages** en el menú lateral.
4. En **Source** (Fuente), selecciona la rama `main` y la carpeta donde subiste el archivo (`/` para raíz o `/docs`).
5. Haz clic en **Save** (Guardar).
6. GitHub generará una URL pública, por ejemplo:
   - `https://tuusuario.github.io/BarcoStop/eliminar-cuenta.html`
7. Usa esa URL en la consola de Google Play para cumplir con el requisito de eliminación de cuenta.

**Nota:** Si necesitas más ayuda, consulta la documentación oficial de [GitHub Pages](https://pages.github.com/) o pide soporte.


# BarcoStop - Guía de Inicio Rápido

## 🎯 Todo está listo!

Tu proyecto BarcoStop ha sido configurado con:

1. ✅ Backend Node.js con MySQL
2. ✅ App móvil React Native con Expo
3. ✅ Base de datos estructurada

## 🚀 Pasos para Iniciar

## Reanudar BarcoStop en un comando

Desde la raiz de `c:\BarcoStop`:

```powershell
npm run barcostop:activate
```

Este comando deja BarcoStop aislado y levanta todo lo necesario para continuar:
- Backend (`server`) si no esta en puerto `5000`
- Metro (`mobile`) si no esta en puerto `8081`
- App Android de BarcoStop en el emulador Pixel 6

### Paso 1: Inicializar la Base de Datos

```bash
# Opción A: Desde línea de comandos
mysql -h localhost -u locogon_0 -p'e2@LK@Lsy6X5' locogon_db0 < server/database/init.sql

# Opción B: Desde MySQL Workbench
# 1. Abrir MySQL Workbench
# 2. Conectar con los datos: host=localhost, user=locogon_0, password=e2@LK@Lsy6X5
# 3. Abrir el archivo server/database/init.sql
# 4. Ejecutar el script
```

### Paso 2: Iniciar el Servidor Backend

```powershell
cd c:\BarcoStop\server
npm start
```

Deberías ver:
```
✓ MySQL connected successfully
Server running on port 5000
```

### Paso 3: Configurar URLs API (solo 1 cambio)

Web (Vite) usa `VITE_API_URL` y mobile usa `BARCOSTOP_API_URL`.

1. En la raíz del proyecto crea/edita `.env`:

```env
VITE_API_URL=https://api.barcostop.net/v1
```

2. En `mobile/` crea/edita `.env`:

```env
APP_ENV=prod
BARCOSTOP_API_URL=https://api.barcostop.net/v1
```

Notas:
- Si usas una URL acabada en `/api`, la app la normaliza a `/api/v1`.
- Si no incluyes sufijo, la app agrega `/v1`.
- En mobile también puedes usar solo `APP_ENV=dev|staging|prod` y tomar URLs por entorno desde `mobile/src/config/apiConfig.ts`.

### Paso 4: Iniciar la App Móvil

```powershell
cd c:\BarcoStop\mobile
npm start
```

Esto abrirá Expo Dev Tools en tu navegador.

### Paso 5: Probar la App en tu Android

**Opción A: Teléfono Real** (Recomendado)
1. Descarga "Expo Go" desde Play Store
2. Escanea el código QR que aparece en la terminal
3. ¡Empieza a usar BarcoStop!

**Opción B: Emulador**
1. Instala Android Studio
2. Crea un dispositivo virtual
3. Presiona 'a' en la terminal de Expo

## 🎨 Pantallas Disponibles

- **Home**: Pantalla principal con opciones para patrón o viajero
- **Lista de Viajes**: Ver todos los viajes disponibles
- **Detalle de Viaje**: Información completa + botón de reserva
- **Crear Viaje**: Formulario para patrones
- **Perfil**: Ver información de usuarios y calificaciones

## 🔧 Comandos Útiles

```powershell
# Backend
cd c:\BarcoStop\server
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo con nodemon

# Mobile
cd c:\BarcoStop\mobile
npm start          # Iniciar Expo
npm run android    # Abrir en emulador Android
npm run web        # Abrir en navegador
```

## 📊 Endpoints del API

Backend en produccion: `https://api.barcostop.net/v1` (local antiguo: `http://localhost:5000/api`).

- `GET /users` - Listar usuarios
- `POST /users` - Crear usuario
- `GET /trips` - Listar viajes
- `POST /trips` - Crear viaje
- `GET /trips/:id` - Detalles de viaje
- `POST /reservations` - Crear reserva
- Y más...

## ❓ Problemas Comunes

### La app no se conecta al backend

1. Verifica que el servidor esté corriendo
2. Verifica la IP en `api.ts`
3. Habilita el puerto en el firewall:

```powershell
New-NetFirewallRule -DisplayName "Node Server 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Error de MySQL connection

1. Verifica que MySQL esté corriendo
2. Revisa las credenciales en `server/.env`
3. Ejecuta el script `init.sql` para crear las tablas

### Expo no inicia

```powershell
# Limpia caché y reinstala
cd c:\BarcoStop\mobile
rm -rf node_modules
npm install
npm start --clear
```

## 🎓 Próximos Pasos

1. **Implementar autenticación**: Login y registro de usuarios
2. **Agregar mapas**: Mostrar rutas en mapa interactivo
3. **Chat en tiempo real**: WebSockets para mensajería
4. **Tracking GPS**: Seguimiento en vivo de viajes
5. **Sistema de pagos**: Integrar pasarela de pagos
6. **Compilar APK**: Generar app para distribución

## 📱 Genera tu APK

Cuando estés listo para distribuir:

```powershell
cd c:\BarcoStop\mobile
npx eas build:configure
npx eas build -p android --profile preview
```

---

**¡Tu app BarcoStop está lista! 🚢⚓**


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
