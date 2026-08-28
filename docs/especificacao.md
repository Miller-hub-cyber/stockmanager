# Sistema de Estoque Operacional Interno
## Especificação técnica e plano de execução
**Contexto:** empresa de logística, controle de material de uso próprio (frota, peças, EPI, insumos de operação).

---

## 1. Definição de escopo

### 1.1 O que este sistema controla

| Categoria | Exemplos | Particularidade |
|---|---|---|
| Peças de frota | Filtros, correias, pastilhas, lâmpadas | Consumo vinculado a veículo |
| Lubrificantes | Óleo motor, graxa, ARLA 32 | Unidade em litros, fracionamento |
| Pneus | Pneu novo, recapado | Item serializado, ciclo de vida próprio |
| EPI | Luva, bota, colete, capacete | Exigência legal (NR-6), entrega nominal |
| Insumos de operação | Filme stretch, fita, etiqueta, pallet | Alto giro, baixo valor unitário |
| Ferramentas | Chave, macaco, torquímetro | Empréstimo com devolução, não é consumo |
| Escritório e limpeza | Papel, material de higiene | Baixa criticidade |

### 1.2 O que este sistema NÃO controla

Mercadoria de clientes, carga em trânsito, expedição, romaneio, endereçamento de armazém. Se isso entrar no escopo depois, é outro produto (WMS).

### 1.3 A regra que define o sistema inteiro

> **Toda saída deve ter um destino de custo obrigatório: um veículo, um setor ou um funcionário.**

Sem essa regra o sistema vira uma lista de quantidades e não gera nenhuma decisão. Com ela, o cliente passa a saber quanto cada caminhão custa em manutenção por mês, que é a informação que ele não tem hoje.

---

## 2. Regras de negócio críticas

1. **Movimentação é imutável.** Erro se corrige com estorno, nunca com exclusão ou edição. Auditoria depende disso.
2. **Saldo nunca é editado diretamente.** É sempre resultado de movimentações, calculado por trigger no banco.
3. **Saldo não pode ficar negativo.** Se a operação tentar, o sistema bloqueia e exige ajuste de inventário antes.
4. **Custo médio ponderado é recalculado apenas na entrada.**
   `novo_custo = (saldo × custo_atual + qtd_entrada × custo_entrada) / (saldo + qtd_entrada)`
5. **Saída é valorizada pelo custo médio vigente no momento.** É isso que permite o relatório de custo por veículo.
6. **Ponto de pedido é calculado, não chutado.**
   `ponto_pedido = (consumo_médio_diário × prazo_de_entrega_em_dias) + estoque_de_segurança`
   `estoque_de_segurança = consumo_médio_diário × dias_de_folga`
7. **EPI exige rastro nominal.** Quem recebeu, qual CA, qual validade, data de entrega, data de devolução ou troca.
8. **Ferramenta não dá baixa.** Ela sai como empréstimo e precisa voltar. Movimentação de tipo separado.

---

## 3. Modelo de dados

### 3.1 Diagrama lógico

```
empresas
   ├── usuarios (perfil: admin | almoxarife | requisitante | consulta)
   ├── depositos (almoxarifado central, oficina, filial)
   ├── categorias
   ├── fornecedores
   ├── centros_custo (setores)
   ├── veiculos (placa, modelo, km)
   ├── funcionarios
   └── itens
         ├── saldos (item × deposito)
         └── movimentacoes
               ├── documentos (nota fiscal de entrada)
               └── epi_entregas
```

### 3.2 Schema SQL (Postgres / Supabase)

```sql
-- ============================================
-- 0001_init.sql
-- ============================================

create extension if not exists "pgcrypto";

create type tipo_item as enum
  ('peca','consumivel','epi','ferramenta','pneu','lubrificante','outro');

create type tipo_mov as enum
  ('entrada','saida','transferencia','ajuste','devolucao','emprestimo');

create type perfil_usuario as enum
  ('admin','almoxarife','requisitante','consulta');

-- --------------------------------------------
create table empresas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cnpj        text,
  criado_em   timestamptz not null default now()
);

create table usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  empresa_id  uuid not null references empresas(id),
  nome        text not null,
  email       text not null,
  perfil      perfil_usuario not null default 'consulta',
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

create table depositos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  nome        text not null,
  descricao   text,
  ativo       boolean not null default true
);

create table categorias (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  nome        text not null
);

create table fornecedores (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  nome        text not null,
  cnpj        text,
  telefone    text,
  email       text,
  prazo_entrega_dias int default 7,
  ativo       boolean not null default true
);

create table centros_custo (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  nome        text not null,
  codigo      text,
  ativo       boolean not null default true
);

create table veiculos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  placa       text not null,
  modelo      text,
  ano         int,
  km_atual    numeric(12,2) default 0,
  ativo       boolean not null default true,
  unique (empresa_id, placa)
);

create table funcionarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  nome        text not null,
  matricula   text,
  funcao      text,
  ativo       boolean not null default true
);

-- --------------------------------------------
create table itens (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references empresas(id),
  sku               text not null,
  nome              text not null,
  descricao         text,
  tipo              tipo_item not null default 'consumivel',
  categoria_id      uuid references categorias(id),
  fornecedor_id     uuid references fornecedores(id),
  unidade           text not null default 'UN',
  estoque_minimo    numeric(12,3) not null default 0,
  ponto_pedido      numeric(12,3) not null default 0,
  custo_medio       numeric(12,4) not null default 0,
  codigo_barras     text,
  controla_serie    boolean not null default false,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now(),
  unique (empresa_id, sku)
);

create table saldos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references empresas(id),
  item_id     uuid not null references itens(id),
  deposito_id uuid not null references depositos(id),
  quantidade  numeric(12,3) not null default 0,
  atualizado_em timestamptz not null default now(),
  unique (item_id, deposito_id),
  constraint saldo_nao_negativo check (quantidade >= 0)
);

create table documentos (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references empresas(id),
  tipo          tipo_mov not null,
  numero_nf     text,
  fornecedor_id uuid references fornecedores(id),
  data          date not null default current_date,
  valor_total   numeric(14,2),
  observacao    text,
  usuario_id    uuid references usuarios(id),
  criado_em     timestamptz not null default now()
);

create table movimentacoes (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references empresas(id),
  item_id          uuid not null references itens(id),
  deposito_id      uuid not null references depositos(id),
  tipo             tipo_mov not null,
  quantidade       numeric(12,3) not null check (quantidade > 0),
  custo_unitario   numeric(12,4) not null default 0,
  documento_id     uuid references documentos(id),
  centro_custo_id  uuid references centros_custo(id),
  veiculo_id       uuid references veiculos(id),
  funcionario_id   uuid references funcionarios(id),
  deposito_destino_id uuid references depositos(id),
  motivo           text,
  estorno_de       uuid references movimentacoes(id),
  usuario_id       uuid references usuarios(id),
  criado_em        timestamptz not null default now(),

  -- destino de custo obrigatorio na saida
  constraint saida_exige_destino check (
    tipo <> 'saida'
    or centro_custo_id is not null
    or veiculo_id is not null
    or funcionario_id is not null
  )
);

create index idx_mov_item_data on movimentacoes (item_id, criado_em desc);
create index idx_mov_veiculo    on movimentacoes (veiculo_id, criado_em desc);
create index idx_mov_empresa    on movimentacoes (empresa_id, criado_em desc);

-- --------------------------------------------
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

create table inventarios (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references empresas(id),
  deposito_id  uuid not null references depositos(id),
  status       text not null default 'aberto',
  iniciado_em  timestamptz not null default now(),
  fechado_em   timestamptz,
  usuario_id   uuid references usuarios(id)
);

create table inventario_itens (
  id             uuid primary key default gen_random_uuid(),
  inventario_id  uuid not null references inventarios(id) on delete cascade,
  item_id        uuid not null references itens(id),
  qtd_sistema    numeric(12,3) not null,
  qtd_contada    numeric(12,3),
  divergencia    numeric(12,3) generated always as (qtd_contada - qtd_sistema) stored
);
```

### 3.3 Triggers (o coração do sistema)

```sql
-- ============================================
-- 0002_triggers.sql
-- ============================================

create or replace function fn_aplicar_movimentacao()
returns trigger
language plpgsql
as $$
declare
  v_saldo_atual  numeric(12,3);
  v_custo_atual  numeric(12,4);
  v_delta        numeric(12,3);
begin
  -- garante linha de saldo
  insert into saldos (empresa_id, item_id, deposito_id, quantidade)
  values (new.empresa_id, new.item_id, new.deposito_id, 0)
  on conflict (item_id, deposito_id) do nothing;

  select quantidade into v_saldo_atual
    from saldos
   where item_id = new.item_id and deposito_id = new.deposito_id
   for update;

  -- define o sinal
  v_delta := case new.tipo
    when 'entrada'    then  new.quantidade
    when 'devolucao'  then  new.quantidade
    when 'saida'      then -new.quantidade
    when 'emprestimo' then -new.quantidade
    when 'transferencia' then -new.quantidade
    when 'ajuste'     then  new.quantidade  -- pode ser negativo via estorno
    else 0
  end;

  if v_saldo_atual + v_delta < 0 then
    raise exception
      'Saldo insuficiente. Disponivel: %, solicitado: %',
      v_saldo_atual, new.quantidade;
  end if;

  update saldos
     set quantidade = quantidade + v_delta,
         atualizado_em = now()
   where item_id = new.item_id and deposito_id = new.deposito_id;

  -- transferencia credita o deposito destino
  if new.tipo = 'transferencia' and new.deposito_destino_id is not null then
    insert into saldos (empresa_id, item_id, deposito_id, quantidade)
    values (new.empresa_id, new.item_id, new.deposito_destino_id, 0)
    on conflict (item_id, deposito_id) do nothing;

    update saldos
       set quantidade = quantidade + new.quantidade,
           atualizado_em = now()
     where item_id = new.item_id
       and deposito_id = new.deposito_destino_id;
  end if;

  -- custo medio ponderado, apenas na entrada
  if new.tipo = 'entrada' and new.custo_unitario > 0 then
    select custo_medio into v_custo_atual from itens where id = new.item_id;

    update itens
       set custo_medio = case
             when (v_saldo_atual + new.quantidade) > 0 then
               ((v_saldo_atual * v_custo_atual) +
                (new.quantidade * new.custo_unitario))
               / (v_saldo_atual + new.quantidade)
             else new.custo_unitario
           end
     where id = new.item_id;
  end if;

  -- saida valoriza pelo custo medio vigente
  if new.tipo in ('saida','emprestimo') and new.custo_unitario = 0 then
    select custo_medio into new.custo_unitario from itens where id = new.item_id;
  end if;

  return new;
end;
$$;

create trigger trg_aplicar_movimentacao
  before insert on movimentacoes
  for each row execute function fn_aplicar_movimentacao();

-- bloqueia alteracao e exclusao de movimentacao
create or replace function fn_movimentacao_imutavel()
returns trigger language plpgsql as $$
begin
  raise exception 'Movimentacao e imutavel. Registre um estorno.';
end;
$$;

create trigger trg_mov_no_update
  before update or delete on movimentacoes
  for each row execute function fn_movimentacao_imutavel();
```

### 3.4 Views de relatório

```sql
-- ============================================
-- 0003_views.sql
-- ============================================

-- itens que precisam de compra
create view v_itens_a_comprar as
select i.id, i.sku, i.nome, i.unidade,
       coalesce(sum(s.quantidade),0) as saldo,
       i.ponto_pedido, i.estoque_minimo,
       i.custo_medio,
       f.nome as fornecedor,
       case when coalesce(sum(s.quantidade),0) = 0 then 'ESGOTADO'
            when coalesce(sum(s.quantidade),0) <= i.estoque_minimo then 'CRITICO'
            else 'REPOR' end as situacao
  from itens i
  left join saldos s on s.item_id = i.id
  left join fornecedores f on f.id = i.fornecedor_id
 where i.ativo
 group by i.id, f.nome
having coalesce(sum(s.quantidade),0) <= greatest(i.ponto_pedido, i.estoque_minimo);

-- custo de manutencao por veiculo
create view v_consumo_por_veiculo as
select v.placa, v.modelo,
       date_trunc('month', m.criado_em) as mes,
       sum(m.quantidade * m.custo_unitario) as custo_total,
       count(*) as movimentos
  from movimentacoes m
  join veiculos v on v.id = m.veiculo_id
 where m.tipo = 'saida'
 group by v.placa, v.modelo, date_trunc('month', m.criado_em);

-- kardex do item
create view v_kardex as
select m.item_id, i.sku, i.nome, m.criado_em, m.tipo, m.quantidade,
       m.custo_unitario, m.motivo, u.nome as usuario,
       coalesce(v.placa, c.nome, f.nome) as destino
  from movimentacoes m
  join itens i on i.id = m.item_id
  left join usuarios u on u.id = m.usuario_id
  left join veiculos v on v.id = m.veiculo_id
  left join centros_custo c on c.id = m.centro_custo_id
  left join funcionarios f on f.id = m.funcionario_id
 order by m.criado_em desc;

-- EPI vencendo
create view v_epi_alerta as
select e.id, f.nome as funcionario, i.nome as epi,
       e.numero_ca, e.validade_ca, e.data_entrega,
       (e.validade_ca - current_date) as dias_restantes
  from epi_entregas e
  join funcionarios f on f.id = e.funcionario_id
  join itens i on i.id = e.item_id
 where e.data_devolucao is null
   and e.validade_ca is not null
   and e.validade_ca <= current_date + 30;
```

### 3.5 RLS (isolamento multi-empresa)

```sql
-- ============================================
-- 0004_rls.sql
-- ============================================

create or replace function fn_empresa_atual()
returns uuid language sql stable as $$
  select empresa_id from usuarios where id = auth.uid();
$$;

-- aplicar em todas as tabelas com empresa_id
alter table itens enable row level security;

create policy itens_tenant on itens
  for all
  using (empresa_id = fn_empresa_atual())
  with check (empresa_id = fn_empresa_atual());

-- repetir o padrao para: saldos, movimentacoes, documentos,
-- depositos, categorias, fornecedores, centros_custo,
-- veiculos, funcionarios, epi_entregas, inventarios
```

---

## 4. Telas do sistema

### Fase 1 (MVP)

| # | Tela | Perfil | Conteúdo essencial |
|---|---|---|---|
| 1 | Login | todos | Supabase Auth, e-mail e senha |
| 2 | Dashboard | todos | Valor do estoque, itens críticos, consumo do mês, últimas movimentações |
| 3 | Itens | admin, almoxarife | Lista com busca, filtro por categoria e tipo, importação CSV |
| 4 | Item (detalhe) | todos | Dados, saldo por depósito, kardex, gráfico de consumo |
| 5 | Entrada | almoxarife | Fornecedor, NF, múltiplos itens, quantidade, custo unitário |
| 6 | Saída | almoxarife | Item (busca por SKU ou código de barras), quantidade, destino obrigatório, motivo |
| 7 | Alertas de compra | admin, almoxarife | View `v_itens_a_comprar`, exportação CSV |
| 8 | Relatórios | admin | Consumo por veículo, por centro de custo, curva ABC, valor do estoque |
| 9 | Usuários | admin | Convite, perfil, ativação |

### Fase 2
Inventário cíclico com contagem e ajuste, ficha de EPI com assinatura, transferência entre depósitos, requisição interna com aprovação, exportação PDF.

### Fase 3
Pneus serializados com histórico de rodízio e recapagem, ordem de serviço de manutenção, leitura de código de barras via câmera no celular, importação de XML de NF-e, previsão de consumo.

---

## 5. Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Já dominado, Server Actions eliminam camada de API |
| UI | Tailwind CSS + lucide-react | Velocidade de montagem |
| Banco e Auth | Supabase (Postgres + RLS) | Regras críticas em trigger, isolamento nativo |
| Relatórios | Views SQL + exportação CSV na Fase 1 | Evita biblioteca de PDF cedo demais |
| Deploy | Vercel | Integração direta |
| E-mail | Resend | Já configurado no domínio |

Ponto de atenção: o free tier do Supabase pausa o projeto após inatividade. Para cliente pagante, subir para o plano pago desde o go-live.

---

## 6. Cronograma sugerido (6 semanas)

| Semana | Entrega |
|---|---|
| 0 | Visita técnica, coleta de dados, planilha de itens atual |
| 1 | Schema, migrations, triggers, RLS, seed de teste |
| 2 | Auth, layout, cadastros (itens, fornecedores, veículos, centros de custo) |
| 3 | Entrada e saída funcionando com trigger validado |
| 4 | Dashboard, alertas de compra, kardex |
| 5 | Relatórios, importação CSV, inventário inicial com o cliente |
| 6 | Treinamento, go-live assistido, ajustes |

---

## 7. Checklist de descoberta com o cliente

Antes da semana 1:

- [ ] Quantos veículos na frota
- [ ] Oficina própria ou terceirizada
- [ ] Existe almoxarife dedicado ou qualquer um pega material
- [ ] Como o material é controlado hoje (planilha, caderno, nada)
- [ ] Quantas saídas de material por dia, em média
- [ ] Quem autoriza compra e qual o prazo médio dos fornecedores
- [ ] Já sofreram fiscalização de EPI ou têm ficha de entrega
- [ ] Quantos itens diferentes existem hoje (contagem aproximada)
- [ ] Existe mais de um local de armazenagem
- [ ] Qual foi o último prejuízo por falta de peça ou compra emergencial

Peça a planilha de itens atual, mesmo bagunçada. Ela vira a importação inicial.

---

## 8. Riscos do projeto

| Risco | Impacto | Mitigação |
|---|---|---|
| Inventário inicial errado | Alto. O sistema perde credibilidade em uma semana | Contagem física total antes do go-live, com o cliente presente e assinando |
| Almoxarife não registra saída | Alto. Dados divergem e o sistema morre | Saída em menos de 20 segundos, busca por código de barras, tablet fixo no balcão |
| Escopo cresce durante o projeto | Médio. Prazo estoura | Escopo assinado, Fase 2 e 3 cotadas separadamente |
| Cliente quer integração com o ERP dele | Médio | Levantar na semana 0. Se existir ERP, exportação CSV na Fase 1 e API na Fase 3 |
| Produto sob medida sem reuso | Médio. Trabalho não escala | Multi-tenant desde o dia 1, custo marginal baixo |
| Concorrência com planilha grátis | Baixo | Argumento é custo por veículo e ficha de EPI, não é a lista de itens |

---

## 9. Estrutura comercial sugerida

Não venda "sistema de estoque". Venda **redução de compra emergencial e visibilidade de custo por veículo**.

Modelo recomendado:
- **Implantação:** valor fechado, cobre migração de dados, configuração e treinamento
- **Mensalidade:** licença de uso, suporte e hospedagem
- **Fase 2 e 3:** cotadas por módulo, após o cliente estar usando

Números para justificar o investimento na proposta: uma parada de veículo por falta de peça custa o frete perdido mais o custo fixo do dia. Peça esse número ao cliente na visita e use na apresentação.

---

## 10. Ordem de execução recomendada

1. Visita técnica e checklist do item 7
2. Escopo de uma página assinado pelo cliente
3. Migrations 0001 a 0004 rodando no Supabase
4. Testar o trigger com casos de erro (saldo insuficiente, saída sem destino, tentativa de update)
5. Só depois construir a interface
6. Importar itens reais na semana 5, não antes
7. Contagem física com o cliente
8. Go-live acompanhado por três dias no balcão
