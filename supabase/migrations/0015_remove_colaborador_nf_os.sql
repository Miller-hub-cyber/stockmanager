-- =====================================================================
-- StockManager  |  0015_remove_colaborador_nf_os.sql
-- Remove do banco: vinculo de colaborador/funcionario em movimentacoes,
-- numero de nota fiscal, numero de OS e o cadastro de funcionarios como
-- um todo (inclusive ficha de EPI, que dependia dele e nao tinha uso na
-- aplicacao).
-- =====================================================================

-- fn_obter_ou_criar_funcionario (0010) so existia para resolver o nome
-- digitado de colaborador na entrada/saida.
drop function if exists fn_obter_ou_criar_funcionario(text);

-- v_kardex (0003) expunha o nome do funcionario como possivel "destino".
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
       coalesce(v.placa, c.nome) as destino,
       m.estorno_de
  from movimentacoes m
  join itens i             on i.id = m.item_id
  left join usuarios u     on u.id = m.usuario_id
  left join veiculos v     on v.id = m.veiculo_id
  left join centros_custo c on c.id = m.centro_custo_id;

-- v_movimentacoes_detalhe (0013) expunha funcionario_id, mecanico, numero_nf
-- e numero_os; o join com documentos permanece por causa do fornecedor.
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
       c.nome                                 as centro_custo,
       forn.nome                              as fornecedor,
       m.km_veiculo,
       u.nome                                 as usuario,
       m.motivo,
       m.estorno_de,
       exists (select 1 from movimentacoes e where e.estorno_de = m.id) as estornada
  from movimentacoes m
  join itens i                   on i.id = m.item_id
  left join veiculos v           on v.id = m.veiculo_id
  left join centros_custo c      on c.id = m.centro_custo_id
  left join documentos d         on d.id = m.documento_id
  left join fornecedores forn    on forn.id = d.fornecedor_id
  left join usuarios u           on u.id = m.usuario_id;

grant select on v_movimentacoes_detalhe to authenticated;

-- v_epi_alerta e epi_entregas dependem de funcionarios e nao tem nenhum
-- consumidor na aplicacao hoje.
drop view if exists v_epi_alerta;
drop table if exists epi_entregas;

-- fn_estornar_movimentacao (0014) copiava funcionario_id e numero_os do
-- original para o estorno.
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
    centro_custo_id, veiculo_id, motivo, estorno_de, usuario_id
  ) values (
    o.empresa_id, o.item_id, o.deposito_id,
    (case o.tipo when 'saida' then 'entrada'
                 when 'emprestimo' then 'devolucao'
                 when 'entrada' then 'saida'
                 else 'ajuste' end)::tipo_mov,
    abs(o.quantidade), o.custo_unitario,
    o.centro_custo_id, o.veiculo_id,
    p_motivo, o.id, p_usuario_id
  ) returning id into v_novo_id;

  return v_novo_id;
end;
$$;

-- Colunas e constraints de movimentacoes.
alter table movimentacoes drop constraint if exists numero_os_tamanho;
alter table movimentacoes drop constraint if exists saida_exige_destino;
alter table movimentacoes
  add constraint saida_exige_destino check (
    tipo <> 'saida'
    or centro_custo_id is not null
    or veiculo_id is not null
  );

drop index if exists idx_mov_numero_os;

alter table movimentacoes
  drop column if exists funcionario_id,
  drop column if exists numero_os;

alter table documentos
  drop column if exists numero_nf;

-- Cadastro de funcionarios inteiro: nao ha mais referencia a ele.
drop table if exists funcionarios;
