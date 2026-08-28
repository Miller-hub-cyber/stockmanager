# StockManager

Controle de estoque **operacional interno** para empresa de logistica.
Peca de frota, lubrificante, EPI, insumo de operacao e ferramenta de uso proprio.

Nao e um WMS: nao controla mercadoria de terceiros, expedicao nem enderecamento de armazem.

PWA instalavel (Next.js 14 + Supabase). Duas areas com o mesmo codigo: `/operacao`
(mobile, para o almoxarife) e `/gestao` (desktop, para admin/gestor).

---

## Como comecar

```bash
npm install
cp .env.example .env.local     # preencha com as chaves do Supabase (veja abaixo)
npm run dev
```

Sem projeto Supabase configurado, o servidor sobe normalmente mas o login real
nao funciona (falha com erro de conexao traduzido na tela). Para ver o sistema
funcionando sem nenhuma configuracao, abra `http://localhost:3000/prototipo` —
fluxo completo com dados em memoria, nao depende do Supabase.

### Configurar um projeto Supabase real

1. Crie o projeto em [supabase.com](https://supabase.com).
2. Rode as migrations abaixo no SQL Editor, nesta ordem.
3. Crie um usuario em Authentication → Users.
4. Insira uma linha em `usuarios` ligando o id desse usuario a uma empresa e a
   um perfil (`admin`, `gestor`, `almoxarife` ou `consulta`).
5. Cole a URL e a chave anonima do projeto no `.env.local`.

## Banco de dados

| Arquivo | O que faz |
|---|---|
| `0001_init.sql` | Enums, tabelas, indices e restricoes |
| `0002_triggers.sql` | Saldo, custo medio, imutabilidade, estorno |
| `0003_views.sql` | Relatorios |
| `0004_rls.sql` | Isolamento por empresa e perfil |
| `0005_seed.sql` | Dados de teste (nao rode em producao) |

Depois rode os casos de `supabase/tests/triggers.test.sql`. Se algum caso da
secao "DEVEM falhar" passar sem erro, pare: a regra nao esta protegida no banco.

`src/types/database.ts` foi escrito a mao a partir dessas migrations (nao ha
projeto para rodar `supabase gen types` ainda). Assim que houver um projeto
real, rode `npm run types` (edite o project-id no script antes) para substituir
pelo arquivo gerado de verdade.

## Regras que nao podem ser quebradas

1. Saldo e derivado das movimentacoes. Nenhum codigo faz `UPDATE saldos`.
2. Movimentacao e imutavel. Correcao e estorno.
3. Toda saida exige destino de custo: veiculo, setor ou funcionario.
4. Saldo nao pode ficar negativo.
5. Custo medio ponderado recalculado so na entrada.
6. Regra critica vive no banco, nao na interface.

Detalhe completo em `CLAUDE.md`.

## Testes

```bash
npm run test    # vitest — validacao Zod, traducao de erro, CSV, regras de perfil
npm run lint
npx tsc --noEmit
npm run build
```

Os testes automatizados cobrem a logica pura (schemas, formatacao, roteamento
por perfil). Regras de banco (saldo, imutabilidade, RLS) sao verificadas
manualmente via `supabase/tests/triggers.test.sql`, rodado no SQL Editor —
nao ha projeto Supabase de CI neste ambiente.

## Estrutura

```
src/app/operacao      area mobile (saida, entrada, consulta) — leitor de codigo de barras
src/app/gestao         area desktop (painel, itens, cadastros, compras, relatorios)
src/app/login          autenticacao
src/app/prototipo      prototipo isolado, dados em memoria, sem Supabase
src/app/design         design system vivo (componentes base)
src/actions            Server Actions, um arquivo por acao
src/components/ui      componentes base do design system
src/components/operacao  busca de item e leitor de codigo de barras
src/lib                supabase (client/server), validacao Zod, formatacao, csv, sessao
src/types/database.ts  tipos do banco (escrito a mao, ver secao acima)
supabase/migrations    SQL do sistema
supabase/tests         casos de teste manuais de trigger e RLS
docs/                  especificacao, roteiro de etapas, design system, apresentacoes
```

## Documentacao

| Arquivo | Conteudo |
|---|---|
| `CLAUDE.md` | Regras para o Claude Code. Leia antes de qualquer alteracao |
| `docs/roteiro-etapas.md` | Etapas de construcao com prompt pronto para cada uma |
| `docs/design-system.md` | Paleta, tipografia, layout e elemento de assinatura |
| `docs/especificacao.md` | Escopo, modelo de dados e analise de risco |
| `docs/apresentacao-cliente.pptx` | Deck comercial |
| `docs/apresentacao-aula.pptx` | Deck academico |

## Fases

**Fase 1 (implementada):** autenticacao, cadastros, entrada, saida, leitor de
codigo de barras, estorno, saldo, alertas de compra, historico/kardex,
dashboard, relatorios CSV, controle de acesso, PWA. Falta apenas configurar um
projeto Supabase real para usar em producao (ver "Como comecar").

**Fase 2 (nao implementada):** inventario ciclico, ficha de EPI com
assinatura, transferencia entre depositos, requisicao com aprovacao.

**Fase 3 (nao implementada):** pneus serializados, ordem de servico,
importacao de XML de NF-e, previsao de consumo.
