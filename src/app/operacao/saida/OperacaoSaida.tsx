"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Plus, TrendingDown } from "lucide-react";
import { Etiqueta, Chip, Botao, TelaResultado, type ResultadoOperacao } from "@/components/ui";
import { BuscaItem, type ItemComSaldo } from "@/components/operacao/BuscaItem";
import { registrarSaida } from "@/actions/registrarSaida";
import { quantidade as formatarQuantidade } from "@/lib/formato";

interface Veiculo {
  id: string;
  placa: string;
}
interface CentroCusto {
  id: string;
  nome: string;
}
interface Funcionario {
  id: string;
  nome: string;
}

interface OperacaoSaidaProps {
  depositoId: string;
  veiculos: Veiculo[];
  centrosCusto: CentroCusto[];
  funcionarios: Funcionario[];
}

type TipoDestino = "veiculo" | "centro" | "funcionario";
interface DestinoSelecionado {
  tipo: TipoDestino;
  id: string;
  rotulo: string;
}

export function OperacaoSaida({ depositoId, veiculos, centrosCusto, funcionarios }: OperacaoSaidaProps) {
  const [selecionado, setSelecionado] = useState<ItemComSaldo | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [destino, setDestino] = useState<DestinoSelecionado | null>(null);
  const [km, setKm] = useState("");
  const [resultado, setResultado] = useState<ResultadoOperacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setDestino(null);
    setKm("");
  }

  async function confirmar() {
    if (!selecionado || enviando) return;

    if (!destino) {
      setResultado({
        ok: false,
        titulo: "Destino obrigatório",
        detalhe: "Toda saída precisa ser vinculada a um veículo, setor ou funcionário.",
      });
      return;
    }
    if (quantidadeSelecionada > selecionado.saldo) {
      setResultado({
        ok: false,
        titulo: "Saldo insuficiente",
        detalhe: `Disponível: ${formatarQuantidade(selecionado.saldo)} ${selecionado.unidade}. Faça o ajuste por inventário antes de registrar.`,
      });
      return;
    }

    setEnviando(true);
    const resposta = await registrarSaida({
      itemId: selecionado.id,
      depositoId,
      quantidade: quantidadeSelecionada,
      centroCustoId: destino.tipo === "centro" ? destino.id : undefined,
      veiculoId: destino.tipo === "veiculo" ? destino.id : undefined,
      funcionarioId: destino.tipo === "funcionario" ? destino.id : undefined,
      kmVeiculo: destino.tipo === "veiculo" && km ? Number(km) : undefined,
    });
    setEnviando(false);

    if (!resposta.sucesso) {
      setResultado({
        ok: false,
        titulo: "Não foi possível registrar",
        detalhe: resposta.erro ?? "Tente novamente.",
      });
      return;
    }

    setResultado({
      ok: true,
      titulo: "Saída registrada",
      detalhe: `${formatarQuantidade(quantidadeSelecionada)} ${selecionado.unidade} · ${selecionado.nome} → ${destino.rotulo}`,
    });
    limpar();
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <TelaResultado resultado={resultado} aoFechar={() => setResultado(null)} />

      <div className="flex-1 overflow-auto p-4 pb-24">
        {!selecionado ? (
          <BuscaItem depositoId={depositoId} onSelecionar={setSelecionado} />
        ) : (
          <div className="flex flex-col gap-5">
            <button onClick={limpar} className="flex items-center gap-1.5 font-corpo text-sm text-bruma">
              <ArrowLeft size={16} /> Trocar item
            </button>

            <Etiqueta
              nome={selecionado.nome}
              sku={selecionado.sku}
              saldo={selecionado.saldo}
              unidade={selecionado.unidade}
              minimo={selecionado.estoqueMinimo}
              pontoPedido={selecionado.pontoPedido}
              escuro
              ativo
            />

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">Quantidade</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantidadeSelecionada((q) => Math.max(1, q - 1))}
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-grafite bg-aco"
                >
                  <Minus size={22} className="text-white" />
                </button>
                <div className="flex flex-1 items-baseline justify-center gap-2">
                  <span className="font-display text-[44px] font-bold leading-none text-white">
                    {quantidadeSelecionada}
                  </span>
                  <span className="font-dado text-sm text-bruma">{selecionado.unidade}</span>
                </div>
                <button
                  onClick={() => setQuantidadeSelecionada((q) => q + 1)}
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-grafite bg-aco"
                >
                  <Plus size={22} className="text-white" />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">Destino · obrigatório</p>
              <div className="flex flex-wrap gap-2">
                {veiculos.map((v) => (
                  <Chip
                    key={`v-${v.id}`}
                    escuro
                    ativo={destino?.tipo === "veiculo" && destino.id === v.id}
                    onClick={() => setDestino({ tipo: "veiculo", id: v.id, rotulo: v.placa })}
                  >
                    <span className="font-dado">{v.placa}</span>
                  </Chip>
                ))}
                {centrosCusto.map((c) => (
                  <Chip
                    key={`c-${c.id}`}
                    escuro
                    ativo={destino?.tipo === "centro" && destino.id === c.id}
                    onClick={() => setDestino({ tipo: "centro", id: c.id, rotulo: c.nome })}
                  >
                    {c.nome}
                  </Chip>
                ))}
                {funcionarios.map((f) => (
                  <Chip
                    key={`f-${f.id}`}
                    escuro
                    ativo={destino?.tipo === "funcionario" && destino.id === f.id}
                    onClick={() => setDestino({ tipo: "funcionario", id: f.id, rotulo: f.nome })}
                  >
                    {f.nome}
                  </Chip>
                ))}
                {veiculos.length + centrosCusto.length + funcionarios.length === 0 && (
                  <p className="font-corpo text-sm text-bruma">
                    Nenhum veículo, centro de custo ou funcionário cadastrado.
                  </p>
                )}
              </div>

              {destino?.tipo === "veiculo" && (
                <div className="mt-4">
                  <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">
                    Quilometragem atual · opcional
                  </p>
                  <input
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    inputMode="numeric"
                    className="h-14 w-full rounded border border-grafite bg-aco px-3.5 font-dado text-base text-white outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selecionado && (
        <div className="flex-shrink-0 border-t border-grafite bg-carbono p-4">
          <Botao tamanho="grande" onClick={confirmar} carregando={enviando} icone={<TrendingDown size={22} />}>
            {enviando ? "Registrando..." : "Registrar saída"}
          </Botao>
        </div>
      )}
    </div>
  );
}
