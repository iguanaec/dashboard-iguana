/* =========================================================
   Mensajería · Iguana
   Bandeja de conversaciones, embudo, chatbots, campañas y catálogo.
   Solo datos de ejemplo (nada se envía ni se guarda). Se monta desde app.js
   con  window.IguanaMsg.render(vista).
   ========================================================= */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const toast = (msg, type) => (window.IG ? window.IG.toast(msg, { type }) : null);
  const icon = (name, cls = '') => `<svg class="ig-icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const usd = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
  const initials = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const CHANNELS = {
    whatsapp: { label: 'WhatsApp', icon: 'whatsapp' },
    instagram: { label: 'Instagram', icon: 'star' },
    messenger: { label: 'Messenger', icon: 'chat' },
  };
  const AGENTS = {
    ana: { name: 'Ana Paredes', short: 'Ana' },
    luis: { name: 'Luis Mora', short: 'Luis' },
    sofi: { name: 'Sofía Vera', short: 'Sofía' },
  };
  const hm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  /* ---------------- Datos de ejemplo ---------------- */
  const convos = [
    { id: 1, name: 'María Fernanda Salazar', phone: '+593 98 412 7788', channel: 'whatsapp', agent: 'ana', bot: false, unread: 2, stage: 'negociacion', status: 'open', tags: ['Cliente frecuente', 'Quito'], last: hm(10, 42),
      msgs: [
        { from: 'in', text: 'Hola, buenos días. ¿Tienen disponible el plan de limpieza facial para este sábado?', t: hm(10, 31) },
        { from: 'bot', text: 'Hola María Fernanda 👋 Soy el asistente de Iguana. Sí hay cupos el sábado a las 09:00 y a las 15:30. ¿Cuál te acomoda?', t: hm(10, 31) },
        { from: 'in', text: 'A las 15:30 por favor. ¿Cuánto cuesta con el masaje incluido?', t: hm(10, 38) },
        { from: 'out', agent: 'ana', text: 'Con masaje incluido son $45. Si pagas hoy por transferencia te dejo $5 de descuento.', t: hm(10, 40) },
        { from: 'in', text: 'Perfecto, ¿me pasas el link de pago?', t: hm(10, 42) },
        { from: 'in', text: 'Y confirmo la cita ahora mismo 🙌', t: hm(10, 42) },
      ] },
    { id: 2, name: 'Carlos Andrade', phone: '+593 99 301 2245', channel: 'instagram', agent: null, bot: true, unread: 1, stage: 'nuevo', status: 'open', tags: ['Desde anuncio'], last: hm(10, 15),
      msgs: [
        { from: 'in', text: 'Vi su publicación del corte + barba. ¿Hasta qué hora atienden?', t: hm(10, 14) },
        { from: 'bot', text: 'Hola Carlos 👋 Atendemos de lunes a sábado de 09:00 a 19:00. ¿Quieres que te reserve un cupo?', t: hm(10, 15) },
        { from: 'in', text: '¿Y el domingo?', t: hm(10, 15) },
      ] },
    { id: 3, name: 'Valeria Núñez', phone: '+593 96 880 1432', channel: 'whatsapp', agent: 'luis', bot: false, unread: 0, stage: 'propuesta', status: 'open', tags: ['Corporativo'], last: hm(9, 58),
      msgs: [
        { from: 'in', text: 'Necesitamos una cotización para 12 personas, jornada completa de bienestar para el equipo.', t: hm(9, 40) },
        { from: 'out', agent: 'luis', text: 'Claro Valeria, te preparo la propuesta. ¿Qué fecha tienen en mente?', t: hm(9, 45) },
        { from: 'in', text: 'Primera semana del próximo mes.', t: hm(9, 52) },
        { from: 'out', agent: 'luis', text: 'Listo. Te la envío por correo en unos minutos y la dejo también por aquí.', t: hm(9, 58) },
      ] },
    { id: 4, name: 'Diego Cevallos', phone: '+593 98 120 5566', channel: 'messenger', agent: 'sofi', bot: false, unread: 0, stage: 'calificado', status: 'open', tags: ['Guayaquil'], last: hm(9, 20),
      msgs: [
        { from: 'in', text: '¿Hacen envíos a Guayaquil de los kits de cuidado?', t: hm(9, 12) },
        { from: 'out', agent: 'sofi', text: 'Sí Diego, enviamos a todo el país. En Guayaquil llega en 24 a 48 horas. El envío cuesta $4,50.', t: hm(9, 20) },
      ] },
    { id: 5, name: 'Paola Jácome', phone: '+593 99 774 0091', channel: 'whatsapp', agent: null, bot: true, unread: 3, stage: 'nuevo', status: 'open', tags: ['Sin asignar'], last: hm(8, 47),
      msgs: [
        { from: 'in', text: 'Hola!!', t: hm(8, 44) },
        { from: 'bot', text: 'Hola Paola 👋 ¿En qué te puedo ayudar? Puedo agendar una cita, mostrarte el catálogo o pasarte con una persona del equipo.', t: hm(8, 44) },
        { from: 'in', text: 'Quiero cambiar mi cita del jueves', t: hm(8, 46) },
        { from: 'in', text: 'Si se puede para el viernes en la tarde', t: hm(8, 47) },
      ] },
    { id: 9, name: 'Valeria Andrade', phone: '+593 99 870 1122', channel: 'whatsapp', agent: null, bot: false, pauseReason: 'owner_reply', unread: 0, stage: 'calificado', status: 'open', tags: ['Coexistencia'], last: hm(9, 58),
      msgs: [
        { from: 'in', text: '¿Me pueden hacer el corte hoy a las 5?', t: hm(9, 50) },
        { from: 'bot', text: 'Hola Valeria 👋 Hoy a las 17:00 está libre. ¿Te lo reservo?', t: hm(9, 50) },
        { from: 'out', who: 'Tú · desde el celular', text: 'Valeria, te espero a las 5 y te hago el 10% por ser tu cumple 🎉', t: hm(9, 58) },
      ] },
    { id: 6, name: 'Andrés Villacís', phone: '+593 95 612 3388', channel: 'instagram', agent: 'ana', bot: false, unread: 0, stage: 'ganado', status: 'resolved', tags: ['Pagado'], last: 'Ayer',
      msgs: [
        { from: 'in', text: 'Ya hice el pago, te mando el comprobante.', t: hm(17, 3) },
        { from: 'out', agent: 'ana', text: '¡Recibido, Andrés! Tu cita queda confirmada para el miércoles a las 11:00. Gracias 💚', t: hm(17, 10) },
      ] },
    { id: 7, name: 'Gabriela Torres', phone: '+593 98 004 7712', channel: 'whatsapp', agent: 'sofi', bot: false, unread: 0, stage: 'calificado', status: 'open', tags: ['Referida'], last: 'Ayer',
      msgs: [
        { from: 'in', text: 'Me recomendó Paula. ¿Tienen paquetes para novias?', t: hm(15, 20) },
        { from: 'out', agent: 'sofi', text: 'Hola Gabriela, ¡felicidades! Sí, tenemos el paquete Novia con prueba previa. Te cuento los detalles.', t: hm(15, 32) },
      ] },
    { id: 8, name: 'Jorge Mejía', phone: '+593 99 555 8090', channel: 'messenger', agent: 'luis', bot: false, unread: 0, stage: 'perdido', status: 'resolved', tags: ['Sin respuesta'], last: 'Lun',
      msgs: [
        { from: 'in', text: 'Gracias, lo voy a pensar.', t: hm(12, 5) },
      ] },
  ];

  const stages = [
    { key: 'nuevo', label: 'Nuevo', tone: 'info' },
    { key: 'calificado', label: 'Calificado', tone: 'brand' },
    { key: 'propuesta', label: 'Propuesta', tone: 'warning' },
    { key: 'negociacion', label: 'Negociación', tone: 'warning' },
    { key: 'ganado', label: 'Ganado', tone: 'success' },
  ];
  const deals = [
    { id: 1, convo: 4, title: 'Kit cuidado facial x3', value: 96, stage: 'calificado' },
    { id: 2, convo: 2, title: 'Corte + barba mensual', value: 120, stage: 'nuevo' },
    { id: 3, convo: 5, title: 'Reagendar cita + extras', value: 35, stage: 'nuevo' },
    { id: 4, convo: 3, title: 'Jornada bienestar · 12 personas', value: 1260, stage: 'propuesta' },
    { id: 5, convo: 1, title: 'Limpieza facial + masaje', value: 45, stage: 'negociacion' },
    { id: 6, convo: 7, title: 'Paquete Novia con prueba', value: 380, stage: 'calificado' },
    { id: 7, convo: 6, title: 'Plan trimestral cuidado', value: 210, stage: 'ganado' },
  ];

  const bots = [
    { id: 1, name: 'Bienvenida y menú', trigger: 'Primer mensaje de un contacto nuevo', on: true, runs: 1284, done: 78,
      steps: [
        { type: 'Disparador', text: 'Llega un mensaje de un contacto nuevo', icon: 'bell' },
        { type: 'Mensaje', text: 'Saludo con el nombre del negocio y 3 botones: Agendar · Catálogo · Hablar con alguien', icon: 'chat' },
        { type: 'Condición', text: 'Si elige «Agendar» → flujo de citas. Si elige «Catálogo» → envía productos', icon: 'sliders' },
        { type: 'Acción', text: 'Etiqueta al contacto como «Desde bot» y lo agrega al embudo en «Nuevo»', icon: 'users' },
      ] },
    { id: 2, name: 'Agendar cita con IA', trigger: 'Palabras: cita, reservar, agendar', on: true, runs: 642, done: 71,
      steps: [
        { type: 'Disparador', text: 'El mensaje contiene «cita», «reservar» o «agendar»', icon: 'bell' },
        { type: 'IA', text: 'Pregunta servicio y día, y consulta los cupos libres del calendario', icon: 'bot' },
        { type: 'Mensaje', text: 'Ofrece hasta 3 horarios disponibles', icon: 'chat' },
        { type: 'Acción', text: 'Crea la cita en el calendario y envía confirmación', icon: 'calendar' },
      ] },
    { id: 3, name: 'Recordatorio y cobro', trigger: '24 horas antes de la cita', on: true, runs: 913, done: 92,
      steps: [
        { type: 'Disparador', text: '24 horas antes de cada cita', icon: 'clock' },
        { type: 'Plantilla', text: 'Envía el recordatorio aprobado por WhatsApp con botón «Confirmar»', icon: 'whatsapp' },
        { type: 'Condición', text: 'Si hay saldo pendiente → envía el link de pago', icon: 'wallet' },
      ] },
    { id: 4, name: 'Reactivar clientes inactivos', trigger: 'Sin visitas hace 60 días', on: false, runs: 0, done: 0,
      steps: [
        { type: 'Disparador', text: 'Cliente sin citas en los últimos 60 días', icon: 'clock' },
        { type: 'Plantilla', text: 'Envía una oferta de regreso con 10 % de descuento', icon: 'whatsapp' },
        { type: 'Espera', text: 'Si no responde en 3 días, pasa a una persona del equipo', icon: 'users' },
      ] },
  ];

  const campaigns = [
    { id: 1, name: 'Promo Día de la Madre', tpl: 'promo_madre_v2', channel: 'whatsapp', audience: 'Clientes con cita en el último año', sent: 842, delivered: 811, read: 604, replied: 119, status: 'sent', date: '12 may' },
    { id: 2, name: 'Recordatorio de cupos de fin de semana', tpl: 'cupos_finde', channel: 'whatsapp', audience: 'Etiqueta · Cliente frecuente', sent: 215, delivered: 209, read: 172, replied: 41, status: 'sent', date: '03 jun' },
    { id: 3, name: 'Lanzamiento kit cuidado facial', tpl: 'lanzamiento_kit', channel: 'whatsapp', audience: 'Todos los contactos', sent: 0, delivered: 0, read: 0, replied: 0, status: 'scheduled', date: 'Vie 18:00' },
  ];

  const templates = ['Saludo de bienvenida', 'Datos para transferencia', 'Horarios de atención', 'Dirección y cómo llegar', 'Gracias por tu compra'];
  const templateText = {
    'Saludo de bienvenida': '¡Hola! Gracias por escribirnos a Iguana 👋 ¿En qué te podemos ayudar?',
    'Datos para transferencia': 'Banco Pichincha · Cuenta corriente 2200123456 · Iguana Corp · RUC 1790000000001. Envíanos el comprobante por aquí.',
    'Horarios de atención': 'Atendemos de lunes a sábado de 09:00 a 19:00.',
    'Dirección y cómo llegar': 'Estamos en La Floresta, Quito. Te comparto la ubicación en un momento 📍',
    'Gracias por tu compra': '¡Gracias por tu compra! Si necesitas algo más, aquí estamos 💚',
  };

  /* ---------------- Estado de la interfaz ---------------- */
  const ui = {
    convoId: 1, tab: 'todos', channel: 'todos', q: '', mobileThread: false, info: window.innerWidth >= 1560,
    botId: 1, catQ: '', catCat: 'Todo',
  };
  const mounted = {};
  const byId = (id) => convos.find((c) => c.id === id);

  const chBadge = (key) => `<span class="m-ch m-ch--${key}">${icon(CHANNELS[key].icon)}<span>${CHANNELS[key].label}</span></span>`;
  const avatar = (c, size = '') => `<span class="m-avatar ${size}" data-ch="${c.channel}" aria-hidden="true">${esc(initials(c.name))}</span>`;
  const agentLabel = (c) => (c.bot ? 'Asistente IA' : c.agent ? AGENTS[c.agent].name : 'Sin asignar');
  const lastPreview = (c) => { const m = c.msgs[c.msgs.length - 1]; return (m.from === 'out' ? 'Tú: ' : '') + m.text; };
  const stageOf = (k) => stages.find((s) => s.key === k) || { label: 'Perdido', tone: 'danger' };

  /* ======================= CONVERSACIONES ======================= */
  // Con la API real (sin demo-api.js) la bandeja usa conversaciones reales; en modo diseño, los datos de ejemplo.
  const live = { get on() { return Boolean(window.IguanaApi && !window.demoFetch); }, loading: false };
  const A = () => window.IguanaApi;
  const clock = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return today ? hm(d.getHours(), d.getMinutes()) : d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
  };
  const fromApiMsg = (m) => ({
    from: m.direction === 'in' ? 'in' : m.author === 'bot' ? 'bot' : 'out',
    who: m.author === 'staff' ? 'Equipo' : 'Tú', text: m.text || (m.media_type ? `[${m.media_type}]` : ''), t: clock(m.created_at),
  });

  async function loadLiveInbox() {
    const rows = await A().parse(await A().fetch('/api/conversations'), 'No se pudieron cargar las conversaciones.');
    const prev = new Map(convos.map((c) => [c.id, c]));
    convos.splice(0, convos.length, ...rows.map((r) => ({
      id: r.id, name: r.name, phone: r.phone ? `+${r.phone}` : '', channel: CHANNELS[r.kind] ? r.kind : 'whatsapp', agent: null,
      bot: r.bot_active, pauseReason: r.bot_active ? '' : r.pause_reason, unread: r.unread, stage: r.stage, status: 'open',
      tags: [r.is_owner ? 'Dueño' : null, r.pending_proofs ? 'Comprobante por revisar' : null].filter(Boolean), last: clock(r.last_message_at),
      proofs: r.pending_proofs,
      msgs: prev.get(r.id)?.loaded ? prev.get(r.id).msgs : [{ from: r.last_author === 'customer' ? 'in' : r.last_author === 'bot' ? 'bot' : 'out', who: 'Tú', text: r.last_text || '', t: clock(r.last_message_at) }],
      loaded: prev.get(r.id)?.loaded || false, live: true,
    })));
    if (!convos.some((c) => c.id === ui.convoId)) ui.convoId = convos[0]?.id ?? null;
  }

  async function loadLiveThread(c) {
    const data = await A().parse(await A().fetch(`/api/conversations/${c.id}/messages`), 'No se pudieron cargar los mensajes.');
    c.msgs = data.messages.map(fromApiMsg);
    c.loaded = true;
    c.canReply = data.can_reply;
    c.unread = 0;
  }

  const PAUSE_NOTE = {
    owner_reply: 'Respondiste desde tu celular: el asistente se hizo a un lado en este chat. Vuelve solo en un rato o actívalo aquí.',
    manual: 'Tu equipo tomó este chat. El asistente volverá cuando lo actives.',
    handoff: 'El asistente pasó este chat a tu equipo. Revisa y responde.',
    budget: 'Se alcanzó el límite mensual de IA: este chat lo atiende tu equipo.',
  };
  function visibleConvos() {
    const q = ui.q.trim().toLowerCase();
    return convos.filter((c) => {
      if (ui.channel !== 'todos' && c.channel !== ui.channel) return false;
      if (ui.tab === 'mios' && c.agent !== 'ana') return false;
      if (ui.tab === 'sin' && (c.agent || c.bot)) return false;
      if (ui.tab === 'bot' && !c.bot) return false;
      if ((ui.tab === 'resueltos') !== (c.status === 'resolved')) return false;
      if (q && !(c.name.toLowerCase().includes(q) || lastPreview(c).toLowerCase().includes(q) || c.phone.includes(q))) return false;
      return true;
    });
  }

  function renderInbox() {
    const root = $('merc-conversaciones');
    if (live.on && !live.loading && !convos.some((c) => c.live)) {
      live.loading = true;
      root.innerHTML = '<div class="card empty-big"><p>Cargando conversaciones…</p></div>';
      loadLiveInbox().then(renderInbox).catch((err) => { root.innerHTML = `<div class="card empty-big"><p>${esc(err.message)}</p></div>`; }).finally(() => { live.loading = false; });
      return;
    }
    if (live.on && !convos.length) {
      root.innerHTML = `<div class="card empty-big">${icon('chat', 'ig-icon--xl')}<h2>Aún no hay conversaciones</h2><p>Conecta tu WhatsApp, Instagram o Facebook en <a href="#/asistente">Asistente IA</a> y aquí verás cada chat, con el asistente respondiendo por ti.</p></div>`;
      return;
    }
    const pending = byId(ui.convoId);
    if (pending?.live && !pending.loaded) {
      loadLiveThread(pending).then(renderInbox).catch((err) => toast(err.message, 'error'));
    }
    const list = visibleConvos();
    if (!list.some((c) => c.id === ui.convoId) && list.length && !ui.mobileThread) ui.convoId = list[0].id;
    const cur = byId(ui.convoId);
    const unreadTotal = convos.reduce((n, c) => n + c.unread, 0);
    const tabs = [['todos', 'Abiertas'], ['mios', 'Mías'], ['sin', 'Sin asignar'], ['bot', 'Con IA'], ['resueltos', 'Resueltas']];

    root.innerHTML = `
      <div class="m-inbox ${ui.mobileThread ? 'is-thread' : ''} ${ui.info ? 'has-info' : ''}">
        <section class="m-list card card-flush" aria-label="Conversaciones">
          <div class="m-list-head">
            <div class="m-search"><span class="sr-only">Buscar</span>${icon('search')}<input id="mSearch" type="search" placeholder="Buscar nombre, teléfono o mensaje" value="${esc(ui.q)}" autocomplete="off" /></div>
            <div class="m-chips" role="group" aria-label="Canal">
              ${['todos', ...Object.keys(CHANNELS)].map((k) => `<button class="m-chip" type="button" data-ch="${k}" aria-pressed="${ui.channel === k}">${k === 'todos' ? 'Todos' : CHANNELS[k].label}</button>`).join('')}
            </div>
            <div class="m-tabs" role="tablist" aria-label="Filtro">
              ${tabs.map(([k, l]) => `<button class="m-tab" role="tab" type="button" data-tab="${k}" aria-selected="${ui.tab === k}">${l}${k === 'todos' && unreadTotal ? `<em>${unreadTotal}</em>` : ''}</button>`).join('')}
            </div>
          </div>
          <ul class="m-items">
            ${list.length ? list.map((c) => `
              <li><button class="m-item" type="button" data-id="${c.id}" ${c.id === ui.convoId ? 'aria-current="true"' : ''}>
                ${avatar(c)}
                <span class="m-item-main">
                  <span class="m-item-top"><strong>${esc(c.name)}</strong><time>${c.last}</time></span>
                  <span class="m-item-msg">${esc(lastPreview(c))}</span>
                  <span class="m-item-meta">${chBadge(c.channel)}<span class="m-who">${c.bot ? icon('bot') : ''}${esc(agentLabel(c))}</span></span>
                </span>
                ${c.unread ? `<span class="m-unread" aria-label="${c.unread} sin leer">${c.unread}</span>` : ''}
              </button></li>`).join('') : `<li class="empty">No hay conversaciones con ese filtro.</li>`}
          </ul>
        </section>

        ${cur ? threadHtml(cur) : `<section class="m-thread card"><div class="empty-big">${icon('chat', 'ig-icon--xl')}<h2>Elige una conversación</h2><p>Aquí verás los mensajes de WhatsApp, Instagram y Messenger en un solo lugar.</p></div></section>`}
        ${cur ? infoHtml(cur) : ''}
      </div>`;
    wireInbox(root);
    const body = root.querySelector('.m-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function threadHtml(c) {
    return `
      <section class="m-thread card card-flush" aria-label="Chat con ${esc(c.name)}">
        <header class="m-thread-head">
          <button class="icon-btn m-back" type="button" id="mBack" aria-label="Volver a la lista">${icon('back')}</button>
          ${avatar(c, 'm-avatar--lg')}
          <div class="m-thread-who"><h2>${esc(c.name)}</h2><p>${chBadge(c.channel)}<span>${esc(c.phone)}</span></p></div>
          <div class="m-thread-actions">
            <label class="m-ai" title="Si está activo, el asistente responde por ti">
              <span>Asistente IA</span>
              <span class="ig-switch"><input type="checkbox" id="mAiToggle" ${c.bot ? 'checked' : ''} aria-label="Responder con el asistente IA" /><span class="ig-switch__track"></span></span>
            </label>
            <button class="btn btn-sm ${c.status === 'resolved' ? '' : 'btn-primary'}" type="button" id="mResolve">${icon('check')}<span>${c.status === 'resolved' ? 'Reabrir' : 'Resolver'}</span></button>
            <button class="icon-btn m-info-btn" type="button" id="mInfoBtn" aria-label="Ver datos del contacto" aria-pressed="${ui.info}">${icon('info')}</button>
          </div>
        </header>
        ${!c.bot && c.pauseReason ? `<p class="m-paused">${icon('info')}<span>${PAUSE_NOTE[c.pauseReason] || PAUSE_NOTE.manual}</span></p>` : ''}
        ${c.canReply === false ? `<p class="m-paused m-paused--warn">${icon('clock')}<span>Pasaron más de 24 h desde su último mensaje: Meta solo permite escribirle con una plantilla aprobada. Puedes escribirle desde tu celular.</span></p>` : ''}
        <div class="m-body" tabindex="0" aria-live="polite">
          <p class="m-day"><span>Hoy</span></p>
          ${c.msgs.map(msgHtml).join('')}
        </div>
        <form class="m-composer" id="mComposer" autocomplete="off">
          <div class="ig-menu-wrap">
            <button class="icon-btn" type="button" id="mTplBtn" aria-haspopup="menu" aria-expanded="false" aria-label="Respuestas rápidas" title="Respuestas rápidas">${icon('file')}</button>
            <div class="m-tpl-menu" id="mTplMenu" role="menu" hidden>
              ${templates.map((t) => `<button type="button" role="menuitem" data-tpl="${esc(t)}">${esc(t)}</button>`).join('')}
            </div>
          </div>
          <input id="mInput" type="text" placeholder="${c.bot ? 'El asistente está respondiendo. Escribe para tomar el chat' : 'Escribe un mensaje'}" aria-label="Mensaje" />
          <button class="btn btn-primary" type="submit">${icon('arrow-ur')}<span>Enviar</span></button>
        </form>
      </section>`;
  }

  function msgHtml(m) {
    if (m.from === 'in') return `<div class="m-msg m-msg--in"><p>${esc(m.text)}</p><time>${m.t}</time></div>`;
    if (m.from === 'bot') return `<div class="m-msg m-msg--bot"><span class="m-msg-who">${icon('bot')}Asistente IA</span><p>${esc(m.text)}</p><time>${m.t}</time></div>`;
    return `<div class="m-msg m-msg--out"><span class="m-msg-who">${esc(m.who || AGENTS[m.agent || 'ana'].short)}</span><p>${esc(m.text)}</p><time>${m.t}</time></div>`;
  }

  function infoHtml(c) {
    const d = deals.find((x) => x.convo === c.id);
    const st = stageOf(c.stage);
    return `
      <aside class="m-info card" aria-label="Datos del contacto">
        <div class="m-info-top">${avatar(c, 'm-avatar--xl')}<h3>${esc(c.name)}</h3><p>${esc(c.phone)}</p></div>
        <dl class="m-facts">
          <div><dt>Canal</dt><dd>${chBadge(c.channel)}</dd></div>
          <div><dt>Atiende</dt><dd>
            <select id="mAssign" aria-label="Asignar a">
              <option value="" ${!c.agent && !c.bot ? 'selected' : ''}>Sin asignar</option>
              ${Object.entries(AGENTS).map(([k, a]) => `<option value="${k}" ${c.agent === k && !c.bot ? 'selected' : ''}>${a.name}</option>`).join('')}
            </select></dd></div>
          <div><dt>Etapa</dt><dd><span class="ig-chip ig-chip--${st.tone}">${st.label}</span></dd></div>
          ${d ? `<div><dt>Oportunidad</dt><dd>${esc(d.title)}<br /><strong>${usd(d.value)}</strong></dd></div>` : ''}
        </dl>
        <div class="m-info-block"><h4>Etiquetas</h4><div class="m-tags">${c.tags.map((t) => `<span class="ig-chip">${esc(t)}</span>`).join('')}<button class="m-addtag" type="button" id="mAddTag" aria-label="Agregar etiqueta">${icon('plus')}</button></div></div>
        <div class="m-info-block"><h4>Nota interna</h4><textarea id="mNote" rows="3" placeholder="Solo la ve tu equipo"></textarea></div>
        <div class="m-info-block"><a class="btn btn-sm btn-block" href="#/clientes">${icon('users')}<span>Ver ficha del cliente</span></a></div>
      </aside>`;
  }

  function wireInbox(root) {
    const rerender = () => renderInbox();
    root.querySelector('#mSearch')?.addEventListener('input', (e) => {
      ui.q = e.target.value; const pos = e.target.selectionStart; renderInbox();
      const el = $('mSearch'); el.focus(); el.setSelectionRange(pos, pos);
    });
    root.querySelectorAll('.m-chip').forEach((b) => b.addEventListener('click', () => { ui.channel = b.dataset.ch; rerender(); }));
    root.querySelectorAll('.m-tab').forEach((b) => b.addEventListener('click', () => { ui.tab = b.dataset.tab; rerender(); }));
    root.querySelectorAll('.m-item').forEach((b) => b.addEventListener('click', () => {
      ui.convoId = Number(b.dataset.id); ui.mobileThread = true; byId(ui.convoId).unread = 0;
      if (byId(ui.convoId).live) byId(ui.convoId).loaded = false;
      rerender();
    }));
    const cur = byId(ui.convoId);
    if (!cur) return;
    $('mBack')?.addEventListener('click', () => { ui.mobileThread = false; rerender(); });
    $('mInfoBtn')?.addEventListener('click', () => { ui.info = !ui.info; rerender(); });
    $('mAiToggle')?.addEventListener('change', async (e) => {
      if (cur.live) {
        try { await A().parse(await A().fetch(`/api/conversations/${cur.id}/bot`, A().json('POST', { active: e.target.checked })), 'No se pudo cambiar el asistente.'); }
        catch (err) { toast(err.message, 'error'); e.target.checked = !e.target.checked; return; }
        cur.pauseReason = e.target.checked ? '' : 'manual';
      }
      cur.bot = e.target.checked;
      if (cur.bot) cur.agent = null;
      toast(cur.bot ? 'El asistente IA responderá este chat' : 'Tomaste el chat, el asistente se pausó');
      rerender();
    });
    $('mResolve')?.addEventListener('click', () => {
      cur.status = cur.status === 'resolved' ? 'open' : 'resolved';
      toast(cur.status === 'resolved' ? 'Conversación resuelta' : 'Conversación reabierta');
      rerender();
    });
    $('mAssign')?.addEventListener('change', (e) => {
      cur.agent = e.target.value || null; cur.bot = false;
      toast(cur.agent ? `Asignada a ${AGENTS[cur.agent].name}` : 'Conversación sin asignar');
      rerender();
    });
    $('mAddTag')?.addEventListener('click', () => {
      const t = (window.prompt('Nueva etiqueta') || '').trim();
      if (t) { cur.tags.push(t.slice(0, 24)); rerender(); }
    });
    const menu = $('mTplMenu'); const menuBtn = $('mTplBtn');
    menuBtn?.addEventListener('click', () => {
      const open = menu.hidden; menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    });
    menu?.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => {
      $('mInput').value = templateText[b.dataset.tpl]; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); $('mInput').focus();
    }));
    $('mComposer')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = $('mInput').value.trim();
      if (!text) return;
      if (cur.live) {
        try {
          await A().parse(await A().fetch(`/api/conversations/${cur.id}/reply`, A().json('POST', { text })), 'No se pudo enviar el mensaje.');
          cur.bot = false; cur.pauseReason = 'manual'; cur.loaded = false;
          renderInbox();
          $('mInput')?.focus();
        } catch (err) { toast(err.message, 'error'); }
        return;
      }
      const now = new Date();
      cur.msgs.push({ from: 'out', agent: 'ana', text, t: hm(now.getHours(), now.getMinutes()) });
      cur.last = hm(now.getHours(), now.getMinutes());
      if (cur.bot) { cur.bot = false; cur.agent = 'ana'; }
      cur.status = 'open';
      renderInbox();
      $('mInput').focus();
    });
  }

  /* ======================= EMBUDO ======================= */
  function renderPipeline() {
    const root = $('merc-embudo');
    const open = deals.filter((d) => d.stage !== 'ganado');
    const total = open.reduce((n, d) => n + d.value, 0);
    const won = deals.filter((d) => d.stage === 'ganado').reduce((n, d) => n + d.value, 0);
    root.innerHTML = `
      <div class="m-kpis">
        <div class="card m-kpi"><span class="m-kpi-l">En el embudo</span><strong>${usd(total)}</strong><small>${open.length} oportunidades abiertas</small></div>
        <div class="card m-kpi m-kpi--hl"><span class="m-kpi-l">Ganado este mes</span><strong>${usd(won)}</strong><small>${deals.filter((d) => d.stage === 'ganado').length} ${deals.filter((d) => d.stage === 'ganado').length === 1 ? 'venta cerrada' : 'ventas cerradas'}</small></div>
        <div class="card m-kpi"><span class="m-kpi-l">Tasa de cierre</span><strong>${Math.round((deals.filter((d) => d.stage === 'ganado').length / deals.length) * 100)} %</strong><small>Sobre todas las oportunidades</small></div>
      </div>
      <div class="m-board" role="list">
        ${stages.map((s, si) => {
          const list = deals.filter((d) => d.stage === s.key);
          return `<section class="m-col" role="listitem" data-stage="${s.key}" aria-label="${s.label}">
            <header><span class="ig-chip ig-chip--${s.tone} ig-chip--dot">${s.label}</span><span class="m-col-sum">${usd(list.reduce((n, d) => n + d.value, 0))}</span></header>
            <ul>
              ${list.map((d) => { const c = byId(d.convo); return `
                <li class="m-deal" draggable="true" data-deal="${d.id}">
                  <strong>${esc(d.title)}</strong>
                  <span class="m-deal-who">${avatar(c)}<span>${esc(c.name)}</span></span>
                  <span class="m-deal-foot"><b>${usd(d.value)}</b>${chBadge(c.channel)}</span>
                  <span class="m-deal-move">
                    <button class="icon-btn" type="button" data-move="-1" data-deal="${d.id}" aria-label="Mover a la etapa anterior" ${si === 0 ? 'disabled' : ''}>${icon('chevron-left')}</button>
                    <button class="icon-btn" type="button" data-move="1" data-deal="${d.id}" aria-label="Mover a la siguiente etapa" ${si === stages.length - 1 ? 'disabled' : ''}>${icon('chevron-right')}</button>
                  </span>
                </li>`; }).join('') || '<li class="m-col-empty">Arrastra una oportunidad aquí</li>'}
            </ul>
          </section>`;
        }).join('')}
      </div>`;
    root.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => {
      const d = deals.find((x) => x.id === Number(b.dataset.deal));
      const i = stages.findIndex((s) => s.key === d.stage) + Number(b.dataset.move);
      if (i < 0 || i >= stages.length) return;
      d.stage = stages[i].key; byId(d.convo).stage = d.stage;
      if (d.stage === 'ganado') toast('¡Venta ganada! 🎉');
      renderPipeline();
    }));
    let drag = null;
    root.querySelectorAll('.m-deal').forEach((el) => {
      el.addEventListener('dragstart', (e) => { drag = Number(el.dataset.deal); el.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(drag)); });
      el.addEventListener('dragend', () => el.classList.remove('is-drag'));
    });
    root.querySelectorAll('.m-col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('is-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('is-over'));
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        const d = deals.find((x) => x.id === drag);
        if (d) { d.stage = col.dataset.stage; byId(d.convo).stage = d.stage; renderPipeline(); }
      });
    });
  }

  /* ======================= CHATBOTS ======================= */
  function renderBots() {
    const root = $('merc-chatbots');
    const cur = bots.find((b) => b.id === ui.botId) || bots[0];
    root.innerHTML = `
      <div class="m-bots">
        <ul class="m-bot-list" aria-label="Automatizaciones">
          ${bots.map((b) => `
            <li class="card m-bot ${b.id === cur.id ? 'is-current' : ''}">
              <button type="button" class="m-bot-pick" data-bot="${b.id}" aria-current="${b.id === cur.id}">
                <strong>${esc(b.name)}</strong>
                <small>${esc(b.trigger)}</small>
                <span class="m-bot-stats">${b.on ? `${b.runs.toLocaleString('es-EC')} ejecuciones · ${b.done} % completadas` : 'Pausada'}</span>
              </button>
              <label class="ig-switch" title="${b.on ? 'Activa' : 'Pausada'}"><input type="checkbox" data-toggle="${b.id}" ${b.on ? 'checked' : ''} aria-label="Activar ${esc(b.name)}" /><span class="ig-switch__track"></span></label>
            </li>`).join('')}
          <li><button class="btn btn-block" type="button" id="mNewBot">${icon('plus')}<span>Nueva automatización</span></button></li>
        </ul>
        <section class="card m-flow" aria-label="Flujo de ${esc(cur.name)}">
          <div class="card-head"><div><p class="eyebrow">Flujo</p><h2>${esc(cur.name)}</h2></div><span class="ig-chip ig-chip--${cur.on ? 'success' : 'warning'} ig-chip--dot">${cur.on ? 'Activa' : 'Pausada'}</span></div>
          <ol class="m-steps">
            ${cur.steps.map((s, i) => `
              <li class="m-step m-step--${s.type === 'IA' ? 'ai' : 'std'}">
                <span class="m-step-ico">${icon(s.icon)}</span>
                <div><span class="eyebrow">${i + 1} · ${s.type}</span><p>${esc(s.text)}</p></div>
              </li>`).join('')}
          </ol>
          <div class="m-flow-foot">
            <button class="btn" type="button" id="mAddStep">${icon('plus')}<span>Agregar paso</span></button>
            <button class="btn btn-primary" type="button" id="mTestBot">${icon('chat')}<span>Probar en WhatsApp</span></button>
          </div>
        </section>
      </div>`;
    root.querySelectorAll('[data-bot]').forEach((b) => b.addEventListener('click', () => { ui.botId = Number(b.dataset.bot); renderBots(); }));
    root.querySelectorAll('[data-toggle]').forEach((i) => i.addEventListener('change', () => {
      const b = bots.find((x) => x.id === Number(i.dataset.toggle)); b.on = i.checked;
      toast(b.on ? `«${b.name}» activada` : `«${b.name}» pausada`); renderBots();
    }));
    $('mNewBot').addEventListener('click', () => {
      const name = (window.prompt('¿Cómo se llama la automatización?') || '').trim();
      if (!name) return;
      const b = { id: bots.length + 1, name: name.slice(0, 50), trigger: 'Define cuándo se activa', on: false, runs: 0, done: 0, steps: [{ type: 'Disparador', text: 'Elige qué inicia este flujo', icon: 'bell' }] };
      bots.push(b); ui.botId = b.id; renderBots();
    });
    $('mAddStep').addEventListener('click', () => {
      const text = (window.prompt('¿Qué debe hacer este paso?') || '').trim();
      if (text) { cur.steps.push({ type: 'Mensaje', text: text.slice(0, 160), icon: 'chat' }); renderBots(); }
    });
    $('mTestBot').addEventListener('click', () => toast('Te enviamos un mensaje de prueba (demostración)'));
  }

  /* ======================= CAMPAÑAS ======================= */
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function renderCampaigns() {
    const root = $('merc-campanas');
    const sent = campaigns.reduce((n, c) => n + c.sent, 0);
    const del = campaigns.reduce((n, c) => n + c.delivered, 0);
    const read = campaigns.reduce((n, c) => n + c.read, 0);
    const rep = campaigns.reduce((n, c) => n + c.replied, 0);
    root.innerHTML = `
      <div class="m-kpis m-kpis--4">
        <div class="card m-kpi"><span class="m-kpi-l">Mensajes enviados</span><strong>${sent.toLocaleString('es-EC')}</strong><small>En los últimos 30 días</small></div>
        <div class="card m-kpi"><span class="m-kpi-l">Entregados</span><strong>${pct(del, sent)} %</strong><small>${del.toLocaleString('es-EC')} mensajes</small></div>
        <div class="card m-kpi"><span class="m-kpi-l">Leídos</span><strong>${pct(read, del)} %</strong><small>De los entregados</small></div>
        <div class="card m-kpi m-kpi--hl"><span class="m-kpi-l">Respondieron</span><strong>${pct(rep, read)} %</strong><small>${rep} conversaciones nuevas</small></div>
      </div>
      <ul class="m-camps">
        ${campaigns.map((c) => `
          <li class="card m-camp">
            <div class="m-camp-main">
              <div class="m-camp-top"><strong>${esc(c.name)}</strong><span class="ig-chip ig-chip--${c.status === 'sent' ? 'success' : 'info'} ig-chip--dot">${c.status === 'sent' ? 'Enviada' : 'Programada'}</span></div>
              <p>${chBadge(c.channel)}<span>Plantilla <code>${esc(c.tpl)}</code></span><span>${esc(c.audience)}</span><time>${esc(c.date)}</time></p>
            </div>
            ${c.status === 'sent' ? `
              <div class="m-funnel" role="img" aria-label="Enviados ${c.sent}, entregados ${c.delivered}, leídos ${c.read}, respuestas ${c.replied}">
                ${[['Enviados', c.sent, 100], ['Entregados', c.delivered, pct(c.delivered, c.sent)], ['Leídos', c.read, pct(c.read, c.sent)], ['Respuestas', c.replied, pct(c.replied, c.sent)]]
                  .map(([l, v, w]) => `<div><span>${l}</span><i style="--w:${Math.max(w, 4)}%"></i><b>${v.toLocaleString('es-EC')}</b></div>`).join('')}
              </div>` : `<div class="m-camp-sched">${icon('clock')}<span>Se envía automáticamente a los contactos elegidos.</span></div>`}
          </li>`).join('')}
      </ul>`;
  }

  function openCampaignDialog() {
    const dlg = $('mCampaignDialog');
    if (!dlg) return;
    dlg.querySelector('form').reset();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('input')?.focus();
  }

  /* ======================= CATÁLOGO ======================= */
  /* ---------------- Montaje ---------------- */
  const renderers = { conversaciones: renderInbox, embudo: renderPipeline, chatbots: renderBots, campanas: renderCampaigns };

  function render(view) {
    if (!renderers[view]) return;
    if (view === 'conversaciones' && live.on) convos.splice(0, convos.length); // recarga al entrar
    if (view === 'conversaciones' && !ui.mobileThread) ui.mobileThread = false;
    renderers[view]();
    if (!mounted.dialog) {
      mounted.dialog = true;
      const dlg = $('mCampaignDialog');
      if (dlg) {
        dlg.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          campaigns.unshift({ id: campaigns.length + 1, name: String(f.get('name')).slice(0, 80), tpl: String(f.get('tpl')), channel: 'whatsapp', audience: String(f.get('audience')), sent: 0, delivered: 0, read: 0, replied: 0, status: 'scheduled', date: f.get('when') === 'now' ? 'Ahora' : 'Mañana 10:00' });
          dlg.close(); toast('Campaña programada (demostración)');
          if (window.location.hash === '#/campanas') renderCampaigns();
        });
      }
      document.querySelectorAll('[data-merc-new-campaign]').forEach((b) => b.addEventListener('click', openCampaignDialog));
    }
  }

  window.IguanaMsg = { render };
})();
