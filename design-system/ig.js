/* =========================================================
   Iguana Design System — comportamientos  ·  v0.1.0
   JavaScript sin dependencias. Expone window.IG.
   Todo respeta prefers-reduced-motion y funciona con teclado.
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value == null || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : value);
    });
    (children || []).forEach(function (child) { if (child) node.append(child); });
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), out = '#';
    [16, 8, 0].forEach(function (shift) {
      var ca = (pa >> shift) & 255, cb = (pb >> shift) & 255;
      out += ('0' + Math.round(ca + (cb - ca) * t).toString(16)).slice(-2);
    });
    return out;
  }
  var money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });

  /* ---------- Control segmentado ---------- */
  function segmented(root) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll('.ig-segmented__btn'));
    var thumb = root.querySelector('.ig-segmented__thumb') || root.insertBefore(el('span', { class: 'ig-segmented__thumb', 'aria-hidden': 'true' }), root.firstChild);
    function selected() { return buttons.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0] || buttons[0]; }
    function place() {
      var current = selected();
      root.style.setProperty('--_x', current.offsetLeft + 'px');
      root.style.setProperty('--_w', current.offsetWidth + 'px');
    }
    function select(button, focus) {
      buttons.forEach(function (b) { b.setAttribute('aria-selected', String(b === button)); b.tabIndex = b === button ? 0 : -1; });
      place();
      if (focus) button.focus();
      root.dispatchEvent(new CustomEvent('ig:change', { bubbles: true, detail: { value: button.dataset.value || button.textContent.trim() } }));
    }
    buttons.forEach(function (button) {
      button.setAttribute('role', 'tab');
      button.tabIndex = button.getAttribute('aria-selected') === 'true' ? 0 : -1;
      button.addEventListener('click', function () { select(button); });
      button.addEventListener('keydown', function (event) {
        var i = buttons.indexOf(button);
        if (event.key === 'ArrowRight') { event.preventDefault(); select(buttons[(i + 1) % buttons.length], true); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); select(buttons[(i - 1 + buttons.length) % buttons.length], true); }
      });
    });
    root.setAttribute('role', 'tablist');
    place();
    root.setAttribute('data-ready', '');
    if (window.ResizeObserver) new ResizeObserver(place).observe(root);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  /* ---------- Menú desplegable ---------- */
  function menu(wrap) {
    var trigger = wrap.querySelector('.ig-select-chip');
    var panel = wrap.querySelector('.ig-menu');
    var label = wrap.querySelector('[data-ig-label]');
    var items = Array.prototype.slice.call(panel.querySelectorAll('.ig-menu__item'));
    function close(returnFocus) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) trigger.focus();
    }
    function open() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      (items.filter(function (i) { return i.getAttribute('aria-checked') === 'true'; })[0] || items[0]).focus();
    }
    function choose(item) {
      items.forEach(function (i) { i.setAttribute('aria-checked', String(i === item)); });
      if (label) label.textContent = item.dataset.label || item.textContent.trim();
      wrap.dispatchEvent(new CustomEvent('ig:select', { bubbles: true, detail: { value: item.dataset.value, label: item.textContent.trim() } }));
      close(true);
    }
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'menu');
    panel.hidden = true;
    items.forEach(function (item) {
      item.setAttribute('role', 'menuitemradio');
      item.addEventListener('click', function () { choose(item); });
    });
    trigger.addEventListener('click', function () { panel.hidden ? open() : close(false); });
    panel.addEventListener('keydown', function (event) {
      var i = items.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') { event.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      if (event.key === 'Escape') { event.preventDefault(); close(true); }
      if (event.key === 'Tab') close(false);
    });
    document.addEventListener('pointerdown', function (event) { if (!wrap.contains(event.target)) close(false); });
  }

  /* ---------- Contador animado ---------- */
  function countUp(node, to, options) {
    var opts = options || {};
    var from = opts.from || 0;
    var duration = opts.duration || 900;
    var format = opts.format || function (n) { return money.format(n); };
    if (reduceMotion()) { node.textContent = format(to); return; }
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = format(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Barras redondeadas ---------- */
  function bars(root, items, options) {
    var opts = options || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var holder = el('div', { class: 'ig-bars', role: 'group', 'aria-label': opts.label || 'Gráfico de barras' });
    var tip = el('div', { class: 'ig-tooltip', hidden: true, role: 'status' });
    var current = typeof opts.selected === 'number' ? opts.selected : items.length - 1;
    var buttons = items.map(function (item, index) {
      var fill = el('span', { class: 'ig-bar__fill' });
      var button = el('button', { type: 'button', class: 'ig-bar' + (item.dark ? ' ig-bar--dark' : ''), 'aria-pressed': String(index === current), 'aria-label': item.label + ': ' + item.display }, [fill, el('span', { class: 'ig-bar__label', text: item.label })]);
      button.style.setProperty('--_h', reduceMotion() ? item.value / max : 0);
      button.addEventListener('click', function () { current = index; sync(); show(index); });
      button.addEventListener('pointerenter', function () { show(index); });
      button.addEventListener('focus', function () { show(index); });
      button.addEventListener('pointerleave', function () { show(current); });
      holder.append(button);
      return button;
    });
    function show(index) {
      var fill = buttons[index].querySelector('.ig-bar__fill');
      tip.textContent = items[index].display;
      tip.hidden = false;
      var half = tip.offsetWidth / 2 + 4;
      var center = buttons[index].offsetLeft + buttons[index].offsetWidth / 2;
      tip.style.left = Math.max(half, Math.min(root.clientWidth - half, center)) + 'px';
      tip.style.top = (buttons[index].offsetTop + fill.offsetTop - 8) + 'px';
    }
    function sync() { buttons.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === current)); }); }
    root.replaceChildren(holder, tip);
    root.classList.add('ig-chart');
    requestAnimationFrame(function () {
      buttons.forEach(function (button, i) { button.style.setProperty('--_h', items[i].value / max); });
      setTimeout(function () { show(current); }, reduceMotion() ? 0 : 520);
    });
    return { select: function (i) { current = i; sync(); show(i); } };
  }

  /* ---------- Línea suave con área ---------- */
  function smoothPath(points) {
    var d = 'M' + points[0].x + ',' + points[0].y;
    for (var i = 0; i < points.length - 1; i += 1) {
      var p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      d += ' C' + (p1.x + (p2.x - p0.x) / 6) + ',' + (p1.y + (p2.y - p0.y) / 6) + ' ' + (p2.x - (p3.x - p1.x) / 6) + ',' + (p2.y - (p3.y - p1.y) / 6) + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }
  function line(root, config) {
    var W = 640, H = 240, padX = 18, padTop = 28, padBottom = 34;
    var labels = config.labels, series = config.series;
    var max = Math.max.apply(null, series.reduce(function (all, s) { return all.concat(s.values); }, [])) * 1.12 || 1;
    var x = function (i) { return padX + (i * (W - padX * 2)) / (labels.length - 1); };
    var y = function (v) { return padTop + (1 - v / max) * (H - padTop - padBottom); };
    var chart = svg('svg', { class: 'ig-line', viewBox: '0 0 ' + W + ' ' + H, role: 'img', tabindex: '0', 'aria-label': config.label || 'Gráfico de líneas' });
    var defs = svg('defs');
    var active = labels.length - 1;
    var tip = el('div', { class: 'ig-tooltip', role: 'status' });
    var markers = [];
    series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) { return { x: x(i), y: y(v) }; });
      var gradient = svg('linearGradient', { id: 'ig-area-' + (config.id || 'x') + si, x1: 0, y1: 0, x2: 0, y2: 1 });
      gradient.append(svg('stop', { offset: '0%', 'stop-color': s.color, 'stop-opacity': si === 0 ? '.28' : '.10' }), svg('stop', { offset: '100%', 'stop-color': s.color, 'stop-opacity': '0' }));
      defs.append(gradient);
      var d = smoothPath(pts);
      chart.append(svg('path', { d: d + ' L' + pts[pts.length - 1].x + ',' + (H - padBottom) + ' L' + pts[0].x + ',' + (H - padBottom) + ' Z', fill: 'url(#ig-area-' + (config.id || 'x') + si + ')' }));
      chart.append(svg('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      var marker = svg('circle', { r: 7.5, fill: '#fff', stroke: s.color, 'stroke-width': 3.5 });
      markers.push({ node: marker, series: s });
      chart.append(marker);
    });
    chart.prepend(defs);
    labels.forEach(function (label, i) {
      if (labels.length > 8 && i % 2) return;
      chart.append(Object.assign(svg('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace', fill: cssVar('--ig-gray-500') }), { textContent: label }));
    });
    function show(index) {
      active = Math.max(0, Math.min(labels.length - 1, index));
      markers.forEach(function (m) { m.node.setAttribute('cx', x(active)); m.node.setAttribute('cy', y(m.series.values[active])); });
      var top = Math.min.apply(null, series.map(function (s) { return y(s.values[active]); }));
      tip.innerHTML = '';
      tip.append(labels[active] + ' · ' + series.map(function (s) { return s.name + ' ' + (config.format || money.format.bind(money))(s.values[active]); }).join(' · '));
      var box = chart.getBoundingClientRect();
      var scale = box.width / W;
      var halfTip = tip.offsetWidth / 2 + 4;
      tip.style.left = Math.max(halfTip, Math.min(box.width - halfTip, x(active) * scale)) + 'px';
      tip.style.top = (top * scale - 14) + 'px';
      chart.setAttribute('aria-valuetext', tip.textContent);
    }
    chart.addEventListener('pointermove', function (event) {
      var box = chart.getBoundingClientRect();
      var vx = ((event.clientX - box.left) / box.width) * W;
      show(Math.round(((vx - padX) / (W - padX * 2)) * (labels.length - 1)));
    });
    chart.addEventListener('pointerleave', function () { show(labels.length - 1); });
    chart.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); show(active + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(active - 1); }
    });
    root.replaceChildren(chart, tip);
    root.classList.add('ig-chart');
    requestAnimationFrame(function () { show(active); });
    window.addEventListener('resize', function () { show(active); });
  }

  /* ---------- Gauge en segmentos redondeados ---------- */
  function gauge(root, config) {
    var N = config.segments || 30, W = 260, H = 140, R = 112, cx = W / 2, cy = 128;
    var holder = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': config.label || 'Indicador' });
    var segs = [];
    for (var i = 0; i < N; i += 1) {
      var theta = Math.PI + ((i + 0.5) / N) * Math.PI;
      var rect = svg('rect', { class: 'ig-gauge__seg', x: -4.5, y: -13, width: 9, height: 26, rx: 4.5, fill: cssVar('--ig-gray-100') });
      rect.setAttribute('transform', 'translate(' + (cx + R * Math.cos(theta)) + ' ' + (cy + R * Math.sin(theta)) + ') rotate(' + (theta * 180 / Math.PI - 90) + ')');
      holder.append(rect);
      segs.push(rect);
    }
    var number = el('strong', { text: '0%' });
    var caption = el('span', { text: config.caption || '' });
    var wrap = el('div', { class: 'ig-gauge__label' }, [number, caption]);
    root.replaceChildren(holder, wrap);
    root.classList.add('ig-gauge');
    function set(value) {
      var filled = Math.round((value / 100) * N);
      segs.forEach(function (seg, i) {
        seg.style.transitionDelay = reduceMotion() ? '0ms' : (i * 14) + 'ms';
        seg.setAttribute('fill', i < filled ? mix(cssVar('--ig-green-300'), cssVar('--ig-green-700'), i / Math.max(1, N * 0.8)) : cssVar('--ig-gray-100'));
      });
      number.textContent = Math.round(value) + '%';
      root.setAttribute('aria-label', (config.label || 'Indicador') + ': ' + Math.round(value) + '%');
    }
    requestAnimationFrame(function () { set(config.value); });
    return { set: set };
  }

  /* ---------- Anillo de progreso ---------- */
  function ring(root, done, total, caption) {
    var r = 50, c = 2 * Math.PI * r;
    var holder = svg('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' });
    holder.append(svg('circle', { cx: 60, cy: 60, r: r, fill: 'none', stroke: cssVar('--ig-data-track'), 'stroke-width': 12 }));
    var arc = svg('circle', { class: 'ig-ring__arc', cx: 60, cy: 60, r: r, fill: 'none', stroke: cssVar('--ig-data-1'), 'stroke-width': 12, 'stroke-linecap': 'round', transform: 'rotate(-90 60 60)', 'stroke-dasharray': '0 ' + c });
    holder.append(arc);
    var label = el('div', { class: 'ig-ring__label' }, [el('strong', { text: done + '/' + total }), el('span', { text: caption || '' })]);
    root.classList.add('ig-ring');
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', done + ' de ' + total + (caption ? ' ' + caption : ''));
    root.replaceChildren(holder, label);
    requestAnimationFrame(function () { arc.setAttribute('stroke-dasharray', (done / total) * c + ' ' + c); });
  }

  /* ---------- Matriz de puntos (mapa de calor redondeado) ---------- */
  function matrix(root, config) {
    var rows = config.rows, cols = config.cols, data = config.data;
    root.classList.add('ig-matrix', 'ig-chart');
    root.style.setProperty('--_cols', cols.length);
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', config.label || 'Matriz de puntos');
    var tip = el('div', { class: 'ig-tooltip', hidden: true });
    root.append(el('span'));
    cols.forEach(function (c) { root.append(el('span', { class: 'ig-matrix__col-label', text: c })); });
    rows.forEach(function (row, r) {
      root.append(el('span', { class: 'ig-matrix__row-label', text: row }));
      cols.forEach(function (col, c) {
        var value = data[r][c];
        var level = value >= config.high ? 3 : value >= config.mid ? 2 : value > 0 ? 1 : 0;
        var dot = el('span', { class: 'ig-dot', 'data-level': String(level), 'aria-label': row + ' ' + col + ': ' + config.format(value) });
        dot.addEventListener('pointerenter', function () {
          var box = root.getBoundingClientRect(), d = dot.getBoundingClientRect();
          tip.textContent = row + ' · ' + col + ' · ' + config.format(value);
          tip.hidden = false;
          tip.style.left = (d.left - box.left + d.width / 2) + 'px';
          tip.style.top = (d.top - box.top - 8) + 'px';
        });
        dot.addEventListener('pointerleave', function () { tip.hidden = true; });
        root.append(dot);
      });
    });
    root.append(tip);
  }

  /* ---------- Aviso ---------- */
  function toast(message, options) {
    var opts = options || {};
    var region = document.querySelector('.ig-toast-region') || document.body.appendChild(el('div', { class: 'ig-toast-region', role: 'status', 'aria-live': 'polite' }));
    var icon = el('span', { class: 'ig-toast__icon' });
    icon.innerHTML = '<svg class="ig-icon ig-icon--sm" aria-hidden="true"><use href="#i-' + (opts.type === 'error' ? 'x' : 'check') + '"/></svg>';
    var node = el('div', { class: 'ig-toast' + (opts.type === 'error' ? ' ig-toast--error' : '') }, [icon, el('span', { text: message })]);
    region.append(node);
    setTimeout(function () { node.remove(); }, opts.duration || 3500);
  }

  /* ---------- Arranque automático por atributos ---------- */
  function auto(scope) {
    var root = scope || document;
    root.querySelectorAll('.ig-segmented').forEach(function (n) { if (!n.hasAttribute('data-ready')) segmented(n); });
    root.querySelectorAll('.ig-menu-wrap').forEach(menu);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { auto(); });
  else auto();

  window.IG = { segmented: segmented, menu: menu, countUp: countUp, bars: bars, line: line, gauge: gauge, ring: ring, matrix: matrix, toast: toast, auto: auto, money: function (n) { return money.format(n); } };
})();
