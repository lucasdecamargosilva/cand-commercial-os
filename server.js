// ── SERVER.JS — servidor único para EasyPanel ─────────────────
// Serve o front (index.html + js/) e executa os handlers de api/.
// Sem dependências: só o Node. Não precisa de npm install.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// Só estes arquivos vão para o navegador. Tudo mais (api/, .env,
// package.json, server.js) fica fora do alcance de quem acessa.
const PUBLIC = {
  '/':                    { file: 'index.html',          type: 'text/html; charset=utf-8' },
  '/index.html':          { file: 'index.html',          type: 'text/html; charset=utf-8' },
  '/js/auth.js':          { file: 'js/auth.js',          type: 'text/javascript; charset=utf-8' },
  '/js/products-ext.js':  { file: 'js/products-ext.js',  type: 'text/javascript; charset=utf-8' },
  '/js/creatives-ext.js': { file: 'js/creatives-ext.js', type: 'text/javascript; charset=utf-8' },
};

// Rotas de API → arquivo do handler.
const ROUTES = {
  '/api/login':               'api/login.js',
  '/api/status':              'api/status.js',
  '/api/products':            'api/products.js',
  '/api/solomon-performance': 'api/solomon-performance.js',
  '/api/shopify/sync':        'api/shopify/sync.js',
};

// Cache dos módulos: importa uma vez só.
const handlers = new Map();
async function getHandler(rel) {
  if (!handlers.has(rel)) {
    const mod = await import(pathToFileURL(path.join(ROOT, rel)).href);
    handlers.set(rel, mod.default);
  }
  return handlers.get(rel);
}

// Dá a um `res` do Node os métodos .status()/.json() que os handlers esperam.
function adapt(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 1_000_000) throw new Error('Corpo da requisição grande demais');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  adapt(res);
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return res.status(400).json({ error: 'URL inválida' }); }
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // Checagem de saúde para o EasyPanel.
  if (pathname === '/healthz') return res.status(200).json({ ok: true });

  const route = ROUTES[pathname];
  if (route) {
    try {
      req.query = Object.fromEntries(url.searchParams);
      const raw = await readBody(req);
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      const handler = await getHandler(route);
      await handler(req, res);
      if (!res.writableEnded) res.status(500).json({ error: 'Handler não respondeu' });
    } catch (err) {
      console.error('[api]', pathname, err);
      if (!res.headersSent) res.status(500).json({ error: 'Erro interno' });
      else res.end();
    }
    return;
  }

  if (pathname.startsWith('/api/')) return res.status(404).json({ error: 'Rota não encontrada' });

  const asset = PUBLIC[pathname];
  if (!asset) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('Não encontrado'); }
  try {
    const buf = fs.readFileSync(path.join(ROOT, asset.file));
    res.setHeader('Content-Type', asset.type);
    res.setHeader('Cache-Control', 'no-cache');
    res.statusCode = 200;
    res.end(buf);
  } catch (err) {
    console.error('[static]', asset.file, err);
    res.statusCode = 500;
    res.end('Erro ao ler o arquivo');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Cand Commercial OS ouvindo na porta ${PORT}`);
  if (!process.env.APP_USERS) console.warn('AVISO: APP_USERS não configurado — o login vai recusar todo mundo.');
  if (!process.env.AUTH_SECRET) console.warn('AVISO: AUTH_SECRET não configurado — as sessões caem a cada restart.');
});
