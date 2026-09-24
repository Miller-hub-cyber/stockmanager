-- =====================================================================
-- StockManager  |  0012_view_estoque_geral.sql
-- Posicao atual por item: total que entrou, total que saiu, saldo e status.
-- Alimenta a aba "Estoque Geral" da planilha do relatorio geral.
--
-- Entradas e saidas contam so movimentacoes originais, sem estorno e sem
-- ter sido estornadas (o efeito liquido de um estorno e zero).
-- =====================================================================

create or replace view v_estoque_geral
with (security_invoker = true) as
select i.id                                     as item_id,
       i.empresa_id,
       i.sku,
       i.nome,
       i.unidade,
       coalesce(mv.entradas, 0)                 as entradas,
       coalesce(mv.saidas, 0)                   as saidas,
       coalesce(s.saldo, 0)                     as saldo,
       i.custo_medio,
       coalesce(s.saldo, 0) * i.custo_medio     as valor_estoque,
       case
         when coalesce(s.saldo, 0) <= 0                 then 'Sem estoque'
         when coalesce(s.saldo, 0) <= i.estoque_minimo  then 'Crítico'
         when coalesce(s.saldo, 0) <= i.ponto_pedido    then 'Repor'
         else 'Estoque bom'
       end                                      as status
  from itens i
  left join (
    select item_id, sum(quantidade) as saldo
      from saldos
     group by item_id
  ) s on s.item_id = i.id
  left join (
    select m.item_id,
           sum(abs(m.quantidade)) filter (where m.tipo = 'entrada') as entradas,
           sum(abs(m.quantidade)) filter (where m.tipo = 'saida')   as saidas
      from movimentacoes m
      left join movimentacoes e on e.estorno_de = m.id
     where m.estorno_de is null
       and e.id is null
     group by m.item_id
  ) mv on mv.item_id = i.id
 where i.ativo;

grant select on v_estoque_geral to authenticated;
