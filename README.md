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
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Onde ficam os usuários. Fonte principal. |
| `APP_USERS` | Fallback: só é usado se as duas acima estiverem vazias. |
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

## Usuários e senhas

Os usuários vivem na tabela `usuarios` do Supabase (`sql/001_usuarios.sql`).
A tabela fica com RLS ligado e **sem policy** — só a `service_role`, que vive no
servidor, enxerga. A chave anon do navegador não lê nada.

Senha nunca é guardada em texto. Gere o hash e cole na coluna `senha_hash`:

```bash
node scripts/hash-password.mjs "a-senha-da-pessoa"
```

```sql
insert into public.usuarios (username, senha_hash, nome, role, creator) values
  ('lucas',   'scrypt$...', 'Lucas',   'owner',   null),
  ('beatriz', 'scrypt$...', 'Beatriz', 'creator', 'Bia');
```

Para tirar o acesso de alguém: `update public.usuarios set ativo = false where username = '...'`.
Não precisa de redeploy.

Se `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` não estiverem configurados, o login cai
no `APP_USERS`. Se o Supabase estiver fora do ar, o login responde 503 — nunca
"senha incorreta".

## Nota sobre os dados de receita

`api/products.js` carrega tabelas fixas de receita por período (7d/15d/60d)
escritas à mão, mais um mapa de IDs da Shopify. Esses números envelhecem
sozinhos — só o filtro de período personalizado consulta a Solomon ao vivo.
