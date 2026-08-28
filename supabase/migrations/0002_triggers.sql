-- =====================================================================
-- StockManager  |  0002_triggers.sql
-- Onde vivem as regras que nao podem depender da interface.
-- =====================================================================

-- ---------------------------------------------------------------------
-- fn_aplicar_movimentacao
-- Executa ANTES da insercao de uma movimentacao e faz quatro coisas:
--   1. garante que existe linha de saldo para o par item x deposito
--   2. calcula o delta conforme o tipo e bloqueia saldo negativo
--   3. credita o deposito de destino quando for transferencia
--   4. recalcula o custo medio na entrada e valoriza a saida
-- ---------------------------------------------------------------------
-- security definer: a trigger precisa escrever em saldos mesmo que o
-- papel "authenticated" nao tenha grant direto na tabela (ver 0004_rls.sql).
create or replace function fn_aplicar_movimentacao()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_saldo_atual numeric(12,3);
  v_custo_atual numeric(12,4);
  v_delta       numeric(12,3);
begin
  -- libera fn_saldo_somente_por_trigger para esta transacao: e o unico
  -- caminho autorizado a escrever em saldos fora de uma migration.
  perform set_config('stockmanager.mov_em_curso', 'on', true);

  insert into saldos (empresa_id, item_id, deposito_id, quantidade)
  values (new.empresa_id, new.item_id, new.deposito_id, 0)
  on conflict (item_id, deposito_id) do nothing;

  select quantidade into v_saldo_atual
    from saldos
   where item_id = new.item_id and deposito_id = new.deposito_id
   for update;

  v_delta := case new.tipo
    when 'entrada'       then  abs(new.quantidade)
    when 'devolucao'     then  abs(new.quantidade)
    when 'saida'         then -abs(new.quantidade)
    when 'emprestimo'    then -abs(new.quantidade)
    when 'transferencia' then -abs(new.quantidade)
    when 'ajuste'        then  new.quantidade   -- pode ser negativo
  end;

  if v_saldo_atual + v_delta < 0 then
    raise exception
      'SALDO_INSUFICIENTE: disponivel %, solicitado %',
      v_saldo_atual, abs(new.quantidade)
      using errcode = 'P0001';
  end if;

  update saldos
     set quantidade = quantidade + v_delta,
         atualizado_em = now()
   where item_id = new.item_id and deposito_id = new.deposito_id;

  if new.tipo = 'transferencia' then
    insert into saldos (empresa_id, item_id, deposito_id, quantidade)
    values (new.empresa_id, new.item_id, new.deposito_destino_id, 0)
    on conflict (item_id, deposito_id) do nothing;

    update saldos
       set quantidade = quantidade + abs(new.quantidade),
           atualizado_em = now()
     where item_id = new.item_id
       and deposito_id = new.deposito_destino_id;
  end if;

  -- custo medio ponderado: recalculado somente na entrada
  if new.tipo = 'entrada' and new.custo_unitario > 0 then
    select custo_medio into v_custo_atual from itens where id = new.item_id;

    update itens
       set custo_medio = case
             when (v_saldo_atual + abs(new.quantidade)) > 0 then
               ((v_saldo_atual * v_custo_atual)
                + (abs(new.quantidade) * new.custo_unitario))
               / (v_saldo_atual + abs(new.quantidade))
             else new.custo_unitario
           end
     where id = new.item_id;
  end if;

  -- saida e valorizada pelo custo medio vigente
  if new.tipo in ('saida','emprestimo') and new.custo_unitario = 0 then
    select custo_medio into new.custo_unitario from itens where id = new.item_id;
  end if;

  perform set_config('stockmanager.mov_em_curso', 'off', true);

  return new;
end;
$$;

create trigger trg_aplicar_movimentacao
  before insert on movimentacoes
  for each row execute function fn_aplicar_movimentacao();

-- ---------------------------------------------------------------------
-- Movimentacao e imutavel. Correcao se faz por estorno, nunca por edicao.
-- ---------------------------------------------------------------------
create or replace function fn_movimentacao_imutavel()
returns trigger language plpgsql as $$
begin
  raise exception
    'MOVIMENTACAO_IMUTAVEL: registre um estorno em vez de alterar ou excluir'
    using errcode = 'P0001';
end;
$$;

create trigger trg_mov_bloqueia_update
  before update on movimentacoes
  for each row execute function fn_movimentacao_imutavel();

create trigger trg_mov_bloqueia_delete
  before delete on movimentacoes
  for each row execute function fn_movimentacao_imutavel();

-- ---------------------------------------------------------------------
-- Saldo tambem nao pode ser alterado por fora da movimentacao.
-- ---------------------------------------------------------------------
create or replace function fn_saldo_somente_por_trigger()
returns trigger language plpgsql as $$
begin
  if current_setting('stockmanager.mov_em_curso', true) is distinct from 'on' then
    raise exception
      'SALDO_DERIVADO: o saldo resulta das movimentacoes e nao pode ser editado'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- segunda camada de defesa alem do revoke em 0004_rls.sql: mesmo um papel
-- com grant direto em saldos (ex.: service_role mal configurado) so escreve
-- durante uma movimentacao, nunca fora dela. So insert/update: a funcao
-- retorna "new", que e sempre null em trigger de delete e cancelaria a
-- operacao em silencio em vez de barrar com erro. Delete continua coberto
-- pelo revoke (nenhum fluxo legitimo apaga linha de saldo).
create trigger trg_saldo_bloqueia_escrita
  before insert or update on saldos
  for each row execute function fn_saldo_somente_por_trigger();

-- ---------------------------------------------------------------------
-- Atualiza a quilometragem do veiculo quando informada na saida.
-- security definer pelo mesmo motivo de fn_aplicar_movimentacao: o efeito
-- colateral em outra tabela nao deve depender do grant do papel invocador.
-- ---------------------------------------------------------------------
create or replace function fn_atualizar_km_veiculo()
returns trigger language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.veiculo_id is not null and new.km_veiculo is not null then
    update veiculos
       set km_atual = new.km_veiculo
     where id = new.veiculo_id
       and new.km_veiculo > km_atual;
  end if;
  return new;
end;
$$;

create trigger trg_atualizar_km
  after insert on movimentacoes
  for each row execute function fn_atualizar_km_veiculo();

-- ---------------------------------------------------------------------
-- Estorno: gera a movimentacao inversa da original.
-- ---------------------------------------------------------------------
create or replace function fn_estornar_movimentacao(
  p_movimentacao_id uuid,
  p_usuario_id uuid,
  p_motivo text default 'Estorno'
)
returns uuid
language plpgsql
as $$
declare
  o movimentacoes%rowtype;
  v_novo_id uuid;
begin
  select * into o from movimentacoes where id = p_movimentacao_id;
  if not found then
    raise exception 'MOVIMENTACAO_NAO_ENCONTRADA' using errcode = 'P0001';
  end if;

  if exists (select 1 from movimentacoes where estorno_de = p_movimentacao_id) then
    raise exception 'MOVIMENTACAO_JA_ESTORNADA' using errcode = 'P0001';
  end if;

  insert into movimentacoes (
    empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario,
    centro_custo_id, veiculo_id, funcionario_id, motivo, estorno_de, usuario_id
  ) values (
    o.empresa_id, o.item_id, o.deposito_id,
    case o.tipo when 'saida' then 'entrada'
                when 'emprestimo' then 'devolucao'
                when 'entrada' then 'saida'
                else 'ajuste' end,
    abs(o.quantidade), o.custo_unitario,
    o.centro_custo_id, o.veiculo_id, o.funcionario_id,
    p_motivo, o.id, p_usuario_id
  ) returning id into v_novo_id;

  return v_novo_id;
end;
$$;
