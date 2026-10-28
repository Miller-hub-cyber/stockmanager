-- =====================================================================
-- StockManager  |  0017_catalogo_itens.sql
-- Biblioteca de nomes padronizados de pecas e materiais de frota.
--
-- O catalogo e global (sem empresa_id): e referencia, nao estoque. Ele
-- so sugere nome, tipo, unidade e NCM ao cadastrar um item em /gestao;
-- o item continua sendo criado em `itens`, por empresa, com SKU proprio.
-- Nenhum saldo ou movimentacao aponta para o catalogo.
--
-- NCM: codigo de 8 digitos da Nomenclatura Comum do Mercosul (Receita
-- Federal), o mesmo que vai na NF-e. No catalogo e uma SUGESTAO e deve
-- ser confirmado com a contabilidade antes de ser usado em documento
-- fiscal. Fica vazio onde a classificacao depende da especificacao do
-- produto.
-- =====================================================================

create table if not exists catalogo_itens (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null unique,
  grupo     text not null,
  tipo      tipo_item not null,
  unidade   text not null default 'UN',
  ncm       text,
  criado_em timestamptz not null default now(),
  constraint catalogo_ncm_formato check (ncm is null or ncm ~ '^[0-9]{8}$')
);

-- Leitura para qualquer usuario logado; sem policy de escrita, entao o
-- catalogo so muda por migration.
alter table catalogo_itens enable row level security;

drop policy if exists catalogo_itens_leitura on catalogo_itens;
create policy catalogo_itens_leitura on catalogo_itens
  for select to authenticated
  using (true);

-- NCM no item da empresa ------------------------------------------------
alter table itens
  add column if not exists ncm text;

alter table itens drop constraint if exists itens_ncm_formato;
alter table itens
  add constraint itens_ncm_formato check (ncm is null or ncm ~ '^[0-9]{8}$');
