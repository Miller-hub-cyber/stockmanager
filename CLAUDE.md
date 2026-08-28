# CLAUDE.md

Contexto permanente do projeto. Leia antes de qualquer alteração.

## 1. O que é este projeto

Sistema de controle de estoque **operacional interno** para empresa de logística.
Controla material de uso próprio: peças de frota, lubrificantes, EPI, insumos de operação, ferramentas.

**Não é um WMS.** Não controla mercadoria de terceiros, expedição, romaneio nem endereçamento de armazém. Se uma tarefa pedir isso, pare e pergunte antes de implementar.

Formato de entrega: **PWA** (Next.js instalável na tela inicial). Não existe app nativo neste projeto.

## 2. Stack

- Next.js 14, App Router, Server Components e Server Actions
- TypeScript estrito
- Tailwind CSS + lucide-react
- Supabase: Postgres, Auth, PostgREST, RLS
- `next-pwa` para manifest e service worker
- `@zxing/browser` para leitura de código de barras pela câmera
- Deploy na Vercel

Não adicione biblioteca nova sem justificar em uma linha no PR. Sem Redux, sem ORM externo, sem camada de API própria.

## 3. Regras invioláveis

1. **Saldo é derivado.** A tabela `saldos` só é alterada por trigger a partir de `movimentacoes`. Nenhum código de aplicação faz `UPDATE saldos`.
2. **Movimentação é imutável.** `UPDATE` e `DELETE` em `movimentacoes` são bloqueados por trigger. Correção é feita por registro de estorno.
3. **Toda saída exige destino de custo.** `centro_custo_id` ou `veiculo_id` ou `funcionario_id`. Garantido por `CHECK` no banco, não apenas na tela.
4. **Saldo não pode ficar negativo.** A trigger lança exceção. A interface trata o erro, não o previne sozinha.
5. **Custo médio ponderado** é recalculado apenas na entrada. A saída é valorizada pelo custo médio vigente.
6. **Regra de negócio crítica vive no banco.** Se der para expressar em constraint ou trigger, é lá que vai.
7. **Todo acesso passa por RLS.** Nenhuma query usa service role key no cliente.

## 4. Padrões de código

- Server Actions para mutação, Server Components para leitura. `use client` só quando houver estado de interface.
- Um arquivo por Server Action, em `src/actions/`.
- Tipos gerados do banco em `src/types/database.ts`. Nunca escrever tipo de tabela à mão.
- Erro de banco é traduzido para mensagem em português na Server Action, nunca exibido cru.
- Formulário sempre com validação Zod no servidor. Validação no cliente é conveniência, não segurança.
- Nada de `any`. Se precisar, comente o porquê.

## 5. Convenções

- Banco em português, snake_case: `movimentacoes`, `centro_custo_id`, `estoque_minimo`.
- Código em inglês, camelCase: `createMovimentacao`, `itemId`.
- Datas sempre `timestamptz`. Exibição em `America/Belem`.
- Quantidade é `numeric(12,3)`. Nunca `float`.
- Dinheiro é `numeric(12,4)` para custo unitário e `numeric(14,2)` para totais.

## 6. Migrations

- Arquivos numerados em `supabase/migrations/`: `0001_init.sql`, `0002_triggers.sql`, etc.
- Nunca editar migration já aplicada. Criar uma nova.
- Toda migration precisa ser idempotente onde possível (`if not exists`).
- Após criar migration, atualizar `src/types/database.ts`.

## 7. Interface

Duas áreas com layouts diferentes, mesma base de código:

- `/operacao` — mobile first. Botões grandes, poucos toques, sem menu lateral. Meta: registrar uma saída em menos de 20 segundos.
- `/gestao` — desktop first. Tabelas densas, filtros, exportação.

O perfil do usuário define o destino após o login: `almoxarife` vai para `/operacao/saida`, `admin` e `gestor` vão para `/gestao`.

## 8. O que não fazer

- Não criar tela de "ajuste de saldo" com campo livre. Ajuste é feito por inventário.
- Não implementar exclusão de registro em lugar nenhum. Use `ativo = false`.
- Não usar `localStorage` para dado de negócio.
- Não gerar relatório em PDF na fase 1. Só CSV.
- Não implementar nada da fase 2 ou 3 sem pedido explícito.

## 9. Fases

**Fase 1 (atual):** cadastros, entrada, saída, saldo, alertas de compra, histórico, relatórios em CSV, controle de acesso.

**Fase 2 (não implementar ainda):** inventário cíclico, ficha de EPI com assinatura, transferência entre depósitos, requisição com aprovação.

**Fase 3 (não implementar ainda):** pneus serializados, ordem de serviço, importação de XML de NF-e, previsão de consumo.
