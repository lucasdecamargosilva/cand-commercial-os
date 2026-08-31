// ── AUTH.JS — Login e controle de acesso ─────────────────────
// As senhas NÃO ficam aqui. Quem valida é /api/login (env APP_USERS).

var currentUser = null;
var authToken   = null;

// fetch com o token da sessão. Use isto em toda chamada a /api/*.
function authFetch(url, opts) {
  opts = opts || {};
  var headers = Object.assign({}, opts.headers || {});
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  return fetch(url, Object.assign({}, opts, { headers: headers })).then(function (res) {
    if (res.status === 401) { doLogout('Sessão expirada. Entre novamente.'); }
    return res;
  });
}

function saveSession(token, user) {
  authToken   = token;
  currentUser = user;
  try { sessionStorage.setItem('candAuth', JSON.stringify({ token: token, user: user })); } catch (e) {}
}

function clearSession() {
  authToken = null;
  currentUser = null;
  try { sessionStorage.removeItem('candAuth'); } catch (e) {}
}

async function doLogin() {
  var uEl   = document.getElementById('loginUser');
  var pEl   = document.getElementById('loginPass');
  var errEl = document.getElementById('loginError');
  if (!uEl || !pEl) return;
  if (errEl) errEl.textContent = '';

  try {
    var res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: uEl.value.toLowerCase().trim(), pass: pEl.value })
    });
    var payload = await res.json().catch(function () { return {}; });
    if (!res.ok) { if (errEl) errEl.textContent = payload.error || 'Não foi possível entrar.'; return; }

    saveSession(payload.token, payload.user);
    pEl.value = '';
    document.getElementById('loginScreen').style.display = 'none';
    startApp();
  } catch (e) {
    if (errEl) errEl.textContent = 'Servidor indisponível. Tente novamente.';
  }
}

function doLogout(msg) {
  clearSession();
  document.getElementById('loginScreen').style.display = 'flex';
  var u = document.getElementById('loginUser');
  var p = document.getElementById('loginPass');
  var e = document.getElementById('loginError');
  if (u) u.value = '';
  if (p) p.value = '';
  if (e) e.textContent = msg || '';
}

function startApp() {
  if (!currentUser) return;

  // Botão de sair — reaproveita o existente e atualiza o nome de quem está logado.
  var lb = document.getElementById('logoutBtn');
  if (!lb) {
    var navEl = document.getElementById('nav');
    lb = document.createElement('button');
    lb.id = 'logoutBtn';
    lb.style.cssText = 'background:none;border:1px solid #444;color:#aaa;border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;margin:10px 16px 0;display:block;width:calc(100% - 32px)';
    lb.onclick = function () { doLogout(); };
    if (navEl && navEl.parentElement) navEl.parentElement.appendChild(lb);
  }
  lb.textContent = 'Sair (' + currentUser.name + ')';

  // Controle de acesso por role
  var nav = document.getElementById('nav');
  if (nav) {
    nav.querySelectorAll('button').forEach(function (b) { b.style.display = ''; });
    if (currentUser.role === 'creator') {
      nav.querySelectorAll('button').forEach(function (b) {
        if (b.dataset.view !== 'creatives') b.style.display = 'none';
      });
    }
  }

  // Conteúdo comum
  if (typeof renderLibrary   === 'function') renderLibrary();
  if (typeof renderCalendar  === 'function') renderCalendar();
  if (typeof renderUpcoming  === 'function') renderUpcoming();
  if (typeof loadSyncStatus  === 'function') loadSyncStatus();
  if (typeof loadShopifyProducts === 'function') loadShopifyProducts();

  if (currentUser.role === 'creator') {
    showView('creatives');
    if (typeof selectCreator === 'function') selectCreator(currentUser.creator);
  }
}

// Retoma a sessão depois de um F5 (dura enquanto a aba estiver aberta).
// Espera o DOMContentLoaded: products-ext.js e creatives-ext.js carregam
// depois deste arquivo e startApp() depende das funções deles.
document.addEventListener('DOMContentLoaded', function restore() {
  var raw = null;
  try { raw = sessionStorage.getItem('candAuth'); } catch (e) {}
  if (!raw) return;
  try {
    var s = JSON.parse(raw);
    if (!s || !s.token || !s.user) return;
    authToken = s.token;
    currentUser = s.user;
    document.getElementById('loginScreen').style.display = 'none';
    startApp();
  } catch (e) { clearSession(); }
});
