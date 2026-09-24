import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Botao, Campo, Seletor, Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula } from "@/components/ui";
import { brl, dataHora, quantidade } from "@/lib/formato";
import {
  buscarMovimentacoes,
  filtrosParaQuery,
  lerFiltros,
  rotuloTipo,
  type LinhaMovimentacao,
  type ModoRelatorio,
} from "@/lib/relatorio-movimentacoes";

const LIMITE_TELA = 500;

interface Coluna {
  rotulo: string;
  /** Classes de largura fixa (literais, para o Tailwind gerar); sem elas, a coluna divide o espaco que sobra. */
  largura?: string;
  direita?: boolean;
  mono?: boolean;
  suave?: boolean;
  valor: (l: LinhaMovimentacao) => string;
}

const dash = (v: string | null) => v ?? "—";

const COL_DATA: Coluna = { rotulo: "Data", largura: "w-[130px] flex-none", mono: true, suave: true, valor: (l) => dataHora(l.criado_em) };
const COL_ITEM: Coluna = { rotulo: "Item", valor: (l) => `${l.sku} · ${l.item}` };
const COL_QTD: Coluna = {
  rotulo: "Qtd",
  largura: "w-[90px] flex-none",
  direita: true,
  mono: true,
  valor: (l) => `${quantidade(l.quantidade)} ${l.unidade}`,
};
const COL_VALOR: Coluna = { rotulo: "Valor", largura: "w-[110px] flex-none", direita: true, mono: true, valor: (l) => brl(l.valor) };
const COL_OS: Coluna = { rotulo: "OS", largura: "w-[90px] flex-none", mono: true, valor: (l) => dash(l.numero_os) };
const COL_FROTA: Coluna = { rotulo: "Frota", largura: "w-[100px] flex-none", mono: true, valor: (l) => dash(l.placa) };
const COL_MECANICO: Coluna = { rotulo: "Colaborador", largura: "w-[140px] flex-none", suave: true, valor: (l) => dash(l.mecanico) };
const COL_SETOR: Coluna = { rotulo: "Centro de custo", largura: "w-[130px] flex-none", suave: true, valor: (l) => dash(l.centro_custo) };
const COL_USUARIO: Coluna = { rotulo: "Usuário", largura: "w-[110px] flex-none", suave: true, valor: (l) => dash(l.usuario) };

const COLUNAS: Record<ModoRelatorio, Coluna[]> = {
  entrada: [
    COL_DATA,
    COL_ITEM,
    COL_QTD,
    COL_VALOR,
    { rotulo: "Fornecedor", largura: "w-[140px] flex-none", suave: true, valor: (l) => dash(l.fornecedor) },
    { rotulo: "NF", largura: "w-[90px] flex-none", mono: true, valor: (l) => dash(l.numero_nf) },
    COL_OS,
    COL_FROTA,
    COL_MECANICO,
    COL_USUARIO,
  ],
  saida: [COL_DATA, COL_ITEM, COL_QTD, COL_VALOR, COL_OS, COL_FROTA, COL_MECANICO, COL_SETOR, COL_USUARIO],
  geral: [
    COL_DATA,
    { rotulo: "Tipo", largura: "w-[130px] flex-none", valor: (l) => rotuloTipo(l) },
    COL_ITEM,
    COL_QTD,
    COL_VALOR,
    COL_OS,
    COL_FROTA,
    COL_MECANICO,
    COL_SETOR,
    COL_USUARIO,
  ],
};

const TEXTO_VAZIO: Record<ModoRelatorio, string> = {
  entrada: "Nenhuma entrada encontrada para estes filtros.",
  saida: "Nenhuma saída encontrada para estes filtros.",
  geral: "Nenhuma movimentação encontrada para estes filtros.",
};

interface Props {
  modo: ModoRelatorio;
  titulo: string;
  descricao: string;
  /** Caminho da propria pagina, ex.: /gestao/relatorios/entradas (o CSV fica em /exportar). */
  rota: string;
  searchParams: { [chave: string]: string | string[] | undefined };
}

export async function RelatorioMovimentacoes({ modo, titulo, descricao, rota, searchParams }: Props) {
  const supabase = createClient();
  const filtros = lerFiltros(searchParams);

  let linhasBrutas: LinhaMovimentacao[] = [];
  let falhou = false;
  try {
    linhasBrutas = await buscarMovimentacoes(supabase, modo, filtros, 0, LIMITE_TELA + 1);
  } catch (erro) {
    console.error("Falha ao carregar relatorio", erro);
    falhou = true;
  }
  const [{ data: veiculos }, { data: funcionarios }] = await Promise.all([
    supabase.from("veiculos").select("id, placa").order("placa"),
    supabase.from("funcionarios").select("id, nome").order("nome"),
  ]);

  const cortado = linhasBrutas.length > LIMITE_TELA;
  const linhas = cortado ? linhasBrutas.slice(0, LIMITE_TELA) : linhasBrutas;
  const colunas = COLUNAS[modo];
  const query = filtrosParaQuery(filtros);
  const temFiltro = query !== "";

  // Totais so fazem sentido sobre o conjunto completo; com a lista cortada ficam de fora.
  const original = (l: LinhaMovimentacao) => !l.estorno_de && !l.estornada;
  const somar = (tipo: "entrada" | "saida") =>
    linhas.filter((l) => l.tipo === tipo && original(l)).reduce((soma, l) => soma + l.valor, 0);
  const resumo =
    modo === "geral"
      ? [
          { rotulo: "Movimentações", valor: String(linhas.length) },
          { rotulo: "Entradas", valor: brl(somar("entrada")) },
          { rotulo: "Saídas", valor: brl(somar("saida")) },
        ]
      : [
          { rotulo: modo === "entrada" ? "Entradas" : "Saídas", valor: String(linhas.length) },
          { rotulo: "Valor total", valor: brl(linhas.reduce((soma, l) => soma + l.valor, 0)) },
        ];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">{titulo}</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">{descricao}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Botao href={`${rota}/exportar?${[query, "formato=xlsx"].filter(Boolean).join("&")}`} variante="secundario">
              Exportar Excel
            </Botao>
          </div>
          <div className="w-28">
            <Botao href={`${rota}/exportar${query ? `?${query}` : ""}`} variante="secundario">
              CSV
            </Botao>
          </div>
        </div>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Campo id="de" name="de" type="date" rotulo="De" defaultValue={filtros.de ?? ""} />
        </div>
        <div className="w-40">
          <Campo id="ate" name="ate" type="date" rotulo="Até" defaultValue={filtros.ate ?? ""} />
        </div>
        <div className="w-44">
          <Seletor id="veiculoId" name="veiculoId" rotulo="Frota" defaultValue={filtros.veiculoId ?? ""}>
            <option value="">Todas</option>
            {(veiculos ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa}
              </option>
            ))}
          </Seletor>
        </div>
        <div className="w-52">
          <Seletor
            id="funcionarioId"
            name="funcionarioId"
            rotulo="Colaborador"
            defaultValue={filtros.funcionarioId ?? ""}
          >
            <option value="">Todos</option>
            {(funcionarios ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Seletor>
        </div>
        <div className="w-36">
          <Campo id="numeroOs" name="numeroOs" rotulo="OS" placeholder="Ex.: 12212" maxLength={40} defaultValue={filtros.numeroOs ?? ""} />
        </div>
        <div className="w-28">
          <Botao type="submit" variante="secundario">
            Filtrar
          </Botao>
        </div>
        {temFiltro && (
          <Link href={rota} className="pb-3 font-corpo text-sm text-bruma-texto underline">
            Limpar
          </Link>
        )}
      </form>

      {!cortado && linhas.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
          {resumo.map(({ rotulo, valor }) => (
            <div key={rotulo}>
              <dt className="font-display text-rotulo uppercase text-bruma-texto">{rotulo}</dt>
              <dd className="font-dado text-base text-tinta">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {cortado && (
        <p className="mt-5 font-corpo text-sm text-bruma-texto">
          Mostrando as {LIMITE_TELA} mais recentes. Use os filtros ou exporte o CSV para ver todas.
        </p>
      )}

      <div className="mt-6">
        {falhou ? (
          <div className="rounded border border-carmim bg-white p-8 text-center font-corpo text-sm text-carmim-texto">
            Não foi possível carregar o relatório. Tente novamente; se continuar, avise o suporte.
          </div>
        ) : linhas.length === 0 ? (
          <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
            {TEXTO_VAZIO[modo]}
          </div>
        ) : (
          <Tabela>
            <TabelaCabecalho>
              {colunas.map((c) => (
                <TabelaCelula
                  key={c.rotulo}
                  cabecalho
                  align={c.direita ? "direita" : "esquerda"}
                  className={c.largura}
                >
                  {c.rotulo}
                </TabelaCelula>
              ))}
            </TabelaCabecalho>
            {linhas.map((l) => (
              <TabelaLinha key={l.id}>
                {colunas.map((c) => (
                  <TabelaCelula
                    key={c.rotulo}
                    mono={c.mono}
                    align={c.direita ? "direita" : "esquerda"}
                    className={[c.largura, c.suave ? "text-bruma-texto" : ""]
                      .filter(Boolean)
                      .join(" ") || undefined}
                  >
                    {c.valor(l)}
                  </TabelaCelula>
                ))}
              </TabelaLinha>
            ))}
          </Tabela>
        )}
      </div>
    </main>
  );
}
