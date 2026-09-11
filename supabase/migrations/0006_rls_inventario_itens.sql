-- =====================================================================
-- StockManager  |  0006_rls_inventario_itens.sql
-- inventario_itens ficou de fora do loop de RLS em 0004_rls.sql porque
-- nao tinha empresa_id proprio (so referenciava inventarios). Fecha o
-- isolamento por empresa tambem aqui, mesmo a tabela ainda sem uso na
-- interface (Fase 2).
-- =====================================================================

alter table inventario_itens
  add column if not exists empresa_id uuid references empresas(id);

update inventario_itens ii
   set empresa_id = inv.empresa_id
  from inventarios inv
 where inv.id = ii.inventario_id
   and ii.empresa_id is null;

alter table inventario_itens
  alter column empresa_id set not null;

alter table inventario_itens enable row level security;

drop policy if exists inventario_itens_tenant on inventario_itens;
create policy inventario_itens_tenant on inventario_itens
  for all
  using (empresa_id = fn_empresa_atual())
  with check (empresa_id = fn_empresa_atual());
