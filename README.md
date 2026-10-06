# Panel Iguana

Diseño del panel de administración (citas, clientes, dinero, asistente de IA) en HTML, CSS y JavaScript puro.

## Verlo en tu computadora

Abre `index.html` con doble clic. No necesitas instalar nada ni tener servidor.

Funciona con **datos de ejemplo** (`demo-api.js`): no usa ninguna API y nada se guarda; al recargar todo vuelve al inicio.
Solo necesitas internet para cargar la fuente y el calendario.

Vistas especiales, agregando esto al final de la dirección del archivo:

| Dirección | Qué muestra |
| --- | --- |
| `index.html?demo=acceso` | Pantalla de entrar / crear negocio |
| `index.html?demo=moderador` | Vista del super administrador |
| `index.html?demo=password` | Cambio de contraseña obligatorio |

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Estructura: acceso, navegación, vistas y diálogos |
| `styles.css` | Estilo claro, tokens de color/espacio y diseño responsive |
| `app.js` | Lógica de la interfaz |
| `demo-api.js` | Datos de ejemplo que reemplazan a la API (solo para diseño) |
| `images/` | Logo y íconos de Iguana (tomados de iguana.ec) |

## Botón flotante de WhatsApp

El botón verde abajo a la derecha abre el chat del asistente en WhatsApp. El número está al inicio de `app.js`
(`ASSISTANT_WHATSAPP`); también puedes definir `window.ASSISTANT_WHATSAPP_NUMBER` antes de cargar `app.js`.
Ejemplo con código de país y sin signos: `593959420676`.

## Navegación

Cada sección tiene su propia dirección, así el botón "atrás" y los enlaces directos funcionan:

- `#/inicio` — lo primero que ves: próxima cita, cobrado y gastado hoy, ganancia y citas del mes vs el mes pasado, días más fuertes, por cobrar y próximas citas
- `#/calendario` — vista diaria (principal): franja de la semana y línea de tiempo del día; la vista de mes está en el botón "Mes". En celular también se cambia de día deslizando
- `#/clientes` — directorio e historial
- `#/dinero/resumen`, `#/dinero/ingresos`, `#/dinero/gastos`
- `#/asistente` — configuración del asistente de IA
- `#/ajustes` — servicios, horario y reglas de reserva
- `#/facturar` — próximamente

## Más adelante: conectar la API real

1. Quita la línea `<script src="demo-api.js">` de `index.html`.
2. `app.js` ya llama a los endpoints `/api/...` del Worker; fuera de `*.workers.dev` apunta a `http://127.0.0.1:8787`
   o a lo que definas en `window.APPOINTMENTS_API_BASE_URL`.
