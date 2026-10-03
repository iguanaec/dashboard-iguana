/* =========================================================
   Panel Iguana — lógica de la interfaz
   Misma API que antes; navegación por hash (#/calendario, #/dinero/gastos…)
   ========================================================= */
(() => {
  'use strict';

  const API = String(
    window.APPOINTMENTS_API_BASE_URL ||
    (location.hostname.endsWith('.workers.dev') ? location.origin : 'http://127.0.0.1:8787'),
  ).replace(/\/$/, '');

  const $ = (id) => document.getElementById(id);

  const state = {
    user: null,
    settings: null,
    services: [],
    servicesApi: true,
    appointments: [],
    customers: [],
    selectedCustomer: null,
    editingCustomerId: null,
    expenses: [],
    knowledge: [],
    appointment: null,
    calendar: null,
    initialCompanies: null,
  };

  const VIEW_TITLES = {
    calendario: 'Calendario', clientes: 'Clientes', dinero: 'Dinero', asistente: 'Asistente IA',
    ajustes: 'Ajustes', facturar: 'Facturar', moderador: 'Empresas',
  };
  const MONEY_TABS = ['resumen', 'ingresos', 'gastos'];
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const APPT_STATUS = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistió' };
  const PAY_STATUS = { paid: 'Pagado', partial: 'Pago parcial', unpaid: 'Sin pagar' };
  const ORIGINS = { whatsapp: 'WhatsApp', telegram: 'Telegram', chat: 'Chat', admin: 'Panel' };

  /* ---------- Utilidades ---------- */

  function h(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    node.append(...kids.flat().filter((kid) => kid != null && kid !== false));
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }

  const money = (cents) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);
  const currency = (value) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
  const tz = () => state.settings?.businessTimezone || 'America/Guayaquil';

  function toast(message, type = 'info') {
    const node = h('div', { class: `toast ${type}`, text: message });
    $('toasts').append(node);
    window.setTimeout(() => node.remove(), type === 'error' ? 6000 : 3500);
  }

  function fail(error) {
    toast(error instanceof Error ? error.message : String(error), 'error');
  }

  async function apiFetch(path, options = {}) {
    const { retryNetworkFailure = false, ...fetchOptions } = options;
    const request = () => fetch(`${API}${path}`, {
      ...fetchOptions,
      headers: new Headers(fetchOptions.headers || {}),
      credentials: 'include',
      cache: 'no-store',
    });
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      if (retryNetworkFailure) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        try { return await request(); } catch { /* cae al mensaje de abajo */ }
      }
      throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    }
  }

  async function parse(response, fallback) {
    let data;
    try { data = await response.json(); } catch { throw new Error(fallback); }
    if (!response.ok) throw new Error(data.error || fallback);
    return data;
  }

  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  function zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    return Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  }

  function toLocalInput(iso, timeZone) {
    const p = zonedParts(new Date(iso), timeZone);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function localToUtc(value, timeZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) throw new Error('Selecciona una fecha y hora válidas.');
    const [y, mo, d, hh, mm] = match.slice(1).map(Number);
    const wanted = Date.UTC(y, mo - 1, d, hh, mm);
    let instant = wanted;
    for (let i = 0; i < 4; i += 1) {
      const a = zonedParts(new Date(instant), timeZone);
      instant += wanted - Date.UTC(Number(a.year), Number(a.month) - 1, Number(a.day), Number(a.hour), Number(a.minute));
    }
    if (toLocalInput(new Date(instant).toISOString(), timeZone) !== value) {
      throw new Error('Esa fecha no existe en la zona horaria configurada.');
    }
    return new Date(instant).toISOString();
  }

  function businessToday() {
    const p = zonedParts(new Date(), tz());
    return `${p.year}-${p.month}-${p.day}`;
  }

  const formatDateTime = (iso, options = { dateStyle: 'medium', timeStyle: 'short' }) =>
    new Date(iso).toLocaleString('es-EC', { ...options, timeZone: tz() });

  /* ---------- Diálogos ---------- */

  function openDialog(dialog, focusId) {
    if (!dialog.open) dialog.showModal();
    if (focusId) $(focusId)?.focus();
  }

  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && dialog.id !== 'passwordDialog') dialog.close();
    });
    dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  }
  $('passwordDialog').addEventListener('cancel', (event) => event.preventDefault());

  function confirmAction({ title, text, confirmLabel = 'Confirmar', danger = false }) {
    const dialog = $('confirmDialog');
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text || '';
    const ok = $('confirmOk');
    ok.textContent = confirmLabel;
    ok.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    return new Promise((resolve) => {
      dialog.returnValue = '';
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
      dialog.showModal();
      $('confirmCancel').focus();
    });
  }

  /* ---------- Acceso ---------- */

  function setState(value) { document.body.dataset.state = value; }

  function showAuthTab(mode) {
    const login = mode === 'login';
    $('loginForm').hidden = !login;
    $('registerForm').hidden = login;
    $('loginTab').setAttribute('aria-selected', String(login));
    $('registerTab').setAttribute('aria-selected', String(!login));
  }

  async function submitLogin(form) {
    const error = form.querySelector('[data-auth-error]');
    const submit = form.querySelector('[type="submit"]');
    error.textContent = '';
    submit.disabled = true;
    try {
      const response = await apiFetch('/api/auth/login', { ...json('POST', Object.fromEntries(new FormData(form))), retryNetworkFailure: true });
      await parse(response, 'No se pudo iniciar sesión.');
      window.location.reload();
    } catch (err) {
      error.textContent = err.message;
      submit.disabled = false;
    }
  }

  async function submitRegister(form) {
    const error = form.querySelector('[data-auth-error]');
    const submit = form.querySelector('[type="submit"]');
    const pdf = form.elements.knowledgePdf.files[0];
    error.textContent = '';
    submit.disabled = true;
    try {
      const fields = Object.fromEntries(new FormData(form));
      delete fields.knowledgePdf;
      const response = await apiFetch('/api/auth/register', json('POST', fields));
      await parse(response, 'No se pudo registrar el negocio.');
      if (pdf) {
        try { await uploadKnowledge(pdf, { refresh: false }); }
        catch (uploadError) { window.alert(`El negocio se creó, pero el PDF no pudo cargarse: ${uploadError.message}`); }
      }
      window.location.reload();
    } catch (err) {
      error.textContent = err.message;
      submit.disabled = false;
    }
  }

  async function logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch { /* se recarga igual */ }
    window.location.reload();
  }

  $('loginTab').addEventListener('click', () => showAuthTab('login'));
  $('registerTab').addEventListener('click', () => showAuthTab('register'));
  $('loginForm').addEventListener('submit', (e) => { e.preventDefault(); submitLogin(e.currentTarget); });
  $('registerForm').addEventListener('submit', (e) => { e.preventDefault(); submitRegister(e.currentTarget); });
  $('logoutBtn').addEventListener('click', logout);

  $('passwordChangeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    $('passwordChangeError').textContent = '';
    submit.disabled = true;
    try {
      const response = await apiFetch('/api/auth/change-password', json('POST', Object.fromEntries(new FormData(form))));
      await parse(response, 'No se pudo cambiar la contraseña.');
      window.location.reload();
    } catch (err) {
      $('passwordChangeError').textContent = err.message;
      submit.disabled = false;
    }
  });

  /* ---------- Datos base ---------- */

  async function loadSettings() {
    state.settings = await parse(await apiFetch('/api/settings'), 'No se pudo cargar la configuración.');
    return state.settings;
  }

  async function saveSettings(settings) {
    const response = await apiFetch('/api/settings', json('PUT', settings));
    state.settings = await parse(response, 'No se pudo guardar la configuración.');
    return state.settings;
  }

  async function loadAppointments() {
    state.appointments = await parse(await apiFetch('/api/appointments?include_cancelled=true'), 'No se pudieron cargar las citas.');
    return state.appointments;
  }

  async function loadServices() {
    const response = await apiFetch('/api/services');
    if (response.status === 404) {
      state.servicesApi = false;
      state.services = [];
      return state.services;
    }
    state.services = await parse(response, 'No se pudieron cargar los servicios.');
    state.servicesApi = true;
    return state.services;
  }

  function setBrand() {
    const name = state.settings?.businessProfile?.businessName || state.user?.companyName;
    if (name) $('brandName').textContent = name;
  }

  function stamp() {
    $('refreshStatus').textContent = `Actualizado ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
  }

  /* ---------- Calendario ---------- */

  function endOf(startIso) {
    const end = new Date(startIso);
    end.setMinutes(end.getMinutes() + state.settings.appointmentDurationMinutes);
    return end.toISOString();
  }

  function toEvent(a) {
    const start = a.start_at || a.date_iso;
    return {
      title: `${a.customer_name || a.patient_name || 'Cliente'} · ${a.service_name || a.service || 'Servicio'}`,
      start,
      end: a.end_at || endOf(start),
      classNames: a.status === 'cancelled' ? ['appointment-cancelled'] : [],
      extendedProps: { ...a },
    };
  }

  function businessHoursFor(settings) {
    const open = settings.businessHours.filter((d) => d.enabled);
    return open.length ? open.map((d) => ({ daysOfWeek: [d.day], startTime: d.start, endTime: d.end })) : false;
  }

  function contactOf(a) {
    if (a.phone) return String(a.phone).replace('@c.us', '');
    if (a.telegram_username) return `@${a.telegram_username}`;
    return 'Sin contacto';
  }

  function ensureCalendar() {
    if (state.calendar) {
      window.setTimeout(() => state.calendar.updateSize(), 0);
      return;
    }
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    state.calendar = new FullCalendar.Calendar($('calendar'), {
      initialView: mobile ? 'listWeek' : 'dayGridMonth',
      locale: 'es',
      height: 'auto',
      timeZone: tz(),
      businessHours: businessHoursFor(state.settings),
      nowIndicator: true,
      navLinks: true,
      navLinkDayClick: 'listDay',
      dayMaxEvents: 3,
      eventDisplay: 'block',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek,listDay' },
      views: {
        listWeek: { buttonText: 'Semana', noEventsContent: 'No hay citas esta semana.' },
        listDay: { buttonText: 'Día', noEventsContent: 'No hay citas para este día.' },
      },
      buttonText: { today: 'Hoy', month: 'Mes' },
      events: state.appointments.map(toEvent),
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: 'short' },
      eventContent(arg) {
        if (arg.view.type !== 'dayGridMonth') return undefined;
        const a = arg.event.extendedProps;
        return { domNodes: [h('div', { class: 'fc-event-main-frame' },
          h('span', { class: 'fc-event-time', text: arg.timeText }),
          h('span', { class: 'fc-event-title', text: a.customer_name || a.patient_name || 'Cliente' }))] };
      },
      eventDidMount(info) {
        if (!info.view.type.startsWith('list')) return;
        const target = info.el.querySelector('.fc-list-event-title');
        if (!target) return;
        const a = info.event.extendedProps;
        const chips = [
          h('span', { class: 'chip', text: contactOf(a) }),
          h('span', { class: `badge ${a.status === 'cancelled' ? 'cancelled' : ''}`, text: APPT_STATUS[a.status] || 'Confirmada' }),
          h('span', { class: `badge ${a.payment_status || 'unpaid'}`, text: PAY_STATUS[a.payment_status] || 'Sin pagar' }),
          a.price_cents == null ? null : h('span', { class: 'chip', text: `${money(a.paid_cents || 0)} de ${money(a.price_cents)}` }),
        ];
        target.replaceChildren(h('div', { class: 'list-appt' },
          h('div', { class: 'list-appt-title', text: info.event.title }),
          h('div', { class: 'list-appt-meta' }, chips)));
      },
      eventClick: (info) => openAppointment(info.event.extendedProps),
    });
    state.calendar.render();
  }

  function syncCalendar() {
    const cal = state.calendar;
    if (!cal) return;
    cal.setOption('timeZone', tz());
    cal.setOption('businessHours', businessHoursFor(state.settings));
    cal.removeAllEvents();
    cal.addEventSource(state.appointments.map(toEvent));
  }

  async function refreshAppointments() {
    await Promise.all([loadAppointments(), loadServices()]);
    syncCalendar();
    stamp();
  }

  /* ---------- Detalle de cita ---------- */

  function openAppointment(a) {
    state.appointment = a;
    const start = a.start_at || a.date_iso;
    const end = a.end_at || endOf(start);
    const endText = new Date(end).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: tz() });
    const cancelled = a.status === 'cancelled';
    const confirmed = (a.status || 'confirmed') === 'confirmed';

    $('apptTitle').textContent = a.customer_name || a.patient_name || 'Cliente';
    $('modalDate').textContent = `${formatDateTime(start, { dateStyle: 'full', timeStyle: 'short' })} – ${endText}`;
    $('modalService').textContent = a.service_name || a.service || 'Servicio';
    $('modalPhone').textContent = contactOf(a);
    $('modalStatus').textContent = `${APPT_STATUS[a.status] || 'Confirmada'} · ${ORIGINS[a.origin] || 'Chat'}`;

    const badge = $('modalPaymentStatus');
    badge.textContent = PAY_STATUS[a.payment_status] || 'Sin pagar';
    badge.className = `badge ${a.payment_status || 'unpaid'}`;
    $('modalPaymentSummary').textContent = a.price_cents == null
      ? 'El servicio no tiene precio configurado'
      : `${money(a.paid_cents || 0)} de ${money(a.price_cents)}`;

    const payBtn = $('showPayment');
    payBtn.disabled = a.price_cents == null;
    payBtn.title = a.price_cents == null ? 'Configura el precio del servicio en Ajustes' : '';
    $('cancelAppointment').hidden = !confirmed;

    $('paymentPanel').hidden = true;
    $('paymentPanel').reset();
    syncPaymentBank();
    $('paymentError').textContent = '';
    const remaining = Math.max(0, Number(a.price_cents || 0) - Number(a.paid_cents || 0));
    $('appointmentPaymentAmount').value = remaining ? (remaining / 100).toFixed(2) : '';

    $('reschedulePanel').hidden = true;
    syncApptButtons();
    $('appointmentError').textContent = '';
    $('rescheduleStart').value = toLocalInput(start, tz());
    const select = $('rescheduleService');
    select.replaceChildren();
    for (const s of state.services.filter((item) => item.enabled || item.id === a.service_id)) {
      select.append(h('option', { value: s.id, text: `${s.name} (${s.duration_minutes} min)`, selected: s.id === a.service_id }));
    }
    openDialog($('apptDialog'), 'apptTitle');
  }

  // Cada botón del pie desaparece mientras su panel está abierto, para no repetir acciones.
  function syncApptButtons() {
    const a = state.appointment;
    const status = a.status || 'confirmed';
    $('showPayment').hidden = status === 'cancelled' || a.payment_status === 'paid' || !$('paymentPanel').hidden;
    $('showReschedule').hidden = status !== 'confirmed' || !$('reschedulePanel').hidden;
  }

  function syncPaymentBank() {
    const transfer = $('appointmentPaymentMethod').value === 'Transferencia';
    $('appointmentBankField').hidden = !transfer;
    $('appointmentPaymentBank').required = transfer;
    if (!transfer) $('appointmentPaymentBank').value = '';
  }

  $('appointmentPaymentMethod').addEventListener('change', syncPaymentBank);

  $('showPayment').addEventListener('click', () => {
    $('reschedulePanel').hidden = true;
    $('paymentPanel').hidden = false;
    syncApptButtons();
    $('appointmentPaymentAmount').focus();
  });
  $('showReschedule').addEventListener('click', () => {
    $('paymentPanel').hidden = true;
    $('reschedulePanel').hidden = false;
    syncApptButtons();
    $('rescheduleStart').focus();
  });

  $('paymentPanel').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('paymentError').textContent = '';
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget).entries());
      body.payment_date = businessToday();
      const response = await apiFetch(`/api/appointments/${state.appointment.id}/payment`, json('POST', body));
      await parse(response, 'No se pudo registrar el pago.');
      $('apptDialog').close();
      toast('Pago registrado.', 'success');
      await refreshAppointments();
    } catch (err) { $('paymentError').textContent = err.message; }
  });

  $('confirmReschedule').addEventListener('click', async () => {
    $('appointmentError').textContent = '';
    try {
      const startAt = localToUtc($('rescheduleStart').value, tz());
      const response = await apiFetch(`/api/appointments/${state.appointment.id}/reschedule`,
        json('POST', { start_at: startAt, service_id: Number($('rescheduleService').value) }));
      await parse(response, 'No se pudo reprogramar la cita.');
      $('apptDialog').close();
      toast('Cita reprogramada.', 'success');
      await refreshAppointments();
    } catch (err) { $('appointmentError').textContent = err.message; }
  });

  $('cancelAppointment').addEventListener('click', async () => {
    const ok = await confirmAction({
      title: '¿Cancelar esta cita?',
      text: 'Se liberará el horario. Esta acción no se puede deshacer.',
      confirmLabel: 'Cancelar cita', danger: true,
    });
    if (!ok) return;
    try {
      const response = await apiFetch(`/api/appointments/${state.appointment.id}/cancel`, json('POST', {}));
      await parse(response, 'No se pudo cancelar la cita.');
      $('apptDialog').close();
      toast('Cita cancelada.', 'success');
      await refreshAppointments();
    } catch (err) { fail(err); }
  });

  /* ---------- Clientes ---------- */

  const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  function renderCustomers(customers) {
    state.customers = customers;
    const list = $('customerList');
    list.replaceChildren();
    if (!customers.length) {
      list.append(h('div', { class: 'empty', text: 'Todavía no hay clientes.' }));
      $('customerDetail').replaceChildren(h('div', { class: 'empty', text: 'Crea tu primer cliente o espera a que alguien agende por WhatsApp o Telegram.' }));
      return;
    }
    for (const c of customers) {
      const meta = `${c.appointment_count} servicio${Number(c.appointment_count) === 1 ? '' : 's'}${c.telegram_username ? ` · @${c.telegram_username}` : ''}`;
      list.append(h('button', {
        type: 'button', class: 'customer-item',
        dataset: { customerId: c.id, search: [c.full_name, c.phone, c.telegram_username].filter(Boolean).join(' ').toLocaleLowerCase('es') },
      },
      h('span', { class: 'avatar', 'aria-hidden': 'true', text: initials(c.full_name) }),
      h('span', {}, h('span', { class: 'customer-name', text: c.full_name }), h('span', { class: 'customer-meta', text: meta }))));
    }
    list.append(h('div', { class: 'empty', id: 'customerNoMatch', hidden: true, text: 'Ningún cliente coincide con tu búsqueda.' }));
  }

  async function loadCustomers() {
    const customers = await parse(await apiFetch('/api/customers'), 'No se pudieron cargar los clientes.');
    renderCustomers(customers);
    return customers;
  }

  async function showCustomer(id) {
    const customer = await parse(await apiFetch(`/api/customers/${id}`), 'No se pudo cargar el historial del cliente.');
    state.selectedCustomer = customer;
    $('customerList').querySelectorAll('.customer-item').forEach((item) => {
      item.setAttribute('aria-current', String(Number(item.dataset.customerId) === id));
    });
    $('customersSplit').dataset.mode = 'detail';

    const channel = { whatsapp: 'WhatsApp', telegram: 'Telegram' }[customer.contact_channel] || 'Chat';
    const chips = [
      `Teléfono: ${customer.phone || 'No registrado'}`,
      `Cédula/RUC: ${customer.cedula_ruc || 'No registrada'}`,
      `Dirección: ${customer.address || 'No registrada'}`,
      customer.telegram_username
        ? `${channel}: ${customer.contact_channel === 'telegram' ? '@' : ''}${customer.telegram_username}`
        : null,
    ].filter(Boolean);

    const history = customer.appointments.length
      ? customer.appointments.map((a) => {
        const paid = Number(a.paid_cents || 0);
        const payKey = paid <= 0 ? 'unpaid' : (a.price_cents != null && paid >= Number(a.price_cents) ? 'paid' : 'partial');
        const cancelled = a.status === 'cancelled';
        return h('div', { class: 'history-item' },
          h('div', { class: 'history-service', text: a.service_name || a.service || 'Servicio' }),
          h('div', { class: 'history-date', text: a.start_at ? formatDateTime(a.start_at) : 'Fecha no disponible' }),
          h('span', { class: `badge ${cancelled ? 'cancelled' : payKey}`, text: cancelled ? 'Cancelada' : PAY_STATUS[payKey] }));
      })
      : [h('div', { class: 'empty', text: 'Este cliente todavía no tiene servicios.' })];

    $('customerDetail').replaceChildren(
      h('button', { type: 'button', class: 'btn btn-quiet btn-sm detail-back', onclick: () => { $('customersSplit').dataset.mode = 'list'; } },
        icon('back'), h('span', { text: 'Clientes' })),
      h('div', { class: 'detail-head' },
        h('h2', { text: customer.full_name }),
        h('div', { class: 'detail-actions' },
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Editar cliente', title: 'Editar', onclick: () => openCustomerEditor(customer) }, icon('edit')),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Eliminar cliente', title: 'Eliminar', onclick: () => removeCustomer(customer).catch(fail) }, icon('trash')))),
      h('div', { class: 'chips' }, chips.map((text) => h('span', { class: 'chip', text }))),
      h('h3', { class: 'history-title', text: `Historial de servicios (${customer.appointments.length})` }),
      h('div', { class: 'history' }, history));
  }

  function openCustomerEditor(customer = null) {
    state.editingCustomerId = customer?.id || null;
    $('customerFormTitle').textContent = customer ? 'Editar cliente' : 'Nuevo cliente';
    $('customerFirstName').value = customer?.first_name || '';
    $('customerLastName').value = customer?.last_name || '';
    $('customerCedulaRuc').value = customer?.cedula_ruc || '';
    $('customerAddress').value = customer?.address || '';
    $('customerPhone').value = customer?.phone || '';
    $('customerFormError').textContent = '';
    openDialog($('customerDialog'), 'customerFirstName');
  }

  async function removeCustomer(customer) {
    const ok = await confirmAction({
      title: `¿Eliminar a ${customer.full_name}?`,
      text: 'Sus citas permanecerán en el calendario.',
      confirmLabel: 'Eliminar', danger: true,
    });
    if (!ok) return;
    await parse(await apiFetch(`/api/customers/${customer.id}`, { method: 'DELETE' }), 'No se pudo eliminar el cliente.');
    state.selectedCustomer = null;
    $('customersSplit').dataset.mode = 'list';
    $('customerDetail').replaceChildren(h('div', { class: 'empty', text: 'Selecciona un cliente para ver su historial.' }));
    toast('Cliente eliminado.', 'success');
    await loadCustomers();
  }

  $('createCustomer').addEventListener('click', () => openCustomerEditor());
  $('customerList').addEventListener('click', (event) => {
    const item = event.target.closest('[data-customer-id]');
    if (item) showCustomer(Number(item.dataset.customerId)).catch(fail);
  });
  $('customerSearch').addEventListener('input', () => {
    const query = $('customerSearch').value.trim().toLocaleLowerCase('es');
    let visible = 0;
    $('customerList').querySelectorAll('.customer-item').forEach((item) => {
      item.hidden = !item.dataset.search.includes(query);
      if (!item.hidden) visible += 1;
    });
    const none = $('customerNoMatch');
    if (none) none.hidden = visible > 0;
  });
  $('customerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('customerFormError').textContent = '';
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget).entries());
      const editing = state.editingCustomerId;
      const response = await apiFetch(editing ? `/api/customers/${editing}` : '/api/customers', json(editing ? 'PUT' : 'POST', body));
      const customer = await parse(response, editing ? 'No se pudo actualizar el cliente.' : 'No se pudo crear el cliente.');
      $('customerDialog').close();
      state.editingCustomerId = null;
      toast(editing ? 'Cliente actualizado.' : 'Cliente creado.', 'success');
      await loadCustomers();
      await showCustomer(customer.id);
    } catch (err) { $('customerFormError').textContent = err.message; }
  });

  /* ---------- Dinero: tablas ---------- */

  function cell(label, value, className = '') {
    return h('td', { class: className, dataset: { label } }, value == null || value === '' ? '—' : value);
  }

  function emptyRow(text, columns) {
    return h('tr', {}, h('td', { class: 'empty-cell', colspan: columns, text }));
  }

  function renderIncome(data) {
    $('incomeExpected').textContent = money(data.summary.expected_cents);
    $('incomePaid').textContent = money(data.summary.paid_cents);
    $('incomeOutstanding').textContent = money(data.summary.outstanding_cents);
    $('incomeCount').textContent = String(data.summary.appointments);
    const body = $('incomeTableBody');
    body.replaceChildren();
    if (!data.appointments.length) {
      body.append(emptyRow('No hay citas que coincidan con los filtros.', 8));
      return;
    }
    for (const a of data.appointments) {
      body.append(h('tr', {},
        cell('Fecha', formatDateTime(a.start_at)),
        cell('Cliente', a.customer_name),
        cell('Servicio', a.service_name),
        cell('Cita', APPT_STATUS[a.appointment_status] || a.appointment_status),
        h('td', { dataset: { label: 'Pago' } }, h('span', { class: `badge ${a.payment_status}`, text: PAY_STATUS[a.payment_status] })),
        cell('Valor', a.price_cents == null ? 'Sin precio' : money(a.price_cents), 'num'),
        cell('Pagado', money(a.paid_cents), 'num strong'),
        cell('Por cobrar', money(a.outstanding_cents), 'num strong')));
    }
  }

  async function loadIncome() {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData($('incomeFilters')).entries()) if (value) params.set(key, value);
    const data = await parse(await apiFetch(`/api/income${params.size ? `?${params}` : ''}`), 'No se pudieron cargar los ingresos.');
    renderIncome(data);
  }

  async function prepareIncome() {
    if (!state.services.length) await loadServices();
    const select = $('incomeService');
    const selected = select.value;
    select.replaceChildren(new Option('Todos los servicios', ''));
    state.services.forEach((s) => select.add(new Option(s.name, s.name)));
    select.value = selected;
    await loadIncome();
  }

  if (window.matchMedia('(min-width: 861px)').matches) $('incomeMore').open = true;

  let incomeTimer;
  $('incomeFilters').addEventListener('input', () => {
    window.clearTimeout(incomeTimer);
    incomeTimer = window.setTimeout(() => loadIncome().catch(fail), 250);
  });

  function renderExpenses(expenses) {
    state.expenses = expenses;
    $('expenseTotal').textContent = currency(expenses.reduce((sum, e) => sum + e.amount, 0));
    $('expenseCount').textContent = String(expenses.length);
    const body = $('expensesTableBody');
    body.replaceChildren();
    if (!expenses.length) {
      body.append(emptyRow('Todavía no hay gastos registrados. Usa “Registrar gasto” para agregar el primero.', 8));
      return;
    }
    for (const e of expenses) {
      const description = h('td', { dataset: { label: 'Descripción' } }, h('div', { class: 'cell-main' }, e.description, e.notes ? h('span', { class: 'sub', text: e.notes }) : null));
      const doc = h('td', { dataset: { label: 'Comprobante' } }, h('div', { class: 'cell-main' },
        [e.document_type, e.document_number].filter(Boolean).join(' · ') || '—',
        e.receipt_url ? h('a', { class: 'sub', href: e.receipt_url, target: '_blank', rel: 'noopener', text: 'Ver archivo' }) : null));
      body.append(h('tr', {},
        cell('Fecha', new Date(`${e.expense_date}T12:00:00`).toLocaleDateString('es-EC')),
        description,
        cell('Categoría', e.category),
        cell('Proveedor', e.supplier),
        cell('Pago', [e.payment_method, e.bank].filter(Boolean).join(' · ')),
        doc,
        cell('Monto', currency(e.amount), 'num strong'),
        h('td', { class: 'actions-cell' },
          h('button', { type: 'button', class: 'link-danger', 'aria-label': `Eliminar gasto ${e.description}`, onclick: () => removeExpense(e).catch(fail), text: 'Eliminar' }))));
    }
  }

  async function loadExpenses() {
    renderExpenses(await parse(await apiFetch('/api/expenses'), 'No se pudieron cargar los gastos.'));
  }

  async function removeExpense(expense) {
    const ok = await confirmAction({ title: `¿Eliminar “${expense.description}”?`, text: 'El gasto dejará de contarse en tus totales.', confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    await parse(await apiFetch(`/api/expenses/${expense.id}`, { method: 'DELETE' }), 'No se pudo eliminar el gasto.');
    toast('Gasto eliminado.', 'success');
    await loadExpenses();
  }

  function syncExpenseTransfer() {
    const transfer = $('expensePaymentMethod').value === 'Transferencia';
    $('expenseTransferFields').hidden = !transfer;
    $('expenseBank').required = transfer;
    if (!transfer) { $('expenseBank').value = ''; $('expenseReceipt').value = ''; }
  }
  $('expensePaymentMethod').addEventListener('change', syncExpenseTransfer);

  $('newExpense').addEventListener('click', () => {
    $('expenseForm').reset();
    $('expenseDate').value = businessToday();
    $('expenseMessage').textContent = '';
    syncExpenseTransfer();
    openDialog($('expenseDialog'), 'expenseDescription');
  });

  $('expenseForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('[type="submit"]');
    $('expenseMessage').textContent = '';
    submit.disabled = true;
    try {
      const response = await apiFetch('/api/expenses', { method: 'POST', body: new FormData(event.currentTarget) });
      await parse(response, 'No se pudo guardar el gasto.');
      $('expenseDialog').close();
      toast('Gasto guardado.', 'success');
      await loadExpenses();
    } catch (err) { $('expenseMessage').textContent = err.message; }
    finally { submit.disabled = false; }
  });

  /* ---------- Dinero: resumen ---------- */

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs = {}, text = '') {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    return node;
  }

  function chartSvg(label) {
    const svg = svgEl('svg', { viewBox: '0 0 360 250', role: 'img', 'aria-label': label });
    svg.append(svgEl('title', {}, label));
    return svg;
  }

  function renderDonut(summary) {
    const box = $('dashboardPieChart');
    const income = Math.max(0, Number(summary.income_cents));
    const expenses = Math.max(0, Number(summary.expenses_cents));
    const total = income + expenses;
    const svg = chartSvg(`Ingresos ${money(income)} y gastos ${money(expenses)}`);
    const r = 72;
    const c = 2 * Math.PI * r;
    svg.append(svgEl('circle', { cx: 180, cy: 112, r, fill: 'none', stroke: '#e9ecf1', 'stroke-width': 30 }));
    if (total > 0) {
      const incomeLen = (income / total) * c;
      svg.append(svgEl('circle', { cx: 180, cy: 112, r, fill: 'none', stroke: '#2457d6', 'stroke-width': 30, 'stroke-dasharray': `${incomeLen} ${c - incomeLen}`, transform: 'rotate(-90 180 112)' }));
      svg.append(svgEl('circle', { cx: 180, cy: 112, r, fill: 'none', stroke: '#c9731a', 'stroke-width': 30, 'stroke-dasharray': `${c - incomeLen} ${incomeLen}`, 'stroke-dashoffset': -incomeLen, transform: 'rotate(-90 180 112)' }));
    }
    svg.append(svgEl('text', { x: 180, y: 108, 'text-anchor': 'middle', fill: '#6b7486', 'font-size': 12 }, 'Movimiento total'));
    svg.append(svgEl('text', { x: 180, y: 132, 'text-anchor': 'middle', fill: '#171c26', 'font-size': 20, 'font-weight': 600 }, currency(total / 100)));
    box.replaceChildren(svg);
  }

  function renderServiceBars(services) {
    const box = $('dashboardBarChart');
    const data = services.slice(0, 6);
    if (!data.length) {
      box.replaceChildren(h('div', { class: 'chart-empty', text: 'Sin servicios en este período' }));
      return;
    }
    const max = Math.max(...data.map((s) => Number(s.appointments)), 1);
    box.replaceChildren(h('div', { class: 'bars' }, data.map((s) => h('div', {},
      h('div', { class: 'bar-head' }, h('span', { text: s.service_name }), h('strong', { text: String(s.appointments) })),
      h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${(Number(s.appointments) / max) * 100}%` }))))));
  }

  function renderDailyLine(activity) {
    const box = $('dashboardLineChart');
    const svg = chartSvg('Ingresos y gastos por día');
    if (!activity.length) {
      box.replaceChildren(h('div', { class: 'chart-empty', text: 'Sin movimientos en este período' }));
      return;
    }
    const max = Math.max(...activity.flatMap((a) => [Number(a.income_cents), Number(a.expenses_cents)]), 1);
    const left = 44, top = 16, width = 300, height = 175;
    for (let i = 0; i <= 4; i += 1) {
      const y = top + (height * i) / 4;
      svg.append(svgEl('line', { x1: left, y1: y, x2: left + width, y2: y, stroke: '#eceff4' }));
      svg.append(svgEl('text', { x: left - 6, y: y + 4, 'text-anchor': 'end', fill: '#6b7486', 'font-size': 10 }, currency((max * (4 - i)) / 4 / 100).replace(/[,.]00$/, '')));
    }
    const at = (item, index, field) => ({
      x: activity.length === 1 ? left + width / 2 : left + (index * width) / (activity.length - 1),
      y: top + height - (Number(item[field]) / max) * height,
    });
    for (const [field, color] of [['income_cents', '#2457d6'], ['expenses_cents', '#c9731a']]) {
      const pts = activity.map((item, i) => at(item, i, field));
      svg.append(svgEl('polyline', { points: pts.map((p) => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      pts.forEach((p) => svg.append(svgEl('circle', { cx: p.x, cy: p.y, r: 3.5, fill: color, stroke: '#fff', 'stroke-width': 2 })));
    }
    for (const index of new Set([0, Math.floor((activity.length - 1) / 2), activity.length - 1])) {
      svg.append(svgEl('text', { x: at(activity[index], index, 'income_cents').x, y: 216, 'text-anchor': 'middle', fill: '#6b7486', 'font-size': 10 }, `Día ${Number(activity[index].date.slice(8, 10))}`));
    }
    box.replaceChildren(svg);
  }

  function renderDashboard(data) {
    const s = data.summary;
    $('dashboardIncome').textContent = currency(s.income_cents / 100);
    $('dashboardExpenses').textContent = currency(s.expenses_cents / 100);
    $('dashboardProfit').textContent = currency(s.profit_cents / 100);
    $('dashboardProfit').classList.toggle('negative', s.profit_cents < 0);
    $('dashboardOutstanding').textContent = currency(s.outstanding_cents / 100);
    $('dashboardServices').textContent = String(s.services_count);
    $('dashboardUnpaidPeople').textContent = String(s.unpaid_people);
    renderDonut(s);
    renderServiceBars(data.service_breakdown);
    renderDailyLine(data.daily_activity);

    const body = $('dashboardUnpaidBody');
    body.replaceChildren();
    if (!data.unpaid.length) body.append(emptyRow('No hay pagos pendientes en este período.', 5));
    for (const u of data.unpaid) {
      body.append(h('tr', {},
        cell('Cliente', u.customer_name),
        cell('Servicio', u.service_name),
        cell('Fecha', u.start_at ? new Date(u.start_at).toLocaleDateString('es-EC', { timeZone: tz() }) : '—'),
        cell('Pagado', currency(Number(u.paid_cents) / 100), 'num'),
        cell('Pendiente', currency(Number(u.outstanding_cents) / 100), 'num strong')));
    }
  }

  async function loadDashboard() {
    const input = $('dashboardMonth');
    if (!input.value) input.value = businessToday().slice(0, 7);
    const match = /^(\d{4})-(\d{2})$/.exec(input.value);
    if (!match) throw new Error('Selecciona un mes válido.');
    const last = new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
    const data = await parse(await apiFetch(`/api/dashboard?from=${input.value}-01&to=${input.value}-${String(last).padStart(2, '0')}`), 'No se pudo cargar el resumen.');
    renderDashboard(data);
  }

  $('dashboardMonth').addEventListener('change', () => loadDashboard().catch(fail));

  /* ---------- Asistente IA ---------- */

  const STYLE_PREVIEWS = {
    formal: { name: 'Formal', text: 'Con gusto. Tenemos disponibilidad mañana a las 10:00 a. m. ¿Desea que reserve la cita para usted?' },
    semiformal: { name: 'Semiformal', text: 'Claro, tenemos un espacio mañana a las 10:00 a. m. ¿Quieres que te agende?' },
    friend: { name: 'Amigo', text: 'Claro, tengo un espacio mañana a las 10:00 a. m. ¿Te lo agendo?' },
  };

  function renderAiMode(mode) {
    const value = (mode || state.settings?.aiMode) === 'owner' ? 'owner' : 'client';
    const input = $('aiModeForm').querySelector(`input[name="aiMode"][value="${value}"]`);
    if (input) input.checked = true;
    $('aiModeDetail').textContent = value === 'owner'
      ? 'Modo dueño: puede agendar citas para clientes y registrar pagos recibidos o gastos del negocio desde WhatsApp o Telegram.'
      : 'Modo cliente: puede consultar servicios, revisar disponibilidad y gestionar citas. No puede registrar pagos ni gastos.';
  }

  function renderStylePreview(style) {
    const p = STYLE_PREVIEWS[style] || STYLE_PREVIEWS.semiformal;
    $('communicationStylePreviewLabel').textContent = `Ejemplo de respuesta · estilo ${p.name}`;
    $('communicationStylePreviewMessage').textContent = p.text;
  }

  function readProfile() {
    return {
      businessName: state.settings?.businessProfile?.businessName || '',
      communicationStyle: new FormData($('aiModeForm')).get('communicationStyle') || 'semiformal',
      preferredTone: state.settings?.businessProfile?.preferredTone || '',
      greeting: $('businessGreeting').value.trim(),
      address: $('businessAddress').value.trim(),
      contactPhone: $('contactPhone').value.trim(),
      cancellationPolicy: $('cancellationPolicy').value.trim(),
      arrivalInstructions: $('arrivalInstructions').value.trim(),
      generalNotes: $('generalNotes').value.trim(),
      acceptedPaymentMethods: $('paymentMethods').value.split(',').map((item) => item.trim()).filter(Boolean),
    };
  }

  function fillSettingsForms(settings) {
    const profile = settings.businessProfile || {};
    // Asistente
    const style = ['formal', 'semiformal', 'friend'].includes(profile.communicationStyle) ? profile.communicationStyle : 'semiformal';
    const styleInput = $('aiModeForm').querySelector(`input[name="communicationStyle"][value="${style}"]`);
    if (styleInput) styleInput.checked = true;
    renderStylePreview(style);
    renderAiMode(settings.aiMode);
    $('businessGreeting').value = profile.greeting || '';
    $('businessAddress').value = profile.address || '';
    $('contactPhone').value = profile.contactPhone || '';
    $('cancellationPolicy').value = profile.cancellationPolicy || '';
    $('arrivalInstructions').value = profile.arrivalInstructions || '';
    $('generalNotes').value = profile.generalNotes || '';
    $('paymentMethods').value = (profile.acceptedPaymentMethods || []).join(', ');
    // Ajustes
    $('businessName').value = profile.businessName || '';
    $('appointmentDuration').value = settings.appointmentDurationMinutes;
    $('businessTimezone').value = settings.businessTimezone || 'America/Guayaquil';
    $('slotInterval').value = settings.slotIntervalMinutes || 15;
    $('closedDates').value = (settings.closedDates || []).join(', ');
    $('minimumBookingNotice').value = settings.minimumBookingNoticeMinutes ?? 0;
    $('maximumAdvanceDays').value = settings.maximumAdvanceBookingDays ?? 31;
    renderHours(settings.businessHours);
    renderServices();
  }

  function fmtSize(bytes) {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }

  function renderKnowledge() {
    const list = $('knowledgeList');
    list.replaceChildren();
    for (const doc of state.knowledge) {
      list.append(h('li', { class: 'doc-item' },
        icon('file'),
        h('div', { class: 'doc-info' },
          h('div', { class: 'doc-name', text: doc.name }),
          h('div', { class: 'doc-meta', text: `${fmtSize(doc.size_bytes)} · ${new Date(`${doc.created_at}Z`).toLocaleDateString('es-EC')}` })),
        h('button', { type: 'button', class: 'link-danger', text: 'Eliminar', 'aria-label': `Eliminar ${doc.name}`, onclick: () => removeKnowledge(doc).catch((e) => { $('aiModeMessage').textContent = e.message; }) })));
    }
  }

  async function loadKnowledge() {
    state.knowledge = await parse(await apiFetch('/api/ai-documents'), 'No se pudieron cargar los documentos.');
    renderKnowledge();
  }

  function mimeFor(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    return ({ pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown', csv: 'text/csv', json: 'application/json' })[ext] || file.type;
  }

  function base64Of(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result).split(',')[1] || ''));
      reader.addEventListener('error', () => reject(new Error('No se pudo leer el PDF.')));
      reader.readAsDataURL(file);
    });
  }

  async function uploadKnowledge(file = $('knowledgeFile').files[0], { refresh = true } = {}) {
    if (!file) throw new Error('Elige un documento primero.');
    const mimeType = mimeFor(file);
    const pdf = mimeType === 'application/pdf';
    if (file.size > (pdf ? 2_000_000 : 100_000)) throw new Error(pdf ? 'El PDF puede pesar como máximo 2 MB.' : 'Cada documento puede pesar como máximo 100 KB.');
    const response = await apiFetch('/api/ai-documents', json('POST', { name: file.name, mimeType, content: pdf ? await base64Of(file) : await file.text() }));
    await parse(response, 'No se pudo subir el documento.');
    if (file === $('knowledgeFile').files[0]) $('knowledgeFile').value = '';
    if (refresh) await loadKnowledge();
  }

  async function removeKnowledge(doc) {
    const ok = await confirmAction({ title: `¿Eliminar “${doc.name}”?`, text: 'El asistente dejará de usar este documento.', confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    await parse(await apiFetch(`/api/ai-documents/${doc.id}`, { method: 'DELETE' }), 'No se pudo eliminar el documento.');
    await loadKnowledge();
    $('aiModeMessage').textContent = 'Documento eliminado.';
  }

  $('aiModeForm').addEventListener('change', (event) => {
    if (event.target.name === 'aiMode') renderAiMode(event.target.value);
    if (event.target.name === 'communicationStyle') renderStylePreview(event.target.value);
  });

  $('aiModeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('aiModeMessage').textContent = 'Guardando…';
    try {
      await saveSettings({ ...state.settings, aiMode: new FormData(event.currentTarget).get('aiMode'), businessProfile: readProfile() });
      renderAiMode();
      $('aiModeMessage').textContent = '';
      toast('Asistente actualizado.', 'success');
    } catch (err) { $('aiModeMessage').textContent = err.message; }
  });

  $('uploadKnowledge').addEventListener('click', async () => {
    $('aiModeMessage').textContent = 'Subiendo documento…';
    try {
      await uploadKnowledge();
      $('aiModeMessage').textContent = '';
      toast('Documento disponible para el asistente.', 'success');
    } catch (err) { $('aiModeMessage').textContent = err.message; }
  });

  /* ---------- Ajustes ---------- */

  function renderHours(hours) {
    const list = $('businessHoursList');
    list.replaceChildren();
    for (const d of hours) {
      const toggle = h('input', { type: 'checkbox', class: 'day-enabled', checked: d.enabled, 'aria-label': `${DAYS[d.day]} abierto` });
      const start = h('input', { type: 'time', class: 'day-start', value: d.start, 'aria-label': `${DAYS[d.day]} apertura`, required: true });
      const end = h('input', { type: 'time', class: 'day-end', value: d.end, 'aria-label': `${DAYS[d.day]} cierre`, required: true });
      const sync = () => { start.disabled = !toggle.checked; end.disabled = !toggle.checked; };
      toggle.addEventListener('change', sync);
      sync();
      list.append(h('div', { class: 'hours-row', dataset: { day: d.day } },
        h('span', { class: 'day', text: DAYS[d.day] }),
        h('label', { class: 'check' }, toggle, 'Abierto'),
        start, end));
    }
  }

  function renderServices() {
    $('servicesSection').hidden = !state.servicesApi;
    const list = $('servicesList');
    list.replaceChildren();
    if (!state.servicesApi) return;
    const field = (label, input) => h('label', { class: 'field' }, h('span', { class: 'field-label', text: label }), input);
    for (const s of state.services) {
      const enabled = h('input', { type: 'checkbox', class: 'service-enabled-input', checked: s.enabled !== false });
      list.append(h('div', { class: 'service-row', dataset: { id: s.id || '' } },
        field('Nombre', h('input', { type: 'text', class: 'service-name', value: s.name, maxlength: 100, required: true })),
        field('Descripción', h('input', { type: 'text', class: 'service-description', value: s.description || '', maxlength: 500, placeholder: 'Opcional' })),
        field('Duración (min)', h('input', { type: 'number', class: 'service-duration', value: s.duration_minutes, min: 5, max: 480, step: 5, required: true })),
        field('Precio (USD)', h('input', { type: 'number', class: 'service-price', value: s.price ?? '', min: 0, step: '0.01' })),
        h('label', { class: 'check' }, enabled, 'Activo')));
    }
    if (!state.services.length) list.append(h('div', { class: 'empty', text: 'Aún no tienes servicios. Agrega el primero.' }));
  }

  function readServices() {
    return Array.from($('servicesList').querySelectorAll('.service-row')).map((row) => ({
      id: row.dataset.id ? Number(row.dataset.id) : null,
      name: row.querySelector('.service-name').value,
      description: row.querySelector('.service-description').value,
      duration_minutes: Number(row.querySelector('.service-duration').value),
      price: row.querySelector('.service-price').value,
      enabled: row.querySelector('.service-enabled-input').checked,
    }));
  }

  async function saveServices() {
    if (!state.servicesApi) return;
    for (const s of readServices()) {
      const response = await apiFetch(s.id ? `/api/services/${s.id}` : '/api/services', json(s.id ? 'PUT' : 'POST', {
        name: s.name, description: s.description, duration_minutes: s.duration_minutes, price: s.price, enabled: s.enabled,
      }));
      await parse(response, 'No se pudo guardar un servicio.');
    }
    await loadServices();
  }

  function readSettings() {
    return {
      aiMode: state.settings?.aiMode || 'owner',
      appointmentDurationMinutes: Number($('appointmentDuration').value),
      businessTimezone: $('businessTimezone').value.trim(),
      slotIntervalMinutes: Number($('slotInterval').value),
      minimumBookingNoticeMinutes: Number($('minimumBookingNotice').value),
      maximumAdvanceBookingDays: Number($('maximumAdvanceDays').value),
      closedDates: $('closedDates').value.split(',').map((d) => d.trim()).filter(Boolean),
      businessHours: Array.from($('businessHoursList').querySelectorAll('.hours-row')).map((row) => ({
        day: Number(row.dataset.day),
        enabled: row.querySelector('.day-enabled').checked,
        start: row.querySelector('.day-start').value,
        end: row.querySelector('.day-end').value,
      })),
      businessProfile: { ...readProfile(), businessName: $('businessName').value.trim() },
    };
  }

  $('addService').addEventListener('click', () => {
    state.services.push({ name: '', description: '', duration_minutes: 60, price: null, enabled: true });
    renderServices();
    const rows = $('servicesList').querySelectorAll('.service-row');
    rows[rows.length - 1]?.querySelector('.service-name').focus();
  });

  $('settingsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('settingsError').textContent = '';
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      // Si el formulario fue editado, conserva lo que hay en pantalla para los servicios nuevos.
      await saveSettings(readSettings());
      await saveServices();
      setBrand();
      await refreshAppointments();
      fillSettingsForms(state.settings);
      toast('Cambios guardados.', 'success');
    } catch (err) { $('settingsError').textContent = err.message; }
    finally { submit.disabled = false; }
  });

  /* ---------- Moderador ---------- */

  function renderCompanies(companies) {
    const grid = $('companyGrid');
    grid.replaceChildren();
    if (!companies.length) {
      grid.append(h('div', { class: 'empty', text: 'No hay empresas registradas.' }));
      return;
    }
    for (const c of companies) {
      const registered = new Date(`${c.created_at}Z`).toLocaleDateString('es-EC');
      const button = h('button', { type: 'button', class: 'btn btn-danger-quiet btn-sm', 'aria-label': `Eliminar empresa ${c.name}`, text: 'Eliminar empresa' });
      button.addEventListener('click', () => removeCompany(c, button));
      grid.append(h('article', { class: 'company-card' },
        h('h2', { text: c.name }),
        h('div', { class: 'company-meta', text: `${c.status === 'active' ? 'Activa' : 'Inactiva'} · ${c.admin_count} administrador(es) · desde ${registered}` }),
        h('div', { class: 'company-owner' },
          h('div', {}, h('strong', { text: 'Usuario: ' }), c.owner_username || 'Sin usuario asignado'),
          h('div', {}, h('strong', { text: 'Teléfono: ' }), c.owner_phone || 'Sin teléfono registrado')),
        button));
    }
  }

  async function removeCompany(company, button) {
    const ok = await confirmAction({
      title: `¿Eliminar “${company.name}”?`,
      text: 'Se borrarán también su usuario y todos sus datos. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar empresa', danger: true,
    });
    if (!ok) return;
    button.disabled = true;
    try {
      await parse(await apiFetch(`/api/moderator/companies/${company.id}`, { method: 'DELETE' }), 'No se pudo eliminar la empresa.');
      toast(`Se eliminó ${company.name}.`, 'success');
      await loadCompanies();
    } catch (err) { button.disabled = false; fail(err); }
  }

  async function loadCompanies() {
    if (state.initialCompanies) {
      renderCompanies(state.initialCompanies);
      state.initialCompanies = null;
      return;
    }
    const data = await parse(await apiFetch('/api/moderator/companies'), 'No se pudieron cargar las empresas.');
    renderCompanies(data.companies || []);
  }

  async function loadModeratorSettings() {
    const data = await parse(await apiFetch('/api/moderator/ai-settings'), 'No se pudo cargar la configuración global.');
    $('moderatorOnboardingEnabled').checked = data.onboardingEnabled === true;
    $('moderatorFirstStepsEnabled').checked = data.firstStepsEnabled === true;
  }

  function bindModeratorSwitch(input, key, label) {
    input.addEventListener('change', async () => {
      const enabled = input.checked;
      input.disabled = true;
      try {
        await parse(await apiFetch('/api/moderator/ai-settings', json('PUT', { [key]: enabled })), `No se pudo actualizar ${label}.`);
        $('moderatorAiMessage').textContent = `${label} ${enabled ? 'activado' : 'desactivado'}.`;
      } catch (err) {
        input.checked = !enabled;
        $('moderatorAiMessage').textContent = err.message;
      } finally { input.disabled = false; }
    });
  }
  bindModeratorSwitch($('moderatorOnboardingEnabled'), 'onboardingEnabled', 'Onboarding del bot');
  bindModeratorSwitch($('moderatorFirstStepsEnabled'), 'firstStepsEnabled', 'Primeros pasos');

  /* ---------- Rutas ---------- */

  let routeToken = 0;
  let currentView = null;

  function parseRoute() {
    const [view, tab] = location.hash.replace(/^#\/?/, '').split('/');
    return { view, tab };
  }

  async function renderRoute() {
    if (!state.user || state.user.mustChangePassword) return;
    const isModerator = state.user.role === 'super_admin';
    let { view, tab } = parseRoute();
    if (isModerator) view = 'moderador';
    else if (!VIEW_TITLES[view] || view === 'moderador') view = 'calendario';
    if (view === 'dinero' && !MONEY_TABS.includes(tab)) tab = 'resumen';
    const canonical = `#/${view}${view === 'dinero' ? `/${tab}` : ''}`;
    if (location.hash !== canonical) history.replaceState(null, '', canonical);

    const token = ++routeToken;
    const changed = view !== currentView;
    currentView = view;

    document.querySelectorAll('[data-view]').forEach((panel) => { panel.hidden = panel.dataset.view !== view; });
    document.querySelectorAll('#nav a').forEach((link) => {
      if (link.dataset.route === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = `${VIEW_TITLES[view]} · ${$('brandName').textContent}`;
    if (changed) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      $(`view-${view}`).querySelector('h1')?.focus({ preventScroll: true });
    }

    try {
      if (view === 'calendario') ensureCalendar();
      if (view === 'clientes') await loadCustomers();
      if (view === 'dinero') {
        document.querySelectorAll('[data-tab]').forEach((link) => link.setAttribute('aria-selected', String(link.dataset.tab === tab)));
        document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
        if (tab === 'resumen') await loadDashboard();
        if (tab === 'ingresos') await prepareIncome();
        if (tab === 'gastos') await loadExpenses();
      }
      if (view === 'asistente') {
        await loadSettings();
        if (token !== routeToken) return;
        fillSettingsForms(state.settings);
        await loadKnowledge();
      }
      if (view === 'ajustes') {
        await Promise.all([loadSettings(), loadServices()]);
        if (token !== routeToken) return;
        fillSettingsForms(state.settings);
      }
      if (view === 'moderador') await Promise.all([loadCompanies(), loadModeratorSettings()]);
      stamp();
    } catch (err) {
      if (token === routeToken) fail(err);
    }
  }

  function refreshCurrent() {
    const btn = $('refreshBtn');
    btn.classList.add('is-loading');
    const done = () => btn.classList.remove('is-loading');
    if (currentView === 'calendario') refreshAppointments().catch(fail).finally(done);
    else renderRoute().finally(done);
  }

  $('refreshBtn').addEventListener('click', refreshCurrent);
  window.addEventListener('hashchange', renderRoute);

  /* ---------- Arranque ---------- */

  async function boot() {
    let session;
    try {
      const response = await apiFetch('/api/auth/me');
      if (!response.ok) { setState('out'); return; }
      session = await response.json();
    } catch (err) {
      setState('out');
      document.querySelector('#loginForm [data-auth-error]').textContent = err.message;
      return;
    }

    state.user = session.user;
    state.initialCompanies = Array.isArray(session.companies) ? session.companies : null;
    $('userName').textContent = state.user.username;
    $('logoutBtn').setAttribute('aria-label', `Salir (${state.user.username})`);
    setState('in');

    if (state.user.mustChangePassword) {
      openDialog($('passwordDialog'));
      $('passwordChangeForm').elements.password.focus();
      return;
    }

    if (state.user.role === 'super_admin') {
      document.querySelectorAll('#nav li').forEach((li) => { li.hidden = li.id !== 'moderatorNav'; });
      $('brandName').textContent = 'Administración';
      await renderRoute();
      return;
    }

    if (state.user.companyName) $('brandName').textContent = state.user.companyName;
    try {
      await Promise.all([loadSettings(), loadAppointments(), loadServices()]);
      setBrand();
    } catch (err) {
      fail(err);
    }
    if (state.settings) {
      await renderRoute();
      window.setInterval(() => {
        if (document.visibilityState === 'visible' && currentView === 'calendario') {
          refreshAppointments().catch(() => { $('refreshStatus').textContent = 'No se pudo actualizar'; });
        }
      }, 30_000);
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
