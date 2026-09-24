"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Pencil, Plus, Trash2, TrendingDown, X } from "lucide-react";
import { Etiqueta, Chip, Botao, TelaResultado, type ResultadoOperacao } from "@/components/ui";
import { BuscaItem, type ItemComSaldo } from "@/components/operacao/BuscaItem";
import { registrarSaidaLote } from "@/actions/registrarSaidaLote";
import { quantidade as formatarQuantidade } from "@/lib/formato";

interface Veiculo {
  id: string;
  placa: string;
}
interface CentroCusto {
  id: string;
  nome: string;
}

interface OperacaoSaidaProps {
  depositoId: string;
  veiculos: Veiculo[];
  centrosCusto: CentroCusto[];
}

type TipoDestino = "veiculo" | "centro";
interface DestinoSelecionado {
  tipo: TipoDestino;
  id: string;
  rotulo: string;
}

interface LinhaSaida {
  itemId: string;
  sku: string;
  nome: string;
  unidade: string;
  estoqueMinimo: number;
  pontoPedido: number;
  quantidade: number;
  saldo: number;
}

export function OperacaoSaida({ depositoId, veiculos, centrosCusto }: OperacaoSaidaProps) {
  const [buscando, setBuscando] = useState(true);
  const [selecionado, setSelecionado] = useState<ItemComSaldo | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [carrinho, setCarrinho] = useState<LinhaSaida[]>([]);
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [destino, setDestino] = useState<DestinoSelecionado | null>(null);
  const [frotaDigitada, setFrotaDigitada] = useState("");
  const [funcionarioDigitado, setFuncionarioDigitado] = useState("");
  const [numeroOs, setNumeroOs] = useState("");
  const [resultado, setResultado] = useState<ResultadoOperacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setBuscando(true);
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setCarrinho([]);
    setIndiceEditando(null);
    setDestino(null);
    setFrotaDigitada("");
    setFuncionarioDigitado("");
    setNumeroOs("");
  }

  function editarItemCarrinho(indice: number) {
    const linha = carrinho[indice];
    setSelecionado({
      id: linha.itemId,
      sku: linha.sku,
      nome: linha.nome,
      unidade: linha.unidade,
      estoqueMinimo: linha.estoqueMinimo,
      pontoPedido: linha.pontoPedido,
      custoMedio: 0,
      saldo: linha.saldo,
    });
    setQuantidadeSelecionada(linha.quantidade);
    setIndiceEditando(indice);
  }

  function cancelarEdicaoItem() {
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setIndiceEditando(null);
  }

  // Frota, setor e colaborador se combinam. So "veiculo da lista" e "frota digitada"
  // se excluem, porque os dois dizem qual e o veiculo.
  function selecionarChipDestino(novoDestino: DestinoSelecionado) {
    const jaSelecionado = destino?.tipo === novoDestino.tipo && destino.id === novoDestino.id;
    setDestino(jaSelecionado ? null : novoDestino);
    if (!jaSelecionado && novoDestino.tipo === "veiculo") setFrotaDigitada("");
  }

  function digitarFrota(valor: string) {
    setFrotaDigitada(valor);
    if (valor.trim() && destino?.tipo === "veiculo") setDestino(null);
  }

  function adicionarAoCarrinho() {
    if (!selecionado) return;
    const linha: LinhaSaida = {
      itemId: selecionado.id,
      sku: selecionado.sku,
      nome: selecionado.nome,
      unidade: selecionado.unidade,
      estoqueMinimo: selecionado.estoqueMinimo,
      pontoPedido: selecionado.pontoPedido,
      quantidade: quantidadeSelecionada,
      saldo: selecionado.saldo,
    };

    if (indiceEditando !== null) {
      setCarrinho((atual) => atual.map((l, i) => (i === indiceEditando ? linha : l)));
    } else {
      setCarrinho((atual) => [...atual, linha]);
    }

    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setIndiceEditando(null);
    setBuscando(false);
  }

  function removerDoCarrinho(indice: number) {
    setCarrinho((atual) => atual.filter((_, i) => i !== indice));
  }

  function cancelarOperacao() {
    if (!window.confirm("Cancelar esta saída? Os itens adicionados serão perdidos.")) return;
    limpar();
  }

  async function confirmar() {
    if (enviando || carrinho.length === 0) return;

    const frota = frotaDigitada.trim();
    const colaborador = funcionarioDigitado.trim();
    if (!destino && !frota && !colaborador) {
      setResultado({
        ok: false,
        titulo: "Destino obrigatório",
        detalhe: "Toda saída precisa ser vinculada a uma frota, setor ou colaborador.",
      });
      return;
    }

    const rotuloDestino = [destino?.rotulo, frota, colaborador].filter(Boolean).join(" · ");

    setEnviando(true);
    const resposta = await registrarSaidaLote({
      depositoId,
      centroCustoId: destino?.tipo === "centro" ? destino.id : undefined,
      veiculoId: destino?.tipo === "veiculo" ? destino.id : undefined,
      veiculoPlaca: frota || undefined,
      funcionarioNome: colaborador || undefined,
      numeroOs: numeroOs.trim() || undefined,
      itens: carrinho.map((l) => ({ itemId: l.itemId, quantidade: l.quantidade })),
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

    const totalItens = carrinho.length;
    setResultado({
      ok: true,
      titulo: "Saída registrada",
      detalhe: `${totalItens} ${totalItens === 1 ? "item" : "itens"} → ${rotuloDestino}`,
    });
    limpar();
  }

  const temCarrinho = carrinho.length > 0;

  return (
    <div className="relative flex flex-1 flex-col">
      <TelaResultado resultado={resultado} aoFechar={() => setResultado(null)} />

      <div className="flex-1 overflow-auto p-4 pb-24">
        {selecionado ? (
          <div className="flex flex-col gap-5">
            <button
              onClick={cancelarEdicaoItem}
              className="flex items-center gap-1.5 font-corpo text-sm text-bruma-luz"
            >
              <ArrowLeft size={16} /> {indiceEditando !== null ? "Cancelar edição" : "Trocar item"}
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
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Quantidade</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantidadeSelecionada((q) => Math.max(1, q - 1))}
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-bruma bg-aco"
                >
                  <Minus size={22} className="text-white" />
                </button>
                <div className="flex flex-1 items-baseline justify-center gap-2">
                  <span className="font-display text-[44px] font-bold leading-none text-white">
                    {quantidadeSelecionada}
                  </span>
                  <span className="font-dado text-sm text-bruma-luz">{selecionado.unidade}</span>
                </div>
                <button
                  onClick={() => setQuantidadeSelecionada((q) => q + 1)}
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-bruma bg-aco"
                >
                  <Plus size={22} className="text-white" />
                </button>
              </div>
              {quantidadeSelecionada > selecionado.saldo && (
                <p className="mt-2 font-corpo text-xs text-carmim-luz">
                  Acima do saldo disponível ({formatarQuantidade(selecionado.saldo)} {selecionado.unidade}).
                </p>
              )}
            </div>
          </div>
        ) : buscando ? (
          <div className="flex flex-col gap-4">
            {temCarrinho && (
              <button
                onClick={() => setBuscando(false)}
                className="flex items-center gap-1.5 font-corpo text-sm text-bruma-luz"
              >
                <ArrowLeft size={16} /> Voltar para a lista ({carrinho.length})
              </button>
            )}
            <BuscaItem depositoId={depositoId} onSelecionar={setSelecionado} />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="font-display text-rotulo uppercase text-bruma-luz">Itens desta saída</p>
                <button
                  onClick={() => setBuscando(true)}
                  className="flex items-center gap-1 font-corpo text-sm text-petroleo-claro"
                >
                  <Plus size={16} /> Adicionar item
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {carrinho.map((linha, indice) => (
                  <div
                    key={`${linha.itemId}-${indice}`}
                    className="flex items-center justify-between gap-3 rounded border border-bruma bg-aco p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-white">{linha.nome}</p>
                      <p className="font-dado text-denso text-bruma-luz">{linha.sku}</p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="font-dado text-base text-white">
                        {formatarQuantidade(linha.quantidade)} {linha.unidade}
                      </span>
                      <button
                        onClick={() => editarItemCarrinho(indice)}
                        aria-label={`Editar ${linha.nome}`}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-bruma-luz"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => removerDoCarrinho(indice)}
                        aria-label={`Remover ${linha.nome}`}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-carmim-luz"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Destino · obrigatório</p>
              <div className="flex flex-wrap gap-2">
                {veiculos.map((v) => (
                  <Chip
                    key={`v-${v.id}`}
                    escuro
                    ativo={destino?.tipo === "veiculo" && destino.id === v.id}
                    onClick={() => selecionarChipDestino({ tipo: "veiculo", id: v.id, rotulo: v.placa })}
                  >
                    <span className="font-dado">{v.placa}</span>
                  </Chip>
                ))}
                {centrosCusto.map((c) => (
                  <Chip
                    key={`c-${c.id}`}
                    escuro
                    ativo={destino?.tipo === "centro" && destino.id === c.id}
                    onClick={() => selecionarChipDestino({ tipo: "centro", id: c.id, rotulo: c.nome })}
                  >
                    {c.nome}
                  </Chip>
                ))}
                {veiculos.length + centrosCusto.length === 0 && (
                  <p className="font-corpo text-sm text-bruma-luz">Nenhum veículo ou centro de custo cadastrado.</p>
                )}
              </div>

              <div className="mt-3">
                <input
                  value={frotaDigitada}
                  onChange={(e) => digitarFrota(e.target.value)}
                  placeholder="Ou digite o número da frota / placa"
                  className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-dado text-base text-white outline-none placeholder:text-bruma-luz"
                />
                {frotaDigitada.trim() && (
                  <p className="mt-2 font-corpo text-xs text-bruma-luz">
                    Se essa frota ainda não estiver cadastrada, ela é criada automaticamente.
                  </p>
                )}
              </div>

              <div className="mt-3">
                <input
                  value={funcionarioDigitado}
                  onChange={(e) => setFuncionarioDigitado(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-corpo text-base text-white outline-none placeholder:text-bruma-luz"
                />
                {funcionarioDigitado.trim() && (
                  <p className="mt-2 font-corpo text-xs text-bruma-luz">
                    Se esse colaborador ainda não estiver cadastrado, ele é criado automaticamente.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Ordem de serviço · opcional</p>
              <input
                value={numeroOs}
                onChange={(e) => setNumeroOs(e.target.value)}
                maxLength={40}
                placeholder="Número da OS (ex.: OS 12212)"
                className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-dado text-base text-white outline-none placeholder:text-bruma-luz"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-grafite bg-carbono p-4">
        {selecionado ? (
          <Botao
            tamanho="grande"
            onClick={adicionarAoCarrinho}
            icone={indiceEditando !== null ? undefined : <Plus size={22} />}
          >
            {indiceEditando !== null ? "Salvar alteração" : "Adicionar à lista"}
          </Botao>
        ) : (
          temCarrinho &&
          !buscando && (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={cancelarOperacao}
                className="flex h-11 items-center justify-center gap-1.5 rounded border border-carmim/40 font-corpo text-sm font-semibold text-carmim-luz"
              >
                <X size={16} /> Cancelar saída
              </button>
              <Botao tamanho="grande" onClick={confirmar} carregando={enviando} icone={<TrendingDown size={22} />}>
                {enviando
                  ? "Registrando..."
                  : `Registrar saída (${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"})`}
              </Botao>
            </div>
          )
        )}
      </div>
    </div>
  );
}
