-- =====================================================================
-- StockManager  |  0024_usuarios_convites.sql
-- Acesso de novos usuarios por convite com codigo, sem service role key.
--
-- Fluxo:
--   1. admin chama fn_convidar_usuario(nome, email, perfil) e recebe um
--      codigo de 8 caracteres, valido por 7 dias;
--   2. a pessoa faz signUp no Supabase Auth com esse e-mail, uma senha e
--      o codigo em user_metadata.codigo_convite (tela /primeiro-acesso);
--   3. fn_aceitar_convite, trigger em auth.users, confere e-mail + codigo
--      e cria a linha em `usuarios` com empresa e perfil do convite. Codigo
--      errado ou vencido aborta o cadastro inteiro.
--
-- Cadastro feito sem codigo (ex.: admin criado pelo painel do Supabase)
-- passa pela trigger sem efeito: a conta existe no Auth mas nao tem linha
-- em `usuarios`, entao nao enxerga nada (RLS).
--
-- Tambem: usuario com ativo = false perde o acesso na hora, nao so no
-- proximo login (fn_empresa_atual/fn_perfil_atual passam a exigir ativo).
-- =====================================================================

-- Usuario inativo deixa de ter empresa/perfil para o RLS ----------------
create or replace function fn_empresa_atual()
returns uuid language sql stable security definer
set search_path = public, pg_temp as $$
  select empresa_id from usuarios where id = auth.uid() and ativo;
$$;

create or replace function fn_perfil_atual()
returns perfil_usuario language sql stable security definer
set search_path = public, pg_temp as $$
  select perfil from usuarios where id = auth.uid() and ativo;
$$;

-- Convites -------------------------------------------------------------
create table if not exists convites (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id),
  nome         text not null,
  email        text not null,
  perfil       perfil_usuario not null,
  codigo       text not null,
  criado_por   uuid references usuarios(id),
  criado_em    timestamptz not null default now(),
  expira_em    timestamptz not null default now() + interval '7 days',
  usado_em     timestamptz,
  cancelado_em timestamptz,
  constraint convite_email_minusculo check (email = lower(email)),
  constraint convite_codigo_formato check (codigo ~ '^[0-9A-F]{8}$')
);

-- No maximo um convite em aberto por e-mail.
create unique index if not exists convites_email_em_aberto
  on convites (email) where usado_em is null and cancelado_em is null;

-- Leitura so para admin da propria empresa. Sem policy de escrita: convite
-- so muda pelas funcoes abaixo (security definer).
alter table convites enable row level security;

drop policy if exists convites_leitura_admin on convites;
create policy convites_leitura_admin on convites
  for select using (empresa_id = fn_empresa_atual() and fn_perfil_atual() = 'admin');

-- ---------------------------------------------------------------------
-- fn_convidar_usuario: cria o convite e devolve o codigo.
-- Convite anterior em aberto para o mesmo e-mail e cancelado (reenvio).
-- ---------------------------------------------------------------------
create or replace function fn_convidar_usuario(p_nome text, p_email text, p_perfil perfil_usuario)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := lower(trim(p_email));
  v_codigo text;
begin
  if fn_perfil_atual() is distinct from 'admin' then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'USUARIO_JA_EXISTE' using errcode = 'P0001';
  end if;

  update convites
     set cancelado_em = now()
   where email = v_email and usado_em is null and cancelado_em is null;

  -- 8 hex de um uuid v4 (os primeiros 32 bits sao aleatorios).
  v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into convites (empresa_id, nome, email, perfil, codigo, criado_por)
  values (fn_empresa_atual(), trim(p_nome), v_email, p_perfil, v_codigo, auth.uid());

  return v_codigo;
end;
$$;

-- ---------------------------------------------------------------------
-- fn_cancelar_convite: admin desfaz um convite ainda nao usado.
-- ---------------------------------------------------------------------
create or replace function fn_cancelar_convite(p_convite_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if fn_perfil_atual() is distinct from 'admin' then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  update convites
     set cancelado_em = now()
   where id = p_convite_id
     and empresa_id = fn_empresa_atual()
     and usado_em is null
     and cancelado_em is null;
end;
$$;

-- ---------------------------------------------------------------------
-- fn_alterar_usuario: admin muda perfil e ativa/desativa alguem da
-- propria empresa. Nao pode alterar a si mesmo, para a empresa nunca
-- ficar sem admin por engano.
-- ---------------------------------------------------------------------
create or replace function fn_alterar_usuario(p_usuario_id uuid, p_perfil perfil_usuario, p_ativo boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if fn_perfil_atual() is distinct from 'admin' then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  if p_usuario_id = auth.uid() then
    raise exception 'NAO_ALTERA_PROPRIO_USUARIO' using errcode = 'P0001';
  end if;

  update usuarios
     set perfil = p_perfil,
         ativo  = p_ativo
   where id = p_usuario_id
     and empresa_id = fn_empresa_atual();

  if not found then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function fn_convidar_usuario(text, text, perfil_usuario) from public, anon;
revoke execute on function fn_cancelar_convite(uuid) from public, anon;
revoke execute on function fn_alterar_usuario(uuid, perfil_usuario, boolean) from public, anon;
grant execute on function fn_convidar_usuario(text, text, perfil_usuario) to authenticated;
grant execute on function fn_cancelar_convite(uuid) to authenticated;
grant execute on function fn_alterar_usuario(uuid, perfil_usuario, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- fn_aceitar_convite: roda dentro do signUp do Supabase Auth.
-- Exception aqui desfaz a criacao da conta; o Auth devolve "Database
-- error saving new user", traduzido em src/actions/primeiroAcesso.ts.
-- ---------------------------------------------------------------------
create or replace function fn_aceitar_convite()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo  text := upper(regexp_replace(coalesce(new.raw_user_meta_data->>'codigo_convite', ''), '[^0-9A-Fa-f]', '', 'g'));
  v_convite convites%rowtype;
begin
  if v_codigo = '' then
    return new;
  end if;

  select * into v_convite
    from convites
   where email = lower(new.email)
     and codigo = v_codigo
     and usado_em is null
     and cancelado_em is null
     and expira_em > now()
   for update;

  if not found then
    raise exception 'CONVITE_INVALIDO' using errcode = 'P0001';
  end if;

  insert into usuarios (id, empresa_id, nome, email, perfil)
  values (new.id, v_convite.empresa_id, v_convite.nome, lower(new.email), v_convite.perfil);

  update convites set usado_em = now() where id = v_convite.id;

  return new;
end;
$$;

drop trigger if exists trg_aceitar_convite on auth.users;
create trigger trg_aceitar_convite
  after insert on auth.users
  for each row execute function fn_aceitar_convite();
