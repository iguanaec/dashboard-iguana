/* =========================================================
   Giro · Iguana
   Lo que cambia según el tipo de negocio:
   - Secciones visibles (el servidor manda `business.modules`; el giro queda fijo tras el onboarding)
   - Onboarding en pasos (giro → catálogo → horario → canales)
   - Vistas propias: Catálogo, Pedidos, Propiedades, Prospectos, Lista de espera, Reactivar
   - Asistente: canales con un botón (WhatsApp coexistencia, Instagram, Messenger), probador y medidor de retorno
   - Campos del cliente propios del giro (mascota, zona, vehículo…)
   Usa window.IguanaApi (lo expone app.js).
   ========================================================= */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const api = () => window.IguanaApi;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = '') => `<svg class="ig-icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const usd = (n) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(n || 0));
  const dateShort = (iso) => (iso ? new Date(iso).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

  async function get(path, fallback = 'No se pudo cargar la información.') {
    return api().parse(await api().fetch(path), fallback);
  }
  async function send(method, path, body, fallback = 'No se pudo guardar.') {
    return api().parse(await api().fetch(path, api().json(method, body ?? {})), fallback);
  }

  /** Vista del panel → sección (módulo) que debe tener el giro. `demo` = solo en modo diseño. */
  const VIEW_MODULE = {
    inicio: 'inicio', conversaciones: 'mensajeria', calendario: 'calendario', clientes: 'clientes', dinero: 'dinero',
    catalogo: 'catalogo', pedidos: 'pedidos', propiedades: 'propiedades', prospectos: 'leads', espera: 'lista_espera',
    reactivar: 'reactivar', asistente: 'asistente', ajustes: 'ajustes', facturar: 'dinero',
    embudo: 'demo', chatbots: 'demo', campanas: 'demo',
  };

  const NICHE_ICON = { scissors: 'sparkle', sparkle: 'star', leaf: 'star', paw: 'paw', heart: 'plus', bolt: 'trend', book: 'file', home: 'house', bag: 'box', food: 'receipt', wrench: 'cog', briefcase: 'building', camera: 'eye', bed: 'house' };
  const nicheIcon = (n) => (NICHE_ICON[n] === 'sparkle' ? 'star' : NICHE_ICON[n]) || 'star';

  const state = { session: null, business: null, demo: false, niches: null, proofs: [] };

  /* ======================= Sesión y navegación ======================= */

  function apply(session) {
    state.session = session;
    state.business = session.business || null;
    state.demo = Boolean(window.demoFetch);
    const modules = new Set(state.business?.modules || []);
    if (state.demo) modules.add('demo');
    document.querySelectorAll('[data-module]').forEach((el) => {
      el.hidden = !state.business || !modules.has(el.dataset.module);
    });
    document.body.dataset.mode = state.business?.mode || '';
    document.body.dataset.niche = state.business?.niche || '';
    const v = state.business?.vocabulary;
    if (v) document.querySelectorAll('[data-vocab]').forEach((el) => { el.textContent = v[el.dataset.vocab] ?? el.textContent; });
    renderCustomerFields();
    if (state.business?.onboarding) startOnboarding().catch(api().fail);
  }

  function allowed(view) {
    if (!state.business) return true;
    const module = VIEW_MODULE[view];
    if (!module) return true;
    if (module === 'demo') return state.demo;
    return state.business.modules.includes(module);
  }

  /** Primera vista permitida (por si Inicio no aplica a algún giro). */
  const firstAllowed = () => ['inicio', 'conversaciones', 'calendario', 'pedidos', 'clientes'].find(allowed) || 'inicio';

  /* ======================= Campos del cliente según el giro ======================= */

  function renderCustomerFields() {
    const box = $('customerExtra');
    if (!box) return;
    const fields = state.business?.customerFields || [];
    box.hidden = !fields.length;
    box.innerHTML = fields.length ? `<p class="field-label giro-extra-title">${icon('paw')} Datos de ${esc(state.business.nicheLabel.split(' / ')[0].toLowerCase())}</p>
      <div class="grid-2">${fields.map((f) => `
        <label class="field"><span class="field-label">${esc(f.label)}${f.required ? ' <em class="req" title="El asistente lo pide antes de agendar">•</em>' : ''}</span>
          ${f.options
            ? `<select class="ig-select" data-extra="${esc(f.key)}"><option value="">—</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`
            : `<input data-extra="${esc(f.key)}" maxlength="200" />`}
        </label>`).join('')}</div>` : '';
  }

  function fillCustomerExtra(customer) {
    document.querySelectorAll('#customerExtra [data-extra]').forEach((el) => { el.value = customer?.extra?.[el.dataset.extra] ?? ''; });
  }
  function readCustomerExtra() {
    const extra = {};
    document.querySelectorAll('#customerExtra [data-extra]').forEach((el) => { if (el.value) extra[el.dataset.extra] = el.value; });
    return extra;
  }
  function customerExtraFacts(customer) {
    const fields = state.business?.customerFields || [];
    return fields.filter((f) => customer.extra?.[f.key]).map((f) => [f.label, customer.extra[f.key]]);
  }

  /* ======================= Onboarding ======================= */

  const ob = { step: 0, niche: null, services: [], products: [] };
  const STEPS = ['Tu negocio', 'Lo que ofreces', 'Horario', 'Canales'];

  async function startOnboarding() {
    if (!state.niches) state.niches = await get('/api/niches');
    ob.step = 0;
    // El dueño elige conscientemente: nada preseleccionado mientras el giro no esté bloqueado.
    ob.niche = null;
    renderOnboarding();
    const dlg = $('onboardingDialog');
    if (!dlg.open) dlg.showModal();
  }

  function renderOnboarding() {
    const root = $('onboardingBody');
    const progress = STEPS.map((label, i) => `<li class="${i < ob.step ? 'is-done' : i === ob.step ? 'is-current' : ''}" ${i === ob.step ? 'aria-current="step"' : ''}><span>${i < ob.step ? icon('check', 'ig-icon--sm') : i + 1}</span>${label}</li>`).join('');
    $('onboardingSteps').innerHTML = progress;
    $('onboardingBack').hidden = ob.step === 0;
    $('onboardingNext').querySelector('span').textContent = ob.step === STEPS.length - 1 ? 'Terminar' : 'Continuar';
    $('onboardingError').textContent = '';
    if (ob.step === 0) root.innerHTML = nicheStep();
    if (ob.step === 1) catalogStep().then((html) => { root.innerHTML = html; }).catch(api().fail);
    if (ob.step === 2) root.innerHTML = hoursStep();
    if (ob.step === 3) { root.innerHTML = channelsStep(); wireChannelButtons(root, () => renderOnboarding()); }
    if (ob.step === 0) {
      root.querySelectorAll('[data-niche]').forEach((b) => b.addEventListener('click', () => {
        ob.niche = b.dataset.niche;
        root.querySelectorAll('[data-niche]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }));
      root.querySelector('#obNicheSearch')?.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        root.querySelectorAll('[data-niche]').forEach((b) => { b.parentElement.hidden = q && !b.dataset.search.includes(q); });
      });
    }
  }

  function nicheStep() {
    const groups = {};
    for (const n of state.niches) (groups[n.modeLabel] ||= []).push(n);
    return `
      <div class="ob-intro">
        <h3>¿Qué tipo de negocio tienes?</h3>
        <p>Con esto armamos tu panel y entrenamos a tu asistente. <strong>Queda fijo al terminar</strong>; si luego necesitas cambiarlo, te ayuda soporte de Iguana.</p>
        <div class="ig-search ob-search">${icon('search')}<input class="ig-input" id="obNicheSearch" type="search" placeholder="Buscar: peluquería, inmobiliaria, tienda…" aria-label="Buscar tipo de negocio" /></div>
      </div>
      ${Object.entries(groups).map(([mode, list]) => `
        <section class="ob-group" aria-label="${esc(mode)}">
          <h4>${esc(mode)}</h4>
          <ul class="ob-niches">${list.map((n) => `
            <li><button type="button" class="ob-niche" data-niche="${n.id}" data-search="${esc(`${n.label} ${n.description}`.toLowerCase())}" aria-pressed="${ob.niche === n.id}">
              <span class="ob-niche-icon">${icon(nicheIcon(n.icon), 'ig-icon--lg')}</span>
              <strong>${esc(n.label)}</strong><small>${esc(n.description)}</small>
              <span class="ob-check">${icon('check', 'ig-icon--sm')}</span>
            </button></li>`).join('')}</ul>
        </section>`).join('')}`;
  }

  async function catalogStep() {
    const business = (await get('/api/auth/me')).business;
    state.business = business;
    const sells = business.modules.includes('catalogo');
    if (sells) {
      ob.products = await get('/api/products');
      return `<div class="ob-intro"><h3>Tus productos</h3><p>Dejamos ejemplos de ${esc(business.nicheLabel.toLowerCase())}. Ajusta precios ahora o completa tu catálogo después en <strong>Catálogo</strong>.</p></div>
        <ul class="ob-items">${ob.products.map((p) => `<li><span>${esc(p.name)}</span><label class="ob-price">$<input type="number" min="0" step="0.01" value="${p.price ?? ''}" data-product="${p.id}" aria-label="Precio de ${esc(p.name)}" /></label></li>`).join('')}</ul>`;
    }
    ob.services = await get('/api/services');
    return `<div class="ob-intro"><h3>Tus servicios</h3><p>Estos son los más comunes en ${esc(business.nicheLabel.toLowerCase())}. Ajusta precio y duración; el asistente solo ofrecerá lo que está aquí.</p></div>
      <ul class="ob-items">${ob.services.map((s) => `<li>
        <label class="ob-toggle"><input type="checkbox" data-svc-on="${s.id}" ${s.enabled ? 'checked' : ''} /><span>${esc(s.name)}</span></label>
        <label class="ob-dur"><input type="number" min="5" step="5" value="${s.duration_minutes}" data-svc-dur="${s.id}" aria-label="Minutos de ${esc(s.name)}" /> min</label>
        <label class="ob-price">$<input type="number" min="0" step="0.01" value="${s.price ?? ''}" data-svc-price="${s.id}" aria-label="Precio de ${esc(s.name)}" /></label>
      </li>`).join('')}</ul>`;
  }

  function hoursStep() {
    const s = api().state.settings;
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `<div class="ob-intro"><h3>¿Cuándo atiendes?</h3><p>El asistente solo agenda dentro de este horario. Lo puedes afinar luego en Ajustes.</p></div>
      <ul class="ob-hours">${s.businessHours.map((h) => `<li>
        <label class="ob-toggle"><input type="checkbox" data-day="${h.day}" ${h.enabled ? 'checked' : ''} /><span>${DAYS[h.day]}</span></label>
        <input type="time" value="${h.start}" data-start="${h.day}" aria-label="Apertura ${DAYS[h.day]}" />
        <span aria-hidden="true">–</span>
        <input type="time" value="${h.end}" data-end="${h.day}" aria-label="Cierre ${DAYS[h.day]}" />
      </li>`).join('')}</ul>`;
  }

  function channelsStep() {
    return `<div class="ob-intro"><h3>Conecta tus chats</h3><p>Tu asistente responderá en WhatsApp, Instagram y Facebook. Sigues usando tu WhatsApp Business en el celular: si respondes tú, el asistente se hace a un lado.</p></div>
      <div id="obChannels">${channelsHtml()}</div>
      <p class="note">¿No tienes a la mano tu celular? Puedes conectarlo después en <strong>Asistente IA</strong>.</p>`;
  }

  async function saveStep() {
    const root = $('onboardingBody');
    if (ob.step === 0) {
      if (!ob.niche) throw new Error('Elige el tipo de negocio para continuar.');
      if (ob.niche !== state.business.niche) await send('PUT', '/api/onboarding/niche', { niche: ob.niche });
    }
    if (ob.step === 1) {
      for (const input of root.querySelectorAll('[data-product]')) {
        const p = ob.products.find((x) => x.id === Number(input.dataset.product));
        if (p && String(p.price) !== input.value) await send('PUT', `/api/products/${p.id}`, { ...p, price: input.value });
      }
      for (const s of ob.services) {
        const on = root.querySelector(`[data-svc-on="${s.id}"]`).checked;
        const dur = Number(root.querySelector(`[data-svc-dur="${s.id}"]`).value) || s.duration_minutes;
        const price = root.querySelector(`[data-svc-price="${s.id}"]`).value;
        if (on !== s.enabled || dur !== s.duration_minutes || String(s.price ?? '') !== price) {
          await send('PUT', `/api/services/${s.id}`, { ...s, enabled: on, duration_minutes: dur, price });
        }
      }
    }
    if (ob.step === 2) {
      const settings = { ...api().state.settings };
      settings.businessHours = settings.businessHours.map((h) => ({
        day: h.day, enabled: root.querySelector(`[data-day="${h.day}"]`).checked,
        start: root.querySelector(`[data-start="${h.day}"]`).value, end: root.querySelector(`[data-end="${h.day}"]`).value,
      }));
      api().state.settings = await send('PUT', '/api/settings', settings);
    }
    if (ob.step === 3) {
      const ok = await api().confirmAction({
        title: '¿Terminamos?',
        text: `Tu negocio quedará como «${state.niches.find((n) => n.id === ob.niche)?.label}». Ese tipo ya no se podrá cambiar desde tu cuenta.`,
        confirmLabel: 'Terminar configuración',
      });
      if (!ok) return false;
      await send('POST', '/api/onboarding/complete');
      return 'done';
    }
    return true;
  }

  function wireOnboarding() {
    const dlg = $('onboardingDialog');
    if (!dlg) return;
    dlg.addEventListener('cancel', (e) => e.preventDefault()); // no se cierra sin terminar
    $('onboardingBack').addEventListener('click', () => { ob.step = Math.max(0, ob.step - 1); renderOnboarding(); });
    $('onboardingNext').addEventListener('click', async () => {
      const btn = $('onboardingNext');
      btn.disabled = true;
      try {
        const r = await saveStep();
        if (r === 'done') { dlg.close(); api().toast('¡Listo! Tu panel está configurado.', 'success'); window.location.reload(); return; }
        if (r) { ob.step += 1; renderOnboarding(); $('onboardingBody').scrollTop = 0; }
      } catch (err) {
        $('onboardingError').textContent = err.message;
      } finally { btn.disabled = false; }
    });
  }

  /* ======================= Canales (un botón) ======================= */

  let channelsCache = null;

  function channelsHtml() {
    const list = channelsCache?.channels || [];
    const has = (k) => list.find((c) => c.kind === k && c.status === 'active');
    const wa = has('whatsapp');
    const ig = has('instagram');
    const fb = has('messenger');
    const row = (key, label, ch, button) => `
      <div class="ch-row ${ch ? 'is-on' : ''}">
        <span class="ch-logo ch-logo--${key}">${icon(key === 'whatsapp' ? 'whatsapp' : key === 'instagram' ? 'star' : 'chat')}</span>
        <div class="ch-text"><strong>${label}</strong><small>${ch ? `Conectado · ${esc(ch.display_name)}${ch.coexistence ? ' · también en tu celular' : ''}` : 'Sin conectar'}</small></div>
        ${ch ? `<span class="ig-chip ig-chip--success">${icon('check', 'ig-icon--sm')}Activo</span>` : button}
      </div>`;
    return `<div class="ch-list">
      ${row('whatsapp', 'WhatsApp', wa, `<button class="btn btn-primary btn-sm" type="button" data-connect="whatsapp">${icon('link')}<span>Conectar mi WhatsApp</span></button>`)}
      ${row('instagram', 'Instagram', ig, `<button class="btn btn-sm" type="button" data-connect="pages">${icon('link')}<span>Conectar Instagram y Facebook</span></button>`)}
      ${row('messenger', 'Facebook Messenger', fb, fb || ig ? '' : `<span class="ch-hint">Se conecta junto con Instagram</span>`)}
    </div>`;
  }

  async function loadChannels() {
    channelsCache = await get('/api/channels');
    return channelsCache;
  }

  function loadFacebookSdk(appId, version) {
    if (window.FB) return Promise.resolve(window.FB);
    return new Promise((resolve, reject) => {
      window.fbAsyncInit = () => { window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version }); resolve(window.FB); };
      const s = document.createElement('script');
      s.src = 'https://connect.facebook.net/es_LA/sdk.js';
      s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
      s.onerror = () => reject(new Error('No se pudo abrir la ventana de Meta. Revisa tu conexión o bloqueadores.'));
      document.head.append(s);
    });
  }

  const fbLogin = (FB, options, cancelled) => new Promise((resolve, reject) => {
    FB.login((res) => (res.authResponse?.code ? resolve(res.authResponse.code) : reject(new Error(cancelled))), options);
  });

  /** WhatsApp con coexistencia: ventana de Meta → QR con la app WhatsApp Business → listo. */
  async function connectWhatsApp() {
    if (state.demo) return send('POST', '/api/channels/whatsapp/embedded-signup', { code: 'demo', waba_id: 'demo', phone_number_id: 'demo' });
    const meta = (channelsCache || await loadChannels()).meta;
    if (!meta.appId || !meta.waConfigId) throw new Error('La conexión con Meta aún no está configurada. Escríbele a soporte de Iguana.');
    const FB = await loadFacebookSdk(meta.appId, meta.graphVersion);
    let session = null;
    const onMessage = (event) => {
      if (!/facebook\.com$/.test(new URL(event.origin).hostname)) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'WA_EMBEDDED_SIGNUP' && /^FINISH/.test(data.event)) session = data.data;
      } catch { /* mensajes que no son del registro */ }
    };
    window.addEventListener('message', onMessage);
    try {
      const code = await fbLogin(FB, {
        config_id: meta.waConfigId, response_type: 'code', override_default_response_type: true,
        extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' },
      }, 'Se canceló la conexión con WhatsApp.');
      await new Promise((r) => setTimeout(r, 400)); // el mensaje con los ids llega justo después
      if (!session?.waba_id || !session?.phone_number_id) throw new Error('Meta no devolvió los datos del número. Inténtalo de nuevo.');
      return send('POST', '/api/channels/whatsapp/embedded-signup', { code, waba_id: session.waba_id, phone_number_id: session.phone_number_id, coexistence: true }, 'No se pudo conectar WhatsApp.');
    } finally { window.removeEventListener('message', onMessage); }
  }

  async function connectPages() {
    if (state.demo) return send('POST', '/api/channels/pages/connect', { code: 'demo' });
    const meta = (channelsCache || await loadChannels()).meta;
    if (!meta.appId || !meta.pagesConfigId) throw new Error('La conexión con Meta aún no está configurada. Escríbele a soporte de Iguana.');
    const FB = await loadFacebookSdk(meta.appId, meta.graphVersion);
    const code = await fbLogin(FB, { config_id: meta.pagesConfigId, response_type: 'code', override_default_response_type: true }, 'Se canceló la conexión.');
    return send('POST', '/api/channels/pages/connect', { code }, 'No se pudo conectar Instagram y Facebook.');
  }

  function wireChannelButtons(root, after) {
    loadChannels().then(() => { const box = root.querySelector('#obChannels, #giroChannels'); if (box) { box.innerHTML = channelsHtml(); bind(); } }).catch(() => {});
    function bind() {
      root.querySelectorAll('[data-connect]').forEach((btn) => btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await (btn.dataset.connect === 'whatsapp' ? connectWhatsApp() : connectPages());
          api().toast(btn.dataset.connect === 'whatsapp' ? 'WhatsApp conectado. Tu asistente ya responde.' : 'Instagram y Facebook conectados.', 'success');
          await loadChannels();
          after?.();
        } catch (err) { api().toast(err.message, 'error'); btn.disabled = false; }
      }));
    }
    bind();
  }

  /* ======================= Asistente: probador, medidor, FAQs ======================= */

  const play = { asOwner: false, log: [] };

  async function renderAssistantExtras() {
    const root = $('giroAssistant');
    if (!root || !state.business) return;
    const [usage, config] = await Promise.all([get('/api/agent/usage'), get('/api/agent/config'), loadChannels()]);
    const pct = Math.min(100, usage.budgetUsedPct || 0);
    const roi = usage.costUsd > 0 ? Math.round(usage.bookedUsd / usage.costUsd) : null;
    root.innerHTML = `
      <section class="card giro-roi" aria-labelledby="roiTitle">
        <p class="eyebrow" id="roiTitle">Este mes tu asistente</p>
        <div class="roi-figures">
          <div><span class="roi-label">costó</span><strong class="roi-cost">${usd(usage.costUsd)}</strong></div>
          <div class="roi-arrow" aria-hidden="true">${icon('arrow-ur', 'ig-icon--lg')}</div>
          <div><span class="roi-label">${state.business.mode === 'ventas' || state.business.mode === 'pedidos' ? 'vendió' : 'agendó'}</span><strong class="roi-gain">${usd(usage.bookedUsd)}</strong></div>
        </div>
        <p class="roi-note">${roi ? `Generó <strong>${roi.toLocaleString('es-EC')} veces</strong> lo que costó. ` : ''}${usage.calls} respuestas con IA · ${usage.freeReplies} respuestas gratis por tus preguntas frecuentes.</p>
        <div class="roi-budget"><div class="ig-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Presupuesto usado"><span class="ig-progress__fill" style="--_v:${pct}%"></span></div>
          <small>${pct}% de tu límite mensual de ${usd(usage.budgetUsd)}. Al llegar al 100 % las conversaciones pasan a tu equipo.</small></div>
      </section>

      <section class="card" aria-labelledby="chTitle">
        <h2 class="card-title" id="chTitle">Canales</h2>
        <p class="card-lead">Un botón y listo: no necesitas entrar a tu Business Manager ni copiar códigos.</p>
        <div id="giroChannels">${channelsHtml()}</div>
      </section>

      <section class="card play" aria-labelledby="playTitle">
        <div class="play-head">
          <div><h2 class="card-title" id="playTitle">Prueba tu asistente</h2><p class="card-lead">Escríbele como lo haría un cliente. Las citas y pedidos de prueba se guardan de verdad.</p></div>
          <div class="giro-seg" role="group" aria-label="Probar como">
            <button type="button" data-as="customer" aria-pressed="${!play.asOwner}">Cliente</button>
            <button type="button" data-as="owner" aria-pressed="${play.asOwner}">Dueño</button>
          </div>
        </div>
        <div class="play-log" id="playLog" aria-live="polite">${playLogHtml()}</div>
        <form class="play-form" id="playForm" autocomplete="off">
          <input id="playInput" type="text" maxlength="2000" placeholder="${play.asOwner ? 'Ej.: ¿cuánto vendí hoy?' : 'Ej.: Hola, ¿tienen turno mañana?'}" aria-label="Mensaje de prueba" />
          <button class="btn btn-primary" type="submit">${icon('arrow-ur')}<span>Enviar</span></button>
          <button class="icon-btn" type="button" id="playReset" aria-label="Empezar de nuevo" title="Empezar de nuevo">${icon('refresh')}</button>
        </form>
      </section>

      <section class="card" aria-labelledby="faqTitle">
        <h2 class="card-title" id="faqTitle">Respuestas rápidas (gratis)</h2>
        <p class="card-lead">Si el mensaje contiene todas las palabras clave, se responde al instante sin usar IA.</p>
        <div class="faq-list" id="faqList">${(config.faqs.length ? config.faqs : [{ keywords: [], answer: '' }]).map(faqRow).join('')}</div>
        <div class="row-actions">
          <button class="btn btn-sm" type="button" id="faqAdd">${icon('plus')}<span>Agregar respuesta</span></button>
        </div>
        <label class="field"><span class="field-label">Tu número personal (modo dueño)</span>
          <input id="ownerPhones" inputmode="tel" placeholder="593991234567" value="${esc(config.ownerPhones.join(', '))}" />
          <span class="field-help">Si escribes desde este número al WhatsApp del negocio, el asistente te trata como dueño: resúmenes, agenda, gastos.</span></label>
        <p class="note">Tipo de negocio: <strong>${esc(state.business.nicheLabel)}</strong> · ${esc(state.business.modeLabel)}. Para cambiarlo, escribe a soporte de Iguana.</p>
        <div class="form-actions"><button class="btn btn-primary" type="button" id="faqSave">Guardar</button></div>
      </section>`;
    wireAssistant(root);
  }

  const faqRow = (f) => `<div class="faq-row">
      <input class="faq-k" placeholder="Palabras clave: parqueadero" value="${esc(f.keywords.join(', '))}" aria-label="Palabras clave" />
      <input class="faq-a" placeholder="Respuesta: Sí, tenemos parqueadero gratis" value="${esc(f.answer)}" aria-label="Respuesta" />
      <button class="icon-btn" type="button" data-faq-del aria-label="Quitar">${icon('trash')}</button>
    </div>`;

  function playLogHtml() {
    if (!play.log.length) return `<p class="play-empty">${icon('bot', 'ig-icon--lg')}<span>${play.asOwner ? 'Pídele un resumen del día, bloquear un horario o registrar un gasto.' : 'Prueba agendar, preguntar precios o enviar algo fuera de lo común.'}</span></p>`;
    return play.log.map((m) => `<div class="m-msg ${m.from === 'in' ? 'm-msg--out' : 'm-msg--bot'}">${m.from === 'bot' ? `<span class="m-msg-who">${icon('bot')}Asistente</span>` : ''}<p>${esc(m.text)}</p></div>`).join('');
  }

  function wireAssistant(root) {
    wireChannelButtons(root, () => renderAssistantExtras());
    root.querySelectorAll('[data-as]').forEach((b) => b.addEventListener('click', () => {
      play.asOwner = b.dataset.as === 'owner'; play.log = []; renderAssistantExtras();
    }));
    $('playForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('playInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      play.log.push({ from: 'in', text });
      play.log.push({ from: 'bot', text: '…' });
      $('playLog').innerHTML = playLogHtml();
      try {
        const r = await send('POST', '/api/agent/test', { message: text, asOwner: play.asOwner }, 'El asistente no pudo responder.');
        play.log.pop();
        const reply = r.replies?.[0] || (r.skipped === 'budget' ? 'Se alcanzó el límite mensual: la conversación pasó a tu equipo.' : r.skipped ? 'El asistente no respondió (pausado).' : '');
        if (reply) play.log.push({ from: 'bot', text: reply });
      } catch (err) {
        play.log.pop();
        play.log.push({ from: 'bot', text: `⚠️ ${err.message}` });
      }
      $('playLog').innerHTML = playLogHtml();
      $('playLog').scrollTop = $('playLog').scrollHeight;
      input.focus();
    });
    $('playReset').addEventListener('click', async () => {
      await send('POST', '/api/agent/test', { reset: true, asOwner: play.asOwner }).catch(() => {});
      play.log = []; $('playLog').innerHTML = playLogHtml();
    });
    $('faqAdd').addEventListener('click', () => { $('faqList').insertAdjacentHTML('beforeend', faqRow({ keywords: [], answer: '' })); $('faqList').lastElementChild.querySelector('input').focus(); });
    $('faqList').addEventListener('click', (e) => { const del = e.target.closest('[data-faq-del]'); if (del) del.parentElement.remove(); });
    $('faqSave').addEventListener('click', async () => {
      const faqs = [...root.querySelectorAll('.faq-row')].map((r) => ({ keywords: r.querySelector('.faq-k').value.split(',').map((k) => k.trim()).filter(Boolean), answer: r.querySelector('.faq-a').value.trim() }))
        .filter((f) => f.keywords.length && f.answer);
      const ownerPhones = $('ownerPhones').value.split(',').map((p) => p.replace(/\D/g, '')).filter(Boolean);
      try { await send('PUT', '/api/agent/config', { faqs, ownerPhones }); api().toast('Guardado.', 'success'); } catch (err) { api().toast(err.message, 'error'); }
    });
  }

  /* ======================= Inicio: comprobantes por aprobar ======================= */

  async function renderHomeExtras() {
    const box = $('giroHomeAlerts');
    if (!box || !state.business || api().state.user?.role === 'staff') return;
    state.proofs = await get('/api/payment-proofs').catch(() => []);
    box.hidden = !state.proofs.length;
    box.innerHTML = state.proofs.length ? `
      <section class="card proof-card" aria-labelledby="proofTitle">
        <h2 class="card-title" id="proofTitle">${icon('receipt')} Comprobantes por aprobar <em class="ig-chip ig-chip--warning">${state.proofs.length}</em></h2>
        <p class="card-lead">Tu asistente leyó estas fotos de pago en el chat. Revisa y aprueba con un toque.</p>
        <ul class="proof-list">${state.proofs.map((p) => `<li>
          <div><strong>${esc(p.customer_name || 'Cliente')}</strong><small>${esc([p.bank, p.reference && `ref. ${p.reference}`].filter(Boolean).join(' · ') || 'Transferencia')} · ${dateShort(p.created_at)}</small></div>
          <strong class="proof-amount">${p.amount != null ? usd(p.amount) : '¿monto?'}</strong>
          <div class="proof-actions">
            <button class="btn btn-sm btn-primary" type="button" data-proof-ok="${p.id}">${icon('check')}<span>Aprobar</span></button>
            <button class="btn btn-sm btn-ghost" type="button" data-proof-no="${p.id}" aria-label="Rechazar comprobante">${icon('x')}</button>
          </div></li>`).join('')}</ul>
      </section>` : '';
    box.querySelectorAll('[data-proof-ok],[data-proof-no]').forEach((b) => b.addEventListener('click', async () => {
      const ok = b.dataset.proofOk;
      const id = ok || b.dataset.proofNo;
      let body = {};
      const proof = state.proofs.find((p) => String(p.id) === id);
      if (ok && proof.amount == null) {
        const v = window.prompt('¿De cuánto es el comprobante?');
        if (!v) return;
        body = { amount: v };
      }
      try {
        await send('POST', `/api/payment-proofs/${id}/${ok ? 'approve' : 'reject'}`, body);
        api().toast(ok ? 'Pago registrado.' : 'Comprobante rechazado.', ok ? 'success' : 'info');
        renderHomeExtras();
      } catch (err) { api().toast(err.message, 'error'); }
    }));
  }

  /* ======================= Vistas propias del giro ======================= */

  const tableEmpty = (cols, text) => `<tr><td colspan="${cols}" class="empty">${text}</td></tr>`;

  /* ---- Catálogo ---- */
  async function renderCatalog() {
    const root = $('giroCatalog');
    const list = await get('/api/products');
    const cats = [...new Set(list.map((p) => p.category || 'General'))];
    root.innerHTML = `
      <div class="cat-grid">${list.length ? list.map((p) => `
        <article class="card cat-item ${p.enabled ? '' : 'is-off'}">
          <p class="eyebrow">${esc(p.category || 'General')}</p>
          <h3>${esc(p.name)}</h3>
          <p class="cat-desc">${esc(p.description || '')}</p>
          <div class="cat-foot"><strong>${usd(p.price)}</strong>
            ${p.stock == null ? '<span class="ig-chip">Sin control de stock</span>' : `<span class="ig-chip ${p.stock === 0 ? 'ig-chip--danger' : p.stock < 5 ? 'ig-chip--warning' : 'ig-chip--success'}">${p.stock} en stock</span>`}</div>
          <div class="cat-actions"><button class="btn btn-sm" type="button" data-edit="${p.id}">${icon('edit')}<span>Editar</span></button>
            <button class="icon-btn" type="button" data-del="${p.id}" aria-label="Eliminar ${esc(p.name)}">${icon('trash')}</button></div>
        </article>`).join('') : `<div class="card empty-big">${icon('box', 'ig-icon--xl')}<h2>Tu catálogo está vacío</h2><p>Agrega productos para que tu asistente pueda venderlos con precios exactos.</p></div>`}</div>
      <datalist id="catList">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>`;
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openProduct(list.find((p) => p.id === Number(b.dataset.edit)))));
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!(await api().confirmAction({ title: '¿Eliminar producto?', text: 'El asistente dejará de ofrecerlo.', confirmLabel: 'Eliminar', danger: true }))) return;
      await send('DELETE', `/api/products/${b.dataset.del}`); renderCatalog();
    }));
  }

  function openProduct(p = null) {
    openForm({
      title: p ? 'Editar producto' : 'Nuevo producto',
      fields: [
        ['name', 'Nombre', 'text', p?.name, { required: true, maxlength: 160 }],
        ['price', 'Precio (USD)', 'number', p?.price, { required: true, min: 0, step: '0.01' }],
        ['category', 'Categoría', 'text', p?.category, { list: 'catList', maxlength: 80 }],
        ['stock', 'Stock (vacío = sin control)', 'number', p?.stock ?? '', { min: 0 }],
        ['description', 'Descripción', 'textarea', p?.description],
        ['image_url', 'Link de foto (opcional)', 'url', p?.image_url],
      ],
      submit: (body) => send(p ? 'PUT' : 'POST', p ? `/api/products/${p.id}` : '/api/products', { ...body, enabled: true }),
      after: renderCatalog,
    });
  }

  /* ---- Pedidos ---- */
  const ORDER_FLOW = ['nuevo', 'confirmado', 'pagado', 'enviado', 'entregado'];
  const ORDER_LABEL = { nuevo: 'Nuevo', confirmado: 'Confirmado', pagado: 'Pagado', enviado: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado' };
  const ORDER_TONE = { nuevo: 'info', confirmado: 'brand', pagado: 'success', enviado: 'warning', entregado: '', cancelado: 'danger' };

  async function renderOrders() {
    const root = $('giroOrders');
    const list = await get('/api/orders');
    const cols = ORDER_FLOW.map((s) => ({ s, items: list.filter((o) => o.status === s) }));
    root.innerHTML = `<div class="board">${cols.map(({ s, items }) => `
      <section class="board-col" aria-label="${ORDER_LABEL[s]}">
        <h3><span class="ig-chip ig-chip--${ORDER_TONE[s]}">${ORDER_LABEL[s]}</span><em>${items.length}</em></h3>
        ${items.map((o) => `<article class="card board-card">
          <header><strong>#${o.id} · ${esc(o.customer_name)}</strong><small>${dateShort(o.created_at)}</small></header>
          <ul>${o.items.map((i) => `<li>${i.qty} × ${esc(i.name)}</li>`).join('')}</ul>
          ${o.delivery_address ? `<p class="board-addr">${icon('house', 'ig-icon--sm')}${esc(o.delivery_address)}</p>` : ''}
          <footer><strong>${usd(o.total)}</strong>${o.paid >= o.total ? '<span class="ig-chip ig-chip--success">Pagado</span>' : o.paid ? `<span class="ig-chip ig-chip--warning">Abonó ${usd(o.paid)}</span>` : ''}
            ${s !== 'entregado' ? `<button class="btn btn-sm btn-primary" type="button" data-next="${o.id}" data-to="${ORDER_FLOW[ORDER_FLOW.indexOf(s) + 1]}">${ORDER_LABEL[ORDER_FLOW[ORDER_FLOW.indexOf(s) + 1]]} ${icon('chevron-right', 'ig-icon--sm')}</button>` : ''}
          </footer>
        </article>`).join('') || '<p class="board-empty">Nada aquí</p>'}
      </section>`).join('')}</div>`;
    root.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', async () => {
      await send('POST', `/api/orders/${b.dataset.next}/status`, { status: b.dataset.to }); renderOrders();
    }));
  }

  /* ---- Propiedades ---- */
  async function renderProperties() {
    const root = $('giroProperties');
    const list = await get('/api/properties');
    const tone = { disponible: 'success', reservada: 'warning', vendida: '' };
    root.innerHTML = list.length ? `<div class="prop-grid">${list.map((p) => `
      <article class="card prop-card">
        <div class="prop-top"><span class="ig-chip ig-chip--${tone[p.status]}">${esc(p.status)}</span><span class="ig-chip">${p.operation === 'arriendo' ? 'Arriendo' : 'Venta'}</span></div>
        <h3>${esc(p.title)}</h3>
        <p class="prop-zone">${icon('house', 'ig-icon--sm')}${esc(p.zone || 'Sin zona')} · ${esc(p.type)}</p>
        <p class="prop-specs">${[p.bedrooms && `${p.bedrooms} dorm.`, p.bathrooms && `${p.bathrooms} baños`, p.area_m2 && `${p.area_m2} m²`].filter(Boolean).join(' · ') || '&nbsp;'}</p>
        <div class="prop-foot"><strong>${usd(p.price)}</strong><button class="btn btn-sm" type="button" data-edit="${p.id}">${icon('edit')}<span>Editar</span></button></div>
      </article>`).join('')}</div>`
      : `<div class="card empty-big">${icon('house', 'ig-icon--xl')}<h2>Agrega tu primera propiedad</h2><p>El asistente solo recomienda propiedades que estén aquí y disponibles.</p></div>`;
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openProperty(list.find((p) => p.id === Number(b.dataset.edit)))));
  }

  function openProperty(p = null) {
    openForm({
      title: p ? 'Editar propiedad' : 'Nueva propiedad',
      fields: [
        ['title', 'Título', 'text', p?.title, { required: true, maxlength: 200 }],
        ['operation', 'Operación', 'select', p?.operation || 'venta', { options: [['venta', 'Venta'], ['arriendo', 'Arriendo']] }],
        ['type', 'Tipo', 'select', p?.type || 'casa', { options: ['casa', 'departamento', 'terreno', 'local', 'oficina'].map((t) => [t, t]) }],
        ['zone', 'Zona / sector', 'text', p?.zone, { maxlength: 120 }],
        ['price', 'Precio (USD)', 'number', p?.price, { required: true, min: 0 }],
        ['bedrooms', 'Dormitorios', 'number', p?.bedrooms ?? '', { min: 0 }],
        ['bathrooms', 'Baños', 'number', p?.bathrooms ?? '', { min: 0 }],
        ['area_m2', 'Área (m²)', 'number', p?.area_m2 ?? '', { min: 0 }],
        ['status', 'Estado', 'select', p?.status || 'disponible', { options: [['disponible', 'Disponible'], ['reservada', 'Reservada'], ['vendida', 'Vendida / arrendada']] }],
        ['url', 'Link de fotos o ficha', 'url', p?.url],
        ['description', 'Descripción', 'textarea', p?.description],
      ],
      submit: (body) => send(p ? 'PUT' : 'POST', p ? `/api/properties/${p.id}` : '/api/properties', body),
      after: renderProperties,
    });
  }

  /* ---- Prospectos ---- */
  const LEAD_STAGES = [['nuevo', 'Nuevo'], ['calificado', 'Calificado'], ['visita', 'Visita'], ['negociacion', 'Negociación'], ['ganado', 'Ganado'], ['perdido', 'Perdido']];

  async function renderLeads() {
    const root = $('giroLeads');
    const list = await get('/api/leads');
    root.innerHTML = `<section class="card card-flush"><div class="table-wrap"><table class="table">
      <thead><tr><th>Prospecto</th><th>Busca</th><th>Presupuesto</th><th>Pago · plazo</th><th>Calor</th><th>Etapa</th></tr></thead>
      <tbody>${list.length ? list.map((l) => `<tr>
        <td data-label="Prospecto"><strong>${esc(l.customer_name)}</strong><br /><small class="muted">${esc(l.phone || '')}</small></td>
        <td data-label="Busca">${esc(l.interest || '—')}${l.zone ? `<br /><small class="muted">${esc(l.zone)}</small>` : ''}</td>
        <td data-label="Presupuesto">${l.budget != null ? usd(l.budget) : '—'}</td>
        <td data-label="Pago · plazo">${esc([l.financing, l.timeline].filter(Boolean).join(' · ') || '—')}</td>
        <td data-label="Calor"><span class="heat" style="--heat:${l.score}" title="${l.score}/100"><span></span></span><small>${l.score >= 70 ? 'Caliente' : l.score >= 40 ? 'Tibio' : 'Frío'}</small></td>
        <td data-label="Etapa"><select class="ig-select" data-lead="${l.id}" aria-label="Etapa">${LEAD_STAGES.map(([k, v]) => `<option value="${k}" ${l.stage === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
      </tr>`).join('') : tableEmpty(6, 'Cuando tu asistente converse con interesados, los verás aquí ordenados por qué tan listos están para comprar.')}</tbody>
    </table></div></section>`;
    root.querySelectorAll('[data-lead]').forEach((s) => s.addEventListener('change', () => send('PUT', `/api/leads/${s.dataset.lead}`, { stage: s.value }).then(() => api().toast('Etapa actualizada.', 'success')).catch(api().fail)));
  }

  /* ---- Lista de espera ---- */
  async function renderWaitlist() {
    const root = $('giroWaitlist');
    const list = await get('/api/waitlist');
    root.innerHTML = `<section class="card card-flush"><ul class="wait-list">${list.length ? list.map((w, i) => `<li>
        <span class="wait-pos">${i + 1}</span>
        <div><strong>${esc(w.customer_name)}</strong><small>${esc(w.service_name || 'Cualquier servicio')} · ${w.desired_date ? `para el ${esc(w.desired_date)}` : 'cualquier día'}</small></div>
        ${w.status === 'offered' ? `<span class="ig-chip ig-chip--brand">Cupo ofrecido ${w.offered_at ? `· ${dateShort(w.offered_at)}` : ''}</span>` : '<span class="ig-chip">Esperando</span>'}
        ${w.phone ? `<a class="icon-btn" href="https://wa.me/${esc(w.phone)}" target="_blank" rel="noopener" aria-label="Escribir a ${esc(w.customer_name)}">${icon('whatsapp')}</a>` : ''}
        <button class="icon-btn" type="button" data-del="${w.id}" aria-label="Quitar de la lista">${icon('x')}</button>
      </li>`).join('') : `<li class="empty">Nadie en espera. Cuando no haya cupo, tu asistente ofrecerá anotar al cliente y le avisará apenas alguien cancele.</li>`}</ul></section>`;
    root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { await send('DELETE', `/api/waitlist/${b.dataset.del}`); renderWaitlist(); }));
  }

  /* ---- Reactivar ---- */
  async function renderReactivation() {
    const root = $('giroReactivation');
    const list = await get('/api/reactivation');
    root.innerHTML = list.length ? `<ul class="react-list">${list.map((c) => `<li class="card">
        <div class="react-who"><strong>${esc(c.name || 'Cliente')}</strong><small>${esc(c.service_name)} · hace ${c.days_since} días</small></div>
        <p class="react-msg">“${esc(c.message)}”</p>
        <div class="react-actions">
          ${c.whatsapp_link ? `<a class="btn btn-primary btn-sm" href="${esc(c.whatsapp_link)}" target="_blank" rel="noopener" data-sent="${c.customer_id}">${icon('whatsapp')}<span>Enviar desde mi WhatsApp</span></a>` : '<span class="muted">Sin teléfono</span>'}
          <button class="btn btn-ghost btn-sm" type="button" data-done="${c.customer_id}">Listo</button>
        </div></li>`).join('')}</ul>`
      : `<div class="card empty-big">${icon('spark', 'ig-icon--xl')}<h2>Todos al día</h2><p>Aquí aparecerán los clientes que ya deberían volver según el ciclo de cada servicio (por ejemplo, un corte cada 30 días).</p></div>`;
    const done = async (id) => { await send('POST', `/api/reactivation/${id}/done`); renderReactivation(); };
    root.querySelectorAll('[data-sent]').forEach((a) => a.addEventListener('click', () => setTimeout(() => done(a.dataset.sent), 400)));
    root.querySelectorAll('[data-done]').forEach((b) => b.addEventListener('click', () => done(b.dataset.done)));
  }

  /* ---- Formulario genérico en diálogo ---- */
  function openForm({ title, fields, submit, after }) {
    const dlg = $('giroFormDialog');
    $('giroFormTitle').textContent = title;
    $('giroFormError').textContent = '';
    $('giroFormFields').innerHTML = `<div class="grid-2">${fields.map(([name, label, type, value, o = {}]) => {
      const attrs = ['required', 'maxlength', 'min', 'step', 'list'].filter((k) => o[k] != null).map((k) => (o[k] === true ? k : `${k}="${esc(o[k])}"`)).join(' ');
      const wide = type === 'textarea' || name === 'title' || name === 'name' ? ' full' : '';
      let control;
      if (type === 'textarea') control = `<textarea class="ig-textarea" name="${name}" rows="3" maxlength="2000">${esc(value ?? '')}</textarea>`;
      else if (type === 'select') control = `<select class="ig-select" name="${name}">${o.options.map(([v, l]) => `<option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
      else control = `<input name="${name}" type="${type}" value="${esc(value ?? '')}" ${attrs} />`;
      return `<label class="field${wide}"><span class="field-label">${esc(label)}</span>${control}</label>`;
    }).join('')}</div>`;
    dlg.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await submit(Object.fromEntries(new FormData(e.target).entries()));
        dlg.close(); api().toast('Guardado.', 'success'); after?.();
      } catch (err) { $('giroFormError').textContent = err.message; }
    };
    api().openDialog(dlg);
    dlg.querySelector('input, select, textarea')?.focus();
  }

  /* ======================= Render por vista ======================= */

  async function render(view) {
    if (view === 'catalogo') return renderCatalog();
    if (view === 'pedidos') return renderOrders();
    if (view === 'propiedades') return renderProperties();
    if (view === 'prospectos') return renderLeads();
    if (view === 'espera') return renderWaitlist();
    if (view === 'reactivar') return renderReactivation();
    if (view === 'asistente') return renderAssistantExtras();
    if (view === 'inicio') return renderHomeExtras();
    return undefined;
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireOnboarding();
    $('newProduct')?.addEventListener('click', () => openProduct());
    $('newProperty')?.addEventListener('click', () => openProperty());
  });

  window.IguanaGiro = { apply, allowed, firstAllowed, render, fillCustomerExtra, readCustomerExtra, customerExtraFacts, VIEW_MODULE };
})();
