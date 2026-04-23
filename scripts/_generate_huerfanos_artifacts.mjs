import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Books huérfanos = sin ningún listing asociado
const { data: books } = await s.from('books').select('id, title, author, isbn, publisher, published_year, created_at, created_by');
const { data: listings } = await s.from('listings').select('book_id');
const withListing = new Set(listings.map(l => l.book_id));
const orphans = books.filter(b => !withListing.has(b.id));

const { data: users } = await s.from('users').select('id, username, email, full_name');
const vero = users.find(u => u.username === 'vero');
const cim = users.find(u => u.username === 'cimlibros');

const veroOrphans = orphans.filter(b => b.created_by === vero?.id).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
const cimOrphans = orphans.filter(b => b.created_by === cim?.id).sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));

console.log(`Vero: ${veroOrphans.length} huérfanos`);
console.log(`CIMLibros: ${cimOrphans.length} huérfanos`);

// ════════════════════════════════════════════════════════════
// ARTEFACTO 1 — HTML para que Vero revise sus 49 y decida
// ════════════════════════════════════════════════════════════
const veroHtml = `<!DOCTYPE html>
<html lang="es-CL">
<head>
<meta charset="UTF-8">
<title>Mis libros huérfanos — tuslibros.cl</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #faf7f1; color: #2d2e3d; padding: 40px 24px; }
  .container { max-width: 980px; margin: 0 auto; }
  h1 { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 500; color: #1a1a2e; margin-bottom: 8px; }
  .subtitle { color: #8b8b9c; font-size: 15px; margin-bottom: 32px; }
  .controls { background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .controls button { padding: 8px 16px; border-radius: 8px; border: 1px solid #1a1a2e; background: white; cursor: pointer; font-size: 13px; font-weight: 600; }
  .controls button.primary { background: #1a1a2e; color: white; }
  .controls .summary { margin-left: auto; font-size: 13px; color: #8b8b9c; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: white; padding: 16px; border-radius: 12px; }
  .stat .num { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #d4a017; line-height: 1; }
  .stat .lbl { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8b8b9c; margin-top: 4px; font-weight: 600; }
  table { width: 100%; background: white; border-radius: 12px; overflow: hidden; border-collapse: collapse; }
  th, td { padding: 12px 14px; text-align: left; font-size: 13px; border-bottom: 1px solid #f0ecdf; }
  th { background: #f3ead5; color: #1a1a2e; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; position: sticky; top: 0; }
  tr.rescue { background: #fef6e3; }
  tr.trash { opacity: 0.4; text-decoration: line-through; }
  .check-col { width: 50px; text-align: center; }
  .date-col { width: 100px; color: #8b8b9c; font-size: 11px; }
  .isbn-col { width: 120px; color: #8b8b9c; font-size: 12px; font-family: ui-monospace, monospace; }
  .action-col { width: 180px; }
  .action-btn { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; border: none; cursor: pointer; margin-right: 4px; }
  .action-btn.rescue { background: #d4a017; color: white; }
  .action-btn.trash { background: #c14040; color: white; }
  .action-btn.skip { background: #e0e0e8; color: #2d2e3d; }
  .note { background: #fef6e3; border-left: 3px solid #d4a017; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
  details { margin-top: 24px; background: white; padding: 16px 20px; border-radius: 12px; }
  summary { font-weight: 600; cursor: pointer; }
  .export-area { background: white; padding: 16px; border-radius: 8px; margin-top: 16px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
</style>
</head>
<body>
<div class="container">
  <h1>Tus libros huérfanos</h1>
  <p class="subtitle">Books que escaneaste o iniciaste publicar pero nunca convertiste en listing activo. Decide cuál rescatar y cuál tirar.</p>

  <div class="note">
    <strong>Cómo usar esta lista:</strong> para cada libro, click en <em>Rescatar</em> (quedará en amarillo, yo te lo publico después) o <em>Tirar</em> (queda tachado, lo borramos). Cuando termines, el bloque al final te da el CSV de IDs para pasarme. No se guarda nada todavía — esto es tu hoja de trabajo.
  </div>

  <div class="stats">
    <div class="stat"><div class="num">${veroOrphans.length}</div><div class="lbl">Total huérfanos tuyos</div></div>
    <div class="stat"><div class="num" id="count-rescue">0</div><div class="lbl">Para rescatar</div></div>
    <div class="stat"><div class="num" id="count-trash">0</div><div class="lbl">Para tirar</div></div>
  </div>

  <div class="controls">
    <button onclick="markAll('rescue')">Rescatar todos</button>
    <button onclick="markAll('trash')">Tirar todos</button>
    <button onclick="markAll('skip')">Limpiar selección</button>
    <button class="primary" onclick="exportLists()">Exportar listas</button>
    <div class="summary" id="summary">0 rescatar · 0 tirar · ${veroOrphans.length} sin decidir</div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="check-col">#</th>
        <th>Título</th>
        <th>Autor</th>
        <th class="isbn-col">ISBN</th>
        <th class="date-col">Creado</th>
        <th class="action-col">Acción</th>
      </tr>
    </thead>
    <tbody>
${veroOrphans.map((b, i) => `      <tr id="row-${b.id}" data-id="${b.id}">
        <td class="check-col">${i + 1}</td>
        <td>${escape(b.title || '(sin título)')}${b.publisher ? `<br><small style="color:#8b8b9c">${escape(b.publisher)}${b.published_year ? ' · ' + b.published_year : ''}</small>` : ''}</td>
        <td>${escape(b.author || '')}</td>
        <td class="isbn-col">${b.isbn || '—'}</td>
        <td class="date-col">${b.created_at?.slice(0, 10)}</td>
        <td class="action-col">
          <button class="action-btn rescue" onclick="mark('${b.id}', 'rescue')">Rescatar</button>
          <button class="action-btn trash" onclick="mark('${b.id}', 'trash')">Tirar</button>
          <button class="action-btn skip" onclick="mark('${b.id}', 'skip')">—</button>
        </td>
      </tr>`).join('\n')}
    </tbody>
  </table>

  <details>
    <summary>Lista exportada (después de marcar)</summary>
    <div class="export-area" id="export">Marca los libros y presiona "Exportar listas" para generar el CSV aquí.</div>
  </details>
</div>

<script>
const state = {};
function mark(id, action) {
  state[id] = action;
  const row = document.getElementById('row-' + id);
  row.classList.remove('rescue', 'trash');
  if (action === 'rescue') row.classList.add('rescue');
  else if (action === 'trash') row.classList.add('trash');
  updateSummary();
}
function markAll(action) {
  document.querySelectorAll('tbody tr').forEach(tr => mark(tr.dataset.id, action));
}
function updateSummary() {
  let r = 0, t = 0;
  Object.values(state).forEach(v => { if (v === 'rescue') r++; else if (v === 'trash') t++; });
  const s = ${veroOrphans.length} - r - t;
  document.getElementById('summary').textContent = r + ' rescatar · ' + t + ' tirar · ' + s + ' sin decidir';
  document.getElementById('count-rescue').textContent = r;
  document.getElementById('count-trash').textContent = t;
}
function exportLists() {
  const rescue = [], trash = [];
  document.querySelectorAll('tbody tr').forEach(tr => {
    const id = tr.dataset.id;
    const title = tr.cells[1].innerText.split('\\n')[0];
    if (state[id] === 'rescue') rescue.push({ id, title });
    else if (state[id] === 'trash') trash.push({ id, title });
  });
  const out = [
    '═══ RESCATAR (' + rescue.length + ') ═══',
    rescue.map(b => b.id + ' · ' + b.title).join('\\n') || '(ninguno)',
    '',
    '═══ TIRAR (' + trash.length + ') ═══',
    trash.map(b => b.id + ' · ' + b.title).join('\\n') || '(ninguno)',
  ].join('\\n');
  document.getElementById('export').textContent = out;
}
</script>
</body>
</html>`;

writeFileSync('docs/books_huerfanos_vero.html', veroHtml);
console.log('✓ docs/books_huerfanos_vero.html generado');

// ════════════════════════════════════════════════════════════
// ARTEFACTO 2 — Mensaje WhatsApp para CIMLibros
// ════════════════════════════════════════════════════════════
const cimWhatsapp = `Hola! Te escribo de tuslibros.cl. Estuve revisando la cuenta y vi que tienes 14 libros escaneados pero sin terminar de publicar. ¿Quieres que los retome contigo? Acá va la lista ordenada por fecha:

${cimOrphans.map((b, i) => `${i + 1}. *${b.title || '(sin título)'}*${b.author ? ' — ' + b.author : ''}${b.isbn ? ' (ISBN ' + b.isbn + ')' : ''}`).join('\n')}

Dos opciones:
- Los publico yo si me dices precio y condición (nuevo, muy bueno, bueno) para cada uno
- Tú entras a /publish y los completas uno por uno — en el escáner ISBN el libro aparece directo

Si alguno no quieres publicar, lo borro y listo. Avísame.

Un abrazo,
Vero`;

writeFileSync('docs/mensaje_cimlibros_whatsapp.md', cimWhatsapp);
console.log('✓ docs/mensaje_cimlibros_whatsapp.md generado');

function escape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
