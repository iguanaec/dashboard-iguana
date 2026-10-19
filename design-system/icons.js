/* =========================================================
   Iguana Design System — iconos  ·  v0.2.0
   Estilo "dúo": trazo redondeado de 2 px + una mancha de color de marca
   desplazada detrás (como un sticker mal registrado). Las formas son
   propias del negocio (toldo de tienda, burbuja con ojos, calendario de puntos),
   no los iconos genéricos de siempre.

   Uso:   <svg class="ig-icon"><use href="#i-home"/></svg>
   Color: la mancha usa --ig-icon-tint (por defecto lima). Sobre fondos lima
          el sistema la cambia a un verde oscuro translúcido.
   ========================================================= */
(function () {
  // t(): mancha de color. Desplazada 1.5px hacia abajo-derecha respecto del trazo.
  function t(d, dx, dy) {
    return '<path d="' + d + '" transform="translate(' + (dx == null ? 1.5 : dx) + ' ' + (dy == null ? 1.5 : dy) + ')" style="fill:var(--ig-icon-tint,#A8FF6C);stroke:none"/>';
  }
  function p(d, extra) { return '<path d="' + d + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function dot(x, y, w) { return '<path d="M' + x + ' ' + y + 'h.01" stroke-width="' + (w || 3) + '"/>'; }
  function circ(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; }
  function tc(cx, cy, r, dx, dy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" transform="translate(' + (dx == null ? 1.5 : dx) + ' ' + (dy == null ? 1.5 : dy) + ')" style="fill:var(--ig-icon-tint,#A8FF6C);stroke:none"/>'; }

  var BUBBLE = 'M6 4.5h12a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-6.2L8 19.8V16.5H6A2.5 2.5 0 0 1 3.5 14V7A2.5 2.5 0 0 1 6 4.5Z';
  var CAL = 'M6.5 5.5h11A2.5 2.5 0 0 1 20 8v9.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5V8a2.5 2.5 0 0 1 2.5-2.5Z';
  var RECEIPT = 'M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v14.8l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-1.2.8V5A1.5 1.5 0 0 1 7 3.5Z';
  var BELL = 'M6 16.4V11a6 6 0 0 1 12 0v5.4l1.6 2.1H4.4Z';

  var ICONS = {
    home: t('M5.5 9.8v8.9a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8V9.8L12 4.4Z') +
      p('M3.5 11.2 12 3.8l8.5 7.4M5.5 9.8v8.9a1.8 1.8 0 0 0 1.8 1.8h9.4a1.8 1.8 0 0 0 1.8-1.8V9.8M9.8 20.5v-4.3a2.2 2.2 0 0 1 4.4 0v4.3'),
    calendar: t(CAL) + p(CAL) + p('M8.5 3.5v3.2M15.5 3.5v3.2') + dot(8.5, 11.6) + dot(12, 11.6) + dot(15.5, 11.6) + dot(8.5, 15.6) + dot(12, 15.6),
    users: tc(9.2, 8.7, 4.2, 1.2, 1.4) + circ(9.2, 8.7, 3.4) + p('M3.4 19.6c.5-3.5 3-5.3 5.8-5.3s5.3 1.8 5.8 5.3') + p('M15.6 5.7a3.2 3.2 0 0 1 0 6M17.6 14.6c1.9.6 2.9 2 3.1 4.4'),
    wallet: t('M5.5 9.2h14.5a1.5 1.5 0 0 1 1.5 1.5v7.8a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2Z', 1, 1.2) +
      p('M4 8.5A2.5 2.5 0 0 1 6.5 6H17a2.5 2.5 0 0 1 2.5 2.5v.7M4 8.5v8A2.5 2.5 0 0 0 6.5 19h11a2.5 2.5 0 0 0 2.5-2.5v-6a1.5 1.5 0 0 0-1.5-1.5H6.5A2.5 2.5 0 0 1 4 8.5Z') + dot(16.2, 13.9, 3.4),
    chat: t(BUBBLE) + p(BUBBLE) + dot(8.6, 10.5, 3) + dot(12, 10.5, 3) + dot(15.4, 10.5, 3),
    bot: t(BUBBLE) + p(BUBBLE) + p('M9 10.2v.9M15 10.2v.9') + p('M9.6 13.2c.8.7 1.6 1 2.4 1s1.6-.3 2.4-1'),
    cog: tc(8.5, 7.5, 2.6, 1.2, 1.2) + tc(15.5, 16.5, 2.6, 1.2, 1.2) + circ(8.5, 7.5, 2.6) + circ(15.5, 16.5, 2.6) + p('M13.4 7.5H20M4 7.5h1.9M4 16.5h6.9M18.1 16.5H20'),
    sliders: tc(8, 8.5, 2.5, 1.2, 1.2) + circ(8, 8.5, 2.5) + p('M4 8.5h1.5M10.5 8.5H20') + tc(16, 15.5, 2.5, 1.2, 1.2) + circ(16, 15.5, 2.5) + p('M4 15.5h9.5M18.5 15.5H20'),
    receipt: t(RECEIPT) + p(RECEIPT) + p('M9.2 9h5.6M9.2 12.5h3.6'),
    building: t('M5.5 12.5V20h13v-7.5Z', 1, 1) + p('M4 9.6 5.4 4.6h13.2L20 9.6M4 9.6a2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.2 0 2.7 2.7 0 0 0 5.4 0M5.6 12.6V20h12.8v-7.4M10 20v-4.4h4V20'),
    refresh: tc(12, 12, 7.2, 1, 1) + p('M19.6 12a7.6 7.6 0 1 1-2.3-5.4M19.6 4.4v4.3h-4.3'),
    logout: t('M5 5.5h5.5v13H5Z', 1, 1) + p('M10.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h3.5M15.2 8.2 19 12l-3.8 3.8M19 12H9.6'),
    plus: tc(12, 12, 8, 1.2, 1.2) + p('M12 6.5v11M6.5 12h11'),
    search: tc(10.6, 10.6, 6.2, 1.4, 1.4) + circ(10.6, 10.6, 6.2) + p('m15.4 15.4 4.4 4.4'),
    back: p('M14.8 5.5 8.3 12l6.5 6.5'),
    'chevron-left': p('M14.8 5.5 8.3 12l6.5 6.5'),
    'chevron-right': p('M9.2 5.5l6.5 6.5-6.5 6.5'),
    'chevron-down': p('M5.5 9.2l6.5 6.5 6.5-6.5'),
    x: p('M6.5 6.5l11 11M17.5 6.5l-11 11'),
    check: p('M5 12.8l4.4 4.4L19 7.4', 'stroke-width="2.4"'),
    up: p('M6.5 14.2 12 8.7l5.5 5.5'),
    down: p('M6.5 9.8l5.5 5.5 5.5-5.5'),
    'arrow-ur': p('M7 17 17 7M9.2 7H17v7.8', 'stroke-width="2.2"'),
    more: dot(6, 12, 3.6) + dot(12, 12, 3.6) + dot(18, 12, 3.6),
    edit: t('M5 19.2l.7-3.7 9.6-9.6 3 3-9.6 9.6Z', 1, 1) + p('M4.6 19.4l.9-4.2L16.6 4.1a2.2 2.2 0 0 1 3.1 3.1L8.6 18.5ZM14.4 6.4l3.2 3.2'),
    trash: t('M7 8.5h10l-.7 10a2 2 0 0 1-2 1.8H9.7a2 2 0 0 1-2-1.8Z', 1, 1) + p('M4.8 7h14.4M9.4 7V5.2a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6V7M6.7 7l.8 11.3a2 2 0 0 0 2 1.7h5a2 2 0 0 0 2-1.7L17.3 7M10.2 11v5M13.8 11v5'),
    clock: tc(12, 12, 8.3, 1.2, 1.2) + circ(12, 12, 8.3) + p('M12 7.6V12l3 1.9'),
    file: t('M7.5 3.5h6L19 9v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z', 1, 1) + p('M7.5 3.5h6L19 9v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5ZM13.5 3.7V9h5.3M9.6 13.4h5M9.6 16.8h3'),
    bell: t(BELL) + p(BELL) + p('M10 20.6a2.1 2.1 0 0 0 4 0'),
    download: t('M5 17h14v1.6a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 18.6Z', 0, 0.4) + p('M12 4.2v10.3M7.6 10.2l4.4 4.4 4.4-4.4M5 17v1.6A1.6 1.6 0 0 0 6.6 20.2h10.8a1.6 1.6 0 0 0 1.6-1.6V17'),
    eye: tc(12, 12, 4.4, 1, 1.2) + p('M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12Z') + circ(12, 12, 2.9),
    star: t('M12 3.9l2.6 5.2 5.7.9-4.1 4 1 5.7L12 17.1 6.8 19.7l1-5.7-4.1-4 5.7-.9Z') + p('M12 3.9l2.6 5.2 5.7.9-4.1 4 1 5.7L12 17.1 6.8 19.7l1-5.7-4.1-4 5.7-.9Z', 'stroke-linejoin="round"'),
    info: tc(12, 12, 8.4, 1.2, 1.2) + circ(12, 12, 8.4) + p('M12 11.2v5.2') + dot(12, 7.9, 2.8),
    alert: t('M10.4 5.3 3.7 17a2 2 0 0 0 1.7 3h13.2a2 2 0 0 0 1.7-3L13.6 5.3a2 2 0 0 0-3.2 0Z', 1, 1.2) + p('M10.4 5.3 3.7 17a2 2 0 0 0 1.7 3h13.2a2 2 0 0 0 1.7-3L13.6 5.3a2 2 0 0 0-3.2 0ZM12 10v3.8') + dot(12, 17, 2.8),
    trend: t('M4.5 17.2l5-5 3.5 3.4 6.5-6V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18Z', 0, 0) + p('M4 16.2l5.6-5.6 3.5 3.5 7-6.6M15.4 7.5H20.2v4.8'),
    whatsapp: t('M12 4.4a8.2 8.2 0 0 0-7 12.4L4 20.4l3.7-1A8.2 8.2 0 1 0 12 4.4Z') +
      '<path d="M12 3.2a8.8 8.8 0 0 0-7.5 13.4L3.2 20.8l4.3-1.3A8.8 8.8 0 1 0 12 3.2Z"/>' +
      '<path d="M9.2 8.2c-.4.5-.6 1.1-.4 1.9.5 1.9 2.2 3.8 4.3 4.6.9.3 1.6.1 2.1-.4l.4-.8-1.9-1-.8.7c-.9-.3-1.9-1.2-2.3-2.2l.7-.8-.9-1.9-.8-.1Z" fill="currentColor" stroke="none"/>'
  };

  // Aliases del panel original
  ICONS.note = ICONS.file; ICONS.label = ICONS.file; ICONS.value = ICONS.trend; ICONS.main = ICONS.home;

  function sprite() {
    var out = '<svg id="ig-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>';
    Object.keys(ICONS).forEach(function (name) {
      if (['note', 'label', 'value', 'main'].indexOf(name) > -1) return;   // alias sin símbolo propio
      out += '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + ICONS[name] + '</symbol>';
    });
    return out + '</defs></svg>';
  }

  function mount() {
    if (document.getElementById('ig-sprite')) return;
    var holder = document.createElement('div');
    holder.innerHTML = sprite();
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
  }
  window.IG_ICONS = { names: Object.keys(ICONS), mount: mount, sprite: sprite };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
