# Estrutura do projeto e roteiro para o Claude Code

Sistema de estoque operacional interno. PWA em Next.js 14 + Supabase.

---

## 1. Antes de abrir o Claude Code

- [ ] Criar projeto no Supabase (plano pago se for cliente real, o free tier pausa por inatividade)
- [ ] Criar repositório no GitHub
- [ ] `npx create-next-app@latest estoque-operacional --typescript --tailwind --app --src-dir`
- [ ] Colar o `CLAUDE.md` na raiz do repositório
- [ ] Guardar as chaves em `.env.local` e confirmar que `.env*` está no `.gitignore`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # apenas para scripts locais, nunca no cliente
```

---

## 2. Estrutura de pastas

```
estoque-operacional/
├── CLAUDE.md
├── next.config.mjs                 # configuração do next-pwa
├── public/
│   ├── manifest.json
│   └── icons/                      # 192x192 e 512x512
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql           # tabelas e enums
│   │   ├── 0002_triggers.sql       # saldo, custo médio, imutabilidade
│   │   ├── 0003_views.sql          # relatórios
│   │   ├── 0004_rls.sql            # políticas de acesso
│   │   └── 0005_seed.sql           # dados de teste
│   └── tests/
│       └── triggers.test.sql       # casos de erro esperados
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                # redireciona conforme o perfil
    │   ├── login/
    │   │   └── page.tsx
    │   ├── operacao/               # mobile first
    │   │   ├── layout.tsx
    │   │   ├── saida/page.tsx
    │   │   ├── entrada/page.tsx
    │   │   └── consulta/page.tsx
    │   └── gestao/                 # desktop first
    │       ├── layout.tsx
    │       ├── page.tsx            # painel
    │       ├── itens/
    │       │   ├── page.tsx
    │       │   ├── novo/page.tsx
    │       │   └── [id]/page.tsx   # detalhe e histórico do item
    │       ├── movimentacoes/page.tsx
    │       ├── compras/page.tsx    # itens abaixo do ponto de reposição
    │       ├── relatorios/page.tsx
    │       ├── cadastros/
    │       │   ├── fornecedores/page.tsx
    │       │   ├── veiculos/page.tsx
    │       │   ├── centros-custo/page.tsx
    │       │   ├── funcionarios/page.tsx
    │       │   └── depositos/page.tsx
    │       └── usuarios/page.tsx
    ├── actions/
    │   ├── auth.ts
    │   ├── itens.ts
    │   ├── movimentacoes.ts        # entrada, saída, estorno, transferência
    │   ├── cadastros.ts
    │   └── relatorios.ts
    ├── components/
    │   ├── ui/                     # botão, input, select, card, tabela
    │   ├── operacao/
    │   │   ├── BuscaItem.tsx
    │   │   ├── LeitorCodigoBarras.tsx
    │   │   ├── SeletorQuantidade.tsx
    │   │   └── SeletorDestino.tsx
    │   └── gestao/
    │       ├── TabelaItens.tsx
    │       ├── CardIndicador.tsx
    │       └── ExportarCsv.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts           # browser
    │   │   ├── server.ts           # server components e actions
    │   │   └── middleware.ts       # renovação de sessão
    │   ├── validacao.ts            # schemas Zod
    │   ├── formato.ts              # moeda, data, quantidade
    │   └── csv.ts
    ├── types/
    │   └── database.ts             # gerado pelo Supabase
    └── middleware.ts               # proteção de rotas por perfil
```

---

## 3. Roteiro de etapas

Execute uma etapa por vez. Não avance sem validar a anterior.

### Etapa 1 — Banco de dados

**Prompt:**

> Leia o CLAUDE.md. Crie as migrations em `supabase/migrations/`:
>
> `0001_init.sql` com os enums `tipo_item`, `tipo_mov`, `perfil_usuario` e as tabelas: empresas, usuarios, depositos, categorias, fornecedores, centros_custo, veiculos, funcionarios, itens, saldos, documentos, movimentacoes, epi_entregas, inventarios, inventario_itens. Use `numeric(12,3)` para quantidade e `numeric(12,4)` para custo unitário. Inclua o CHECK que obriga destino de custo na saída e o CHECK de saldo não negativo.
>
> `0002_triggers.sql` com: função que aplica a movimentação no saldo (criando a linha de saldo se não existir, bloqueando saldo negativo com exceção, tratando transferência entre depósitos), recálculo de custo médio ponderado na entrada, valorização da saída pelo custo médio vigente, e trigger que bloqueia UPDATE e DELETE em movimentacoes.
>
> Não crie ainda views nem RLS. Explique cada trigger em comentário antes da função.

**Validar antes de seguir:** rode no SQL Editor e teste manualmente:
- saída maior que o saldo deve falhar
- saída sem destino de custo deve falhar
- `UPDATE movimentacoes` deve falhar
- duas entradas com custos diferentes devem gerar custo médio correto

### Etapa 2 — Views e RLS

**Prompt:**

> Crie `0003_views.sql` com: `v_itens_a_comprar` (itens no ponto de reposição ou abaixo, com situação ESGOTADO, CRITICO ou REPOR), `v_consumo_por_veiculo` (custo total por placa e por mês), `v_kardex` (histórico do item com destino resolvido) e `v_valor_estoque` (saldo × custo médio, total e por categoria).
>
> Crie `0004_rls.sql` com a função `fn_empresa_atual()` lendo `empresa_id` do usuário autenticado, e políticas de RLS em todas as tabelas que tenham `empresa_id`. Adicione política adicional restringindo escrita em `itens` e cadastros ao perfil admin.
>
> Crie `0005_seed.sql` com uma empresa, três usuários (um por perfil), dois depósitos, cinco veículos, três centros de custo e trinta itens realistas de frota de caminhão.

### Etapa 3 — Base da aplicação

**Prompt:**

> Configure o projeto: clientes Supabase para browser e servidor, middleware de renovação de sessão, middleware de proteção de rota por perfil (almoxarife só acessa `/operacao`, admin acessa tudo), tela de login, e redirecionamento pós-login conforme o perfil.
>
> Configure o `next-pwa`: manifest, ícones e service worker. O app precisa ser instalável na tela inicial do Android.
>
> Gere `src/types/database.ts` a partir do schema. Crie os componentes de UI base em `src/components/ui/` seguindo o Tailwind, com variantes para operação (alvo de toque de no mínimo 48px) e gestão.

### Etapa 4 — Cadastros

**Prompt:**

> Implemente o CRUD de itens, fornecedores, veículos, centros de custo, funcionários e depósitos em `/gestao/cadastros`. Use Server Actions com validação Zod. Nenhuma exclusão física: apenas `ativo = false`.
>
> Na tela de itens inclua importação de CSV com pré-visualização, validação linha a linha e relatório de erros antes de gravar.

### Etapa 5 — Movimentação (o núcleo)

**Prompt:**

> Implemente `/operacao/entrada` e `/operacao/saida`.
>
> A tela de saída é a mais crítica. Fluxo: buscar item por nome, SKU ou código de barras lido pela câmera; selecionar quantidade com botões de mais e menos; selecionar destino (veículo, setor ou funcionário) com os últimos usados em destaque; confirmar. Após confirmar, exibir retorno visual e voltar automaticamente para a busca.
>
> Quando o destino for veículo, incluir campo opcional de quilometragem atual, gravando em `movimentacoes` e atualizando `veiculos.km_atual` se for maior que o valor atual.
>
> Toda a validação de saldo vem do erro da trigger. Traduza a exceção do Postgres para mensagem em português.
>
> Implemente também o estorno: gera movimentação inversa referenciando `estorno_de`.

### Etapa 6 — Painel e relatórios

**Prompt:**

> Implemente `/gestao` com indicadores: valor total do estoque, itens críticos, entradas e saídas do mês, e os cinco itens de maior consumo.
>
> Implemente `/gestao/compras` lendo `v_itens_a_comprar`, com exportação CSV agrupada por fornecedor.
>
> Implemente `/gestao/relatorios` com: consumo por veículo, consumo por centro de custo, kardex por item, itens sem movimentação há mais de 90 dias e valor imobilizado por categoria. Todos com filtro de período e exportação CSV.

### Etapa 7 — Ajustes finais

**Prompt:**

> Faça uma auditoria do projeto e me devolva um plano em etapas numeradas cobrindo: queries N+1, uso indevido de `use client`, ausência de índice em coluna filtrada, mensagens de erro cruas expostas ao usuário, rotas sem proteção de perfil, e qualquer lugar onde a aplicação altere saldo sem passar por `movimentacoes`.

---

## 4. Testes que precisam existir

Crie `supabase/tests/triggers.test.sql` com estes casos, todos devendo falhar:

```sql
-- 1. saida maior que o saldo
-- 2. saida sem centro_custo_id, veiculo_id e funcionario_id
-- 3. update em movimentacoes
-- 4. delete em movimentacoes
-- 5. usuario da empresa A lendo item da empresa B
```

E estes, que devem passar com valor exato:

```sql
-- 6. entrada de 10 a R$ 5,00 e depois 10 a R$ 7,00 => custo medio 6,00
-- 7. transferencia entre depositos preserva o saldo total
-- 8. estorno de saida devolve o saldo anterior
```

---

## 5. Como usar isso no Claude Code

1. Abra o projeto no VS Code com o Claude Code
2. Confirme que ele leu o `CLAUDE.md` (peça um resumo das regras invioláveis)
3. Cole o prompt da Etapa 1
4. Rode a migration no SQL Editor do Supabase e teste os casos de erro à mão
5. Só depois cole o prompt da Etapa 2

Não cole duas etapas juntas. O erro mais comum é pedir tudo de uma vez e receber um projeto que compila mas tem a regra de saldo na aplicação em vez do banco.
