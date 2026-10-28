-- =====================================================================
-- StockManager  |  producao/antes_da_0015.sql
-- Rodar no banco NOVO logo antes de 0015_remove_colaborador_nf_os.sql.
--
-- Por que: a 0015 usa "create or replace view" para tirar colunas de
-- v_kardex e v_movimentacoes_detalhe, e o Postgres nao deixa remover
-- coluna com "or replace" ("cannot drop columns from view"). Em banco
-- limpo a 0015 falha sem este passo. O banco de desenvolvimento ja passou
-- da 0015 e nao precisa disto.
--
-- A 0015 nao foi editada porque ja estava aplicada (CLAUDE.md, secao 6).
-- As duas views sao recriadas pela propria 0015 logo em seguida.
-- =====================================================================

drop view if exists v_kardex;
drop view if exists v_movimentacoes_detalhe;
