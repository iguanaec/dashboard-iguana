# Iguana Design System · v0.2.0

Sistema de diseño reutilizable de Iguana: **claro, redondeado y sin líneas rectas**.
Funciona en cualquier app web sin compilar nada.

Abre `design-system/index.html` con doble clic para ver todo, probar los componentes y copiar colores.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `tokens.css` | Fuente única de verdad: color, forma, sombra, espacio, tipografía y movimiento (`--ig-*`) |
| `components.css` | Componentes con prefijo `ig-` (botones, tarjetas, campos, gráficos, navegación…) |
| `ig.js` | Comportamientos sin dependencias: control deslizante, menús, gráficos, contadores, avisos |
| `tokens.json` | Los mismos tokens en JSON, para Figma, React Native, Flutter, etc. |
| `export-tokens.mjs` | Regenera `tokens.json` desde `tokens.css`: `node design-system/export-tokens.mjs` |
| `index.html`, `docs.css`, `docs.js` | La documentación interactiva (no forman parte del sistema) |

## Usarlo

```html
<link rel="stylesheet" href="design-system/tokens.css">
<link rel="stylesheet" href="design-system/components.css">
<script src="design-system/ig.js" defer></script>

<body class="ig-root">
```

Las fuentes (Plus Jakarta Sans y JetBrains Mono) se cargan desde Google Fonts en el `<head>` de tu página.
Los iconos están en el sprite de `index.html`; cópialos a tu página para usarlos con `<svg class="ig-icon"><use href="#i-home"/></svg>`.

## Reglas

1. **Solo tokens semánticos** (`--ig-color-*`) en tus estilos; nunca un primitivo ni un hex suelto. ¿Falta un color? Se agrega al sistema, no a la pantalla.
2. **Sin líneas rectas decorativas**: nada de divisores, bordes de tarjeta ni tablas con rejilla. Se separa con espacio, tono y sombra. Los conectores son punteados.
3. **Colores que la gente ya entiende**: verde = bien, rojo = error o pérdida, ámbar = atención, azul = información. Nunca solo color: siempre con icono, signo o palabra.
4. **Lima solo para resaltar** (activo, tarjeta destacada, día pico) y siempre con texto oscuro.
5. **Todo responde**: pasar el cursor, presionar, foco. Respeta `prefers-reduced-motion`.

## Cromática

Verde lima Iguana `#A8FF6C` como color principal (botones, activo, destacado, siempre con tinta oscura); verdes 600/700 para texto e iconos sobre blanco y 900 para superficies oscuras; neutros "mist" (grises con toque verde, sin beige ni café);
rojo, ámbar y azul con valores estándar y siempre acompañados de texto o icono.
Ingresos en verde y gastos en grafito, para reservar el rojo al error.
Todos los pares de texto/fondo y controles cumplen WCAG 2.1 AA (la tabla "Pares aprobados" de la documentación lo calcula en vivo).

## Versionado

`0.x` mientras se prueba. Los cambios de un token se hacen en `tokens.css`, se regenera `tokens.json` y se revisa la tabla de contraste.
Pendiente: modo oscuro (mismos tokens semánticos), componentes de formulario avanzados y sincronía con Figma.

## Verlo en un solo archivo

`design-system/iguana-design-system.html` es la documentación completa en **un único archivo** (CSS, JS e imágenes embebidos). Se abre con doble clic o desde cualquier visor HTML. Se regenera con:

```bash
node design-system/build-standalone.mjs
```
