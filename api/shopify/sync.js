import { requireAuth } from '../_auth.js';
import { markSynced } from '../status.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAuth(req, res)) return;

  const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'candstore-br.myshopify.com';
  const TOKEN  = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN não configurado no servidor.' });

  try {
    const r = await fetch(`https://${DOMAIN}/admin/api/2024-01/products.json?limit=250&fields=id,title,variants`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    if (!r.ok) return res.status(502).json({ error: 'Shopify respondeu ' + r.status + ' ' + r.statusText });
    const { products } = await r.json();
    const syncedAt = new Date().toISOString();
    markSynced(syncedAt);
    return res.status(200).json({ success: true, total: products?.length || 0, syncedAt });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
