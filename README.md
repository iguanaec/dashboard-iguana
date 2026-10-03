# Panel Iguana

Panel de administración (citas, clientes, dinero, asistente de IA) en HTML, CSS y JavaScript puro.

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Estructura: acceso, navegación, vistas y diálogos |
| `styles.css` | Estilo claro, tokens de color/espacio y diseño responsive |
| `app.js` | Lógica y llamadas a la API (mismos endpoints `/api/...` de antes) |

El calendario sigue usando FullCalendar 6 y Luxon desde CDN.

## Navegación

Cada sección tiene su propia URL, así el botón "atrás" y los enlaces directos funcionan:

- `#/calendario` — citas (mes, semana, día)
- `#/clientes` — directorio e historial
- `#/dinero/resumen`, `#/dinero/ingresos`, `#/dinero/gastos`
- `#/asistente` — configuración del asistente de IA
- `#/ajustes` — servicios, horario y reglas de reserva
- `#/facturar` — próximamente
- `#/moderador` — solo para el super administrador

## Probar en local

La API vive en el Worker. Fuera de `*.workers.dev` el panel llama a `http://127.0.0.1:8787`;
para apuntar a otra URL define `window.APPOINTMENTS_API_BASE_URL` antes de cargar `app.js`.
