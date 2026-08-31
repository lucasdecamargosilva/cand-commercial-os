-- Tabela de usuários do Cand Commercial OS.
-- Rode no SQL Editor do Supabase.

create table if not exists public.usuarios (
  username    text primary key,
  senha_hash  text        not null,
  nome        text        not null,
  role        text        not null default 'creator' check (role in ('owner','creator')),
  creator     text,                                  -- 'Bia' | 'Isa' | 'Daia' (só para role = creator)
  ativo       boolean     not null default true,
  criado_em   timestamptz not null default now()
);

-- Trava a tabela. Só a service_role (que vive no servidor) enxerga.
-- Sem nenhuma policy, a chave anon do navegador não lê nem escreve nada.
alter table public.usuarios enable row level security;
revoke all on public.usuarios from anon, authenticated;

comment on column public.usuarios.senha_hash is
  'Hash scrypt gerado por scripts/hash-password.mjs. NUNCA guardar senha em texto.';
