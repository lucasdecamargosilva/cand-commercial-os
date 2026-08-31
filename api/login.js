// ── LOGIN.JS — valida usuário/senha NO SERVIDOR ───────────────
// Os usuários vêm do Supabase (ou do APP_USERS, se o Supabase não
// estiver configurado). Senha nunca trafega para o navegador.
import { sign, SESSION_TTL_MS } from './_auth.js';
import { findUser, verifyPassword, dummyVerify, authSource } from './_users.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const source = authSource();
  if (!source) {
    return res.status(503).json({ error: 'Login indisponível: configure SUPABASE_URL + SUPABASE_SERVICE_KEY (ou APP_USERS) no servidor.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const username = String(body.user || '').toLowerCase().trim();
  const password = String(body.pass || '');
  if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha.' });

  let user;
  try {
    user = await findUser(username);
  } catch (err) {
    console.error('[login] falha ao consultar usuários:', err.message);
    return res.status(503).json({ error: 'Não foi possível verificar o login agora. Tente de novo em instantes.' });
  }

  // Sem usuário (ou desativado) ainda gasta o tempo de um hash,
  // para não revelar quais logins existem.
  if (!user || !user.ativo) { await dummyVerify(password); return res.status(401).json({ error: 'Usuário ou senha incorretos.' }); }

  const ok = await verifyPassword(password, user.senha);
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  const session = {
    u: user.username,
    role: user.role,
    name: user.nome,
    creator: user.creator,
    exp: Date.now() + SESSION_TTL_MS
  };

  return res.status(200).json({
    token: sign(session),
    user: { username: session.u, role: session.role, name: session.name, creator: session.creator }
  });
}
