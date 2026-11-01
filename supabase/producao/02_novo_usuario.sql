-- =====================================================================
-- StockManager  |  producao/02_novo_usuario.sql
-- Libera um usuario no sistema. Sem esta linha em "usuarios", o login
-- responde "Usuario nao configurado".
--
-- Antes de rodar: crie o usuario em Authentication > Users > Add user >
-- Create new user, com senha e "Auto Confirm User" marcado. Nao use
-- "Invite user": o app ainda nao tem tela para definir a senha do convite.
--
-- Perfis: admin, gestor, almoxarife ou consulta.
-- Para mudar o perfil de alguem, rode de novo com o novo valor.
-- =====================================================================

do $$
declare
  v_nome   text := 'PREENCHER';
  v_email  text := 'PREENCHER';
  v_perfil perfil_usuario := 'almoxarife';

  v_empresa_id uuid;
  v_usuario_id uuid;
begin
  if 'PREENCHER' in (v_nome, v_email) then
    raise exception 'Preencha nome e e-mail no topo do script.';
  end if;

  if (select count(*) from empresas) <> 1 then
    raise exception 'Este script espera exatamente uma empresa cadastrada.';
  end if;
  select id into v_empresa_id from empresas;

  select id into v_usuario_id from auth.users where lower(email) = lower(v_email);
  if v_usuario_id is null then
    raise exception 'Nenhum usuario com o e-mail % em Authentication > Users.', v_email;
  end if;

  insert into usuarios (id, empresa_id, nome, email, perfil)
  values (v_usuario_id, v_empresa_id, v_nome, lower(v_email), v_perfil)
  on conflict (id) do update
    set nome = excluded.nome, perfil = excluded.perfil, ativo = true;
end $$;

select nome, email, perfil, ativo from usuarios order by nome;
