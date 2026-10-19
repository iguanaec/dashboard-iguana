/* Lógica SOLO de la página de documentación. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var css = function (name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var alias = /^var\((--[\w-]+)\)$/.exec(v);          // los alias (p. ej. lima → verde) se resuelven al valor final
    return alias ? css(alias[1]) : v;
  };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return IG.money(n); };

  /* ---------- Contraste WCAG ---------- */
  function lum(hex) {
    var h = hex.replace('#', '');
    var c = [0, 2, 4].map(function (i) {
      var v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  var isHex = function (v) { return /^#[0-9a-f]{6}$/i.test(v); };

  /* ---------- Muestras de color ---------- */
  var scale = function (prefix, steps, label) {
    return steps.map(function (s) { return ['--ig-' + prefix + '-' + s, label + ' ' + s]; });
  };
  var groups = {
    green: scale('green', ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'], 'Verde'),
    lime: scale('lime', ['50', '100', '200', '300', '400', '500'], 'Lima'),
    gray: scale('gray', ['0', '25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'], 'Mist'),
    red: scale('red', ['50', '100', '500', '600', '700'], 'Rojo'),
    amber: scale('amber', ['50', '100', '400', '500'], 'Ámbar'),
    blue: scale('blue', ['50', '100', '500', '600', '700'], 'Azul'),
    roles: [['--ig-color-bg', 'Fondo'], ['--ig-color-surface', 'Superficie'], ['--ig-color-surface-tonal', 'Tonal'], ['--ig-color-surface-brand', 'Marca suave'], ['--ig-color-surface-inverse', 'Inversa'], ['--ig-color-surface-highlight', 'Destacada'], ['--ig-color-text', 'Texto'], ['--ig-color-text-muted', 'Texto secundario'], ['--ig-color-text-subtle', 'Texto sutil'], ['--ig-color-brand', 'Marca'], ['--ig-color-action', 'Acción principal'], ['--ig-color-accent', 'Resalte'], ['--ig-color-control-border', 'Borde de control'], ['--ig-color-success', 'Éxito'], ['--ig-color-danger', 'Peligro'], ['--ig-color-warning-soft', 'Atención (fondo)'], ['--ig-color-info', 'Información']],
    data: [['--ig-data-1', 'Dato 1 · ingresos'], ['--ig-data-2', 'Dato 2 · gastos'], ['--ig-data-3', 'Dato 3'], ['--ig-data-4', 'Dato 4'], ['--ig-data-5', 'Dato 5 · resalte'], ['--ig-data-6', 'Dato 6 · resalte']]
  };
  document.querySelectorAll('.swatches').forEach(function (holder) {
    (groups[holder.dataset.group] || []).forEach(function (item) {
      var token = item[0], name = item[1], value = css(token);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch' + (token === '--ig-green-400' ? ' swatch--brand' : '');
      button.innerHTML = '<div class="swatch__chip" style="background:var(' + token + ')"></div><b>' + name + '</b><span>' + token.replace('--ig-', '') + '</span><small>' + value + '</small>';
      button.title = 'Copiar ' + value;
      button.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(value).catch(function () {});
        IG.toast('Copiado ' + value + ' · ' + token);
      });
      holder.append(button);
    });
  });

  /* ---------- Tabla de contraste ---------- */
  var pairs = [
    ['Texto principal', '--ig-gray-900', '--ig-gray-0', 4.5], ['Texto principal', '--ig-gray-900', '--ig-gray-50', 4.5],
    ['Texto secundario', '--ig-gray-600', '--ig-gray-0', 4.5], ['Texto secundario', '--ig-gray-600', '--ig-gray-100', 4.5],
    ['Texto sutil', '--ig-gray-500', '--ig-gray-0', 4.5], ['Texto sutil', '--ig-gray-500', '--ig-gray-50', 4.5], ['Texto sutil', '--ig-gray-500', '--ig-gray-100', 4.5],
    ['Marca (texto) sobre blanco', '--ig-green-700', '--ig-gray-0', 4.5], ['Marca (texto) sobre verde suave', '--ig-green-700', '--ig-green-100', 4.5], ['Marca (icono) sobre blanco', '--ig-green-600', '--ig-gray-0', 3],
    ['Botón principal: tinta sobre lima', '--ig-gray-900', '--ig-green-400', 4.5], ['Botón oscuro: lima sobre verde 900', '--ig-green-400', '--ig-green-900', 4.5], ['Blanco sobre verde 900', '--ig-gray-0', '--ig-green-900', 4.5],
    ['Peligro sobre fondo suave', '--ig-red-700', '--ig-red-50', 4.5], ['Blanco sobre rojo', '--ig-gray-0', '--ig-red-600', 4.5],
    ['Tinta sobre ámbar claro', '--ig-gray-900', '--ig-amber-100', 4.5], ['Información sobre fondo suave', '--ig-blue-700', '--ig-blue-50', 4.5],
    ['Borde de control', '--ig-gray-400', '--ig-gray-0', 3], ['Borde de control sobre fondo', '--ig-gray-400', '--ig-gray-50', 3],
    ['Gráfico · ingresos', '--ig-data-1', '--ig-gray-0', 3], ['Gráfico · gastos', '--ig-data-2', '--ig-gray-0', 3], ['Gráfico · verde‑azulado', '--ig-data-3', '--ig-gray-0', 3], ['Gráfico · azul', '--ig-data-4', '--ig-gray-0', 3]
  ];
  var table = $('contrast');
  pairs.forEach(function (p) {
    var fg = css(p[1]), bg = css(p[2]);
    if (!isHex(fg) || !isHex(bg)) return;
    var r = ratio(fg, bg), ok = r >= p[3];
    var row = document.createElement('div');
    row.className = 'contrast__row';
    row.innerHTML = '<div class="contrast__sample" style="background:var(' + p[2] + ');color:var(' + p[1] + ')">Aa</div><div><b>' + p[0] + '</b><br><span class="ig-muted" style="font-size:12px">' + p[1].replace('--ig-', '') + ' sobre ' + p[2].replace('--ig-', '') + '</span></div><span class="contrast__ratio">' + r.toFixed(2).replace('.', ',') + ':1</span><span class="ig-chip ' + (ok ? 'ig-chip--success' : 'ig-chip--danger') + ' ig-chip--dot">' + (ok ? 'Cumple ' : 'No cumple ') + (p[3] === 4.5 ? 'AA' : 'UI 3:1') + '</span>';
    table.append(row);
  });

  /* ---------- Iconos ---------- */
  var iconGrid = $('iconGrid');
  document.querySelectorAll('#ig-sprite symbol').forEach(function (sym) {
    var name = sym.id.replace('i-', '');
    var cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'icon-cell';
    cell.innerHTML = '<svg class="ig-icon" aria-hidden="true"><use href="#' + sym.id + '"/></svg>' + name;
    cell.addEventListener('click', function () { IG.toast('Icono “' + name + '”'); });
    iconGrid.append(cell);
  });

  /* ---------- Espaciado y movimiento ---------- */
  var space = $('spaceDemo');
  [['space-1', 4], ['space-2', 8], ['space-3', 12], ['space-4', 16], ['space-6', 24], ['space-8', 32], ['space-12', 48], ['space-16', 64]].forEach(function (s) {
    var row = document.createElement('div');
    row.className = 'space-row';
    row.innerHTML = '<span>--ig-' + s[0] + '</span><i style="width:' + s[1] * 3 + 'px"></i>';
    space.append(row);
  });
  var easeDemo = $('easeDemo');
  [['ease-out', 'Salida suave: la mayoría de transiciones'], ['ease-spring', 'Resorte: lo que aparece o rebota'], ['ease-in-out', 'Entrada y salida: cambios de posición largos']].forEach(function (e) {
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="ig-eyebrow" style="margin-bottom:6px">--ig-' + e[0] + ' · ' + e[1] + '</div><div class="ease-track" style="--_ease:var(--ig-' + e[0] + ')"><div class="ease-ball"></div></div>';
    easeDemo.append(wrap);
  });
  function replayEase() {
    var tracks = easeDemo.querySelectorAll('.ease-track');
    tracks.forEach(function (t) { t.classList.remove('is-run'); t.style.setProperty('--_dist', (t.clientWidth - 52) + 'px'); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { tracks.forEach(function (t) { t.classList.add('is-run'); }); }); });
  }
  $('replay').addEventListener('click', replayEase);

  /* ---------- Botones, chips, campos ---------- */
  $('loadingBtn').addEventListener('click', function (event) {
    var button = event.currentTarget;
    button.setAttribute('aria-busy', 'true');
    setTimeout(function () { button.removeAttribute('aria-busy'); IG.toast('Guardado'); }, 1400);
  });
  document.querySelectorAll('button.ig-chip[aria-pressed]').forEach(function (chip) {
    chip.addEventListener('click', function () { chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')); });
  });
  document.addEventListener('ig:change', function (event) {
    var out = $('segOut');
    if (out && event.target.getAttribute('aria-label') === 'Periodo') out.textContent = 'Periodo: ' + event.detail.value;
  });
  document.addEventListener('ig:select', function (event) { var out = $('segOut'); if (out) out.textContent = 'Elegiste: ' + event.detail.label; });

  var f2 = $('f2'), f2wrap = $('f2wrap'), f2help = $('f2help');
  var iconHelp = function (name, text) { return '<svg class="ig-icon ig-icon--sm" aria-hidden="true"><use href="#i-' + name + '"/></svg>' + text; };
  f2.addEventListener('input', function () {
    var value = parseFloat(f2.value.replace(',', '.'));
    f2wrap.classList.remove('ig-field--error', 'ig-field--success');
    if (!f2.value) { f2help.textContent = 'Escribe un valor para validarlo.'; return; }
    if (isNaN(value) || value <= 0) { f2wrap.classList.add('ig-field--error'); f2help.innerHTML = iconHelp('alert', 'Escribe un monto mayor a 0, por ejemplo 12,50.'); f2.setAttribute('aria-invalid', 'true'); return; }
    f2.removeAttribute('aria-invalid');
    f2wrap.classList.add('ig-field--success');
    f2help.innerHTML = iconHelp('check', 'Se ve bien: ' + money(value));
  });

  /* ---------- Contadores, progreso, anillo, gauge ---------- */
  function counters() {
    IG.countUp($('countA'), 4820.5);
    IG.countUp($('countB'), 52, { format: function (n) { return String(Math.round(n)); } });
  }
  counters();
  $('replayCount').addEventListener('click', counters);

  function setProgress(v) { $('progFill').style.setProperty('--_v', v + '%'); $('progText').textContent = v + '%'; }
  requestAnimationFrame(function () { setProgress(68); });
  $('progFill').parentElement.addEventListener('click', function () { setProgress(Math.round(Math.random() * 100)); });
  $('progFill').parentElement.title = 'Toca para cambiar el valor';

  IG.ring($('ringDemo'), 3, 5, 'citas hoy');
  var gauge = IG.gauge($('gaugeDemo'), { value: 22, caption: 'vs ayer', label: 'Balance' });
  $('gaugeRange').addEventListener('input', function (event) { gauge.set(Number(event.target.value)); });

  /* ---------- Gráficos ---------- */
  var months = [['Abr', 3200], ['May', 4100], ['Jun', 3600], ['Jul', 5200], ['Ago', 4700], ['Sep', 7110]];
  var barItems = months.map(function (m, i) { return { label: m[0], value: m[1], display: m[0] + ' · ' + money(m[1]), dark: false }; });
  IG.bars($('barsDemo'), barItems, { label: 'Ingresos por mes' });
  IG.bars($('dashBars'), barItems, { label: 'Ingresos del mes' });
  var days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  var incomeDays = [120, 90, 160, 140, 260, 310, 40];
  var expenseDays = [60, 30, 80, 40, 110, 70, 20];
  IG.line($('lineDemo'), { id: 'a', label: 'Ingresos y gastos por día', labels: days, series: [{ name: 'Ingresos', color: css('--ig-data-1'), values: incomeDays }, { name: 'Gastos', color: css('--ig-data-2'), values: expenseDays }] });
  var matrix = { rows: ['Insumos', 'Servicios', 'Transporte'], cols: days, data: [[40, 0, 25, 0, 90, 60, 0], [0, 35, 0, 0, 30, 0, 0], [10, 0, 0, 20, 0, 45, 15]], mid: 25, high: 60, format: money, label: 'Gastos por categoría y día' };
  IG.matrix($('matrixDemo'), matrix);
  IG.matrix($('dashMatrix'), Object.assign({}, matrix, { label: 'Gastos por día' }));
  IG.gauge($('dashGauge'), { value: 68, caption: 'de la meta del mes', label: 'Balance del mes' });
  IG.countUp($('dashToday'), 23.5);

  /* ---------- Filas, navegación, pestañas ---------- */
  document.querySelectorAll('.ig-round-btn--ok').forEach(function (b) { b.addEventListener('click', function () { IG.toast('Marcado como cobrado'); }); });
  document.querySelectorAll('.ig-round-btn--no').forEach(function (b) { b.addEventListener('click', function () { IG.toast('Descartado', { type: 'error' }); }); });
  function current(container, selector, attr) {
    container.querySelectorAll(selector).forEach(function (item) {
      item.addEventListener('click', function (event) {
        event.preventDefault();
        container.querySelectorAll(selector).forEach(function (other) { if (attr === 'aria-current') other.removeAttribute('aria-current'); else other.setAttribute('aria-selected', 'false'); });
        if (attr === 'aria-current') item.setAttribute('aria-current', 'page'); else item.setAttribute('aria-selected', 'true');
      });
    });
  }
  current($('sidebarDemo'), '.ig-nav-item', 'aria-current');
  current($('tabbarDemo'), '.ig-tabbar__item', 'aria-current');
  current($('tabsDemo'), '.ig-tab', 'aria-selected');
  current($('dashTabs'), '.ig-tab', 'aria-selected');
  document.querySelectorAll('.dash .ig-nav-item').forEach(function (a) {
    a.addEventListener('click', function (event) {
      event.preventDefault();
      document.querySelectorAll('.dash .ig-nav-item').forEach(function (o) { o.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'page');
    });
  });

  /* ---------- Semana ---------- */
  var week = $('weekDemo');
  [['Lun', 5, 1], ['Mar', 6, 1], ['Mié', 7, 1], ['Jue', 8, 1], ['Vie', 9, 1], ['Sáb', 10, 1], ['Dom', 11, 0]].forEach(function (d, i) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'ig-week__day';
    if (d[2]) button.setAttribute('data-busy', '');
    if (i === 1) button.setAttribute('aria-current', 'date');
    button.setAttribute('aria-label', d[0] + ' ' + d[1] + (d[2] ? ', con citas' : ''));
    button.innerHTML = '<small class="ig-muted">' + d[0] + '</small><strong>' + d[1] + '</strong><i></i>';
    button.addEventListener('click', function () {
      week.querySelectorAll('.ig-week__day').forEach(function (o) { o.removeAttribute('aria-current'); });
      button.setAttribute('aria-current', 'date');
    });
    week.append(button);
  });

  /* ---------- Diálogos y avisos ---------- */
  $('openDialog').addEventListener('click', function () { $('dlg').showModal(); });
  $('openSheet').addEventListener('click', function () { $('sheet').showModal(); });
  document.querySelectorAll('dialog').forEach(function (dialog) {
    dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
    dialog.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { dialog.close(); }); });
  });
  $('toastOk').addEventListener('click', function () { IG.toast('Pago registrado'); });
  $('toastErr').addEventListener('click', function () { IG.toast('No se pudo guardar. Inténtalo de nuevo.', { type: 'error' }); });

  /* ---------- Menú lateral de la documentación ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#docNav a'));
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.doc-section').forEach(function (s) { observer.observe(s); });
  }
})();
