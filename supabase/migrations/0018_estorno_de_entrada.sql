-- =====================================================================
-- StockManager  |  0018_estorno_de_entrada.sql
-- Estorno de entrada falhava sempre: ele gera uma saida, e entrada nao tem
-- destino de custo para copiar, entao saida_exige_destino recusava. Isso
-- deixava sem correcao qualquer entrada errada, inclusive o saldo inicial.
--
-- O estorno cancela um lancamento, nao consome material, entao nao precisa
-- de destino. Saida comum continua obrigada a ter um.
-- =====================================================================

alter table movimentacoes drop constraint if exists saida_exige_destino;
alter table movimentacoes
  add constraint saida_exige_destino check (
    tipo <> 'saida'
    or centro_custo_id is not null
    or veiculo_id is not null
    or estorno_de is not null
  );

-- fn_estornar_movimentacao checa estorno repetido com um select, que nao
-- segura dois cliques simultaneos. Com o CHECK mais brando, o indice unico
-- passa a ser a garantia real.
create unique index if not exists idx_mov_estorno_unico
  on movimentacoes (estorno_de)
  where estorno_de is not null;
