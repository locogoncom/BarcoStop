# Abrir Apps (Punto Unico)

Ruta fija: `C:\BarcoStop\ABRIR_APPS.md`

Estructura oficial para no mezclar apps:

```text
C:\BarcoStop\apps\BarcoStop\open.ps1
C:\BarcoStop\apps\KeepPlaying\open.ps1
```

Keep ya no vive dentro del flujo de BarcoStop. La app operativa e independiente esta fuera de este repo en C:\Apps\Keep.

Usa siempre estos comandos desde `C:\BarcoStop`:

```powershell
npm run app:barcostop
npm run app:keep
npm run keep:continue
```

Tambien puedes abrir cada una por su nombre/ruta:

```powershell
powershell -ExecutionPolicy Bypass -File .\apps\BarcoStop\open.ps1
powershell -ExecutionPolicy Bypass -File .\apps\KeepPlaying\open.ps1
```

Notas:
- `BarcoStop` usa flujo completo (backend + Metro + app Android).
- `Keep` usa `C:\Apps\Open-App.ps1` si existe; si no, cae a `C:\Apps\Keep` con `npm run dev:activate`.
- Keep queda separado e independiente; BarcoStop solo conserva un lanzador hacia esa carpeta externa.

## Orden De Trabajo (Fijo)

Este es el orden oficial para no mezclar sesiones:

1. Si pides `BarcoStop`: ejecutar `npm run app:barcostop`.
2. Si pides `Keep` o `KeepPlaying`: ejecutar `npm run app:keep`.
3. Si en el futuro se crea otra app: crear `apps/<NombreApp>/open.ps1` y comando raiz `npm run app:<nombre>`.

Regla de continuidad:
- Aunque cierres chats, el orden queda guardado aqui y se reutiliza siempre.
- Para Keep, usa `npm run keep:continue` y se abre la app externa independiente desde C:\Apps\Keep.
