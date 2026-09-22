-- =====================================================================
-- StockManager  |  0010_funcionario_por_nome.sql
-- Mesma ideia da 0009 (placa digitada), agora para o nome do mecanico
-- na saida: o almoxarife digita o nome, e se ele ainda nao estiver
-- cadastrado a funcao cria na hora, sem abrir INSERT direto em
-- funcionarios para o perfil almoxarife (RLS continua restrita a
-- admin/gestor -- ver funcionarios_escrita_admin em 0004_rls.sql).
-- =====================================================================

create or replace function fn_obter_ou_criar_funcionario(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa_id uuid;
  v_perfil     perfil_usuario;
  v_nome       text := trim(p_nome);
  v_id         uuid;
begin
  v_empresa_id := fn_empresa_atual();
  v_perfil     := fn_perfil_atual();

  if v_empresa_id is null then
    raise exception 'NAO_AUTENTICADO' using errcode = 'P0001';
  end if;

  if v_perfil not in ('admin','gestor','almoxarife') then
    raise exception 'SEM_PERMISSAO' using errcode = 'P0001';
  end if;

  if v_nome = '' then
    raise exception 'NOME_INVALIDO' using errcode = 'P0001';
  end if;

  select id into v_id
    from funcionarios
   where empresa_id = v_empresa_id
     and lower(nome) = lower(v_nome)
   limit 1;

  if v_id is not null then
    update funcionarios set ativo = true where id = v_id and ativo = false;
    return v_id;
  end if;

  insert into funcionarios (empresa_id, nome, ativo)
  values (v_empresa_id, v_nome, true)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function fn_obter_ou_criar_funcionario(text) to authenticated;
