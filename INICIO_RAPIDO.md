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
VITE_API_URL=https://tu-backend-publico.com/api
```

2. En `mobile/` crea/edita `.env`:

```env
APP_ENV=prod
BARCOSTOP_API_URL=https://tu-backend-publico.com/api
```

Notas:
- Si omites `/api`, la app lo agrega automáticamente.
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

Backend corriendo en `http://localhost:5000/api`:

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
