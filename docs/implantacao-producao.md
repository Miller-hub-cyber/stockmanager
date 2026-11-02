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
4. Em **Authentication → Sign In / Providers → Email**:
   - deixe **Allow new users to sign up** **ligado**. O cadastro de cada pessoa é feito por ela mesma em `/primeiro-acesso`, com o código do convite (etapa 2);
   - desmarque **Confirm email**. Quem libera o acesso é o código do convite, não o e-mail, e o e-mail gratuito do Supabase só manda poucas mensagens por hora.

   Quem se cadastrar sem código válido ganha uma conta no Auth, mas sem linha em `usuarios`: a RLS não mostra nada e o app manda a pessoa para `/sem-acesso`.
5. Em **Authentication → Users → Add user → Create new user**, crie o administrador com senha e **Auto Confirm User** marcado.
6. Preencha e rode `supabase/producao/01_empresa_e_admin.sql`. Ele cria a empresa, o depósito "Almoxarifado central", uma categoria para cada grupo da biblioteca de itens e vincula o admin.
7. Rode `supabase/producao/03_verificacao.sql`. Todas as linhas precisam dar `ok`. O script não grava nada, então pode ser repetido.

## 2. Usuários

O admin libera acessos em **Gestão → Usuários** (`/gestao/usuarios`):

1. Preenche nome, e-mail e perfil e clica em "Gerar convite".
2. Copia a mensagem pronta, com o link e o código de 8 caracteres, e manda para a pessoa (por WhatsApp, por exemplo).
3. A pessoa abre `/primeiro-acesso`, digita e-mail e código e cria a senha. O código vale 7 dias e só pode ser usado uma vez. Código errado ou vencido desfaz o cadastro inteiro.

Nada disso usa a service role key: a regra do convite está no banco (`0024_usuarios_convites.sql`).

Na mesma tela, o admin muda o perfil e desativa ou reativa pessoas. Ninguém altera o próprio acesso, para o único admin não se trancar para fora. A desativação vale na hora: no próximo clique, a sessão é encerrada e a pessoa volta para o login.

**Não use "Invite user" do painel do Supabase.** O convite do sistema é o código gerado na tela de Usuários. Não existe "esqueci minha senha": a troca é feita pelo painel do Supabase.

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

O banco de teste está atrasado. Para igualar à produção, rode no SQL Editor, nesta ordem, de `0015` até `0024`. Todas podem ser rodadas de novo sem estragar nada, então não tem problema se alguma já tiver sido aplicada.

Atenção: as migrations `0021` a `0024` (biblioteca de itens, data retroativa e convites) se chamavam `0017` a `0020` antes de serem renumeradas. Se o banco de teste já tinha recebido essas versões antigas, rodar de novo é seguro.

A 0015 apaga de vez `funcionarios`, `epi_entregas`, `numero_os` e `numero_nf`. O código atual já não usa nada disso.

## 7. Pendências conhecidas

- `/design` é uma página pública com o catálogo visual do sistema, sem dados.
- O `npm audit` ainda aponta falhas altas em dependências do `next-pwa`. Elas afetam apenas o build, não o site no ar. O pacote não tem versão nova, então resolver isso significa trocá-lo por outra biblioteca de PWA.
- O Next 16 avisa que o suporte ao React 18 acaba no Next 17. Subir para o React 19 fica para quando essa migração for feita.
