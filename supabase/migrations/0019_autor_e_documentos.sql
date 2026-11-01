-- =====================================================================
-- StockManager  |  0019_autor_e_documentos.sql
-- Fecha duas pendencias da auditoria de producao:
--   1. o autor de movimentacoes e documentos vinha da aplicacao, e quem
--      chamasse a API direto podia gravar outro usuario como responsavel
--   2. o perfil consulta conseguia gravar em documentos
-- =====================================================================

-- 1. Autor vem da sessao. Sem sessao (migration, SQL Editor) mantem o
-- valor informado.
create or replace function fn_definir_autor()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null then
    new.usuario_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mov_autor on movimentacoes;
create trigger trg_mov_autor
  before insert on movimentacoes
  for each row execute function fn_definir_autor();

drop trigger if exists trg_documento_autor on documentos;
create trigger trg_documento_autor
  before insert on documentos
  for each row execute function fn_definir_autor();

-- 2. Documento acompanha a entrada: quem registra movimentacao pode gravar.
-- "as restrictive" pelo mesmo motivo de 0004_rls.sql.
drop policy if exists documentos_escrita on documentos;
create policy documentos_escrita on documentos
  as restrictive
  for insert with check (fn_perfil_atual() in ('admin','gestor','almoxarife'));

drop policy if exists documentos_update on documentos;
create policy documentos_update on documentos
  as restrictive
  for update using (fn_perfil_atual() in ('admin','gestor','almoxarife'));
