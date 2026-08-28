-- =====================================================================
-- Casos que DEVEM falhar. Rode um por vez no SQL Editor.
-- Se algum passar sem erro, a regra nao esta protegida no banco.
-- =====================================================================

-- 1. Saida maior que o saldo  -> espera SALDO_INSUFICIENTE
-- insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, centro_custo_id)
-- values ('<empresa>', '<item com saldo 3>', '<deposito>', 'saida', 999, '<centro>');

-- 2. Saida sem destino de custo -> espera violacao de saida_exige_destino
-- insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade)
-- values ('<empresa>', '<item>', '<deposito>', 'saida', 1);

-- 3. Alterar movimentacao -> espera MOVIMENTACAO_IMUTAVEL
-- update movimentacoes set quantidade = 999 where id = '<movimentacao>';

-- 4. Excluir movimentacao -> espera MOVIMENTACAO_IMUTAVEL
-- delete from movimentacoes where id = '<movimentacao>';

-- 5. Editar saldo direto -> espera erro de permissao
-- update saldos set quantidade = 999 where id = '<saldo>';

-- 6. Usuario perfil 'consulta' cadastrando item -> espera erro de RLS
--    (policy "as restrictive"; sem ela, a policy generica de tenant
--    autorizaria sozinha e este insert passaria por engano)
-- insert into itens (empresa_id, sku, nome) values ('<empresa>', 'TESTE-01', 'Item de teste');

-- 7. Usuario perfil 'consulta' registrando movimentacao -> espera erro de RLS
-- insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, centro_custo_id)
-- values ('<empresa>', '<item>', '<deposito>', 'saida', 1, '<centro>');

-- 8. Usuario perfil 'almoxarife' cadastrando fornecedor -> espera erro de RLS
--    (Fase 4: mesma policy restritiva em depositos, categorias, fornecedores,
--    centros_custo, veiculos e funcionarios; almoxarife opera estoque, nao cadastra)
-- insert into fornecedores (empresa_id, nome) values ('<empresa>', 'Fornecedor teste');

-- 9. Usuario da empresa A tentando ler item da empresa B -> espera 0 linhas
--    (nao erro — RLS filtra silenciosamente; o teste e a query voltar vazia)
-- select * from itens where id = '<item de outra empresa>';

-- =====================================================================
-- Casos que DEVEM passar com valor exato.
-- =====================================================================

-- 10. Usuario autenticado comum (nao superuser) registra uma entrada e o
--     saldo e atualizado -> espera sucesso, nao erro de permissao em saldos.
--     Regressao especifica do fix da Fase 3: fn_aplicar_movimentacao precisa
--     ser security definer, senao o revoke em 0004_rls.sql quebra a escrita
--     em saldos pro papel authenticated.
-- insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario)
-- values ('<empresa>', '<item>', '<deposito>', 'entrada', 5, 10.00);
-- select quantidade from saldos where item_id = '<item>' and deposito_id = '<deposito>';

-- 11. Custo medio ponderado
--     entrada de 10 a 5,00 e depois 10 a 7,00  =>  itens.custo_medio = 6,0000
-- 12. Transferencia entre depositos preserva o saldo total do item
-- 13. fn_estornar_movimentacao devolve o saldo ao valor anterior
--     select fn_estornar_movimentacao('<movimentacao>', '<usuario>', 'Erro de digitacao');
