// ── CREATIVES-EXT.JS — Gestão de Criativos conectada ao Shopify
// Sobrescreve selectCreator do MVP com versão dinâmica

var CREATOR_FORMATS = {
  Bia:   ['Provador por cor', 'Widde — transição de cores', 'Comparativo'],
  Isa:   ['Provador por cor', 'Widde — transição de cores', 'POV de estilo'],
  Daia:  ['Estético/Fotos', 'Notebook + site', 'Resultado de lente', 'Close acabamento', 'Hook de reação'],
  Todos: []
};

var CREATOR_FORMAT_DESC = {
  Bia: [
    ['Provador por cor',           'Base validada', 'Mostrar cada cor gerando desejo e identificação.'],
    ['Widde — transição de cores', 'Base validada', '1 modelo, transição entre cores, detalhes para PDP.'],
    ['Comparativo',                'Novo teste',    'Mesmo rosto com duas propostas para estimular escolha.']
  ],
  Isa: [
    ['Provador por cor',           'Base validada', 'Gravar por cor para ampliar cobertura dos modelos prioritários.'],
    ['Widde — transição de cores', 'Base validada', 'Transição entre cores + detalhes para site.'],
    ['POV de estilo',              'Novo teste',    'Situações de uso com linguagem mais orgânica.']
  ],
  Daia: [
    ['Estético/Fotos',    'Base validada', 'Branding + desejo + produto. Foco em valor percebido.'],
    ['Notebook + site',   'Base validada', 'Site ao fundo + produto em destaque. Contexto de uso real.'],
    ['Resultado de lente','Base validada', 'Mostrar visualmente o efeito/benefício da lente.'],
    ['Close acabamento',  'Novo teste',    'Macro nos detalhes para aumentar valor percebido.'],
    ['Hook de reação',    'Novo teste',    'Buscar retenção nos primeiros segundos.']
  ]
};

// Status salvo em localStorage por produto + formato + criadora
function getCreativeKey(title, fmt, creator) {
  return 'cs_' + creator + '_' + title.replace(/[^a-z0-9]/gi, '') + '_' + fmt.replace(/[^a-z0-9]/gi, '');
}
function getCreativeStatus(title, fmt, creator) {
  return localStorage.getItem(getCreativeKey(title, fmt, creator)) || 'Pendente';
}
function setCreativeStatusFromEl(el) {
  var t = el.getAttribute('data-title');
  var f = el.getAttribute('data-fmt');
  var c = el.getAttribute('data-creator');
  localStorage.setItem(getCreativeKey(t, f, c), el.value);
  selectCreator(c);
}

function getProductAlert(p) {
  if (!p.inventory || p.inventory === 0) return ['Sem estoque', 'weak'];
  if (p.inventory <= 5)  return ['Risco de ruptura', 'weak'];
  if (p.inventory > 50 && p.curve === 'A') return ['Escalar agora', 'valid'];
  if (p.inventory > 30)  return ['Estoque alto', 'test'];
  return ['Estoque saudável', 'valid'];
}

// Sobrescreve selectCreator do MVP — usa dados reais do Shopify
function selectCreator(name) {
  // Highlight da aba ativa
  document.querySelectorAll('.creator-tab').forEach(function(b) {
    b.classList.toggle('primary', b.dataset.creator === name);
  });

  // Usar produtos do Shopify se disponíveis, senão usar os estáticos do MVP
  var products = (typeof _shopifyAll !== 'undefined' && _shopifyAll.length > 0)
    ? _shopifyAll.filter(function(p) { return p.curve === 'A' || p.curve === 'B'; })
    : [];

  products.sort(function(a, b) {
    if (a.curve !== b.curve) return a.curve < b.curve ? -1 : 1;
    return (b.revenue60d || 0) - (a.revenue60d || 0);
  });

  var fmts = name === 'Todos'
    ? ['Provador por cor', 'Widde — transição de cores', 'Estético/Fotos']
    : (CREATOR_FORMATS[name] || []);

  var rows = [];
  var pendentes = 0, feitos = 0, alta = 0;

  products.slice(0, 40).forEach(function(p) {
    fmts.forEach(function(fmt) {
      var alert  = getProductAlert(p);
      var status = name !== 'Todos' ? getCreativeStatus(p.title, fmt, name) : '—';
      if (status === 'Pendente')  pendentes++;
      if (status === 'Feito ✓')  feitos++;
      if (p.curve === 'A') alta++;
      rows.push({ title: p.title, curve: p.curve, stock: p.inventory || 0,
        alert: alert[0], alertCls: alert[1], fmt: fmt, status: status,
        priority: p.curve === 'A' ? 'Alta' : 'Média', creator: name });
    });
  });

  // KPIs
  var nameEl    = document.getElementById('creatorName');
  var pendEl    = document.getElementById('creatorPending');
  var doneEl    = document.getElementById('creatorDone');
  var highEl    = document.getElementById('creatorHigh');
  if (nameEl) nameEl.textContent    = name;
  if (pendEl) pendEl.textContent    = pendentes;
  if (doneEl) doneEl.textContent    = feitos;
  if (highEl) highEl.textContent    = alta;

  // KPIs globais da seção
  var allP  = (typeof _shopifyAll !== 'undefined') ? _shopifyAll : [];
  var prioEl = document.querySelector('#creatives .cards-4 .metric:nth-child(1) strong');
  var semVEl = document.querySelector('#creatives .cards-4 .metric:nth-child(2) strong');
  var rEl    = document.querySelector('#creatives .cards-4 .metric:nth-child(3) strong');
  if (prioEl) prioEl.textContent = allP.filter(function(p) { return p.curve === 'A' && (p.inventory || 0) > 5; }).length;
  if (semVEl) semVEl.textContent = rows.filter(function(r) { return r.curve === 'A' && r.status === 'Pendente'; }).length;
  if (rEl)    rEl.textContent    = allP.filter(function(p) { return (p.inventory || 0) <= 5 && (p.inventory || 0) > 0; }).length;

  // Tabela
  var body = document.getElementById('creatorQueueBody');
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted)">Sincronize a Shopify para carregar os produtos.</td></tr>';
  } else {
    var statusOpts = ['Pendente', 'Em produção', 'Feito ✓', 'Revisar'];
    body.innerHTML = rows.map(function(r) {
      var statusSel = '<span>—</span>';
      if (name !== 'Todos') {
        var ste = r.title.replace(/"/g, '&quot;');
        var fme = r.fmt.replace(/"/g, '&quot;');
        statusSel = '<select data-title="' + ste + '" data-fmt="' + fme + '" data-creator="' + name + '" onchange="setCreativeStatusFromEl(this)" style="border:1px solid var(--line);border-radius:6px;padding:4px 8px;font-size:11px;background:#fff">'
          + statusOpts.map(function(s) { return '<option' + (s === r.status ? ' selected' : '') + '>' + s + '</option>'; }).join('')
          + '</select>';
      }
      var cc = r.curve === 'A' ? 'valid' : 'plan';
      return '<tr>'
        + '<td><b>' + r.title + '</b></td>'
        + '<td><span class="badge ' + cc + '">' + r.curve + '</span></td>'
        + '<td>' + r.stock + '</td>'
        + '<td><span class="badge ' + r.alertCls + '">' + r.alert + '</span></td>'
        + '<td>' + r.fmt + '</td>'
        + '<td>' + statusSel + '</td>'
        + '<td>' + r.priority + '</td>'
        + '<td>' + r.creator + '</td>'
        + '</tr>';
    }).join('');
  }

  // Descrição dos formatos
  var box = document.getElementById('creatorFormats');
  if (!box) return;
  var fmtDesc = CREATOR_FORMAT_DESC[name];
  if (fmtDesc) {
    box.innerHTML = fmtDesc.map(function(x) {
      return '<div class="insight"><b>' + x[0] + ' <span class="badge ' + (x[1].includes('Novo') ? 'test' : 'valid') + '">' + x[1] + '</span></b><p>' + x[2] + '</p></div>';
    }).join('');
  } else {
    box.innerHTML = '<p style="margin:0;color:var(--muted)">Selecione uma colaboradora para ver os formatos.</p>';
  }
}
