-- =====================================================================
-- StockManager  |  0017_seguranca_producao.sql
-- Fecha o que a auditoria antes da producao encontrou (ver
-- supabase/producao/03_verificacao.sql, que testa cada item abaixo):
--   1. views rodavam como dono e ignoravam a RLS: a chave anon, que e
--      publica, lia kardex e valor de estoque sem login
--   2. empresas estava sem RLS
--   3. usuario desativado era barrado so na tela de login
--   4. DELETE continuava liberado pela policy "for all" de cada tabela
-- =====================================================================

-- 1. Views respeitam a RLS de quem consulta -----------------------------
do $$
declare v text;
begin
  for v in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'v'
  loop
    execute format('alter view %I set (security_invoker = true)', v);
  end loop;
end $$;

-- Sem login nao ha nada a ler: toda rota do app exige sessao. As policies
-- ja devolveriam vazio, isto e a segunda camada.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- 2. Empresa: cada usuario le a propria, escrita so pelo dono do banco ---
alter table empresas enable row level security;

drop policy if exists empresas_tenant on empresas;
create policy empresas_tenant on empresas
  for select using (id = fn_empresa_atual());

revoke insert, update, delete on empresas from authenticated;

-- 3. Usuario desativado perde o acesso no banco --------------------------
-- As duas funcoes alimentam todas as policies: retornando nulo, nenhuma
-- policy de empresa ou perfil passa.
create or replace function fn_empresa_atual()
returns uuid language sql stable security definer
set search_path = public, pg_temp as $$
  select empresa_id from usuarios where id = auth.uid() and ativo;
$$;

create or replace function fn_perfil_atual()
returns perfil_usuario language sql stable security definer
set search_path = public, pg_temp as $$
  select perfil from usuarios where id = auth.uid() and ativo;
$$;

-- src/actions/login.ts precisa ler a propria linha para dizer "acesso
-- desativado" em vez de "usuario nao configurado".
drop policy if exists usuarios_proprio on usuarios;
create policy usuarios_proprio on usuarios
  for select using (id = auth.uid());

alter function fn_atualizar_km_veiculo() set search_path = public, pg_temp;

revoke all on function fn_estornar_movimentacao(uuid, uuid, text) from public, anon;
revoke all on function fn_obter_ou_criar_veiculo(text) from public, anon;
grant execute on function fn_estornar_movimentacao(uuid, uuid, text) to authenticated;
grant execute on function fn_obter_ou_criar_veiculo(text) to authenticated;

-- 4. Nada e excluido pela aplicacao: desativacao e por ativo = false -----
revoke delete, truncate on all tables in schema public from authenticated;
alter default privileges in schema public revoke delete, truncate on tables from authenticated;
