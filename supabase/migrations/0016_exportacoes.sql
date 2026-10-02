-- =====================================================================
-- StockManager  |  0016_exportacoes.sql
-- Historico de exportacoes de relatorio: quem baixou qual relatorio,
-- em que formato e com quais filtros. Alimenta "Exportacoes recentes"
-- na tela de relatorios e permite baixar de novo com os mesmos filtros.
--
-- Registro imutavel: nao ha policy de update nem de delete.
-- =====================================================================

create table if not exists exportacoes (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  usuario_id  uuid not null references usuarios(id),
  relatorio   text not null,
  formato     text not null default 'csv',
  periodo_de  date,
  periodo_ate date,
  item_id     uuid references itens(id),
  veiculo_id  uuid references veiculos(id),
  criado_em   timestamptz not null default now(),

  constraint exportacao_relatorio_valido check (relatorio in (
    'entradas', 'saidas', 'geral', 'kardex',
    'consumo-veiculo', 'consumo-centro', 'itens-parados', 'valor-estoque'
  )),
  constraint exportacao_formato_valido check (formato in ('csv', 'xlsx'))
);

create index if not exists idx_exportacoes_usuario on exportacoes (usuario_id, criado_em desc);
create index if not exists idx_exportacoes_empresa on exportacoes (empresa_id, criado_em desc);

alter table exportacoes enable row level security;

-- Relatorio e coisa de admin e gestor (o mesmo corte das rotas /gestao).
drop policy if exists exportacoes_leitura on exportacoes;
create policy exportacoes_leitura on exportacoes
  for select using (
    empresa_id = fn_empresa_atual()
    and fn_perfil_atual() in ('admin', 'gestor')
  );

-- Cada um registra so as proprias exportacoes, na propria empresa.
drop policy if exists exportacoes_registro on exportacoes;
create policy exportacoes_registro on exportacoes
  for insert with check (
    empresa_id = fn_empresa_atual()
    and usuario_id = auth.uid()
    and fn_perfil_atual() in ('admin', 'gestor')
  );

grant select, insert on exportacoes to authenticated;
revoke update, delete on exportacoes from authenticated;
