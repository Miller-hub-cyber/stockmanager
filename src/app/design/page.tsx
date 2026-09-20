"use client";

import { ReactNode, useState } from "react";
import {
  Botao,
  Campo,
  Seletor,
  Etiqueta,
  Chip,
  Tabela,
  TabelaCabecalho,
  TabelaLinha,
  TabelaCelula,
  Indicador,
  PontoEstado,
  Aviso,
  TelaResultado,
  type ResultadoOperacao,
} from "@/components/ui";
import { cores, estadoItem } from "@/lib/tokens";

const ITENS_EXEMPLO = [
  { sku: "FLT-0042", nome: "Filtro de óleo Mann W950", saldo: 12, minimo: 8, pontoPedido: 15, unidade: "UN" },
  { sku: "LUB-0014", nome: "ARLA 32", saldo: 0, minimo: 50, pontoPedido: 100, unidade: "L" },
  { sku: "FRE-0003", nome: "Pastilha de freio dianteira", saldo: 6, minimo: 4, pontoPedido: 8, unidade: "JG" },
];

const PLACAS_EXEMPLO = ["RKN-2C41", "PXH-7B09", "QTA-5J77"];

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 font-display text-lg font-semibold text-tinta">{titulo}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function PaginaDesign() {
  const [destinoAtivo, setDestinoAtivo] = useState(PLACAS_EXEMPLO[0]);
  const [resultado, setResultado] = useState<ResultadoOperacao | null>(null);

  return (
    <div className="min-h-screen bg-nevoa p-8">
      <h1 className="font-display text-tela text-tinta">Design system</h1>
      <p className="mt-2 max-w-2xl font-corpo text-corpo text-bruma-texto">
        Componentes base do StockManager. Cada um consome os tokens de{" "}
        <code className="font-dado text-denso">tailwind.config.ts</code>, nunca cor ou tamanho fixo fora da
        lista definida em <code className="font-dado text-denso">docs/design-system.md</code>.
      </p>

      <div className="mt-10">
        <Secao titulo="Botão">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Botao>Primário</Botao>
            </div>
            <div className="w-40">
              <Botao variante="secundario">Secundário</Botao>
            </div>
            <div className="w-40">
              <Botao variante="perigo">Perigo</Botao>
            </div>
            <div className="w-40">
              <Botao disabled>Desabilitado</Botao>
            </div>
            <div className="w-40">
              <Botao carregando>Carregando</Botao>
            </div>
          </div>
          <div className="w-full max-w-md">
            <Botao tamanho="grande">Registrar saída</Botao>
          </div>
        </Secao>

        <Secao titulo="Campo e Seletor">
          <div className="grid max-w-xl grid-cols-2 gap-4">
            <Campo id="nome" rotulo="Nome do item" placeholder="Filtro de óleo" />
            <Campo id="sku" rotulo="SKU" placeholder="FLT-0042" erro="SKU já cadastrado." />
            <Seletor id="categoria" rotulo="Categoria" defaultValue="">
              <option value="" disabled>
                Selecionar
              </option>
              <option>Filtros</option>
              <option>Lubrificantes</option>
            </Seletor>
          </div>
          <div className="max-w-xl rounded bg-carbono p-5">
            <Campo id="busca-op" rotulo="Buscar item" placeholder="Buscar item ou SKU" densidade="operacao" />
          </div>
        </Secao>

        <Secao titulo="Etiqueta (elemento de assinatura)">
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {ITENS_EXEMPLO.map((item, indice) => (
              <Etiqueta key={item.sku} {...item} ativo={indice === 0} />
            ))}
          </div>
          <div className="grid max-w-3xl gap-3 rounded bg-carbono p-4 sm:grid-cols-3">
            {ITENS_EXEMPLO.map((item, indice) => (
              <Etiqueta key={item.sku} {...item} escuro ativo={indice === 1} />
            ))}
          </div>
        </Secao>

        <Secao titulo="Chip">
          <div className="flex flex-wrap gap-2">
            {PLACAS_EXEMPLO.map((placa) => (
              <Chip key={placa} ativo={destinoAtivo === placa} onClick={() => setDestinoAtivo(placa)}>
                {placa}
              </Chip>
            ))}
          </div>
        </Secao>

        <Secao titulo="Indicador">
          <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador rotulo="Valor em estoque" valor="R$ 86.420" sub="428 itens ativos" />
            <Indicador rotulo="Itens críticos" valor={17} sub="No mínimo ou abaixo" tom="alerta" />
            <Indicador rotulo="Esgotados" valor={4} sub="Saldo zero" tom="erro" />
            <Indicador rotulo="Entradas no mês" valor={62} sub="Últimos 30 dias" tom="sucesso" />
          </div>
        </Secao>

        <Secao titulo="Ponto de estado">
          <div className="flex flex-wrap gap-6">
            <PontoEstado cor={cores.musgo} texto="Normal" estado="normal" />
            <PontoEstado cor={cores.ambar} texto="Abaixo do mínimo" estado="alerta" />
            <PontoEstado cor={cores.carmim} texto="Esgotado" estado="critico" />
            <PontoEstado cor={cores.bruma} texto="Inativo" estado="inativo" />
          </div>
        </Secao>

        <Secao titulo="Tabela">
          <Tabela>
            <TabelaCabecalho>
              <TabelaCelula cabecalho className="max-w-[100px] flex-none">
                SKU
              </TabelaCelula>
              <TabelaCelula cabecalho>Item</TabelaCelula>
              <TabelaCelula cabecalho align="direita">
                Saldo
              </TabelaCelula>
              <TabelaCelula cabecalho align="direita" className="max-w-[70px] flex-none">
                Estado
              </TabelaCelula>
            </TabelaCabecalho>
            {ITENS_EXEMPLO.map((item) => (
              <TabelaLinha key={item.sku}>
                <TabelaCelula mono className="max-w-[100px] flex-none text-bruma-texto">
                  {item.sku}
                </TabelaCelula>
                <TabelaCelula>{item.nome}</TabelaCelula>
                <TabelaCelula align="direita" mono>
                  {item.saldo} {item.unidade}
                </TabelaCelula>
                <TabelaCelula align="direita" className="max-w-[70px] flex-none">
                  {(() => {
                    const est = estadoItem(item.saldo, item.minimo, item.pontoPedido);
                    return <PontoEstado cor={est.cor} estado={est.estado} />;
                  })()}
                </TabelaCelula>
              </TabelaLinha>
            ))}
          </Tabela>
        </Secao>

        <Secao titulo="Aviso">
          <div className="grid max-w-2xl gap-3">
            <Aviso tipo="info" titulo="Sessão expira em 5 minutos">
              Salve o que estiver em andamento.
            </Aviso>
            <Aviso tipo="alerta" titulo="12 itens abaixo do mínimo">
              Revise a lista de compras.
            </Aviso>
            <Aviso tipo="erro" titulo="Saldo insuficiente">
              Disponível: 3 UN. Faça o ajuste por inventário antes de registrar.
            </Aviso>
            <Aviso tipo="sucesso" titulo="Entrada registrada">
              30 UN adicionadas ao estoque.
            </Aviso>
          </div>
          <div className="max-w-2xl rounded bg-carbono p-4">
            <Aviso tipo="erro" titulo="Saldo insuficiente" escuro>
              Disponível: 3 UN. Faça o ajuste por inventário antes de registrar.
            </Aviso>
          </div>
        </Secao>

        <Secao titulo="Tela de resultado">
          <div className="flex gap-3">
            <div className="w-52">
              <Botao
                variante="secundario"
                onClick={() =>
                  setResultado({
                    ok: true,
                    titulo: "Saída registrada",
                    detalhe: "5 UN · Filtro de óleo → RKN-2C41",
                  })
                }
              >
                Simular sucesso
              </Botao>
            </div>
            <div className="w-52">
              <Botao
                variante="secundario"
                onClick={() =>
                  setResultado({
                    ok: false,
                    titulo: "Saldo insuficiente",
                    detalhe: "Disponível: 3 UN. Faça o ajuste por inventário antes de registrar.",
                  })
                }
              >
                Simular erro
              </Botao>
            </div>
          </div>
          <div className="relative h-72 max-w-md overflow-hidden rounded border border-grafite bg-carbono">
            <TelaResultado resultado={resultado} aoFechar={() => setResultado(null)} />
            {!resultado && (
              <div className="flex h-full items-center justify-center font-corpo text-sm text-bruma-luz">
                Clique em um botão acima
              </div>
            )}
          </div>
        </Secao>
      </div>
    </div>
  );
}
