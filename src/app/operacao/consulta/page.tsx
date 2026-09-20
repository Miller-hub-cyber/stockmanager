import { createClient } from "@/lib/supabase/server";
import { ConsultaItem } from "./ConsultaItem";
import { BotaoEstornar } from "./BotaoEstornar";
import { brl, quantidade as formatarQuantidade, dataHora } from "@/lib/formato";

export default async function PaginaConsulta() {
  const supabase = createClient();

  const { data: deposito } = await supabase
    .from("depositos")
    .select("id")
    .eq("ativo", true)
    .order("nome")
    .limit(1)
    .maybeSingle();

  const { data: movimentacoes } = await supabase
    .from("movimentacoes")
    .select(
      "id, item_id, tipo, quantidade, custo_unitario, centro_custo_id, veiculo_id, funcionario_id, estorno_de, criado_em, usuario_id"
    )
    .order("criado_em", { ascending: false })
    .limit(15);

  const lista = movimentacoes ?? [];

  const idsItens = Array.from(new Set(lista.map((m) => m.item_id)));
  const idsVeiculos = Array.from(
    new Set(lista.map((m) => m.veiculo_id).filter((v): v is string => Boolean(v)))
  );
  const idsCentros = Array.from(
    new Set(lista.map((m) => m.centro_custo_id).filter((v): v is string => Boolean(v)))
  );
  const idsFuncionarios = Array.from(
    new Set(lista.map((m) => m.funcionario_id).filter((v): v is string => Boolean(v)))
  );
  const idsUsuarios = Array.from(
    new Set(lista.map((m) => m.usuario_id).filter((v): v is string => Boolean(v)))
  );

  const [itensRel, veiculosRel, centrosRel, funcionariosRel, usuariosRel] = await Promise.all([
    idsItens.length
      ? supabase.from("itens").select("id, nome, sku, unidade").in("id", idsItens)
      : { data: [] as { id: string; nome: string; sku: string; unidade: string }[] },
    idsVeiculos.length
      ? supabase.from("veiculos").select("id, placa").in("id", idsVeiculos)
      : { data: [] as { id: string; placa: string }[] },
    idsCentros.length
      ? supabase.from("centros_custo").select("id, nome").in("id", idsCentros)
      : { data: [] as { id: string; nome: string }[] },
    idsFuncionarios.length
      ? supabase.from("funcionarios").select("id, nome").in("id", idsFuncionarios)
      : { data: [] as { id: string; nome: string }[] },
    idsUsuarios.length
      ? supabase.from("usuarios").select("id, nome").in("id", idsUsuarios)
      : { data: [] as { id: string; nome: string }[] },
  ]);

  const mapaItens = new Map((itensRel.data ?? []).map((i) => [i.id, i]));
  const mapaVeiculos = new Map((veiculosRel.data ?? []).map((v) => [v.id, v.placa]));
  const mapaCentros = new Map((centrosRel.data ?? []).map((c) => [c.id, c.nome]));
  const mapaFuncionarios = new Map((funcionariosRel.data ?? []).map((f) => [f.id, f.nome]));
  const mapaUsuarios = new Map((usuariosRel.data ?? []).map((u) => [u.id, u.nome]));

  const idsJaEstornados = new Set(lista.map((m) => m.estorno_de).filter((v): v is string => Boolean(v)));

  return (
    <div className="flex-1 overflow-auto p-4">
      <div>
        <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Consultar item</p>
        {deposito ? (
          <ConsultaItem depositoId={deposito.id} />
        ) : (
          <p className="font-corpo text-sm text-bruma-luz">Nenhum depósito cadastrado.</p>
        )}
      </div>

      <div className="mt-7">
        <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Movimentações recentes</p>
        <div className="flex flex-col gap-2">
          {lista.length === 0 && (
            <p className="font-corpo text-sm text-bruma-luz">Nenhuma movimentação registrada ainda.</p>
          )}
          {lista.map((m) => {
            const item = mapaItens.get(m.item_id);
            const destino = m.veiculo_id
              ? mapaVeiculos.get(m.veiculo_id)
              : m.centro_custo_id
                ? mapaCentros.get(m.centro_custo_id)
                : m.funcionario_id
                  ? mapaFuncionarios.get(m.funcionario_id)
                  : null;
            const saida = m.tipo === "saida";
            const jaEstornada = idsJaEstornados.has(m.id);
            const ehEstorno = m.estorno_de !== null;

            return (
              <div key={m.id} className="rounded border border-grafite bg-aco p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-corpo text-sm text-white">
                      {item?.nome ?? "Item removido"}
                    </div>
                    <div className="mt-0.5 truncate font-dado text-xs text-bruma-luz">
                      {item?.sku}
                      {destino ? ` · ${destino}` : ""} · {mapaUsuarios.get(m.usuario_id ?? "") ?? "—"}
                    </div>
                    <div className="mt-0.5 font-dado text-[11px] text-bruma-luz">{dataHora(m.criado_em)}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className={`font-dado text-sm ${saida ? "text-carmim-luz" : "text-musgo-luz"}`}>
                      {saida ? "−" : "+"}
                      {formatarQuantidade(m.quantidade)} {item?.unidade}
                    </div>
                    <div className="font-dado text-xs text-bruma-luz">{brl(m.quantidade * m.custo_unitario)}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {jaEstornada ? (
                    <span className="font-corpo text-xs text-bruma-luz">Estornada</span>
                  ) : ehEstorno ? (
                    <span className="font-corpo text-xs text-bruma-luz">Estorno</span>
                  ) : (
                    <span />
                  )}
                  {!jaEstornada && <BotaoEstornar movimentacaoId={m.id} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
