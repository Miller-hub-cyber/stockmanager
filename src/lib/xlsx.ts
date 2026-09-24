import ExcelJS from "exceljs";

/**
 * Gerador de planilha .xlsx no padrao visual do modelo de controle de estoque:
 * faixa azul com o titulo, cabecalho azul-claro, celulas centralizadas com borda
 * fina, status colorido. So formatacao — quem chama entrega os dados prontos.
 */

export type TipoColuna = "texto" | "dataHora" | "moeda" | "numero";

export interface ColunaXlsx {
  rotulo: string;
  chave: string;
  /** Largura em caracteres. */
  largura: number;
  tipo?: TipoColuna;
  /** Colore a celula conforme o texto (ver ESTILO_STATUS). */
  status?: boolean;
}

export interface AbaXlsx {
  /** Nome da aba (maximo 31 caracteres, sem \ / ? * [ ] :). */
  nome: string;
  /** Titulo na faixa azul acima do cabecalho. */
  titulo: string;
  colunas: ColunaXlsx[];
  linhas: Record<string, string | number | Date | null>[];
}

const COR = {
  titulo: "FF0037E6",
  cabecalho: "FF4A86F7",
  texto: "FF1B1F5B",
  borda: "FFD9D9D9",
  branco: "FFFFFFFF",
};

const ESTILO_STATUS: Record<string, { fundo: string; texto: string }> = {
  "Estoque bom": { fundo: "FF38761D", texto: "FFD9EAD3" },
  Repor: { fundo: "FFE6B800", texto: "FF5C4600" },
  Crítico: { fundo: "FFF6B26B", texto: "FF7F3F00" },
  "Sem estoque": { fundo: "FFEA8B6B", texto: "FFB00000" },
};

const FORMATO: Record<TipoColuna, string | undefined> = {
  texto: undefined,
  dataHora: "dd/mm/yyyy hh:mm",
  moeda: '"R$" #,##0.00',
  numero: "#,##0.###",
};

const BORDA_FINA: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COR.borda } },
  left: { style: "thin", color: { argb: COR.borda } },
  bottom: { style: "thin", color: { argb: COR.borda } },
  right: { style: "thin", color: { argb: COR.borda } },
};

/**
 * O Excel guarda data sem fuso. Desloca de UTC para America/Belem (UTC-3, sem
 * horario de verao) para a planilha mostrar o horario local do registro.
 */
export function dataBelem(iso: string): Date {
  return new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
}

function preencherAba(planilha: ExcelJS.Workbook, aba: AbaXlsx) {
  const folha = planilha.addWorksheet(aba.nome, {
    views: [{ state: "frozen", ySplit: 2, showGridLines: false }],
  });
  const total = aba.colunas.length;

  folha.columns = aba.colunas.map((c) => ({ key: c.chave, width: c.largura }));

  // Linha 1: faixa do titulo, mesclada em toda a largura da tabela.
  folha.mergeCells(1, 1, 1, total);
  const titulo = folha.getCell(1, 1);
  titulo.value = aba.titulo;
  titulo.font = { name: "Arial", size: 12, bold: true, color: { argb: COR.branco } };
  titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.titulo } };
  titulo.alignment = { horizontal: "center", vertical: "middle" };
  folha.getRow(1).height = 26;

  // Linha 2: cabecalho das colunas.
  const cabecalho = folha.getRow(2);
  aba.colunas.forEach((c, i) => {
    const celula = cabecalho.getCell(i + 1);
    celula.value = c.rotulo;
    celula.font = { name: "Arial", size: 10, bold: true, color: { argb: COR.branco } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR.cabecalho } };
    celula.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    celula.border = BORDA_FINA;
  });
  cabecalho.height = 24;

  aba.linhas.forEach((linha, indice) => {
    const linhaExcel = folha.getRow(3 + indice);
    aba.colunas.forEach((c, i) => {
      const celula = linhaExcel.getCell(i + 1);
      const valor = linha[c.chave];
      celula.value = valor === undefined ? null : valor;
      celula.font = { name: "Arial", size: 10, color: { argb: COR.texto } };
      celula.alignment = { horizontal: "center", vertical: "middle" };
      celula.border = BORDA_FINA;

      const formato = FORMATO[c.tipo ?? "texto"];
      if (formato) celula.numFmt = formato;

      const estilo = c.status && typeof valor === "string" ? ESTILO_STATUS[valor] : undefined;
      if (estilo) {
        celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: estilo.fundo } };
        celula.font = { name: "Arial", size: 10, bold: true, color: { argb: estilo.texto } };
      }
    });
    linhaExcel.height = 20;
  });

  folha.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: total } };
}

export async function montarXlsx(abas: AbaXlsx[]): Promise<Uint8Array<ArrayBuffer>> {
  const planilha = new ExcelJS.Workbook();
  planilha.creator = "StockManager";
  abas.forEach((aba) => preencherAba(planilha, aba));
  return Uint8Array.from(new Uint8Array(await planilha.xlsx.writeBuffer()));
}

export function respostaXlsx(conteudo: Uint8Array<ArrayBuffer>, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
