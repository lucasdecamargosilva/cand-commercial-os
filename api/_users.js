// ── _USERS.JS — de onde vêm os usuários e como a senha é conferida ──
// Fonte primária: tabela no Supabase (SUPABASE_URL + SUPABASE_SERVICE_KEY).
// Se essas variáveis não existirem, cai no APP_USERS. Assim dá pra migrar
// sem derrubar o login.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 64, MAXMEM = 64 * 1024 * 1024;

// ── Hash ──────────────────────────────────────────────────────
export async function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const key  = await scrypt(String(plain), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || !stored) return false;

  // Texto puro: só existe no fallback APP_USERS. No Supabase, sempre hash.
  if (!stored.startsWith('scrypt$')) {
    const a = Buffer.from(stored), b = Buffer.from(String(plain));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  const parts = stored.split('$');
  if (parts.length !== 6) return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  let key;
  try {
    key = await scrypt(String(plain), Buffer.from(saltB64, 'base64'), expected.length,
                       { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM });
  } catch { return false; }
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
}

// Gasta o mesmo tempo de um hash real quando o usuário não existe,
// pra não dar pra descobrir quais logins são válidos pelo relógio.
export async function dummyVerify(plain) {
  try { await scrypt(String(plain), crypto.randomBytes(16), KEYLEN, { N, r: R, p: P, maxmem: MAXMEM }); } catch {}
  return false;
}

// ── De onde vêm os usuários ───────────────────────────────────
function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!url || !key) return null;
  return { url, key, table: process.env.SUPABASE_USERS_TABLE || 'usuarios' };
}

export function authSource() {
  if (supabaseConfig()) return 'supabase';
  if (process.env.APP_USERS) return 'env';
  return null;
}

function normalize(row) {
  if (!row) return null;
  return {
    username: String(row.username || '').toLowerCase(),
    senha:    row.senha_hash != null ? row.senha_hash : row.pass,
    nome:     row.nome || row.name || row.username,
    role:     row.role === 'owner' ? 'owner' : 'creator',
    creator:  row.creator || null,
    ativo:    row.ativo === undefined ? true : !!row.ativo
  };
}

async function findInSupabase(cfg, username) {
  const q = `${cfg.url}/rest/v1/${encodeURIComponent(cfg.table)}`
          + `?select=username,senha_hash,nome,role,creator,ativo`
          + `&username=eq.${encodeURIComponent(username)}&limit=1`;
  const res = await fetch(q, {
    headers: {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      Accept: 'application/json'
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
  }
  const rows = await res.json();
  return normalize(Array.isArray(rows) ? rows[0] : null);
}

function findInEnv(username) {
  let map;
  try { map = JSON.parse(process.env.APP_USERS); } catch { return null; }
  if (!map || typeof map !== 'object' || Array.isArray(map)) return null;
  const row = map[username];
  return row ? normalize({ ...row, username }) : null;
}

// Retorna o usuário, ou null. Lança se o Supabase estiver fora do ar —
// o login trata isso como 503, não como senha errada.
export async function findUser(username) {
  const cfg = supabaseConfig();
  if (cfg) return findInSupabase(cfg, username);
  return findInEnv(username);
}
