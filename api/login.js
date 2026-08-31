// ── LOGIN.JS — valida usuário/senha NO SERVIDOR ───────────────
// As senhas vivem na env APP_USERS. Nunca no JavaScript do navegador.
import crypto from 'node:crypto';
import { sign, SESSION_TTL_MS } from './_auth.js';

function loadUsers() {
  const raw = process.env.APP_USERS;
  if (!raw) return null;
  try {
    const u = JSON.parse(raw);
    return (u && typeof u === 'object' && !Array.isArray(u)) ? u : null;
  } catch { return null; }
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a == null ? '' : a));
  const bb = Buffer.from(String(b == null ? '' : b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const users = loadUsers();
  if (!users) {
    return res.status(503).json({ error: 'Login indisponível: configure a variável APP_USERS no servidor.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const username = String(body.user || '').toLowerCase().trim();
  const password = String(body.pass || '');
  const u = users[username];

  // Compara sempre, mesmo sem usuário, pra não vazar quais logins existem.
  const ok = safeEqual(u ? u.pass : crypto.randomBytes(16).toString('hex'), password) && !!u;
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  const session = {
    u: username,
    role: u.role === 'owner' ? 'owner' : 'creator',
    name: u.name || username,
    creator: u.creator || null,
    exp: Date.now() + SESSION_TTL_MS
  };

  return res.status(200).json({
    token: sign(session),
    user: { username: session.u, role: session.role, name: session.name, creator: session.creator }
  });
}
