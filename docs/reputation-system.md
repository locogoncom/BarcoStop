# BarcoStop Reputation System v1

## Objetivo

Separar claramente tres conceptos:

1. Puntos de actividad: premian acciones reales dentro de la plataforma.
2. Valoracion social: nota de 1 a 10 que otros usuarios dejan sobre ti.
3. Rango nautico visible: galones y titulo que se muestran en la app.

Este sistema evita mezclar directamente estrellas o reseñas con experiencia nautica.

## Reglas base

1. Los puntos se acumulan por acciones verificables.
2. La valoracion recibida se mantiene separada del total de puntos.
3. El rango nautico visible depende del total de puntos.
4. El rango de Capitan se desbloquea a partir de 100 puntos.
5. Algunas acciones solo deben puntuar una vez.
6. Las acciones repetibles deben poder auditarse desde backend.

## Tabla de puntos inicial

### Acciones de una sola vez

| Accion | Puntos | Regla |
|---|---:|---|
| Completar perfil al 100% | 25 | Solo una vez por usuario |
| Añadir informacion completa de barco si es patron | 15 | Solo una vez por usuario |
| Añadir avatar o foto principal | 5 | Solo una vez por usuario |

### Acciones repetibles

| Accion | Puntos | Regla |
|---|---:|---|
| Crear viaje publicado | 10 | Por viaje valido publicado |
| Completar viaje con estado final correcto | 15 | Por viaje completado |
| Recibir valoracion de otro usuario | 1 a 10 | Suma exactamente la nota recibida |
| Recibir una reseña con comentario | 2 extra | Bonus opcional por reseña completa |

### Penalizaciones sugeridas

| Accion | Puntos |
|---|---:|
| Cancelar viaje publicado sin causa valida | -10 |
| Ocultar o vaciar perfil tras haber logrado perfil completo | -15 |
| Acumular reportes confirmados por moderacion | -20 |

## Rangos nauticos v1

| Puntos totales | Rango | Presentacion visual |
|---|---|---|
| 0 a 24 | Marinero | Sin galon o galon basico |
| 25 a 49 | Marinero avanzado | 1 galon |
| 50 a 74 | Contramaestre | 2 galones |
| 75 a 99 | Oficial | 3 galones |
| 100 o mas | Capitan | 4 galones o insignia de capitan |

## Condicion especial para Capitan

Para mostrar el titulo de Capitan como rango principal se recomienda exigir:

1. Tener 100 puntos o mas.
2. Tener al menos 3 viajes publicados.
3. Tener al menos 3 valoraciones recibidas.

Mientras no cumpla estas tres condiciones, el usuario puede seguir teniendo 100 puntos o mas, pero mostrarse como Oficial con progreso hacia Capitan.

## Formula de lectura en app

### Datos visibles al usuario

1. Puntos totales.
2. Rango actual.
3. Galon nautico correspondiente.
4. Valoracion media separada, en escala de 1 a 10.
5. Numero de reseñas.

### Ejemplo visual

- Puntos: 112
- Rango: Capitan
- Valoracion: 8.7/10
- Reseñas: 14

## Eventos que backend debe guardar

Para que el sistema sea auditable, cada movimiento de puntos deberia guardarse como un evento con:

1. user_id
2. event_type
3. points_delta
4. source_id opcional, por ejemplo trip_id o review_id
5. created_at
6. metadata opcional en JSON

## MVP recomendado para implementacion

### Fase 1

1. Definir la tabla de rangos y puntos.
2. Mostrar rango y galon en la app.
3. Calcular puntos temporalmente desde datos ya existentes si hace falta.

### Fase 2

1. Crear tabla real de eventos de reputacion.
2. Recalcular puntos desde backend.
3. Exponer totalPoints, rankName y progressToNextRank en la API.

### Fase 3

1. Añadir penalizaciones y validaciones.
2. Añadir logros o insignias especiales.
3. Añadir progreso visual hacia el siguiente rango.

## Decision tomada para v1

La propuesta aprobada para arrancar es esta:

1. Perfil completo: 25 puntos.
2. Crear viaje: 10 puntos.
3. Completar viaje: 15 puntos.
4. Valoracion recibida: suma de 1 a 10 puntos segun la nota.
5. Capitan: desde 100 puntos.

## Pendiente para el paso 2

Implementar visualmente en Android nativo:

1. Nombre del rango.
2. Galon correspondiente.
3. Puntos visibles en perfil y perfil publico.
4. Mantener la valoracion separada de los puntos.