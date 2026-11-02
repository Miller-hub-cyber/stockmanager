-- =====================================================================
-- StockManager  |  producao/03_verificacao.sql
-- Verificacao automatica das regras criticas. Cole o arquivo inteiro no
-- SQL Editor e rode: o resultado e uma tabela com "ok" ou "FALHOU" por
-- caso. Nenhum dado fica gravado: tudo e criado e desfeito aqui dentro.
--
-- Pode rodar quantas vezes quiser, antes ou depois da carga real.
-- Qualquer linha diferente de "ok" bloqueia a ida para producao.
-- =====================================================================

-- Executa um comando no papel e com o usuario informados, como o PostgREST
-- faz. Papel nulo roda como dono do banco (para testar o que nem o dono pode).
create or replace function pg_temp.como(p_papel text, p_usuario uuid, p_sql text)
returns bigint language plpgsql as $$
declare v_linhas bigint;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_usuario::text, ''), true);
  if p_papel is not null then
    execute format('set local role %I', p_papel);
  end if;

  if p_sql ilike 'select%' then
    execute 'select count(*) from (' || p_sql || ') q' into v_linhas;
  else
    execute p_sql;
    get diagnostics v_linhas = row_count;
  end if;

  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  return v_linhas;
end;
$$;

create or replace function pg_temp.deve_falhar(
  p_papel text, p_usuario uuid, p_sql text, p_trecho text
)
returns text language plpgsql as $$
declare v_linhas bigint;
begin
  v_linhas := pg_temp.como(p_papel, p_usuario, p_sql);
  return format('FALHOU: passou sem erro (%s linhas)', v_linhas);
exception when others then
  if position(p_trecho in sqlerrm) > 0 then
    return 'ok';
  end if;
  return 'FALHOU: erro inesperado: ' || sqlerrm;
end;
$$;

-- Espera um numero exato de linhas.
create or replace function pg_temp.deve_contar(
  p_papel text, p_usuario uuid, p_sql text, p_esperado bigint
)
returns text language plpgsql as $$
declare v_linhas bigint;
begin
  v_linhas := pg_temp.como(p_papel, p_usuario, p_sql);
  if v_linhas = p_esperado then
    return 'ok';
  end if;
  return format('FALHOU: esperava %s, veio %s', p_esperado, v_linhas);
exception when others then
  return 'FALHOU: erro inesperado: ' || sqlerrm;
end;
$$;

create or replace function pg_temp.deve_valer(p_valor numeric, p_esperado numeric)
returns text language sql as $$
  select case when p_valor = p_esperado then 'ok'
              else format('FALHOU: esperava %s, veio %s', p_esperado, p_valor) end;
$$;

create or replace function pg_temp.verificar()
returns table (caso text, resultado text) language plpgsql as $$
declare
  c text[] := '{}';
  r text[] := '{}';
  v_erro text;

  empresa_a uuid := gen_random_uuid();
  empresa_b uuid := gen_random_uuid();
  admin_a   uuid := gen_random_uuid();
  almox_a   uuid := gen_random_uuid();
  consulta_a uuid := gen_random_uuid();
  inativo_a uuid := gen_random_uuid();
  admin_b   uuid := gen_random_uuid();
  novo      uuid := gen_random_uuid();
  dep_1    uuid := gen_random_uuid();
  dep_2     uuid := gen_random_uuid();
  item_1    uuid := gen_random_uuid();
  item_2    uuid := gen_random_uuid();
  centro    uuid := gen_random_uuid();
  forn      uuid := gen_random_uuid();
  v_mov     uuid;
  v_mov_ent uuid;
  v_view    text;
begin
  begin
    insert into empresas (id, nome) values
      (empresa_a, 'Verificacao A'), (empresa_b, 'Verificacao B');

    insert into auth.users (id, email) values
      (admin_a,    'verif-admin-a@teste.invalid'),
      (almox_a,    'verif-almox-a@teste.invalid'),
      (consulta_a, 'verif-consulta-a@teste.invalid'),
      (inativo_a,  'verif-inativo-a@teste.invalid'),
      (admin_b,    'verif-admin-b@teste.invalid');

    insert into usuarios (id, empresa_id, nome, email, perfil, ativo) values
      (admin_a,    empresa_a, 'Admin A',    'verif-admin-a@teste.invalid',    'admin',      true),
      (almox_a,    empresa_a, 'Almox A',    'verif-almox-a@teste.invalid',    'almoxarife', true),
      (consulta_a, empresa_a, 'Consulta A', 'verif-consulta-a@teste.invalid', 'consulta',   true),
      (inativo_a,  empresa_a, 'Inativo A',  'verif-inativo-a@teste.invalid',  'admin',      false),
      (admin_b,    empresa_b, 'Admin B',    'verif-admin-b@teste.invalid',    'admin',      true);

    insert into depositos (id, empresa_id, nome) values
      (dep_1, empresa_a, 'Dep 1'), (dep_2, empresa_a, 'Dep 2');
    insert into centros_custo (id, empresa_id, nome) values (centro, empresa_a, 'Centro');
    insert into fornecedores (id, empresa_id, nome) values (forn, empresa_a, 'Fornecedor');
    insert into itens (id, empresa_id, sku, nome) values
      (item_1, empresa_a, 'VERIF-1', 'Item 1'),
      (item_2, empresa_a, 'VERIF-2', 'Item 2');

    -- Regras de saldo e custo ------------------------------------------
    perform pg_temp.como('authenticated', almox_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario, usuario_id)
         values (%L, %L, %L, 'entrada', 10, 5, %L), (%L, %L, %L, 'entrada', 10, 7, %L)$s$,
      empresa_a, item_1, dep_1, almox_a, empresa_a, item_1, dep_1, almox_a));

    c := c || 'entrada 10 a 5,00 + 10 a 7,00 da custo medio 6,00'::text;
    r := r || pg_temp.deve_valer((select custo_medio from itens where id = item_1), 6);

    c := c || 'saida maior que o saldo e recusada'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, centro_custo_id)
         values (%L, %L, %L, 'saida', 999, %L)$s$, empresa_a, item_1, dep_1, centro),
      'SALDO_INSUFICIENTE');

    c := c || 'saida sem destino de custo e recusada'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade)
         values (%L, %L, %L, 'saida', 1)$s$, empresa_a, item_1, dep_1),
      'saida_exige_destino');

    insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, centro_custo_id)
      values (empresa_a, item_1, dep_1, 'saida', 4, centro)
      returning id into v_mov;

    c := c || 'saida usa o custo medio vigente'::text;
    r := r || pg_temp.deve_valer((select custo_unitario from movimentacoes where id = v_mov), 6);

    c := c || 'movimentacao nao aceita update, nem pelo dono do banco'::text;
    r := r || pg_temp.deve_falhar(null, null, format(
      'update movimentacoes set quantidade = 999 where id = %L', v_mov), 'MOVIMENTACAO_IMUTAVEL');

    c := c || 'movimentacao nao aceita delete, nem pelo dono do banco'::text;
    r := r || pg_temp.deve_falhar(null, null, format(
      'delete from movimentacoes where id = %L', v_mov), 'MOVIMENTACAO_IMUTAVEL');

    c := c || 'aplicacao nao edita saldo direto'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a, format(
      'update saldos set quantidade = 999 where item_id = %L', item_1), 'permission denied');

    c := c || 'transferencia preserva o saldo total'::text;
    insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, deposito_destino_id)
      values (empresa_a, item_1, dep_1, 'transferencia', 5, dep_2);
    r := r || pg_temp.deve_valer((select sum(quantidade) from saldos where item_id = item_1), 16);

    c := c || 'estorno de saida devolve o saldo'::text;
    perform pg_temp.como('authenticated', almox_a, format(
      $s$select fn_estornar_movimentacao(%L, %L, 'verificacao')$s$, v_mov, almox_a));
    r := r || pg_temp.deve_valer((select sum(quantidade) from saldos where item_id = item_1), 20);

    c := c || 'estorno nao pode ser repetido'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a, format(
      $s$select fn_estornar_movimentacao(%L, %L, 'verificacao')$s$, v_mov, almox_a),
      'MOVIMENTACAO_JA_ESTORNADA');

    insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario)
      values (empresa_a, item_2, dep_1, 'entrada', 3, 10)
      returning id into v_mov_ent;

    -- Saldo inicial e lancado como entrada: sem isto, um erro de digitacao
    -- na carga nao teria correcao.
    c := c || 'estorno de entrada retira o saldo lancado'::text;
    begin
      perform pg_temp.como('authenticated', almox_a, format(
        $s$select fn_estornar_movimentacao(%L, %L, 'verificacao')$s$, v_mov_ent, almox_a));
      r := r || pg_temp.deve_valer((select sum(quantidade) from saldos where item_id = item_2), 0);
    exception when others then
      r := r || ('FALHOU: erro inesperado: ' || sqlerrm);
    end;

    -- Perfis -----------------------------------------------------------
    c := c || 'perfil consulta nao cadastra item'::text;
    r := r || pg_temp.deve_falhar('authenticated', consulta_a, format(
      $s$insert into itens (empresa_id, sku, nome) values (%L, 'VERIF-X', 'X')$s$, empresa_a),
      'row-level security');

    c := c || 'perfil consulta nao registra movimentacao'::text;
    r := r || pg_temp.deve_falhar('authenticated', consulta_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade)
         values (%L, %L, %L, 'entrada', 1)$s$, empresa_a, item_1, dep_1),
      'row-level security');

    c := c || 'almoxarife nao cadastra fornecedor'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a, format(
      $s$insert into fornecedores (empresa_id, nome) values (%L, 'X')$s$, empresa_a),
      'row-level security');

    c := c || 'perfil consulta nao grava documento'::text;
    r := r || pg_temp.deve_falhar('authenticated', consulta_a, format(
      $s$insert into documentos (empresa_id, tipo) values (%L, 'entrada')$s$, empresa_a),
      'row-level security');

    c := c || 'almoxarife grava documento da entrada'::text;
    r := r || pg_temp.deve_contar('authenticated', almox_a, format(
      $s$insert into documentos (empresa_id, tipo) values (%L, 'entrada')$s$, empresa_a), 1);

    c := c || 'autor da movimentacao vem do login, nao do que foi enviado'::text;
    perform pg_temp.como('authenticated', almox_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario, motivo, usuario_id)
         values (%L, %L, %L, 'entrada', 1, 6, 'verif-autor', %L)$s$, empresa_a, item_1, dep_1, admin_a));
    r := r || case when (select usuario_id from movimentacoes where motivo = 'verif-autor') = almox_a
                   then 'ok' else 'FALHOU: gravou o autor enviado pelo cliente' end;

    c := c || 'ninguem exclui cadastro, nem admin'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a, format(
      'delete from fornecedores where id = %L', forn), 'permission denied');

    -- Isolamento e acesso sem login ------------------------------------
    c := c || 'empresa B nao le item da empresa A'::text;
    r := r || pg_temp.deve_contar('authenticated', admin_b, format(
      'select 1 from itens where id = %L', item_1), 0);

    c := c || 'empresa B nao le a empresa A'::text;
    r := r || pg_temp.deve_contar('authenticated', admin_b, format(
      'select 1 from empresas where id = %L', empresa_a), 0);

    c := c || 'usuario le a propria empresa'::text;
    r := r || pg_temp.deve_contar('authenticated', admin_a, format(
      'select 1 from empresas where id = %L', empresa_a), 1);

    c := c || 'usuario nao altera a empresa'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a, format(
      $s$update empresas set nome = 'X' where id = %L$s$, empresa_a), 'permission denied');

    c := c || 'sem login nao executa funcao de estorno'::text;
    r := r || pg_temp.deve_falhar('anon', null, format(
      $s$select fn_estornar_movimentacao(%L, %L, 'x')$s$, v_mov_ent, admin_a), 'permission denied');

    c := c || 'sem login nao le a tabela empresas'::text;
    r := r || pg_temp.deve_falhar('anon', null, 'select 1 from empresas', 'permission denied');

    -- Toda view publica: vale para as que forem criadas depois tambem.
    for v_view in
      select cl.relname from pg_class cl
        join pg_namespace n on n.oid = cl.relnamespace
       where n.nspname = 'public' and cl.relkind = 'v'
       order by 1
    loop
      c := c || format('sem login nao le %s', v_view);
      r := r || pg_temp.deve_falhar('anon', null, format('select 1 from %I', v_view), 'permission denied');

      c := c || format('empresa B nao ve dados da empresa A em %s', v_view);
      r := r || pg_temp.deve_contar('authenticated', admin_b, format('select 1 from %I', v_view), 0);
    end loop;

    c := c || 'usuario da empresa continua lendo v_kardex'::text;
    r := r || pg_temp.deve_contar('authenticated', admin_a, format(
      'select 1 from v_kardex where item_id = %L', item_2),
      (select count(*) from movimentacoes where item_id = item_2));

    c := c || 'usuario da empresa continua lendo v_valor_estoque'::text;
    r := r || pg_temp.deve_contar('authenticated', admin_a,
      'select 1 from v_valor_estoque where valor > 0', 1);

    -- Gestao de usuarios -----------------------------------------------
    insert into auth.users (id, email) values (novo, 'verif-novo@teste.invalid');

    c := c || 'almoxarife nao vincula usuario'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a,
      $s$select fn_vincular_usuario('verif-novo@teste.invalid', 'Novo', 'almoxarife')$s$, 'SEM_PERMISSAO');

    c := c || 'sem login nao vincula usuario'::text;
    r := r || pg_temp.deve_falhar('anon', null,
      $s$select fn_vincular_usuario('verif-novo@teste.invalid', 'Novo', 'admin')$s$, 'permission denied');

    c := c || 'admin nao vincula e-mail sem login criado'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a,
      $s$select fn_vincular_usuario('verif-nao-existe@teste.invalid', 'X', 'almoxarife')$s$, 'USUARIO_SEM_LOGIN');

    c := c || 'admin nao puxa usuario de outra empresa'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a,
      $s$select fn_vincular_usuario('verif-admin-b@teste.invalid', 'X', 'almoxarife')$s$, 'USUARIO_OUTRA_EMPRESA');

    c := c || 'admin vincula usuario na propria empresa'::text;
    perform pg_temp.como('authenticated', admin_a,
      $s$select fn_vincular_usuario(' Verif-Novo@teste.invalid ', 'Novo', 'consulta')$s$);
    r := r || case when (select empresa_id from usuarios where id = novo) = empresa_a
                   then 'ok' else 'FALHOU: nao vinculou na empresa do admin' end;

    c := c || 'admin nao vincula o mesmo usuario duas vezes'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a,
      $s$select fn_vincular_usuario('verif-novo@teste.invalid', 'Novo', 'consulta')$s$, 'USUARIO_JA_VINCULADO');

    c := c || 'admin altera perfil e status de outro usuario'::text;
    perform pg_temp.como('authenticated', admin_a, format(
      $s$select fn_atualizar_usuario(%L, 'gestor', false)$s$, novo));
    r := r || case when (select perfil = 'gestor' and not ativo from usuarios where id = novo)
                   then 'ok' else 'FALHOU: nao alterou' end;

    c := c || 'admin nao altera o proprio acesso'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_a, format(
      $s$select fn_atualizar_usuario(%L, 'admin', false)$s$, admin_a), 'ALTERACAO_PROPRIA');

    c := c || 'admin nao altera usuario de outra empresa'::text;
    r := r || pg_temp.deve_falhar('authenticated', admin_b, format(
      $s$select fn_atualizar_usuario(%L, 'consulta', false)$s$, almox_a), 'USUARIO_NAO_ENCONTRADO');

    c := c || 'almoxarife nao altera usuario'::text;
    r := r || pg_temp.deve_falhar('authenticated', almox_a, format(
      $s$select fn_atualizar_usuario(%L, 'admin', true)$s$, consulta_a), 'SEM_PERMISSAO');

    -- Usuario desativado -----------------------------------------------
    c := c || 'usuario desativado nao le dados da empresa'::text;
    r := r || pg_temp.deve_contar('authenticated', inativo_a, 'select 1 from itens', 0);

    c := c || 'usuario desativado nao registra movimentacao'::text;
    r := r || pg_temp.deve_falhar('authenticated', inativo_a, format(
      $s$insert into movimentacoes (empresa_id, item_id, deposito_id, tipo, quantidade, custo_unitario)
         values (%L, %L, %L, 'entrada', 1, 1)$s$, empresa_a, item_1, dep_1),
      'row-level security');

    -- O login precisa ler a propria linha para dizer "acesso desativado".
    c := c || 'usuario desativado le a propria linha para o aviso de login'::text;
    r := r || pg_temp.deve_contar('authenticated', inativo_a, format(
      'select 1 from usuarios where id = %L', inativo_a), 1);

    raise exception 'DESFAZER_VERIFICACAO';
  exception when others then
    if sqlerrm <> 'DESFAZER_VERIFICACAO' then
      v_erro := sqlerrm;
    end if;
  end;

  if v_erro is not null then
    c := c || 'preparacao da verificacao'::text;
    r := r || ('FALHOU: ' || v_erro);
  end if;

  return query
    select t.caso, t.resultado from unnest(c, r) as t(caso, resultado);
end;
$$;

select * from pg_temp.verificar();
