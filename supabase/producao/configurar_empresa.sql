-- =====================================================================
-- StockManager  |  producao/configurar_empresa.sql
-- Primeira configuracao do banco de PRODUCAO. Roda uma unica vez, no
-- SQL Editor, depois das migrations (ver docs/producao.md).
--
-- Substitui 0005_seed.sql e 0007_seed_usuario.sql, que sao de teste e
-- NAO devem rodar em producao.
--
-- Antes de rodar:
--   1. Crie o usuario admin em Authentication > Users > Add user,
--      com o e-mail abaixo.
--   2. Preencha as quatro variaveis do bloco "declare".
--
-- O que faz:
--   - cria a empresa
--   - cria o deposito "Almoxarifado central"
--   - cria uma categoria para cada grupo da biblioteca (catalogo_itens),
--     assim o cadastro de item ja casa categoria automaticamente
--   - vincula o usuario admin a empresa
-- Se a empresa ja existir com esse nome, nao faz nada (seguro rodar 2x).
-- =====================================================================

do $$
declare
  v_empresa_nome text := 'PREENCHER: razao social ou nome da empresa';
  v_empresa_cnpj text := null;                 -- opcional, ex.: '12.345.678/0001-90'
  v_admin_email  text := 'PREENCHER: e-mail do administrador';
  v_admin_nome   text := 'PREENCHER: nome do administrador';

  v_empresa_id uuid;
  v_usuario_id uuid;
begin
  if v_empresa_nome like 'PREENCHER%' or v_admin_email like 'PREENCHER%' or v_admin_nome like 'PREENCHER%' then
    raise exception 'Preencha as variaveis no inicio do script antes de rodar.';
  end if;

  if exists (select 1 from empresas where nome = v_empresa_nome) then
    raise notice 'Empresa "%" ja existe. Nada foi alterado.', v_empresa_nome;
    return;
  end if;

  select id into v_usuario_id from auth.users where lower(email) = lower(v_admin_email);
  if v_usuario_id is null then
    raise exception 'Usuario % nao existe no Auth. Crie em Authentication > Users e rode de novo.', v_admin_email;
  end if;

  insert into empresas (nome, cnpj)
  values (v_empresa_nome, v_empresa_cnpj)
  returning id into v_empresa_id;

  insert into depositos (empresa_id, nome)
  values (v_empresa_id, 'Almoxarifado central');

  insert into categorias (empresa_id, nome)
  select v_empresa_id, grupo
    from catalogo_itens
   group by grupo
   order by grupo;

  insert into usuarios (id, empresa_id, nome, email, perfil)
  values (v_usuario_id, v_empresa_id, v_admin_nome, v_admin_email, 'admin');

  raise notice 'Empresa criada: % (id %). Admin: %.', v_empresa_nome, v_empresa_id, v_admin_email;
end $$;
