-- =====================================================================
-- StockManager  |  0011_view_movimentacoes_detalhe.sql
-- Uma linha por movimentacao, com item, veiculo, mecanico, fornecedor e NF
-- ja resolvidos. Alimenta os relatorios de entrada, saida e geral.
--
-- security_invoker: a view respeita a RLS de quem consulta (isolamento por
-- empresa), em vez de rodar com os privilegios do dono.
-- =====================================================================

create or replace view v_movimentacoes_detalhe
with (security_invoker = true) as
select m.id,
       m.empresa_id,
       m.criado_em,
       m.tipo,
       m.item_id,
       i.sku,
       i.nome                                 as item,
       i.unidade,
       abs(m.quantidade)                      as quantidade,
       m.custo_unitario,
       abs(m.quantidade) * m.custo_unitario   as valor,
       m.veiculo_id,
       v.placa,
       m.funcionario_id,
       f.nome                                 as mecanico,
       c.nome                                 as centro_custo,
       forn.nome                              as fornecedor,
       d.numero_nf,
       m.km_veiculo,
       u.nome                                 as usuario,
       m.motivo,
       m.estorno_de,
       exists (select 1 from movimentacoes e where e.estorno_de = m.id) as estornada
  from movimentacoes m
  join itens i                   on i.id = m.item_id
  left join veiculos v           on v.id = m.veiculo_id
  left join funcionarios f       on f.id = m.funcionario_id
  left join centros_custo c      on c.id = m.centro_custo_id
  left join documentos d         on d.id = m.documento_id
  left join fornecedores forn    on forn.id = d.fornecedor_id
  left join usuarios u           on u.id = m.usuario_id;

grant select on v_movimentacoes_detalhe to authenticated;
