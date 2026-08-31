// ── PRODUCTS-EXT.JS — Sobrescreve funções de produto do MVP ──
// Adiciona: busca, filtro, ordenação, date picker, integração real Shopify

var _shopifyAll = [];
var _sortCol    = 'revenue60d';
var _sortAsc    = false;
var _currentPeriod = '60d';
var _customStart   = '';
var _customEnd     = '';

// ── Date Picker ───────────────────────────────────────────────
function onPeriodChange(val) {
  var cr = document.getElementById('customRange');
  if (cr) cr.style.display = val === 'custom' ? 'flex' : 'none';
  if (val !== 'custom') {
    _currentPeriod = val;
    loadShopifyProducts();
  }
}

function applyCustomPeriod() {
  var s = document.getElementById('dateStart') && document.getElementById('dateStart').value;
  var e = document.getElementById('dateEnd')   && document.getElementById('dateEnd').value;
  if (!s || !e) { alert('Selecione início e fim do período.'); return; }
  _currentPeriod = 'custom';
  _customStart   = s;
  _customEnd     = e;
  loadShopifyProducts();
}

// ── Filtro e ordenação ────────────────────────────────────────
function filterProducts() {
  var q = (document.getElementById('productSearch') && document.getElementById('productSearch').value || '').toLowerCase();
  var c = document.getElementById('productCurve') && document.getElementById('productCurve').value || '';
  var rows = _shopifyAll.filter(function(r) {
    return (!q || r.title.toLowerCase().includes(q)) && (!c || r.curve === c);
  });
  rows.sort(function(a, b) {
    var va = a[_sortCol] != null ? a[_sortCol] : '';
    var vb = b[_sortCol] != null ? b[_sortCol] : '';
    if (typeof va === 'string') return _sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return _sortAsc ? va - vb : vb - va;
  });
  renderShopifyTable(rows);
}

function sortProducts(col) {
  if (_sortCol === col) { _sortAsc = !_sortAsc; }
  else { _sortCol = col; _sortAsc = col === 'title' || col === 'curve'; }
  document.querySelectorAll('[id^="sort_"]').forEach(function(el) {
    var c = el.id.replace('sort_', '');
    el.textContent = c !== _sortCol ? '' : (_sortAsc ? ' ↑' : ' ↓');
  });
  filterProducts();
}

// ── Renderização da tabela ────────────────────────────────────
function renderShopifyTable(rows) {
  var body = document.getElementById('shopifyProductsBody');
  if (!body) return;
  var mBR = function(v) { return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(Number(v||0)); };
  if (!rows || !rows.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Nenhum produto. Clique em Sincronizar Shopify.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(function(r) {
    var cc = r.curve === 'A' ? 'valid' : r.curve === 'B' ? 'plan' : 'test';
    var dc = r.diagnostic && r.diagnostic.includes('Ruptura') ? 'weak' : r.diagnostic && r.diagnostic.includes('Escalar') ? 'valid' : 'test';
    var inv = r.inventory > 0 ? r.inventory : '—';
    var st  = r.inventory > 0 ? (r.sellThroughEstimated * 100).toFixed(0) + '%' : '—';
    var diag = r.diagnostic && r.diagnostic !== 'Monitorar' ? '<span class="badge ' + dc + '">' + r.diagnostic + '</span>' : '—';
    return '<tr>'
      + '<td><b>' + r.title + '</b></td>'
      + '<td><span class="badge ' + cc + '">' + r.curve + '</span></td>'
      + '<td title="Receita dos últimos ' + (_currentPeriod==='custom'?_customStart+' a '+_customEnd:_currentPeriod) + ' (Solomon)">' + mBR(r.revenue60d) + '</td>'
      + '<td>' + (r.units60d || '—') + '</td>'
      + '<td title="Estoque atual (Shopify)">' + inv + '</td>'
      + '<td title="Unidades vendidas ÷ (vendidas + estoque atual)">' + st + '</td>'
      + '<td>—</td>'
      + '<td>' + diag + '</td>'
      + '</tr>';
  }).join('');
}

// ── Carga de produtos (sobrescreve versão do MVP) ─────────────
async function loadShopifyProducts() {
  var body = document.getElementById('shopifyProductsBody');
  if (body) body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Carregando...</td></tr>';
  try {
    var url = '/api/products?period=' + (_currentPeriod || '60d');
    if (_currentPeriod === 'custom' && _customStart && _customEnd) {
      url = '/api/products?start=' + _customStart + '&end=' + _customEnd;
    }
    var res  = await authFetch(url);
    var rows = await res.json();
    if (!Array.isArray(rows)) {
      var msg = (rows && rows.error) ? rows.error : 'Resposta inesperada da API.';
      _shopifyAll = [];
      if (body) body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">' + msg + '</td></tr>';
      return;
    }
    _shopifyAll = rows;
    filterProducts();
    // Atualizar criativos se aberto
    var active = document.querySelector('.creator-tab.primary');
    if (active && typeof selectCreator === 'function') selectCreator(active.dataset.creator);
  } catch(e) {
    if (body) body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Erro ao carregar produtos: ' + e.message + '</td></tr>';
  }
}

async function loadSyncStatus() {
  try {
    var r = await authFetch('/api/status');
    var s = await r.json();
    var st = document.getElementById('shopifyStatus');
    var la = document.getElementById('shopifyLastSync');
    if (st) st.value = s.syncedAt ? 'Sincronizado' : (s.shopifyConfigured ? 'Configurado — nunca sincronizado' : 'Não configurado');
    if (la) la.value = s.syncedAt ? new Date(s.syncedAt).toLocaleString('pt-BR') : '—';
  } catch(e) {}
}

async function syncShopify() {
  var btn = document.getElementById('shopifySyncBtn');
  var st  = document.getElementById('shopifyStatus');
  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Sincronizando...'; }
    if (st) st.value = 'Sincronizando...';
    var res = await authFetch('/api/shopify/sync', { method: 'POST' });
    var p   = await res.json();
    if (!res.ok) throw new Error(p.error || 'Falha na sincronização');
    if (st) st.value = 'Conectado';
    await loadShopifyProducts();
    alert('Shopify sincronizada: ' + p.total + ' produtos carregados.');
  } catch(err) {
    if (st) st.value = 'Erro';
    alert('Erro ao sincronizar: ' + err.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↻ Sincronizar Shopify'; }
  }
}
