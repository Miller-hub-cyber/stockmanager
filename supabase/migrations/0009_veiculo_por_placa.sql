-- =====================================================================
-- StockManager  |  0009_veiculo_por_placa.sql
-- Permite o almoxarife digitar o numero da frota/placa na hora da saida,
-- mesmo quando o veiculo ainda nao esta cadastrado, sem abrir INSERT
-- direto em veiculos para o perfil almoxarife (RLS continua restrita a
-- admin/gestor para cadastro manual -- ver veiculos_escrita_admin em
-- 0004_rls.sql). O acesso aqui e estreito: so cria/reaproveita 1 veiculo
-- pela placa informada, nunca edita ou apaga outros campos do cadastro.
-- =====================================================================

create or replace function fn_obter_ou_criar_veiculo(p_placa text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa_id uuid;
  v_perfil     perfil_usuario;
  v_placa      text := upper(trim(p_placa));
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

  if v_placa = '' then
    raise exception 'PLACA_INVALIDA' using errcode = 'P0001';
  end if;

  select id into v_id
    from veiculos
   where empresa_id = v_empresa_id
     and upper(placa) = v_placa
   limit 1;

  if v_id is not null then
    update veiculos set ativo = true where id = v_id and ativo = false;
    return v_id;
  end if;

  insert into veiculos (empresa_id, placa, ativo)
  values (v_empresa_id, v_placa, true)
  on conflict (empresa_id, placa) do update set ativo = true
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function fn_obter_ou_criar_veiculo(text) to authenticated;
