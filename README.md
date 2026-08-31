# Cand Commercial OS

Painel comercial da Cand: curva ABC de produtos, gestão de criativos,
calendário de ações e biblioteca de mecânicas.

## Como roda

Servidor Node único, **sem dependências externas**:

- `server.js` — serve o front e roteia `/api/*` para os handlers de `api/`
- `index.html` + `js/*.js` — front (não usa build)
- `api/*.js` — endpoints (login, produtos, status, sync Shopify, Solomon)

```bash
npm start          # sobe na porta 3000 (ou $PORT)
```

## Variáveis de ambiente

Todas obrigatórias em produção. Veja `.env.example`.

| Variável | Para quê |
|---|---|
| `APP_USERS` | JSON com os usuários e senhas do painel. **Nunca vai para o código.** |
| `AUTH_SECRET` | Segredo que assina o token de sessão (12h). Sem ele, sessões caem a cada restart. |
| `SHOPIFY_STORE_DOMAIN` | Padrão: `candstore-br.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Token Admin API da Shopify |
| `ANTHROPIC_API_KEY` | Só para o filtro de período personalizado (MCP Solomon) |
| `PORT` | Padrão 3000 |

Gerar o `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy (EasyPanel)

App do tipo **Dockerfile**, porta interna `3000`, health check em `/healthz`.
As variáveis acima vão na aba *Environment* do serviço — nunca no repositório.

## Nota sobre os dados de receita

`api/products.js` carrega tabelas fixas de receita por período (7d/15d/60d)
escritas à mão, mais um mapa de IDs da Shopify. Esses números envelhecem
sozinhos — só o filtro de período personalizado consulta a Solomon ao vivo.
