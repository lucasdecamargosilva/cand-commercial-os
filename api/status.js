import { requireAuth } from './_auth.js';

// Estado em memória — some a cada cold start da função.
// Para histórico real de sincronização, persistir em banco.
export let lastSync = null;
export function markSynced(ts) { lastSync = ts; }

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  return res.status(200).json({
    syncedAt:        lastSync,              // null enquanto ninguém sincronizou
    shopifyConfigured: !!TOKEN,
    autoSyncEnabled: !!TOKEN,
    dailyTime:       '06:00'
  });
}
