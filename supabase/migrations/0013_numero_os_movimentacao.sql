-- =====================================================================
-- StockManager  |  0013_numero_os_movimentacao.sql
-- Numero da OS (ex.: "OS 12212") como referencia livre em cada movimentacao,
-- para entrada e saida. E so um texto de consulta: nao existe cadastro de OS
-- nem regra de negocio ligada a ele (ordem de servico completa e fase 3).
--
-- Fica em movimentacoes (e nao em documentos) porque a saida nao tem documento.
-- Coluna nova em tabela imutavel: o trigger bloqueia UPDATE/DELETE de linhas,
-- nao ALTER TABLE; linhas antigas ficam com numero_os nulo.
-- =====================================================================

alter table movimentacoes
  add column if not exists numero_os text;

alter table movimentacoes
  drop constraint if exists numero_os_tamanho;
alter table movimentacoes
  add constraint numero_os_tamanho check (numero_os is null or char_length(numero_os) between 1 and 40);

-- Busca por OS nos relatorios.
create index if not exists idx_mov_numero_os on movimentacoes (empresa_id, numero_os)
  where numero_os is not null;

-- create or replace view so aceita coluna nova no fim da lista.
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
       exists (select 1 from movimentacoes e where e.estorno_de = m.id) as estornada,
       m.numero_os
  from movimentacoes m
  join itens i                   on i.id = m.item_id
  left join veiculos v           on v.id = m.veiculo_id
  left join funcionarios f       on f.id = m.funcionario_id
  left join centros_custo c      on c.id = m.centro_custo_id
  left join documentos d         on d.id = m.documento_id
  left join fornecedores forn    on forn.id = d.fornecedor_id
  left join usuarios u           on u.id = m.usuario_id;

grant select on v_movimentacoes_detalhe to authenticated;
