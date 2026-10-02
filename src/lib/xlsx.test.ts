import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { dataBelem, montarXlsx, type AbaXlsx } from "./xlsx";
import { abaConsumoCentro, abaFornecedores, abaItensParados, abaKardex } from "./relatorio-xlsx";

async function abrir(abas: AbaXlsx[]) {
  const planilha = new ExcelJS.Workbook();
  await planilha.xlsx.load((await montarXlsx(abas)) as unknown as ExcelJS.Buffer); // o tipo Buffer do exceljs e anterior ao Uint8Array<ArrayBuffer>
  return planilha;
}

const aba: AbaXlsx = {
  nome: "Estoque Geral",
  titulo: "Estoque Geral",
  colunas: [
    { chave: "sku", rotulo: "Código do Produto", largura: 18 },
    { chave: "data", rotulo: "Data", largura: 17, tipo: "dataHora" },
    { chave: "valor", rotulo: "Valor", largura: 14, tipo: "moeda" },
    { chave: "status", rotulo: "Status", largura: 16, status: true },
  ],
  linhas: [
    { sku: "101", data: dataBelem("2026-09-23T02:30:00Z"), valor: 120, status: "Estoque bom" },
    { sku: "103", data: null, valor: 0, status: "Sem estoque" },
  ],
};

describe("montarXlsx", () => {
  it("monta faixa de titulo, cabecalho e linhas no padrao do modelo", async () => {
    const folha = (await abrir([aba])).getWorksheet("Estoque Geral")!;

    expect(folha.getCell("A1").value).toBe("Estoque Geral");
    expect(folha.getCell("A1").fill).toMatchObject({ fgColor: { argb: "FF0037E6" } });
    expect(folha.getCell("A2").value).toBe("Código do Produto");
    expect(folha.getCell("A2").fill).toMatchObject({ fgColor: { argb: "FF4A86F7" } });
    expect(folha.getCell("A3").value).toBe("101");
    expect(folha.getCell("C3").numFmt).toBe('"R$" #,##0.00');
    expect(folha.getCell("C3").value).toBe(120);
  });

  it("colore o status conforme o texto", async () => {
    const folha = (await abrir([aba])).getWorksheet("Estoque Geral")!;
    expect(folha.getCell("D3").fill).toMatchObject({ fgColor: { argb: "FF38761D" } });
    expect(folha.getCell("D4").fill).toMatchObject({ fgColor: { argb: "FFEA8B6B" } });
  });

  it("aceita aba sem linhas", async () => {
    const folha = (await abrir([{ ...aba, linhas: [] }])).getWorksheet("Estoque Geral")!;
    expect(folha.getCell("A2").value).toBe("Código do Produto");
    expect(folha.getCell("A3").value).toBeNull();
  });
});

describe("dataBelem", () => {
  it("mostra o horario de Belem: 02:30Z vira 23:30 do dia anterior", () => {
    const d = dataBelem("2026-09-23T02:30:00Z");
    expect(d.toISOString()).toBe("2026-09-22T23:30:00.000Z");
  });
});

describe("abas dos demais relatorios", () => {
  it("itens parados: data sem hora e 'Nunca' para item que nunca saiu", async () => {
    const aba = abaItensParados([
      { sku: "P1", nome: "Filtro", saldo: 3, valor_parado: 90, ultima_saida: "2026-05-10T15:00:00Z", dias_sem_saida: 145 },
      { sku: "P2", nome: "Correia", saldo: 1, valor_parado: 40, ultima_saida: null, dias_sem_saida: null },
    ]);
    const folha = (await abrir([aba])).getWorksheet("Itens parados")!;
    expect(folha.getCell("E3").numFmt).toBe("dd/mm/yyyy");
    expect(folha.getCell("E4").value).toBe("Nunca");
    expect(folha.getCell("D3").value).toBe(90);
  });

  it("consumo por centro: valor numerico em moeda, nao texto", async () => {
    const aba = abaConsumoCentro([{ centro_custo: "Oficina", mes: "2026-09-01", custo_total: 1234.5 }]);
    const folha = (await abrir([aba])).getWorksheet("Consumo por centro de custo")!;
    expect(folha.getCell("C3").value).toBe(1234.5);
    expect(folha.getCell("C3").numFmt).toBe('"R$" #,##0.00');
  });

  it("kardex leva o item na faixa de titulo", () => {
    expect(abaKardex([], { sku: "F-10", nome: "Filtro de óleo" }).titulo).toBe("Kardex — F-10 · Filtro de óleo");
    expect(abaKardex([]).titulo).toBe("Kardex");
  });
});

describe("abaFornecedores", () => {
  const base = { cnpj: null, telefone: null, email: null, endereco: null, prazo_entrega_dias: 7, ativo: true, empresa_id: "e" };

  it("gera uma linha por item fornecido e mantem fornecedor sem item", () => {
    const { linhas } = abaFornecedores(
      [
        { ...base, id: "f1", nome: "Fornecedor A" },
        { ...base, id: "f2", nome: "Fornecedor B" },
      ],
      [
        { fornecedor_id: "f1", nome: "Filtro de óleo" },
        { fornecedor_id: "f1", nome: "Pastilha de freio" },
      ]
    );
    expect(linhas.map((l) => [l.empresa, l.item])).toEqual([
      ["Fornecedor A", "Filtro de óleo"],
      ["Fornecedor A", "Pastilha de freio"],
      ["Fornecedor B", null],
    ]);
  });
});
