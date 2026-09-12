-- =====================================================================
-- StockManager  |  0008_endereco_fornecedor.sql
-- Endereco do fornecedor, usado no contato para reposicao de compra.
-- =====================================================================

alter table fornecedores
  add column if not exists endereco text;
