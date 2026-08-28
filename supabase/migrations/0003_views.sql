-- =====================================================================
-- StockManager  |  0003_views.sql
-- Relatorios como views: a consulta vive no banco, a tela so apresenta.
-- =====================================================================

-- Itens que precisam de compra ------------------------------------------
create or replace view v_itens_a_comprar as
select i.id,
       i.empresa_id,
       i.sku,
       i.nome,
       i.unidade,
       coalesce(sum(s.quantidade), 0)                  as saldo,
       i.ponto_pedido,
       i.estoque_minimo,
       i.custo_medio,
       f.nome                                          as fornecedor,
       f.prazo_entrega_dias,
       greatest(i.ponto_pedido - coalesce(sum(s.quantidade),0), 0) as sugestao_compra,
       case
         when coalesce(sum(s.quantidade),0) = 0                  then 'ESGOTADO'
         when coalesce(sum(s.quantidade),0) <= i.estoque_minimo  then 'CRITICO'
         else 'REPOR'
       end                                             as situacao
  from itens i
  left join saldos s        on s.item_id = i.id
  left join fornecedores f  on f.id = i.fornecedor_id
 where i.ativo
 group by i.id, f.nome, f.prazo_entrega_dias
having coalesce(sum(s.quantidade),0) <= greatest(i.ponto_pedido, i.estoque_minimo);

-- Custo de manutencao por veiculo ---------------------------------------
create or replace view v_consumo_por_veiculo as
select m.empresa_id,
       v.id                                    as veiculo_id,
       v.placa,
       v.modelo,
       date_trunc('month', m.criado_em)::date  as mes,
       sum(abs(m.quantidade) * m.custo_unitario) as custo_total,
       count(*)                                 as movimentos
  from movimentacoes m
  join veiculos v on v.id = m.veiculo_id
 where m.tipo = 'saida'
 group by m.empresa_id, v.id, v.placa, v.modelo, date_trunc('month', m.criado_em);

-- Custo por centro de custo ---------------------------------------------
create or replace view v_consumo_por_centro as
select m.empresa_id,
       c.nome                                   as centro_custo,
       date_trunc('month', m.criado_em)::date   as mes,
       sum(abs(m.quantidade) * m.custo_unitario) as custo_total
  from movimentacoes m
  join centros_custo c on c.id = m.centro_custo_id
 where m.tipo = 'saida'
 group by m.empresa_id, c.nome, date_trunc('month', m.criado_em);

-- Kardex: historico do item com destino resolvido -----------------------
create or replace view v_kardex as
select m.id,
       m.empresa_id,
       m.item_id,
       i.sku,
       i.nome                as item,
       m.criado_em,
       m.tipo,
       m.quantidade,
       m.custo_unitario,
       abs(m.quantidade) * m.custo_unitario as valor,
       m.motivo,
       u.nome                as usuario,
       coalesce(v.placa, c.nome, f.nome) as destino,
       m.estorno_de
  from movimentacoes m
  join itens i             on i.id = m.item_id
  left join usuarios u     on u.id = m.usuario_id
  left join veiculos v     on v.id = m.veiculo_id
  left join centros_custo c on c.id = m.centro_custo_id
  left join funcionarios f on f.id = m.funcionario_id;

-- Valor imobilizado -----------------------------------------------------
create or replace view v_valor_estoque as
select i.empresa_id,
       coalesce(cat.nome, 'Sem categoria')      as categoria,
       count(distinct i.id)                     as itens,
       sum(coalesce(s.quantidade,0))            as unidades,
       sum(coalesce(s.quantidade,0) * i.custo_medio) as valor
  from itens i
  left join saldos s     on s.item_id = i.id
  left join categorias cat on cat.id = i.categoria_id
 where i.ativo
 group by i.empresa_id, cat.nome;

-- Itens parados: capital imobilizado sem giro ---------------------------
create or replace view v_itens_parados as
select i.id,
       i.empresa_id,
       i.sku,
       i.nome,
       coalesce(sum(s.quantidade),0)                  as saldo,
       coalesce(sum(s.quantidade),0) * i.custo_medio  as valor_parado,
       max(m.criado_em)                               as ultima_saida,
       current_date - max(m.criado_em)::date          as dias_sem_saida
  from itens i
  left join saldos s on s.item_id = i.id
  left join movimentacoes m on m.item_id = i.id and m.tipo = 'saida'
 where i.ativo
 group by i.id
having coalesce(sum(s.quantidade),0) > 0
   and (max(m.criado_em) is null
        or max(m.criado_em) < now() - interval '90 days');

-- Consumo anomalo: mesmo item saindo repetidamente para o mesmo veiculo --
create or replace view v_consumo_anomalo as
select m.empresa_id,
       i.sku,
       i.nome        as item,
       v.placa,
       count(*)      as saidas_30_dias,
       sum(abs(m.quantidade)) as quantidade_total
  from movimentacoes m
  join itens i    on i.id = m.item_id
  join veiculos v on v.id = m.veiculo_id
 where m.tipo = 'saida'
   and m.criado_em > now() - interval '30 days'
 group by m.empresa_id, i.sku, i.nome, v.placa
having count(*) >= 3;

-- EPI com CA vencendo ---------------------------------------------------
create or replace view v_epi_alerta as
select e.id,
       e.empresa_id,
       f.nome        as funcionario,
       i.nome        as epi,
       e.numero_ca,
       e.validade_ca,
       e.data_entrega,
       (e.validade_ca - current_date) as dias_restantes
  from epi_entregas e
  join funcionarios f on f.id = e.funcionario_id
  join itens i        on i.id = e.item_id
 where e.data_devolucao is null
   and e.validade_ca is not null
   and e.validade_ca <= current_date + 30;
