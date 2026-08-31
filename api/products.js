import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  const { period, start, end } = req.query;

  const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'candstore-br.myshopify.com';
  const TOKEN  = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!TOKEN) return res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN não configurado no servidor.' });

  // Datasets Solomon embarcados por período fixo
  const S7 = {'boston':{r:12053,u:75,c:'A'},'charlotte':{r:6010,u:26,c:'A'},'milano':{r:5948,u:37,c:'A'},'oxford':{r:4813,u:30,c:'A'},'bend':{r:4550,u:19,c:'A'},'berlim':{r:4048,u:16,c:'A'},'durban':{r:2970,u:13,c:'A'},'toledo':{r:2688,u:11,c:'A'},'paris':{r:2546,u:11,c:'A'},'lecce':{r:2379,u:9,c:'A'},'tailandia':{r:2231,u:10,c:'A'},'nancy':{r:2081,u:8,c:'A'},'toquio':{r:1833,u:7,c:'A'},'veneza':{r:1815,u:8,c:'A'},'atlanta':{r:1718,u:7,c:'A'},'nairobi':{r:1672,u:7,c:'A'},'marrocos':{r:1635,u:7,c:'A'},'clinton':{r:1456,u:6,c:'A'},'doha':{r:1368,u:9,c:'B'},'austin':{r:1311,u:8,c:'B'},'amsterda':{r:1277,u:6,c:'B'},'belgica':{r:1073,u:7,c:'B'},'viterbo':{r:956,u:6,c:'B'},'suecia':{r:805,u:5,c:'B'},'toronto':{r:791,u:5,c:'B'},'madrid':{r:761,u:5,c:'B'},'buzios':{r:742,u:5,c:'B'},'vicenza':{r:720,u:3,c:'B'},'barcelona':{r:671,u:4,c:'B'},'portugal':{r:628,u:3,c:'B'},'japao':{r:616,u:4,c:'C'},'argel':{r:611,u:3,c:'C'},'atenas':{r:605,u:4,c:'C'},'dubai':{r:597,u:3,c:'C'},'angra':{r:592,u:3,c:'C'},'malibu':{r:578,u:3,c:'C'},'cannes':{r:573,u:3,c:'C'},'holambra':{r:450,u:3,c:'C'},'napoles':{r:443,u:3,c:'C'},'versalhes':{r:353,u:2,c:'C'}};
  const S15 = {'boston':{r:17253,u:102,c:'A'},'bend':{r:10362,u:42,c:'A'},'oxford':{r:9704,u:54,c:'A'},'charlotte':{r:8127,u:36,c:'A'},'milano':{r:7480,u:45,c:'A'},'belgica':{r:6128,u:51,c:'A'},'durban':{r:5460,u:23,c:'A'},'veneza':{r:5418,u:23,c:'A'},'nancy':{r:5151,u:20,c:'A'},'toquio':{r:5141,u:21,c:'A'},'berlim':{r:5010,u:20,c:'A'},'lecce':{r:4908,u:19,c:'A'},'viterbo':{r:3866,u:21,c:'A'},'toledo':{r:3549,u:15,c:'A'},'paris':{r:3533,u:15,c:'A'},'atlanta':{r:3174,u:14,c:'A'},'toronto':{r:3119,u:27,c:'B'},'clinton':{r:3091,u:13,c:'B'},'amsterda':{r:2860,u:15,c:'B'},'marrocos':{r:2782,u:12,c:'B'},'madrid':{r:2740,u:22,c:'B'},'argel':{r:2639,u:13,c:'B'},'cannes':{r:2305,u:12,c:'B'},'suecia':{r:2243,u:20,c:'B'},'tailandia':{r:2231,u:10,c:'B'},'chicago':{r:2226,u:22,c:'B'},'colorado':{r:1965,u:8,c:'B'},'malibu':{r:1878,u:9,c:'B'},'nairobi':{r:1877,u:8,c:'B'},'londres':{r:1870,u:17,c:'B'},'bruges':{r:1860,u:17,c:'C'},'atenas':{r:1855,u:15,c:'C'},'portugal':{r:1831,u:8,c:'C'},'monteray':{r:1745,u:9,c:'C'},'vicenza':{r:1707,u:7,c:'C'},'doha':{r:1531,u:10,c:'C'},'austin':{r:1524,u:9,c:'C'},'dubai':{r:1370,u:8,c:'C'},'angra':{r:1217,u:6,c:'C'},'argentina':{r:1067,u:9,c:'C'}};
  const S60 = {'boston':{r:59423,u:356,c:'A'},'milano':{r:32812,u:200,c:'A'},'bend':{r:28915,u:115,c:'A'},'oxford':{r:27897,u:163,c:'A'},'nancy':{r:26157,u:116,c:'A'},'atlanta':{r:24834,u:114,c:'A'},'toquio':{r:20112,u:87,c:'A'},'paris':{r:19437,u:89,c:'A'},'viterbo':{r:18540,u:104,c:'A'},'durban':{r:18487,u:86,c:'A'},'dubai':{r:17160,u:86,c:'A'},'portugal':{r:16687,u:94,c:'A'},'cannes':{r:15864,u:80,c:'A'},'amsterda':{r:15338,u:85,c:'A'},'colmar':{r:15301,u:69,c:'A'},'capri':{r:15074,u:79,c:'A'},'lecce':{r:15035,u:65,c:'A'},'clinton':{r:13903,u:56,c:'A'},'devon':{r:12282,u:55,c:'A'},'nairobi':{r:11904,u:48,c:'A'},'argel':{r:11538,u:66,c:'A'},'charlotte':{r:11078,u:50,c:'A'},'suecia2em1':{r:10725,u:63,c:'A'},'monteray':{r:10610,u:59,c:'A'},'madrid':{r:10342,u:75,c:'A'},'toronto':{r:9804,u:75,c:'A'},'veneza':{r:8833,u:40,c:'A'},'bruges':{r:8498,u:64,c:'A'},'turin':{r:7679,u:40,c:'B'},'austin':{r:7678,u:48,c:'B'},'marrocos':{r:7579,u:35,c:'B'},'chicago':{r:7200,u:57,c:'B'},'dortmund':{r:6767,u:30,c:'B'},'londres':{r:6755,u:49,c:'B'},'atenas':{r:6664,u:49,c:'B'},'colorado':{r:6398,u:23,c:'B'},'belgica':{r:6128,u:51,c:'B'},'malibu':{r:5683,u:27,c:'B'},'doha':{r:5651,u:36,c:'B'},'barcelona':{r:5505,u:33,c:'B'},'ravena':{r:5290,u:24,c:'B'},'vicenza':{r:5120,u:23,c:'B'},'linz':{r:5024,u:23,c:'B'},'berlim':{r:5010,u:20,c:'B'},'napoles':{r:4918,u:35,c:'B'},'chile':{r:4725,u:22,c:'B'},'dallas':{r:4713,u:28,c:'B'},'verona':{r:4486,u:26,c:'B'},'toledo':{r:4381,u:20,c:'B'},'angra':{r:4376,u:19,c:'B'},'munique':{r:4360,u:28,c:'C'},'suecia':{r:4357,u:35,c:'C'},'roma':{r:3672,u:23,c:'C'},'versalhes':{r:2957,u:21,c:'C'},'buzios':{r:2942,u:21,c:'C'},'reims':{r:2828,u:16,c:'C'},'denver':{r:2618,u:13,c:'C'},'japao':{r:2609,u:15,c:'C'},'cancun':{r:2486,u:19,c:'C'},'argentina':{r:2395,u:18,c:'C'},'tailandia':{r:2375,u:11,c:'C'},'malta':{r:2299,u:16,c:'C'},'canada':{r:2236,u:14,c:'C'},'malaga':{r:2160,u:14,c:'C'},'holambra':{r:2148,u:9,c:'C'},'marbella':{r:2094,u:17,c:'C'},'monaco':{r:1912,u:14,c:'C'},'bari':{r:1896,u:12,c:'C'},'naxos':{r:1796,u:13,c:'C'},'ohio':{r:1783,u:8,c:'C'},'mexico':{r:1718,u:11,c:'C'},'italia':{r:1717,u:11,c:'C'},'miami':{r:1630,u:11,c:'C'},'cairo':{r:1504,u:10,c:'C'},'macau':{r:1208,u:10,c:'C'},'dinamarca':{r:467,u:3,c:'C'},'malasia':{r:354,u:2,c:'C'}};

  // ID → chave Solomon
  const ID_MAP = {'8357541511394':'boston','8852286537954':'milano','9155720577250':'bend','9089993900258':'oxford','9012993687778':'nancy','9243540947170':'atlanta','9012965179618':'toquio','9243482095842':'paris','9082410664162':'viterbo','9243531280610':'durban','9153419051234':'dubai','9185114259682':'portugal','9111180247266':'cannes','9197720535266':'amsterda','9095363887330':'colmar','9111182770402':'capri','9033282978018':'lecce','9113653280994':'clinton','9155783721186':'devon','9153433960674':'nairobi','9197713031394':'argel','9113658720482':'charlotte','9082401325282':'suecia2em1','9197711818978':'monteray','9217424589026':'madrid','9219948478690':'toronto','9243462959330':'veneza','9111168549090':'bruges','9082413252834':'turin','9111255679202':'austin','9155686301922':'marrocos','9219946217698':'chicago','9033552822498':'dortmund','9220068376802':'londres','9111225598178':'atenas','9243552121058':'colorado','9292404457698':'belgica','9243560640738':'malibu','9155709796578':'doha','9111261577442':'barcelona','9243470168290':'ravena','9033618882786':'vicenza','9082423738594':'linz','9300101759202':'berlim','9219943366882':'napoles','9113656426722':'chile','9153326481634':'dallas','9089995047138':'verona','9056020529378':'toledo','9197710901474':'angra','9220055040226':'munique','8985643516130':'suecia','9089997996258':'roma','9089998618850':'reims','8984769822946':'versalhes','9074958893282':'buzios','9153318584546':'japao','9219941335266':'cancun','9111285858530':'argentina','8867404939490':'tailandia','9220109467874':'malta','9153323598050':'canada','8915295338722':'malaga','9243573584098':'holambra','8980244988130':'marbella','9219941269730':'monaco','9055066783970':'bari','8984789188834':'naxos','9012980416738':'ohio','8118272327906':'mexico','8973655671010':'italia','9217462796514':'miami','9206753788130':'cairo','9220096884962':'macau','8860817326306':'dinamarca','8973646463202':'malasia'};

  // Para períodos personalizados — buscar Solomon via Anthropic
  let solomonCustom = null;
  let solomonError  = null;
  if (start && end) {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (API_KEY) {
      try {
        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':'application/json',
            'x-api-key':API_KEY,
            'anthropic-version':'2023-06-01',
            'anthropic-beta':'mcp-client-2025-11-20'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 4096,
            mcp_servers: [{ type:'url', url:'https://mcp-solomon-685646918301.us-east1.run.app/mcp', name:'solomon' }],
            tools: [{ type:'mcp_toolset', mcp_server_name:'solomon' }],
            messages: [{ role:'user', content:`Use get_product_performance da Solomon com time_range {"start":"${start}","end":"${end}"} e limit 100 sort_by revenue. Retorne APENAS JSON sem markdown: [{"id":"product_id_shopify","revenue":0,"units":0}]` }]
          })
        });
        const aiData = await aiRes.json();
        if (!aiRes.ok) throw new Error(aiData?.error?.message || ('Anthropic ' + aiRes.status));
        const text = (aiData.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
        const match = text.match(/\[[\s\S]*\]/);
        if (match) solomonCustom = JSON.parse(match[0]);
      } catch(e) { solomonError = e.message; /* cai no dataset fixo mais próximo */ }
    }
  }

  const S = solomonCustom ? null : (period==='7d' ? S7 : period==='15d' ? S15 : S60);

  function normKey(title) {
    return title.toLowerCase().replace(/[®©™]/g,'').replace(/óculos de grau.+?[-–]\s*/i,'').replace(/armação.+?[-–]\s*/i,'').replace(/[^a-z0-9]/g,'').replace(/(feminino|masculino|unissex|acetato|grau|sol|limitado)/g,'').trim();
  }

  try {
    const r = await fetch(`https://${DOMAIN}/admin/api/2024-01/products.json?limit=250&fields=id,title,variants,status&status=active`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    if (!r.ok) return res.status(502).json({ error: 'Shopify respondeu ' + r.status + ' ' + r.statusText });
    const { products } = await r.json();

    const result = (products || []).map(p => {
      const inventory = (p.variants||[]).reduce((s,v)=>s+(v.inventory_quantity||0), 0);
      const nameKey = ID_MAP[String(p.id)];
      let sol = null;

      if (solomonCustom) {
        const sc = solomonCustom.find(x=>x.id===String(p.id)||x.id===p.id);
        if (sc) sol = { r: sc.revenue||0, u: sc.units||0, c: null };
      } else {
        sol = nameKey ? S[nameKey] : null;
        if (!sol) { const k2=Object.keys(S).find(k=>normKey(p.title).includes(k)||k.includes(normKey(p.title))); if(k2)sol=S[k2]; }
      }

      const curve = sol?.c || 'C';
      const rev = sol?.r || 0;
      const units = sol?.u || 0;
      const st = inventory>0&&units>0 ? Math.min((units/(inventory+units))*100,99) : 0;

      let diagnostic = '';
      if (inventory===0) diagnostic='Sem estoque';
      else if (inventory<=5) diagnostic='Risco de ruptura';
      else if (curve==='A'&&inventory>30) diagnostic='Escalar';
      else if (curve==='A') diagnostic='Prioridade';
      else if (curve==='B'&&inventory>20) diagnostic='Destravar';

      return { id:String(p.id), title:p.title, curve, revenue60d:rev, units60d:units, inventory, sellThroughEstimated:st/100, diagnostic, variants:(p.variants||[]).map(v=>({id:String(v.id),title:v.title!=='Default Title'?v.title:null,stock:v.inventory_quantity||0})) };
    });

    result.sort((a,b)=>b.revenue60d-a.revenue60d);
    if (solomonError) res.setHeader('X-Solomon-Warning', encodeURIComponent(solomonError));
    return res.status(200).json(result);
  } catch(err) {
    return res.status(502).json({ error: 'Falha ao consultar a Shopify: ' + err.message });
  }
}
