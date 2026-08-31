import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start e end obrigatórios' });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY não configurado', products: [], needsKey: true });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-api-key':API_KEY,
        'anthropic-version':'2023-06-01',
        'anthropic-beta':'mcp-client-2025-11-20'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        mcp_servers: [{ type:'url', url:'https://mcp-solomon-685646918301.us-east1.run.app/mcp', name:'solomon' }],
        tools: [{ type:'mcp_toolset', mcp_server_name:'solomon' }],
        messages: [{
          role: 'user',
          content: `Use get_product_performance da Solomon com time_range {"start":"${start}","end":"${end}"} e limit 100 sort_by revenue. Retorne APENAS JSON sem markdown: [{"id":"product_id","title":"nome","revenue":0,"units":0,"conv":0.0}]`
        }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || ('Anthropic ' + response.status), products: [] });
    }
    const text = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.status(502).json({ error: 'A Solomon não retornou dados no formato esperado.', products: [] });
    return res.status(200).json({ products: JSON.parse(match[0]) });
  } catch(err) {
    return res.status(502).json({ error: err.message, products: [] });
  }
}
