-- =====================================================================
-- StockManager  |  0001_init.sql
-- Estrutura base: enums, tabelas, indices e restricoes de integridade.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type tipo_item as enum
  ('peca','consumivel','epi','ferramenta','pneu','lubrificante','outro');

create type tipo_mov as enum
  ('entrada','saida','transferencia','ajuste','devolucao','emprestimo');

create type perfil_usuario as enum
  ('admin','gestor','almoxarife','consulta');

-- ------------------------------------------------------------- empresas
create table empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cnpj       text,
  criado_em  timestamptz not null default now()
);

create table usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id),
  nome       text not null,
  email      text not null,
  perfil     perfil_usuario not null default 'consulta',
  pin        text,                       -- acesso rapido no balcao (hash)
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- ------------------------------------------------------------- cadastros
create table depositos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome       text not null,
  descricao  text,
  ativo      boolean not null default true
);

create table categorias (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome       text not null
);

create table fornecedores (
  id                 uuid primary key default gen_random_uuid(),
  empresa_id         uuid not null references empresas(id),
  nome               text not null,
  cnpj               text,
  telefone           text,
  email              text,
  prazo_entrega_dias int not null default 7,
  ativo              boolean not null default true
);

create table centros_custo (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome       text not null,
  codigo     text,
  ativo      boolean not null default true
);

create table veiculos (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  placa      text not null,
  modelo     text,
  ano        int,
  km_atual   numeric(12,2) not null default 0,
  ativo      boolean not null default true,
  unique (empresa_id, placa)
);

create table funcionarios (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome       text not null,
  matricula  text,
  funcao     text,
  ativo      boolean not null default true
);

-- ----------------------------------------------------------------- itens
create table itens (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id),
  sku             text not null,
  nome            text not null,
  descricao       text,
  tipo            tipo_item not null default 'consumivel',
  categoria_id    uuid references categorias(id),
  fornecedor_id   uuid references fornecedores(id),
  unidade         text not null default 'UN',
  fator_conversao numeric(12,3) not null default 1,   -- compra x consumo
  estoque_minimo  numeric(12,3) not null default 0,
  ponto_pedido    numeric(12,3) not null default 0,
  custo_medio     numeric(12,4) not null default 0,
  codigo_barras   text,
  controla_serie  boolean not null default false,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now(),
  unique (empresa_id, sku)
);

create table saldos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id),
  item_id       uuid not null references itens(id),
  deposito_id   uuid not null references depositos(id),
  quantidade    numeric(12,3) not null default 0,
  atualizado_em timestamptz not null default now(),
  unique (item_id, deposito_id),
  constraint saldo_nao_negativo check (quantidade >= 0)
);

-- ----------------------------------------------------------- documentos
create table documentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id),
  tipo          tipo_mov not null,
  numero_nf     text,
  fornecedor_id uuid references fornecedores(id),
  data          date not null default current_date,
  valor_total   numeric(14,2),
  anexo_url     text,
  observacao    text,
  usuario_id    uuid references usuarios(id),
  criado_em     timestamptz not null default now()
);

create table movimentacoes (
  id                  uuid primary key default gen_random_uuid(),
  empresa_id          uuid not null references empresas(id),
  item_id             uuid not null references itens(id),
  deposito_id         uuid not null references depositos(id),
  tipo                tipo_mov not null,
  quantidade          numeric(12,3) not null,
  custo_unitario      numeric(12,4) not null default 0,
  documento_id        uuid references documentos(id),
  centro_custo_id     uuid references centros_custo(id),
  veiculo_id          uuid references veiculos(id),
  funcionario_id      uuid references funcionarios(id),
  km_veiculo          numeric(12,2),
  deposito_destino_id uuid references depositos(id),
  motivo              text,
  estorno_de          uuid references movimentacoes(id),
  usuario_id          uuid references usuarios(id),
  criado_em           timestamptz not null default now(),

  constraint quantidade_nao_zero check (quantidade <> 0),

  -- regra central: nenhuma saida sem responsavel identificado
  constraint saida_exige_destino check (
    tipo <> 'saida'
    or centro_custo_id is not null
    or veiculo_id is not null
    or funcionario_id is not null
  ),

  constraint transferencia_exige_destino check (
    tipo <> 'transferencia' or deposito_destino_id is not null
  )
);

create index idx_mov_item      on movimentacoes (item_id, criado_em desc);
create index idx_mov_veiculo   on movimentacoes (veiculo_id, criado_em desc);
create index idx_mov_empresa   on movimentacoes (empresa_id, criado_em desc);
create index idx_mov_centro    on movimentacoes (centro_custo_id, criado_em desc);
create index idx_itens_busca   on itens (empresa_id, ativo, nome);
create index idx_itens_barras  on itens (empresa_id, codigo_barras);

-- ------------------------------------------------------------------ EPI
create table epi_entregas (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references empresas(id),
  funcionario_id  uuid not null references funcionarios(id),
  item_id         uuid not null references itens(id),
  movimentacao_id uuid references movimentacoes(id),
  numero_ca       text,
  validade_ca     date,
  quantidade      numeric(12,3) not null default 1,
  data_entrega    date not null default current_date,
  data_devolucao  date,
  assinatura_url  text,
  criado_em       timestamptz not null default now()
);

-- ----------------------------------------------------------- inventario
create table inventarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  deposito_id uuid not null references depositos(id),
  status      text not null default 'aberto',
  iniciado_em timestamptz not null default now(),
  fechado_em  timestamptz,
  usuario_id  uuid references usuarios(id)
);

create table inventario_itens (
  id            uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references inventarios(id) on delete cascade,
  item_id       uuid not null references itens(id),
  qtd_sistema   numeric(12,3) not null,
  qtd_contada   numeric(12,3),
  divergencia   numeric(12,3) generated always as (qtd_contada - qtd_sistema) stored
);
