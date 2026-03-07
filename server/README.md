# BarcoStop API

Backend para la aplicación BarcoStop - Plataforma de compartir viajes en barco

## Deployment en Render

### Variables de entorno a configurar:

```
DB_TYPE=mysql
DB_HOST=kqmg.your-database.de
DB_PORT=3306
DB_USER=locogon_0
DB_PASSWORD=e2@LK@Lsy6X5
DB_NAME=locogon_db0
JWT_SECRET=barcostop_jwt_secret_key_2026_production_secure
NODE_ENV=production
CORS_ORIGIN=*
```

### Comandos:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x o superior

## Endpoints principales

- `GET /` - Health check
- `POST /api/users` - Registro
- `POST /api/users/login` - Login
- `GET /api/trips` - Listar viajes
- `POST /api/trips` - Crear viaje
- Y más...
