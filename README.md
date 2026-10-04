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

## Verlo en tu computadora

No abras `index.html` con doble clic: el panel necesita una API y, sin ella, solo muestra el acceso con un error de conexión.
Para ver el diseño con datos de ejemplo (necesitas [Node.js](https://nodejs.org) 18 o superior):

```bash
node dev/mock-server.js
```

Abre <http://127.0.0.1:8787>. Entra con cualquier usuario y contraseña (la contraseña `bad` simula un error).
Otras vistas de prueba, abriendo estas direcciones y luego recargando el panel:

- <http://127.0.0.1:8787/__mock?role=super> — vista del super administrador
- <http://127.0.0.1:8787/__mock?role=mustchange> — cambio de contraseña obligatorio
- <http://127.0.0.1:8787/__mock?auth=0> — pantalla de acceso
- <http://127.0.0.1:8787/__mock?role=admin> — volver a la vista normal

Los datos son de ejemplo y no se guardan.

## Conectarlo a tu API real

Fuera de `*.workers.dev` el panel llama a `http://127.0.0.1:8787`. Para apuntar a otra URL define
`window.APPOINTMENTS_API_BASE_URL` antes de cargar `app.js`. Ten en cuenta que la sesión usa cookies,
así que el Worker tendría que permitir tu origen en CORS con credenciales; lo más simple es servir
estos tres archivos desde el propio Worker.
