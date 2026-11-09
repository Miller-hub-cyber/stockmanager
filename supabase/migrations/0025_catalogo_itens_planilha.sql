-- =====================================================================
-- StockManager  |  0025_catalogo_itens_planilha.sql
-- Nomes novos na biblioteca (ver 0021_catalogo_itens.sql), tirados da
-- planilha de estoque usada na filial antes do sistema: pecas e insumos
-- que a operacao ja usa e que nao estavam no catalogo.
--
-- Mesmo criterio da 0022: nome generico, sem marca nem medida. Rodar de
-- novo nao duplica (unique em nome). NCM fica vazio: a classificacao
-- depende da especificacao do produto.
-- =====================================================================

insert into catalogo_itens (nome, grupo, tipo, unidade, ncm) values
  -- Freios -------------------------------------------------------------
  ('Diafragma de freio',                    'Freios', 'peca', 'UN', null),
  ('Trava aranha',                          'Freios', 'peca', 'UN', null),
  ('Patim de freio',                        'Freios', 'peca', 'UN', null),

  -- Suspensão e direção -------------------------------------------------
  ('Bucha de suspensão',                    'Suspensão e direção', 'peca', 'UN', null),
  ('Bucha do eixo',                         'Suspensão e direção', 'peca', 'UN', null),
  ('Bucha da balança',                      'Suspensão e direção', 'peca', 'UN', null),
  ('Deslizante de mola',                    'Suspensão e direção', 'peca', 'UN', null),
  ('Rolamento de rolo cônico',              'Suspensão e direção', 'peca', 'UN', null),

  -- Embreagem e transmissão ----------------------------------------------
  ('Kit pinhão e coroa',                    'Embreagem e transmissão', 'peca', 'JG', null),
  ('Rolamento da caixa de câmbio',          'Embreagem e transmissão', 'peca', 'UN', null),

  -- Motor ----------------------------------------------------------------
  ('Correia de acessórios',                 'Motor', 'peca', 'UN', null),
  ('Anel do bujão do cárter',               'Motor', 'peca', 'UN', null),
  ('Boia do tanque de combustível',         'Motor', 'peca', 'UN', null),

  -- Ar comprimido --------------------------------------------------------
  ('Válvula solenoide',                     'Ar comprimido', 'peca', 'UN', null),
  ('Válvula 3/2',                           'Ar comprimido', 'peca', 'UN', null),
  ('Válvula retentora',                     'Ar comprimido', 'peca', 'UN', null),
  ('Válvula de respiro',                    'Ar comprimido', 'peca', 'UN', null),
  ('Mangueira pneumática com conexões',     'Ar comprimido', 'peca', 'UN', null),

  -- Fixação e vedação ------------------------------------------------------
  ('Parafuso olhal',                        'Fixação e vedação', 'consumivel', 'UN', null),
  ('Porca castelo',                         'Fixação e vedação', 'consumivel', 'UN', null),
  ('Abraçadeira U',                         'Fixação e vedação', 'consumivel', 'UN', null),
  ('Junta de flange',                       'Fixação e vedação', 'consumivel', 'UN', null),
  ('Retentor de óleo',                      'Fixação e vedação', 'consumivel', 'UN', null),
  ('Kit de anéis o-ring',                   'Fixação e vedação', 'consumivel', 'KIT', null),
  ('Adesivo instantâneo',                   'Fixação e vedação', 'consumivel', 'UN', null),
  ('Fita crepe',                            'Fixação e vedação', 'consumivel', 'RL', null),
  ('Fita dupla face',                       'Fixação e vedação', 'consumivel', 'RL', null),
  ('Fita adesiva prateada (silver tape)',   'Fixação e vedação', 'consumivel', 'RL', null),

  -- Elétrica e iluminação --------------------------------------------------
  ('Lâmpada H1',                            'Elétrica e iluminação', 'consumivel', 'UN', null),
  ('Lâmpada H3',                            'Elétrica e iluminação', 'consumivel', 'UN', null),
  ('Botão de partida',                      'Elétrica e iluminação', 'peca', 'UN', null),

  -- Carroceria e cabine ----------------------------------------------------
  ('Rolete do patim (sider)',               'Carroceria e cabine', 'peca', 'UN', null),
  ('Rabicho da lona sider',                 'Carroceria e cabine', 'peca', 'UN', null),
  ('Fivela da lona sider',                  'Carroceria e cabine', 'peca', 'UN', null),
  ('Bucha da cabine',                       'Carroceria e cabine', 'peca', 'UN', null),
  ('Cola para para-brisa',                  'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Tinta automotiva PU',                   'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Esmalte automotivo',                    'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Primer PU',                             'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Verniz PU',                             'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Thinner',                               'Carroceria e cabine', 'consumivel', 'L',  null),
  ('Catalisador (endurecedor) de tinta',    'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Massa poliéster',                       'Carroceria e cabine', 'consumivel', 'UN', null),
  ('Massa de polir',                        'Carroceria e cabine', 'consumivel', 'UN', null),

  -- Carga e sinalização ----------------------------------------------------
  ('Corrente de amarração',                 'Carga e sinalização', 'consumivel', 'M',  null),
  ('Cabo de aço',                           'Carga e sinalização', 'consumivel', 'M',  null),
  ('Esticador de lona',                     'Carga e sinalização', 'peca', 'UN', null),

  -- Lubrificantes e fluidos ------------------------------------------------
  ('Lubrificante pneumático',               'Lubrificantes e fluidos', 'lubrificante', 'L', null),
  ('Limpador de bico injetor',              'Lubrificantes e fluidos', 'consumivel', 'UN', null),

  -- Ferramentas ------------------------------------------------------------
  ('Chave de boca',                         'Ferramentas', 'ferramenta', 'UN', null),
  ('Chave L (hexagonal)',                   'Ferramentas', 'ferramenta', 'UN', null),
  ('Paquímetro',                            'Ferramentas', 'ferramenta', 'UN', null),
  ('Lima',                                  'Ferramentas', 'ferramenta', 'UN', null),
  ('Serra copo',                            'Ferramentas', 'ferramenta', 'UN', null),
  ('Carregador de bateria',                 'Ferramentas', 'ferramenta', 'UN', null),
  ('Garra negativa (terra) de solda',       'Ferramentas', 'ferramenta', 'UN', null),
  ('Eletrodo de solda',                     'Ferramentas', 'consumivel', 'KG', null),
  ('Antirrespingo de solda',                'Ferramentas', 'consumivel', 'UN', null),
  ('Disco flap',                            'Ferramentas', 'consumivel', 'UN', null),
  ('Disco de lixa',                         'Ferramentas', 'consumivel', 'UN', null),
  ('Pincel',                                'Ferramentas', 'consumivel', 'UN', null)
on conflict (nome) do nothing;
