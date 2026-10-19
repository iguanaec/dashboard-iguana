/* =========================================================
   Datos de ejemplo para probar el DISEÑO sin API.
   Simula las respuestas del servidor dentro del navegador:
   nada se envía ni se guarda; al recargar todo vuelve al inicio.

   Para usar la API real, quita la línea <script src="demo-api.js"> de index.html.

   Vistas especiales (agrégalas a la dirección del archivo):
     ?demo=acceso      pantalla de entrar / crear negocio
     ?demo=moderador   vista del super administrador
     ?demo=password    cambio de contraseña obligatorio
   ========================================================= */
(() => {
  'use strict';

  const mode = new URLSearchParams(location.search).get('demo');
  const store = {
    get() { try { return sessionStorage.getItem('demoLoggedOut') === '1'; } catch { return false; } },
    set(value) { try { sessionStorage.setItem('demoLoggedOut', value ? '1' : '0'); } catch { /* sin almacenamiento */ } },
  };

  /* ----- Fechas relativas a hoy (Ecuador, UTC-5) para que el calendario nunca se vea vacío ----- */
  const ecuadorNow = new Date(Date.now() - 5 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const dayString = (offset) => {
    const d = new Date(Date.UTC(ecuadorNow.getUTCFullYear(), ecuadorNow.getUTCMonth(), ecuadorNow.getUTCDate() + offset));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  };
  const at = (offset, hour, minute = 0) => `${dayString(offset)}T${pad(hour)}:${pad(minute)}:00.000-05:00`;
  const plusMinutes = (iso, minutes) => {
    const d = new Date(new Date(iso).getTime() + minutes * 60000 - 5 * 3600 * 1000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00.000-05:00`;
  };

  /* ----- Datos ----- */
  const services = [
    { id: 1, name: 'Corte de cabello', description: 'Corte y peinado', duration_minutes: 60, price: 7, enabled: true },
    { id: 2, name: 'Tinte completo', description: 'Incluye lavado', duration_minutes: 90, price: 35, enabled: true },
    { id: 3, name: 'Manicure', description: 'Esmaltado tradicional', duration_minutes: 60, price: 12, enabled: true },
    { id: 4, name: 'Barba', description: '', duration_minutes: 30, price: 5, enabled: false },
  ];

  const customers = [
    { id: 1, first_name: 'Esteban', last_name: 'Andrade', phone: '593987654321', cedula_ruc: '1712345678', address: 'La Floresta, Quito', telegram_username: 'Esteban', contact_channel: 'telegram' },
    { id: 2, first_name: 'Marcela', last_name: 'Vinueza', phone: '593991230045', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp' },
    { id: 3, first_name: 'Julián', last_name: 'Paredes', phone: '593984441122', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp' },
    { id: 4, first_name: 'Carla', last_name: 'Mejía', phone: '', cedula_ruc: '', address: '', telegram_username: 'carlamj', contact_channel: 'telegram' },
    { id: 5, first_name: 'Daniela', last_name: 'Ortiz', phone: '593975554433', cedula_ruc: '', address: 'Cumbayá', telegram_username: '', contact_channel: 'whatsapp' },
    { id: 6, first_name: 'Rosa', last_name: 'León', phone: '593975551111', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp' },
    { id: 7, first_name: 'Pablo', last_name: 'Ruiz', phone: '593975550000', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp' },
    { id: 8, first_name: 'Lucía', last_name: 'Montalvo', phone: '593984441199', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp' },
  ].map((c) => ({ ...c, full_name: `${c.first_name} ${c.last_name}` }));

  /* ----- Citas: 80 días de historial con días pico + agenda de hoy y próximos días ----- */
  let seed = 20261004;
  const rnd = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const weekdayOfOffset = (offset) => new Date(`${dayString(offset)}T12:00:00Z`).getUTCDay();

  const appointments = [];
  const makeAppt = (customer, serviceId, day, hour, minute, status, origin, paid) => {
    const service = services.find((x) => x.id === serviceId);
    const start = at(day, hour, minute);
    const price_cents = Math.round(service.price * 100);
    const paid_cents = paid === 'full' ? price_cents : paid === 'half' ? Math.round(price_cents / 2) : 0;
    appointments.push({
      id: appointments.length + 1, customer_name: customer.full_name, service_id: serviceId, service_name: service.name,
      start_at: start, end_at: plusMinutes(start, service.duration_minutes), status, origin,
      phone: customer.phone ? `${customer.phone}@c.us` : '', telegram_username: customer.phone ? '' : customer.telegram_username,
      price_cents, paid_cents, payment_status: 'unpaid',
    });
  };

  // Viernes y sábado son los días fuertes; el domingo no se atiende.
  const dayWeight = [0, 1, 1.2, 1.4, 1.6, 2.6, 2];
  const hourPool = [9, 10, 10, 11, 12, 14, 15, 15, 16, 17];
  for (let day = -80; day <= -1; day += 1) {
    const count = Math.floor(dayWeight[weekdayOfOffset(day)] * rnd() * 1.7 + 0.35);
    const hours = [...new Set(Array.from({ length: count }, () => pick(hourPool)))];
    for (const hour of hours) {
      const r = rnd();
      const status = r < 0.06 ? 'cancelled' : 'confirmed';
      const q = rnd();
      const paid = status === 'cancelled' ? 'none' : (day < -2 ? (q < 0.88 ? 'full' : q < 0.95 ? 'half' : 'none') : (q < 0.6 ? 'full' : q < 0.75 ? 'half' : 'none'));
      makeAppt(pick(customers), pick([1, 1, 1, 2, 3, 3]), day, hour, 0, status, pick(['whatsapp', 'whatsapp', 'telegram', 'chat', 'admin']), paid);
    }
  }

  // Hoy: agenda con horas fijas; lo que ya pasó aparece cobrado.
  const nowHour = ecuadorNow.getUTCHours();
  [[9, 0, 2, 1], [10, 30, 0, 1], [12, 0, 1, 2], [15, 0, 5, 3], [16, 30, 6, 1]].forEach(([hour, minute, who, serviceId]) => {
    makeAppt(customers[who], serviceId, 0, hour, minute, 'confirmed', pick(['whatsapp', 'telegram', 'chat', 'admin']), hour + 1 < nowHour ? 'full' : who % 2 ? 'half' : 'none');
  });
  makeAppt(customers[0], 1, 1, 9, 30, 'confirmed', 'whatsapp', 'none');
  makeAppt(customers[4], 3, 1, 11, 0, 'confirmed', 'chat', 'none');
  makeAppt(customers[3], 3, 1, 14, 0, 'cancelled', 'telegram', 'none');
  makeAppt(customers[6], 1, 2, 10, 0, 'confirmed', 'whatsapp', 'none');
  makeAppt(customers[5], 2, 3, 15, 0, 'confirmed', 'whatsapp', 'none');
  makeAppt(customers[7], 2, 4, 16, 0, 'confirmed', 'chat', 'none');
  makeAppt(customers[0], 1, 8, 10, 0, 'confirmed', 'whatsapp', 'none');

  const derivePayment = (a) => {
    a.payment_status = a.paid_cents <= 0 ? 'unpaid' : (a.price_cents != null && a.paid_cents >= a.price_cents ? 'paid' : 'partial');
  };
  appointments.forEach(derivePayment);

  let settings = {
    aiMode: 'owner', appointmentDurationMinutes: 60, businessTimezone: 'America/Guayaquil', slotIntervalMinutes: 15,
    minimumBookingNoticeMinutes: 30, maximumAdvanceBookingDays: 31, closedDates: ['2026-12-25'],
    businessHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, enabled: day !== 0, start: '09:00', end: day === 6 ? '14:00' : '18:00' })),
    businessProfile: {
      businessName: 'Salón Iguana', communicationStyle: 'semiformal', preferredTone: '',
      greeting: 'Hola, gracias por escribirnos.', address: 'Av. Amazonas N24, Quito', contactPhone: '+593 98 765 4321',
      cancellationPolicy: 'Cancela con 12 horas de anticipación.', arrivalInstructions: '', generalNotes: '',
      acceptedPaymentMethods: ['Efectivo', 'Transferencia'],
    },
  };

  const expenseTemplates = [
    ['Compra de tintes', 'Insumos', 'Distribuidora Andina', 'Transferencia', 'Pichincha', 'Factura', 18.5],
    ['Arriendo del local', 'Arriendo', '', 'Efectivo', '', '', 25],
    ['Servicio de luz', 'Servicios básicos', 'Empresa Eléctrica', 'Tarjeta de débito', '', 'Recibo', 8.4],
    ['Productos de limpieza', 'Insumos', 'Supermaxi', 'Efectivo', '', 'Factura', 14.8],
    ['Publicidad en Instagram', 'Marketing', 'Meta', 'Tarjeta de crédito', '', '', 12],
    ['Transporte de pedido', 'Transporte', '', 'Efectivo', '', '', 4.5],
    ['Internet del local', 'Servicios básicos', 'Netlife', 'Transferencia', 'Guayaquil', 'Factura', 19.9],
  ];
  let expenses = [];
  const addExpense = (day, template) => {
    const [description, category, supplier, payment_method, bank, document_type, amount] = template;
    expenses.push({ id: expenses.length + 1, expense_date: dayString(day), description, notes: '', category, supplier, payment_method, bank, document_type, document_number: document_type === 'Factura' ? '001-001-0000' + (12000 + expenses.length) : '', amount, receipt_url: '' });
  };
  addExpense(0, expenseTemplates[3]);
  [-8, -11, -14, -17, -20, -23, -27, -31, -34, -38, -42, -47, -52, -58].forEach((day, k) => addExpense(day, expenseTemplates[(k + 1) % expenseTemplates.length]));

  let documents = [{ id: 1, name: 'precios-2026.pdf', size_bytes: 48210, created_at: `${dayString(-14)} 10:00:00` }];
  let nextId = 100;

  /* ----- Utilidades de respuesta ----- */
  const respond = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const readJson = (options) => { try { return JSON.parse(options.body || '{}'); } catch { return {}; } };
  const dateOf = (iso) => iso.slice(0, 10);

  const withCount = (c) => ({ ...c, appointment_count: appointments.filter((a) => a.customer_name === c.full_name).length });
  const outstanding = (a) => (a.status === 'cancelled' ? 0 : Math.max(0, a.price_cents - a.paid_cents));

  function income(params) {
    const from = params.get('from');
    const to = params.get('to');
    const customer = (params.get('customer') || '').toLocaleLowerCase('es');
    const service = params.get('service');
    const status = params.get('status');
    const list = appointments
      .filter((a) => (!from || dateOf(a.start_at) >= from) && (!to || dateOf(a.start_at) <= to))
      .filter((a) => !customer || a.customer_name.toLocaleLowerCase('es').includes(customer))
      .filter((a) => !service || a.service_name === service)
      .filter((a) => !status || a.payment_status === status)
      .sort((x, y) => new Date(y.start_at) - new Date(x.start_at))
      .map((a) => ({ ...a, appointment_status: a.status, outstanding_cents: outstanding(a) }));
    const live = list.filter((a) => a.status !== 'cancelled');
    return {
      summary: {
        expected_cents: live.reduce((s, a) => s + a.price_cents, 0),
        paid_cents: live.reduce((s, a) => s + a.paid_cents, 0),
        outstanding_cents: live.reduce((s, a) => s + outstanding(a), 0),
        appointments: list.length,
      },
      appointments: list,
    };
  }

  function dashboard(params) {
    const from = params.get('from');
    const to = params.get('to');
    const inRange = (d) => (!from || d >= from) && (!to || d <= to);
    const live = appointments.filter((a) => a.status !== 'cancelled' && inRange(dateOf(a.start_at)));
    const exp = expenses.filter((e) => inRange(e.expense_date));
    const income_cents = live.reduce((s, a) => s + a.paid_cents, 0);
    const expenses_cents = Math.round(exp.reduce((s, e) => s + e.amount, 0) * 100);
    const unpaid = live.filter((a) => outstanding(a) > 0);
    const byService = {};
    live.forEach((a) => { byService[a.service_name] = (byService[a.service_name] || 0) + 1; });
    const days = {};
    live.forEach((a) => { (days[dateOf(a.start_at)] ||= { income_cents: 0, expenses_cents: 0 }).income_cents += a.paid_cents; });
    exp.forEach((e) => { (days[e.expense_date] ||= { income_cents: 0, expenses_cents: 0 }).expenses_cents += Math.round(e.amount * 100); });
    return {
      summary: {
        income_cents, expenses_cents, profit_cents: income_cents - expenses_cents,
        outstanding_cents: unpaid.reduce((s, a) => s + outstanding(a), 0),
        services_count: live.length, unpaid_people: new Set(unpaid.map((a) => a.customer_name)).size,
      },
      service_breakdown: Object.entries(byService).map(([service_name, n]) => ({ service_name, appointments: n })).sort((a, b) => b.appointments - a.appointments),
      daily_activity: Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
      unpaid: unpaid.map((a) => ({ customer_name: a.customer_name, service_name: a.service_name, start_at: a.start_at, paid_cents: a.paid_cents, outstanding_cents: outstanding(a) })),
    };
  }

  /* ----- Enrutador ----- */
  async function handle(path, options = {}) {
    const url = new URL(path, 'http://demo');
    const route = url.pathname;
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : readJson(options);

    // Sesión
    if (route === '/api/auth/me') {
      if (mode === 'acceso' || store.get()) return respond({ error: 'No autenticado' }, 401);
      if (mode === 'moderador') {
        return respond({
          user: { id: 9, username: 'moderador', role: 'super_admin' },
          companies: [
            { id: 1, name: 'Salón Iguana', status: 'active', admin_count: 1, created_at: '2026-08-01 10:00:00', owner_username: 'Esteban', owner_phone: '593987654321' },
            { id: 2, name: 'Barbería La Mella', status: 'active', admin_count: 2, created_at: '2026-09-12 15:30:00', owner_username: 'lamella', owner_phone: '' },
          ],
        });
      }
      return respond({ user: { id: 1, username: 'Esteban', role: 'admin', companyName: 'Salón Iguana', mustChangePassword: mode === 'password' } });
    }
    if (route === '/api/auth/login') {
      if (body.password === 'bad') return respond({ error: 'Usuario o contraseña incorrectos.' }, 401);
      store.set(false);
      return respond({ ok: true });
    }
    if (route === '/api/auth/register' || route === '/api/auth/change-password') { store.set(false); return respond({ ok: true }); }
    if (route === '/api/auth/logout') { store.set(true); return respond({ ok: true }); }

    // Configuración y servicios
    if (route === '/api/settings') {
      if (method === 'PUT') settings = body;
      return respond(settings);
    }
    if (route === '/api/services') {
      if (method === 'POST') {
        const service = { id: nextId += 1, name: body.name, description: body.description, duration_minutes: body.duration_minutes, price: body.price === '' || body.price == null ? null : Number(body.price), enabled: body.enabled !== false };
        services.push(service);
        return respond(service);
      }
      return respond(services);
    }
    const serviceMatch = route.match(/^\/api\/services\/(\d+)$/);
    if (serviceMatch && method === 'PUT') {
      const service = services.find((s) => s.id === Number(serviceMatch[1]));
      if (service) Object.assign(service, { name: body.name, description: body.description, duration_minutes: body.duration_minutes, price: body.price === '' || body.price == null ? null : Number(body.price), enabled: body.enabled !== false });
      return respond(service || {});
    }

    // Citas
    if (route === '/api/appointments') return respond(appointments);
    const apptMatch = route.match(/^\/api\/appointments\/(\d+)\/(payment|cancel|reschedule)$/);
    if (apptMatch) {
      const a = appointments.find((x) => x.id === Number(apptMatch[1]));
      if (!a) return respond({ error: 'Cita no encontrada.' }, 404);
      if (apptMatch[2] === 'payment') { a.paid_cents += Math.round(Number(body.amount) * 100); derivePayment(a); }
      if (apptMatch[2] === 'cancel') a.status = 'cancelled';
      if (apptMatch[2] === 'reschedule') {
        const service = services.find((s) => s.id === Number(body.service_id)) || services.find((s) => s.id === a.service_id);
        a.start_at = body.start_at;
        a.end_at = plusMinutes(body.start_at, service.duration_minutes);
        a.service_id = service.id;
        a.service_name = service.name;
        a.price_cents = Math.round(service.price * 100);
        derivePayment(a);
      }
      return respond({ ok: true });
    }

    // Clientes
    if (route === '/api/customers') {
      if (method === 'POST') {
        const customer = { id: nextId += 1, first_name: body.first_name, last_name: body.last_name, full_name: `${body.first_name} ${body.last_name}`, phone: body.phone || '', cedula_ruc: body.cedula_ruc || '', address: body.address || '', telegram_username: '', contact_channel: '' };
        customers.push(customer);
        return respond(customer);
      }
      return respond(customers.map(withCount));
    }
    const customerMatch = route.match(/^\/api\/customers\/(\d+)$/);
    if (customerMatch) {
      const index = customers.findIndex((c) => c.id === Number(customerMatch[1]));
      if (index < 0) return respond({ error: 'Cliente no encontrado.' }, 404);
      if (method === 'DELETE') { customers.splice(index, 1); return respond({ ok: true }); }
      if (method === 'PUT') Object.assign(customers[index], body, { full_name: `${body.first_name} ${body.last_name}` });
      const c = customers[index];
      return respond({ ...c, appointments: appointments.filter((a) => a.customer_name === c.full_name).sort((x, y) => new Date(y.start_at) - new Date(x.start_at)) });
    }

    // Dinero
    if (route === '/api/expenses') {
      if (method === 'POST') {
        const expense = { id: nextId += 1, expense_date: body.expense_date, description: body.description, notes: body.notes || '', category: body.category, supplier: body.supplier || '', payment_method: body.payment_method, bank: body.bank || '', document_type: body.document_type || '', document_number: body.document_number || '', amount: Number(body.amount), receipt_url: '' };
        expenses.unshift(expense);
        return respond(expense);
      }
      return respond([...expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date)));
    }
    const expenseMatch = route.match(/^\/api\/expenses\/(\d+)$/);
    if (expenseMatch && method === 'DELETE') { expenses = expenses.filter((e) => e.id !== Number(expenseMatch[1])); return respond({ ok: true }); }
    if (route === '/api/income') return respond(income(url.searchParams));
    if (route === '/api/dashboard') return respond(dashboard(url.searchParams));

    // Asistente
    if (route === '/api/ai-documents') {
      if (method === 'POST') {
        const doc = { id: nextId += 1, name: body.name, size_bytes: String(body.content || '').length, created_at: `${dayString(0)} 12:00:00` };
        documents.push(doc);
        return respond(doc);
      }
      return respond(documents);
    }
    const docMatch = route.match(/^\/api\/ai-documents\/(\d+)$/);
    if (docMatch && method === 'DELETE') { documents = documents.filter((d) => d.id !== Number(docMatch[1])); return respond({ ok: true }); }

    // Moderador
    if (route === '/api/moderator/ai-settings') return respond({ onboardingEnabled: true, firstStepsEnabled: false });
    if (route === '/api/moderator/companies') return respond({ companies: [] });
    if (/^\/api\/moderator\/companies\/\d+$/.test(route)) return respond({ ok: true });

    return respond({ error: 'No encontrado.' }, 404);
  }

  // app.js usa esta función en lugar de fetch cuando existe.
  window.demoFetch = (path, options) => new Promise((resolve) => {
    window.setTimeout(() => resolve(handle(path, options)), 120);
  });
})();
