// ── _AUTH.JS — assinatura e verificação do token de sessão ────
// Não é um endpoint. Só helpers usados pelos outros handlers.
import crypto from 'node:crypto';

// Se AUTH_SECRET não estiver configurado, geramos um por instância:
// funciona, mas derruba as sessões a cada redeploy. Configure em produção.
const SECRET  = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac  = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + mac;
}

export function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  if (!p || typeof p.exp !== 'number' || Date.now() > p.exp) return null;
  return p;
}

// Retorna a sessão, ou responde 401 e retorna null.
export function requireAuth(req, res) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  const s = verify(t);
  if (!s) { res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' }); return null; }
  return s;
}
