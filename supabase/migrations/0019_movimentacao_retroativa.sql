-- =====================================================================
-- StockManager  |  0019_movimentacao_retroativa.sql
-- Controla a data (criado_em) de uma movimentacao.
--
-- Motivo: a carga inicial de producao usa uma data de corte. Primeiro
-- entra o saldo que existia no corte (como entrada) e depois as entradas
-- e saidas posteriores, cada uma com a data original. Fora dessa carga,
-- movimentacao e sempre "agora", porque quem registra uma saida no
-- celular nao pode escolher a data.
--
-- Regras, todas aplicadas antes da insercao:
--   1. data no futuro: rejeitada para todos.
--   2. data no passado: so admin, ou execucao direta no banco (SQL
--      Editor / script de carga, sem auth.uid()). Os demais perfis
--      recebem erro. A aplicacao nunca envia criado_em; isto fecha a
--      porta de quem chamar a API direto.
--   3. data no passado nao pode ser anterior a ultima movimentacao do
--      mesmo item no mesmo deposito. Saldo e custo medio sao calculados
--      na ordem de insercao (0002_triggers.sql); lancar fora de ordem
--      cronologica deixaria o custo medio e o kardex errados.
--
-- Tolerancia de 5 minutos nas duas pontas para diferenca de relogio.
-- =====================================================================

create or replace function fn_controlar_data_movimentacao()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ultima timestamptz;
begin
  if new.criado_em > now() + interval '5 minutes' then
    raise exception 'DATA_FUTURA: movimentacao com data no futuro'
      using errcode = 'P0001';
  end if;

  if new.criado_em < now() - interval '5 minutes' then
    if auth.uid() is not null and fn_perfil_atual() is distinct from 'admin' then
      raise exception 'DATA_RETROATIVA: somente admin lanca movimentacao com data passada'
        using errcode = 'P0001';
    end if;

    select max(criado_em) into v_ultima
      from movimentacoes
     where item_id = new.item_id
       and deposito_id = new.deposito_id;

    if v_ultima is not null and new.criado_em < v_ultima then
      raise exception
        'DATA_FORA_DE_ORDEM: ultima movimentacao do item em %, informada %',
        v_ultima, new.criado_em
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Triggers BEFORE do mesmo evento disparam em ordem alfabetica: o
-- prefixo "trg_a0" garante que a data e validada antes de
-- trg_aplicar_movimentacao mexer em saldo e custo medio.
drop trigger if exists trg_a0_data_movimentacao on movimentacoes;
create trigger trg_a0_data_movimentacao
  before insert on movimentacoes
  for each row execute function fn_controlar_data_movimentacao();
