-- =====================================================================
-- StockManager  |  0020_gestao_usuarios.sql
-- Base da tela /gestao/usuarios. O login continua sendo criado no painel
-- do Supabase, porque criar conta pelo app exigiria a service role key no
-- servidor. Estas funcoes so vinculam esse login a empresa e administram
-- perfil e status.
--
-- Funcao em vez de policy de escrita em usuarios: ler auth.users exige
-- security definer, e assim cada operacao fica estreita e so para admin.
-- =====================================================================

create or replace function fn_vincular_usuario(
  p_email text,
  p_nome text,
  p_perfil perfil_usuario
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa_id uuid := fn_empresa_atual();
  v_email      text := lower(trim(p_email));
  v_id         uuid;
  v_outra      uuid;
begin
  if fn_perfil_atual() is distinct from 'admin' then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  select id into v_id from auth.users where lower(email) = v_email;
  if v_id is null then
    raise exception 'USUARIO_SEM_LOGIN' using errcode = 'P0001';
  end if;

  select empresa_id into v_outra from usuarios where id = v_id;
  if v_outra is not null and v_outra <> v_empresa_id then
    raise exception 'USUARIO_OUTRA_EMPRESA' using errcode = 'P0001';
  end if;
  if v_outra is not null then
    raise exception 'USUARIO_JA_VINCULADO' using errcode = 'P0001';
  end if;

  insert into usuarios (id, empresa_id, nome, email, perfil)
  values (v_id, v_empresa_id, trim(p_nome), v_email, p_perfil);

  return v_id;
end;
$$;

create or replace function fn_atualizar_usuario(
  p_usuario_id uuid,
  p_perfil perfil_usuario,
  p_ativo boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if fn_perfil_atual() is distinct from 'admin' then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  -- Sem isto o unico admin poderia se desativar e ninguem mais entraria.
  if p_usuario_id = auth.uid() then
    raise exception 'ALTERACAO_PROPRIA' using errcode = 'P0001';
  end if;

  update usuarios
     set perfil = p_perfil, ativo = p_ativo
   where id = p_usuario_id
     and empresa_id = fn_empresa_atual();

  if not found then
    raise exception 'USUARIO_NAO_ENCONTRADO' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function fn_vincular_usuario(text, text, perfil_usuario) from public, anon;
revoke all on function fn_atualizar_usuario(uuid, perfil_usuario, boolean) from public, anon;
grant execute on function fn_vincular_usuario(text, text, perfil_usuario) to authenticated;
grant execute on function fn_atualizar_usuario(uuid, perfil_usuario, boolean) to authenticated;
