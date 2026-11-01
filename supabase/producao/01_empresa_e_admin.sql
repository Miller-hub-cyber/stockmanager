-- =====================================================================
-- StockManager  |  producao/01_empresa_e_admin.sql
-- Faz em producao o papel de 0005_seed.sql e 0007_seed_usuario.sql:
-- cria a empresa real e vincula o primeiro administrador.
--
-- Antes de rodar: crie o usuario em Authentication > Users > Add user >
-- Create new user, com senha e "Auto Confirm User" marcado.
-- Preencha os quatro valores abaixo. Pode rodar de novo sem duplicar.
-- =====================================================================

do $$
declare
  v_empresa_nome text := 'PREENCHER';
  v_empresa_cnpj text := 'PREENCHER';
  v_admin_nome   text := 'PREENCHER';
  v_admin_email  text := 'PREENCHER';

  v_empresa_id uuid;
  v_usuario_id uuid;
begin
  if 'PREENCHER' in (v_empresa_nome, v_empresa_cnpj, v_admin_nome, v_admin_email) then
    raise exception 'Preencha os quatro valores no topo do script.';
  end if;

  select id into v_usuario_id from auth.users where lower(email) = lower(v_admin_email);
  if v_usuario_id is null then
    raise exception 'Nenhum usuario com o e-mail % em Authentication > Users.', v_admin_email;
  end if;

  select id into v_empresa_id from empresas where cnpj = v_empresa_cnpj;
  if v_empresa_id is null then
    insert into empresas (nome, cnpj)
    values (v_empresa_nome, v_empresa_cnpj)
    returning id into v_empresa_id;
  end if;

  insert into usuarios (id, empresa_id, nome, email, perfil)
  values (v_usuario_id, v_empresa_id, v_admin_nome, lower(v_admin_email), 'admin')
  on conflict (id) do update
    set empresa_id = excluded.empresa_id, nome = excluded.nome,
        perfil = 'admin', ativo = true;
end $$;

select e.nome as empresa, e.cnpj, u.nome as usuario, u.email, u.perfil
  from usuarios u
  join empresas e on e.id = u.empresa_id;
