"use client";

import { useState } from "react";
import { ArrowLeft, Minus, Pencil, Plus, Trash2, TrendingUp, X } from "lucide-react";
import { Etiqueta, Chip, Botao, TelaResultado, type ResultadoOperacao } from "@/components/ui";
import { BuscaItem, type ItemComSaldo } from "@/components/operacao/BuscaItem";
import { registrarEntradaLote } from "@/actions/registrarEntradaLote";
import { brl, quantidade as formatarQuantidade } from "@/lib/formato";

interface Fornecedor {
  id: string;
  nome: string;
}

interface OperacaoEntradaProps {
  depositoId: string;
  fornecedores: Fornecedor[];
}

interface LinhaEntrada {
  itemId: string;
  sku: string;
  nome: string;
  unidade: string;
  estoqueMinimo: number;
  pontoPedido: number;
  custoMedio: number;
  saldo: number;
  quantidade: number;
  custoUnitario: number;
}

export function OperacaoEntrada({ depositoId, fornecedores }: OperacaoEntradaProps) {
  const [buscando, setBuscando] = useState(true);
  const [selecionado, setSelecionado] = useState<ItemComSaldo | null>(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  const [custoUnitario, setCustoUnitario] = useState("");
  const [carrinho, setCarrinho] = useState<LinhaEntrada[]>([]);
  const [indiceEditando, setIndiceEditando] = useState<number | null>(null);
  const [fornecedorId, setFornecedorId] = useState<string | null>(null);
  const [frotaDigitada, setFrotaDigitada] = useState("");
  const [mecanico, setMecanico] = useState("");
  const [numeroNf, setNumeroNf] = useState("");
  const [numeroOs, setNumeroOs] = useState("");
  const [resultado, setResultado] = useState<ResultadoOperacao | null>(null);
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setBuscando(true);
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setCustoUnitario("");
    setCarrinho([]);
    setIndiceEditando(null);
    setFornecedorId(null);
    setFrotaDigitada("");
    setMecanico("");
    setNumeroNf("");
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
      custoMedio: linha.custoMedio,
      saldo: linha.saldo,
    });
    setQuantidadeSelecionada(linha.quantidade);
    setCustoUnitario(
      linha.custoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    setIndiceEditando(indice);
  }

  function cancelarEdicaoItem() {
    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setCustoUnitario("");
    setIndiceEditando(null);
  }

  function digitarCusto(valorDigitado: string) {
    const digitos = valorDigitado.replace(/\D/g, "");
    if (!digitos) {
      setCustoUnitario("");
      return;
    }
    const centavos = Number(digitos);
    setCustoUnitario((centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

  function adicionarAoCarrinho() {
    if (!selecionado) return;
    const custo = Number(custoUnitario.replace(/\./g, "").replace(",", ".")) || selecionado.custoMedio;
    const linha: LinhaEntrada = {
      itemId: selecionado.id,
      sku: selecionado.sku,
      nome: selecionado.nome,
      unidade: selecionado.unidade,
      estoqueMinimo: selecionado.estoqueMinimo,
      pontoPedido: selecionado.pontoPedido,
      custoMedio: selecionado.custoMedio,
      saldo: selecionado.saldo,
      quantidade: quantidadeSelecionada,
      custoUnitario: custo,
    };

    if (indiceEditando !== null) {
      setCarrinho((atual) => atual.map((l, i) => (i === indiceEditando ? linha : l)));
    } else {
      setCarrinho((atual) => [...atual, linha]);
    }

    setSelecionado(null);
    setQuantidadeSelecionada(1);
    setCustoUnitario("");
    setIndiceEditando(null);
    setBuscando(false);
  }

  function removerDoCarrinho(indice: number) {
    setCarrinho((atual) => atual.filter((_, i) => i !== indice));
  }

  function cancelarOperacao() {
    if (!window.confirm("Cancelar esta entrada? Os itens adicionados serão perdidos.")) return;
    limpar();
  }

  async function confirmar() {
    if (enviando || carrinho.length === 0) return;

    setEnviando(true);
    const resposta = await registrarEntradaLote({
      depositoId,
      fornecedorId: fornecedorId ?? undefined,
      veiculoPlaca: frotaDigitada.trim() || undefined,
      funcionarioNome: mecanico.trim() || undefined,
      numeroNf: numeroNf || undefined,
      numeroOs: numeroOs.trim() || undefined,
      itens: carrinho.map((l) => ({
        itemId: l.itemId,
        quantidade: l.quantidade,
        custoUnitario: l.custoUnitario,
      })),
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
      titulo: "Entrada registrada",
      detalhe: `${totalItens} ${totalItens === 1 ? "item" : "itens"} adicionados ao estoque.`,
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
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Custo unitário da compra</p>
              <input
                value={custoUnitario}
                onChange={(e) => digitarCusto(e.target.value)}
                placeholder={selecionado.custoMedio.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                inputMode="numeric"
                className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-dado text-base text-white outline-none"
              />
              <p className="mt-2 font-corpo text-xs text-bruma-luz">
                Custo médio atual: {brl(selecionado.custoMedio)}. A entrada recalcula o custo médio ponderado.
              </p>
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
                <p className="font-display text-rotulo uppercase text-bruma-luz">Itens desta entrada</p>
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
                      <p className="font-dado text-denso text-bruma-luz">
                        {linha.sku} · {brl(linha.custoUnitario)}/{linha.unidade}
                      </p>
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
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Fornecedor · opcional</p>
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
                  <p className="font-corpo text-sm text-bruma-luz">Nenhum fornecedor cadastrado.</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">
                Frota / veículo de destino · opcional
              </p>
              <div>
                <input
                  value={frotaDigitada}
                  onChange={(e) => setFrotaDigitada(e.target.value)}
                  placeholder="Número da frota / placa"
                  className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-dado text-base text-white outline-none placeholder:text-bruma-luz"
                />
                {frotaDigitada.trim() && (
                  <p className="mt-2 font-corpo text-xs text-bruma-luz">
                    Se essa frota ainda não estiver cadastrada, ela é criada automaticamente.
                  </p>
                )}
              </div>
              <p className="mt-2 font-corpo text-xs text-bruma-luz">
                Só uma etiqueta de referência (para qual frota essa compra é) — o item continua entrando no estoque
                do depósito.
              </p>
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">
                Colaborador que pediu as peças · opcional
              </p>
              <input
                value={mecanico}
                onChange={(e) => setMecanico(e.target.value)}
                placeholder="Nome do colaborador"
                className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-corpo text-base text-white outline-none placeholder:text-bruma-luz"
              />
              {mecanico.trim() && (
                <p className="mt-2 font-corpo text-xs text-bruma-luz">
                  Se esse colaborador ainda não estiver cadastrado, ele é criado automaticamente.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2.5 font-display text-rotulo uppercase text-bruma-luz">Nota fiscal · opcional</p>
              <input
                value={numeroNf}
                onChange={(e) => setNumeroNf(e.target.value)}
                placeholder="Número da NF"
                className="h-14 w-full rounded border border-bruma bg-aco px-3.5 font-dado text-base text-white outline-none placeholder:text-bruma-luz"
              />
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
                <X size={16} /> Cancelar entrada
              </button>
              <Botao tamanho="grande" onClick={confirmar} carregando={enviando} icone={<TrendingUp size={22} />}>
                {enviando
                  ? "Registrando..."
                  : `Registrar entrada (${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"})`}
              </Botao>
            </div>
          )
        )}
      </div>
    </div>
  );
}
