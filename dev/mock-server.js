// Servidor de prueba: sirve el panel y simula la API del Worker con datos de ejemplo.
// Uso: node dev/mock-server.js   →   http://127.0.0.1:8787
// Vistas alternativas: /__mock?role=super  |  /__mock?role=mustchange  |  /__mock?auth=0  |  /__mock?role=admin
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let ROLE = process.env.MOCK_ROLE || 'admin';
let AUTH = process.env.MOCK_AUTH !== '0';
const PORT = Number(process.env.PORT || 8787);

const iso = (d, h, m = 0) => `${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000-05:00`;
const appointments = [
  { id: 1, customer_name: 'Esteban Andrade', service_name: 'Corte de cabello', service_id: 1, start_at: iso('2026-10-05', 10), end_at: iso('2026-10-05', 11), status: 'confirmed', origin: 'whatsapp', phone: '593987654321@c.us', price_cents: 700, paid_cents: 0, payment_status: 'unpaid' },
  { id: 2, customer_name: 'Marcela Vinueza', service_name: 'Tinte completo', service_id: 2, start_at: iso('2026-10-05', 15), end_at: iso('2026-10-05', 16, 30), status: 'confirmed', origin: 'telegram', telegram_username: 'marcelavz', price_cents: 3500, paid_cents: 1500, payment_status: 'partial' },
  { id: 3, customer_name: 'Julián Paredes', service_name: 'Corte de cabello', service_id: 1, start_at: iso('2026-10-07', 9), end_at: iso('2026-10-07', 10), status: 'confirmed', origin: 'admin', phone: '593991112233@c.us', price_cents: 700, paid_cents: 700, payment_status: 'paid' },
  { id: 4, customer_name: 'Carla Mejía', service_name: 'Manicure', service_id: 3, start_at: iso('2026-10-07', 11), end_at: iso('2026-10-07', 12), status: 'cancelled', origin: 'whatsapp', phone: '593980001122@c.us', price_cents: 1200, paid_cents: 0, payment_status: 'unpaid' },
  { id: 5, customer_name: 'Esteban Andrade', service_name: 'Corte de cabello', service_id: 1, start_at: iso('2026-10-14', 16), end_at: iso('2026-10-14', 17), status: 'confirmed', origin: 'whatsapp', phone: '593987654321@c.us', price_cents: 700, paid_cents: 0, payment_status: 'unpaid' },
  { id: 6, customer_name: 'Daniela Ortiz', service_name: 'Manicure', service_id: 3, start_at: iso('2026-10-14', 10), end_at: iso('2026-10-14', 11), status: 'confirmed', origin: 'chat', phone: '593975554433@c.us', price_cents: 1200, paid_cents: 0, payment_status: 'unpaid' },
  { id: 7, customer_name: 'Pablo Ruiz', service_name: 'Corte de cabello', service_id: 1, start_at: iso('2026-10-14', 12), end_at: iso('2026-10-14', 13), status: 'confirmed', origin: 'chat', phone: '593975550000@c.us', price_cents: 700, paid_cents: 0, payment_status: 'unpaid' },
  { id: 8, customer_name: 'Rosa León', service_name: 'Tinte completo', service_id: 2, start_at: iso('2026-10-14', 14), end_at: iso('2026-10-14', 15), status: 'confirmed', origin: 'chat', phone: '593975551111@c.us', price_cents: 3500, paid_cents: 0, payment_status: 'unpaid' },
];
appointments.push({ id: 9, customer_name: 'Lucía Montalvo', service_name: 'Tinte completo', service_id: 2, start_at: iso('2026-10-03', 11), end_at: iso('2026-10-03', 12, 30), status: 'confirmed', origin: 'whatsapp', phone: '593984441122@c.us', price_cents: 3500, paid_cents: 0, payment_status: 'unpaid' });
const services = [
  { id: 1, name: 'Corte de cabello', description: 'Corte y peinado', duration_minutes: 60, price: 7, enabled: true },
  { id: 2, name: 'Tinte completo', description: '', duration_minutes: 90, price: 35, enabled: true },
  { id: 3, name: 'Manicure', description: 'Esmaltado tradicional', duration_minutes: 60, price: 12, enabled: false },
];
let settings = {
  aiMode: 'owner', appointmentDurationMinutes: 60, businessTimezone: 'America/Guayaquil', slotIntervalMinutes: 15,
  minimumBookingNoticeMinutes: 30, maximumAdvanceBookingDays: 31, closedDates: ['2026-12-25'],
  businessHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, enabled: day !== 0, start: '09:00', end: day === 6 ? '14:00' : '18:00' })),
  businessProfile: { businessName: 'Salón Iguana', communicationStyle: 'semiformal', preferredTone: '', greeting: 'Hola, gracias por escribirnos.', address: 'Av. Amazonas N24, Quito', contactPhone: '+593 98 765 4321', cancellationPolicy: '', arrivalInstructions: '', generalNotes: '', acceptedPaymentMethods: ['Efectivo', 'Transferencia'] },
};
const customers = [
  { id: 1, first_name: 'Esteban', last_name: 'Andrade', full_name: 'Esteban Andrade', phone: '593987654321', cedula_ruc: '1712345678', address: 'La Floresta', telegram_username: 'Esteban', contact_channel: 'telegram', appointment_count: 2 },
  { id: 2, first_name: 'Marcela', last_name: 'Vinueza', full_name: 'Marcela Vinueza', phone: '', cedula_ruc: '', address: '', telegram_username: 'marcelavz', contact_channel: 'telegram', appointment_count: 1 },
  { id: 3, first_name: 'Julián', last_name: 'Paredes', full_name: 'Julián Paredes', phone: '593991112233', cedula_ruc: '', address: '', telegram_username: '', contact_channel: 'whatsapp', appointment_count: 1 },
];
let expenses = [
  { id: 1, expense_date: '2026-10-02', description: 'Compra de tintes', notes: 'Pedido mensual', category: 'Insumos', supplier: 'Distribuidora Andina', payment_method: 'Transferencia', bank: 'Pichincha', document_type: 'Factura', document_number: '001-001-000012345', amount: 84.5, receipt_url: '' },
  { id: 2, expense_date: '2026-10-01', description: 'Arriendo del local', notes: '', category: 'Arriendo', supplier: '', payment_method: 'Efectivo', bank: '', document_type: '', document_number: '', amount: 320, receipt_url: '' },
];
let documents = [{ id: 1, name: 'precios-2026.pdf', size_bytes: 48210, created_at: '2026-09-20 10:00:00' }];

const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((resolve) => { const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => resolve(Buffer.concat(chunks).toString())); });

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (p === '/__mock') { ROLE = url.searchParams.get('role') || 'admin'; AUTH = url.searchParams.get('auth') !== '0'; return send(res, 200, { ROLE, AUTH }); }
  if (p.startsWith('/api/')) {
    const body = req.method === 'GET' ? '' : await readBody(req);
    if (p === '/api/auth/me') {
      if (!AUTH) return send(res, 401, { error: 'No autenticado' });
      if (ROLE === 'super') return send(res, 200, { user: { id: 9, username: 'moderador', role: 'super_admin' }, companies: [{ id: 1, name: 'Salón Iguana', status: 'active', admin_count: 1, created_at: '2026-08-01 10:00:00', owner_username: 'Esteban', owner_phone: '593987654321' }] });
      return send(res, 200, { user: { id: 1, username: 'Esteban', role: 'admin', companyName: 'Salón Iguana', mustChangePassword: ROLE === 'mustchange' } });
    }
    if (p === '/api/auth/login') return JSON.parse(body).password === 'bad' ? send(res, 401, { error: 'Usuario o contraseña incorrectos.' }) : send(res, 200, { user: {} });
    if (p === '/api/settings') { if (req.method === 'PUT') settings = JSON.parse(body); return send(res, 200, settings); }
    if (p === '/api/appointments') return send(res, 200, appointments);
    if (/^\/api\/appointments\/\d+\/(payment|cancel|reschedule)$/.test(p)) return send(res, 200, { ok: true });
    if (p === '/api/services') return send(res, 200, services);
    if (p === '/api/customers') return send(res, 200, customers);
    const cm = p.match(/^\/api\/customers\/(\d+)$/);
    if (cm) {
      const c = customers.find((x) => x.id === Number(cm[1]));
      return send(res, 200, { ...c, appointments: appointments.filter((a) => a.customer_name === c.full_name) });
    }
    if (p === '/api/expenses') {
      if (req.method === 'POST') { expenses.unshift({ id: Date.now(), expense_date: '2026-10-03', description: 'Nuevo gasto', category: 'Otros', payment_method: 'Efectivo', amount: 10 }); return send(res, 200, {}); }
      return send(res, 200, expenses);
    }
    if (/^\/api\/expenses\/\d+$/.test(p)) { expenses = expenses.filter((e) => e.id !== Number(p.split('/').pop())); return send(res, 200, {}); }
    if (p === '/api/income') {
      const list = appointments.filter((a) => a.status !== 'cancelled').map((a) => ({ ...a, appointment_status: a.status, outstanding_cents: a.price_cents - a.paid_cents }));
      return send(res, 200, { summary: { expected_cents: 10600, paid_cents: 2200, outstanding_cents: 8400, appointments: list.length }, appointments: list });
    }
    if (p === '/api/dashboard') {
      return send(res, 200, {
        summary: { income_cents: 220000, expenses_cents: 40450, profit_cents: 179550, outstanding_cents: 8400, services_count: 7, unpaid_people: 5 },
        service_breakdown: [{ service_name: 'Corte de cabello', appointments: 14 }, { service_name: 'Tinte completo', appointments: 6 }, { service_name: 'Manicure', appointments: 3 }],
        daily_activity: Array.from({ length: 12 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, income_cents: 4000 + ((i * 7919) % 15000), expenses_cents: (i * 3331) % 9000 })),
        unpaid: [{ customer_name: 'Esteban Andrade', service_name: 'Corte de cabello', start_at: iso('2026-10-05', 10), paid_cents: 0, outstanding_cents: 700 }, { customer_name: 'Marcela Vinueza', service_name: 'Tinte completo', start_at: iso('2026-10-05', 15), paid_cents: 1500, outstanding_cents: 2000 }],
      });
    }
    if (p === '/api/ai-documents') return send(res, 200, documents);
    if (p === '/api/moderator/ai-settings') return send(res, 200, { onboardingEnabled: true, firstStepsEnabled: false });
    if (p === '/api/moderator/companies') return send(res, 200, { companies: [] });
    return send(res, 404, { error: 'No encontrado' });
  }
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('mock on', PORT));
