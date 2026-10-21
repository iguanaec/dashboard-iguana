# Panel Iguana

Panel del CRM Iguana (citas, clientes, dinero, conversaciones y asistente de IA) en HTML, CSS y JavaScript puro.

**Cada negocio ve secciones distintas según su tipo (giro)**: una peluquería canina ve calendario, lista de espera y
reactivación; una inmobiliaria, propiedades y prospectos; una tienda, catálogo y pedidos. El giro se elige en el
onboarding y queda fijo; solo el super administrador de Iguana lo puede cambiar. El servidor está en el repositorio `iguana.ec`.

## Verlo en tu computadora

Abre `index.html` con doble clic. No necesitas instalar nada ni tener servidor.

Funciona con **datos de ejemplo** (`demo-api.js`): no usa ninguna API y nada se guarda; al recargar todo vuelve al inicio.
Solo necesitas internet para cargar la fuente y el calendario.

¿Prefieres un solo archivo? `panel-iguana.html` trae todo embebido (estilos, scripts, imágenes). Se regenera con `node build-demo.mjs`.

Vistas especiales, agregando esto al final de la dirección del archivo:

| Dirección | Qué muestra |
| --- | --- |
| `index.html?demo=acceso` | Pantalla de entrar / crear negocio |
| `index.html?demo=moderador` | Vista del super administrador |
| `index.html?demo=password` | Cambio de contraseña obligatorio |
| `index.html?demo=onboarding` | Configuración inicial: elegir giro, servicios, horario y conectar canales |
| `index.html?demo=canina` | Peluquería canina: datos de la mascota, lista de espera, reactivación |
| `index.html?demo=inmobiliaria` | Inmobiliaria: propiedades y prospectos ordenados por "calor" |
| `index.html?demo=tienda` | Tienda: catálogo, tablero de pedidos y comprobantes por aprobar |

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Estructura: acceso, navegación, vistas y diálogos |
| `styles.css` | Estilos propios del panel, construidos sobre el design system |
| `design-system/` | Iguana Design System: tokens, componentes, iconos y documentación (ver su README) |
| `panel-iguana.html` | El panel completo en un solo archivo (generado) |
| `app.js` | Lógica de la interfaz |
| `giro.js` / `giro.css` | Lo que cambia por giro: onboarding, secciones (catálogo, pedidos, propiedades, prospectos, lista de espera, reactivar), canales con un botón, probador y medidor del asistente, campos del cliente |
| `merc.js` / `merc.css` | Mensajería: bandeja omnicanal (real con la API; de ejemplo en modo diseño), embudo, chatbots y campañas (estas tres solo en modo diseño) |
| `merc.js`, `merc.css` | Mensajería: conversaciones, embudo, chatbots, campañas y catálogo (datos de ejemplo) |
| `demo-api.js` | Datos de ejemplo que reemplazan a la API (solo para diseño) |
| `images/` | Logo y íconos de Iguana (tomados de iguana.ec) |

## Botón flotante de WhatsApp

El botón verde lima abajo a la derecha abre el chat del asistente en WhatsApp. El número está al inicio de `app.js`
(`ASSISTANT_WHATSAPP`); también puedes definir `window.ASSISTANT_WHATSAPP_NUMBER` antes de cargar `app.js`.
Ejemplo con código de país y sin signos: `593959420676`.

## Navegación

Cada sección tiene su propia dirección, así el botón "atrás" y los enlaces directos funcionan:

- `#/inicio` — lo primero que ves: próxima cita, cobrado y gastado hoy, ganancia y citas del mes vs el mes pasado, días más fuertes, por cobrar y próximas citas
- `#/calendario` — vista diaria (principal): franja de la semana y línea de tiempo del día; la vista de mes está en el botón "Mes". En celular también se cambia de día deslizando
- `#/clientes` — directorio e historial
- `#/dinero/resumen`, `#/dinero/ingresos`, `#/dinero/gastos`
- `#/conversaciones` — bandeja única de WhatsApp, Instagram y Messenger, con el asistente IA por chat; avisa cuando el asistente se pausó porque respondiste desde tu celular
- `#/embudo` — (solo modo diseño) oportunidades por etapa (arrastra o usa las flechas)
- `#/chatbots` — (solo modo diseño) automatizaciones con su flujo paso a paso
- `#/campanas` — (solo modo diseño) envíos con plantillas de WhatsApp y su embudo de lectura/respuesta
- `#/asistente` — configuración del asistente de IA
- `#/ajustes` — servicios, horario y reglas de reserva
- `#/catalogo`, `#/pedidos` — giros de venta y delivery
- `#/propiedades`, `#/prospectos` — inmobiliarias y servicios profesionales
- `#/espera`, `#/reactivar` — giros de citas
- `#/facturar` — próximamente

Si un giro no tiene una sección, su enlace se oculta y la dirección lleva a Inicio.

## Más adelante: conectar la API real

1. Quita la línea `<script src="demo-api.js">` de `index.html`.
2. `app.js` ya llama a los endpoints `/api/...` del Worker; fuera de `*.workers.dev` apunta a `http://127.0.0.1:8787`
   o a lo que definas en `window.APPOINTMENTS_API_BASE_URL`.
