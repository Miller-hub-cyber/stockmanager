# Implantação em produção

Passo a passo para colocar o sistema no ar. Siga na ordem: cada etapa depende da anterior.

> **Não use `supabase db push` em produção.** Ele aplicaria também a `0005_seed.sql` e a `0007_seed_usuario.sql`, que são só de teste. Use o arquivo gerado na etapa 1.

## 1. Banco de produção

1. Crie um projeto novo no Supabase, separado do de teste. Use o plano pago: o gratuito pausa o projeto depois de uma semana sem uso.
2. Gere o schema na raiz do repositório:
   ```
   node supabase/producao/gerar-schema.mjs
   ```
3. No SQL Editor do projeto novo, cole e rode `supabase/producao/00_schema.sql`.
4. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**. Ninguém deve conseguir criar conta sozinho.
5. Em **Authentication → Users → Add user → Create new user**, crie o administrador com senha e **Auto Confirm User** marcado.
6. Preencha e rode `supabase/producao/01_empresa_e_admin.sql`.
7. Rode `supabase/producao/03_verificacao.sql`. Todas as linhas precisam dar `ok`. O script não grava nada, então pode ser repetido.

## 2. Usuários

Enquanto não existir a tela `/gestao/usuarios`, cada pessoa é criada assim:

1. **Add user → Create new user**, com senha e Auto Confirm marcado.
2. Preencha e rode `supabase/producao/02_novo_usuario.sql`.

**Não use "Invite user".** O sistema não tem tela para definir senha a partir do convite, então a pessoa fica sem conseguir entrar. Pelo mesmo motivo não existe "esqueci minha senha": a troca é feita pelo painel do Supabase.

Para desativar alguém, rode no SQL Editor:

```sql
update usuarios set ativo = false where email = 'pessoa@empresa.com.br';
```

O bloqueio vale na hora: no próximo clique, a sessão é encerrada e a pessoa volta para o login.

## 3. Deploy na Vercel

1. Importe o repositório `Miller-hub-cyber/stockmanager`. Quem fizer isso precisa ter acesso a esse GitHub.
2. Configure as variáveis com os valores do projeto de **produção**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **A service role key não vai para a Vercel.**
4. Depois do primeiro deploy, no Supabase, em **Authentication → URL Configuration**, coloque a URL da Vercel em **Site URL**.
5. Entre com o administrador e confira se abre `/gestao`.

Sem as duas variáveis o site não cai, mas tudo redireciona para o login e ninguém consegue entrar.

## 4. Carga dos dados reais

1. Depósitos, categorias e centros de custo, em `/gestao/cadastros`.
2. Fornecedores.
3. Veículos.
4. Itens, em `/gestao/itens/importar`. Baixe o modelo de CSV na própria tela.

**Saldo inicial:** a importação de itens já aceita saldo e custo inicial por linha, e registra cada um como entrada. Use isso em vez de lançar item por item.

**Revise o custo antes de importar.** Um saldo lançado errado pode ser estornado, mas o estorno não recalcula o custo médio. Se o item ainda tiver outro saldo, o custo errado continua na média. Se o saldo zerar, a próxima entrada define o custo correto.

## 5. Teste no celular

- **Android:** abra a URL no Chrome e toque em ⋮ → **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone:** abra no Safari e toque em Compartilhar → **Adicionar à Tela de Início**.

Faça uma saída completa pela câmera e cronometre. A meta é menos de 20 segundos. O app precisa de internet: páginas e dados não ficam guardados no aparelho, de propósito, para ninguém operar com saldo desatualizado.

## 6. Banco de teste

O banco de teste está atrasado: a 0015 falhava e a 0016 nunca foi aplicada, então a tela de exportações recentes não funciona nele. Para igualar à produção, rode no SQL Editor, nesta ordem, `0015`, `0016`, `0017`, `0018` e `0019`.

A 0015 apaga de vez `funcionarios`, `epi_entregas`, `numero_os` e `numero_nf`. O código atual já não usa nada disso.

## 7. Pendências conhecidas

- `/design` é uma página pública com o catálogo visual do sistema, sem dados.
- **Migrar o Next.js é a pendência mais importante.** A 14.2.35 é a última da linha 14, e o `npm audit` ainda aponta falhas críticas e altas que só têm correção no Next 15 ou 16. As críticas exigem servidor Windows ou a rota `/_next/image`, que foi desligada, e a Vercel não roda em Windows. As altas de negação de serviço e SSRF continuam valendo. A migração muda o `CLAUDE.md` (a stack fixa o Next 14) e pede teste de todas as telas com login, então deve ser uma tarefa própria.
- `zod`, `next-pwa` e `exceljs` também só corrigem o que o audit aponta trocando de versão principal. No `next-pwa` isso afeta apenas o build, não o site no ar.
