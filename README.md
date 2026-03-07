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
