-- =====================================================================
-- StockManager  |  0014_corrige_estorno.sql
-- Corrige fn_estornar_movimentacao (0002), que falhava em toda chamada:
-- o CASE que escolhe o tipo do estorno devolve `text`, e o Postgres nao
-- converte text em enum tipo_mov no INSERT ("column tipo is of type
-- tipo_mov but expression is of type text"). Aqui o CASE tem cast explicito.
--
-- Aproveita para copiar o numero da OS (0013) da movimentacao original, para
-- que o estorno apareca na mesma OS no relatorio.
-- =====================================================================

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
    centro_custo_id, veiculo_id, funcionario_id, numero_os, motivo, estorno_de, usuario_id
  ) values (
    o.empresa_id, o.item_id, o.deposito_id,
    (case o.tipo when 'saida' then 'entrada'
                 when 'emprestimo' then 'devolucao'
                 when 'entrada' then 'saida'
                 else 'ajuste' end)::tipo_mov,
    abs(o.quantidade), o.custo_unitario,
    o.centro_custo_id, o.veiculo_id, o.funcionario_id, o.numero_os,
    p_motivo, o.id, p_usuario_id
  ) returning id into v_novo_id;

  return v_novo_id;
end;
$$;
