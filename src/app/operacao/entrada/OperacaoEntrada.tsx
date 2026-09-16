"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Plus, TrendingUp } from "lucide-react";
import { Etiqueta, Chip, Botao, TelaResultado, type ResultadoOperacao } from "@/components/ui";
import { BuscaItem, type ItemComSaldo } from "@/components/operacao/BuscaItem";
import { registrarEntrada } from "@/actions/registrarEntrada";
import { brl, quantidade as formatarQuantidade } from "@/lib/formato";

interface Fornecedor {
  id: string;
  nome: string;
}

interface OperacaoEntradaProps {
  depositoId: string;
  fornecedores: Fornecedor[];
}

export function OperacaoEntrada({ depositoId, fornecedores }: OperacaoEntradaProps) {
  const [selecionado, setSelecionado] = useState<ItemComSaldo | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [custoUnitario, setCustoUnitario] = useState("");
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [numeroNf, setNumeroNf] = useState("");
  const [resultado, setResultado] = useState<ResultadoOperacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setCustoUnitario("");
    setFornecedorId(null);
    setNumeroNf("");
  }

  async function confirmar() {
    if (!selecionado || enviando) return;

    const custo = Number(custoUnitario.replace(",", ".")) || selecionado.custoMedio;

    setEnviando(true);
    const resposta = await registrarEntrada({
      itemId: selecionado.id,
      depositoId,
      quantidade: quantidadeSelecionada,
      custoUnitario: custo,
      fornecedorId: fornecedorId ?? undefined,
      numeroNf: numeroNf || undefined,
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
      titulo: "Entrada registrada",
      detalhe: `${formatarQuantidade(quantidadeSelecionada)} ${selecionado.unidade} · ${selecionado.nome}`,
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
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">Custo unitário da compra</p>
              <input
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
                placeholder={selecionado.custoMedio.toFixed(2).replace(".", ",")}
                inputMode="decimal"
                className="h-14 w-full rounded border border-grafite bg-aco px-3.5 font-dado text-base text-white outline-none"
              />
              <p className="mt-2 font-corpo text-xs text-bruma">
                Custo médio atual: {brl(selecionado.custoMedio)}. A entrada recalcula o custo médio ponderado.
              </p>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">Fornecedor · opcional</p>
              <div className="flex flex-wrap gap-2">
                {fornecedores.map((f) => (
                  <Chip
                    key={f.id}
                    escuro
                    ativo={fornecedorId === f.id}
                    onClick={() => setFornecedorId((atual) => (atual === f.id ? null : f.id))}
                  >
                    {f.nome}
                  </Chip>
                ))}
                {fornecedores.length === 0 && (
                  <p className="font-corpo text-sm text-bruma">Nenhum fornecedor cadastrado.</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma">Nota fiscal · opcional</p>
              <input
                value={numeroNf}
                onChange={(e) => setNumeroNf(e.target.value)}
                placeholder="Número da NF"
                className="h-14 w-full rounded border border-grafite bg-aco px-3.5 font-dado text-base text-white outline-none placeholder:text-bruma"
              />
            </div>
          </div>
        )}
      </div>

      {selecionado && (
        <div className="flex-shrink-0 border-t border-grafite bg-carbono p-4">
          <Botao tamanho="grande" onClick={confirmar} carregando={enviando} icone={<TrendingUp size={22} />}>
            {enviando ? "Registrando..." : "Registrar entrada"}
          </Botao>
        </div>
      )}
    </div>
  );
}
