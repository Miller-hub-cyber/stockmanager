-- =====================================================================
-- StockManager  |  0005_seed.sql
-- Dados de teste. NAO rode em producao.
-- Substitua o uuid do usuario pelo id real criado no Supabase Auth.
-- =====================================================================

insert into empresas (id, nome, cnpj) values
  ('11111111-1111-1111-1111-111111111111', 'Transportadora Exemplo', '00.000.000/0001-00');

insert into depositos (id, empresa_id, nome) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Almoxarifado central'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Oficina');

insert into categorias (id, empresa_id, nome) values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Filtros'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Lubrificantes'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Freios'),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'EPI'),
  ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'Insumos');

insert into fornecedores (id, empresa_id, nome, prazo_entrega_dias) values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Distribuidora Norte', 5),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Petro Insumos', 3),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Auto Pecas Belem', 7);

insert into centros_custo (empresa_id, nome, codigo) values
  ('11111111-1111-1111-1111-111111111111', 'Oficina interna', 'OFI'),
  ('11111111-1111-1111-1111-111111111111', 'Armazem', 'ARM'),
  ('11111111-1111-1111-1111-111111111111', 'Administrativo', 'ADM');

insert into veiculos (empresa_id, placa, modelo, km_atual) values
  ('11111111-1111-1111-1111-111111111111', 'RKN-2C41', 'Scania R450', 412880),
  ('11111111-1111-1111-1111-111111111111', 'PXH-7B09', 'Volvo FH 460', 289340),
  ('11111111-1111-1111-1111-111111111111', 'QTA-5J77', 'Mercedes Actros', 158720),
  ('11111111-1111-1111-1111-111111111111', 'NEG-1D22', 'VW Constellation', 501230),
  ('11111111-1111-1111-1111-111111111111', 'OSB-9F13', 'Iveco Tector', 97460);

insert into funcionarios (empresa_id, nome, matricula, funcao) values
  ('11111111-1111-1111-1111-111111111111', 'Almoxarife de turno', '001', 'Almoxarife'),
  ('11111111-1111-1111-1111-111111111111', 'Mecanico responsavel', '002', 'Mecanico'),
  ('11111111-1111-1111-1111-111111111111', 'Conferente', '003', 'Conferente');

insert into itens (empresa_id, sku, nome, tipo, categoria_id, fornecedor_id, unidade, estoque_minimo, ponto_pedido) values
  ('11111111-1111-1111-1111-111111111111','FLT-0042','Filtro de oleo Mann W950','peca','33333333-3333-3333-3333-333333333331','44444444-4444-4444-4444-444444444441','UN',8,15),
  ('11111111-1111-1111-1111-111111111111','FLT-0043','Filtro de ar Mann C30850','peca','33333333-3333-3333-3333-333333333331','44444444-4444-4444-4444-444444444441','UN',6,12),
  ('11111111-1111-1111-1111-111111111111','LUB-0011','Oleo motor 15W40 mineral','lubrificante','33333333-3333-3333-3333-333333333332','44444444-4444-4444-4444-444444444442','L',40,80),
  ('11111111-1111-1111-1111-111111111111','LUB-0014','ARLA 32','lubrificante','33333333-3333-3333-3333-333333333332','44444444-4444-4444-4444-444444444442','L',50,100),
  ('11111111-1111-1111-1111-111111111111','FRE-0003','Pastilha de freio dianteira','peca','33333333-3333-3333-3333-333333333333','44444444-4444-4444-4444-444444444443','JG',4,8),
  ('11111111-1111-1111-1111-111111111111','EPI-0002','Luva de vaqueta','epi','33333333-3333-3333-3333-333333333334',null,'PAR',20,40),
  ('11111111-1111-1111-1111-111111111111','EPI-0005','Bota de seguranca bico composite','epi','33333333-3333-3333-3333-333333333334',null,'PAR',10,20),
  ('11111111-1111-1111-1111-111111111111','INS-0018','Filme stretch 500mm','consumivel','33333333-3333-3333-3333-333333333335',null,'RL',20,40);

-- Estoque inicial entra como movimentacao, nunca como update em saldos.
insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario, motivo)
select empresa_id, id, deposito_id, 'entrada', quantidade, custo_unitario, 'Inventario inicial'
  from (
    select i.empresa_id,
           i.id,
           '22222222-2222-2222-2222-222222222221'::uuid as deposito_id,
           (array[12,3,84,0,6,28,7,46])[row_number() over (order by i.sku)] as quantidade,
           (array[48.90,132.50,22.40,4.20,289.00,14.30,128.00,37.90])[row_number() over (order by i.sku)] as custo_unitario
      from itens i
     where i.empresa_id = '11111111-1111-1111-1111-111111111111'
  ) s
 where quantidade > 0;
