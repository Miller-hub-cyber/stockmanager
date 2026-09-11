-- =====================================================================
-- StockManager  |  0007_seed_usuario.sql
-- Vincula o usuario de teste (ja criado no Supabase Auth) a empresa e
-- perfil. Sem isso ninguem loga: a raiz do app (src/app/page.tsx) exige
-- uma linha em "usuarios" para decidir o destino pos-login.
--
-- Pre-requisito: o usuario precisa existir em auth.users, ou seja,
-- alguem ja deu signup/foi convidado com este e-mail no Supabase Auth.
-- Se o e-mail abaixo nao bater com o do seu Auth, ajuste antes de rodar.
-- =====================================================================

insert into usuarios (id, empresa_id, nome, email, perfil)
select au.id,
       '11111111-1111-1111-1111-111111111111',
       'Administrador',
       au.email,
       'admin'
  from auth.users au
 where au.email = 'millerf1515@gmail.com'
on conflict (id) do nothing;
