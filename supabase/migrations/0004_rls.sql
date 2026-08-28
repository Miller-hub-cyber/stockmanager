-- =====================================================================
-- StockManager  |  0004_rls.sql
-- Isolamento por empresa e restricao de escrita por perfil.
-- =====================================================================

create or replace function fn_empresa_atual()
returns uuid language sql stable security definer as $$
  select empresa_id from usuarios where id = auth.uid();
$$;

create or replace function fn_perfil_atual()
returns perfil_usuario language sql stable security definer as $$
  select perfil from usuarios where id = auth.uid();
$$;

-- Leitura e escrita restritas a propria empresa -------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'depositos','categorias','fornecedores','centros_custo','veiculos',
    'funcionarios','itens','saldos','documentos','movimentacoes',
    'epi_entregas','inventarios'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format($f$
      create policy %I_tenant on %I
        for all
        using (empresa_id = fn_empresa_atual())
        with check (empresa_id = fn_empresa_atual())
    $f$, t, t);
  end loop;
end $$;

alter table usuarios enable row level security;
create policy usuarios_tenant on usuarios
  for select using (empresa_id = fn_empresa_atual());

-- Cadastro so pode ser alterado por admin -------------------------------
-- "as restrictive" e obrigatorio aqui: policies permissivas (o padrao) se
-- combinam com OR. Sem "restrictive", *_tenant (for all, qualquer perfil
-- da empresa) ja autorizaria o insert/update sozinha e estas policies
-- virariam letra morta. Restrictive combina com AND: a linha so passa se
-- a tenant permitir E a policy de perfil tambem permitir.
create policy itens_escrita_admin on itens
  as restrictive
  for insert with check (fn_perfil_atual() in ('admin','gestor'));

create policy itens_update_admin on itens
  as restrictive
  for update using (fn_perfil_atual() in ('admin','gestor'));

-- Mesma regra para os demais cadastros da Fase 4 (mesmo motivo do "as
-- restrictive" acima: sem isso, a policy generica de tenant libera sozinha).
do $$
declare t text;
begin
  foreach t in array array[
    'depositos','categorias','fornecedores','centros_custo','veiculos','funcionarios'
  ]
  loop
    execute format($f$
      create policy %I_escrita_admin on %I
        as restrictive
        for insert with check (fn_perfil_atual() in ('admin','gestor'))
    $f$, t, t);
    execute format($f$
      create policy %I_update_admin on %I
        as restrictive
        for update using (fn_perfil_atual() in ('admin','gestor'))
    $f$, t, t);
  end loop;
end $$;

-- Movimentacao pode ser registrada por almoxarife -----------------------
create policy mov_registro on movimentacoes
  as restrictive
  for insert with check (
    fn_perfil_atual() in ('admin','gestor','almoxarife')
    and empresa_id = fn_empresa_atual()
  );

-- Saldo e somente leitura pela aplicacao --------------------------------
revoke insert, update, delete on saldos from authenticated;
