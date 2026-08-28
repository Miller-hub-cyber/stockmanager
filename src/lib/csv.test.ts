import { describe, expect, it } from "vitest";
import { paraCsv } from "./csv";

describe("paraCsv", () => {
  const colunas = [
    { chave: "sku", rotulo: "SKU" },
    { chave: "nome", rotulo: "Item" },
  ];

  it("usa ponto e virgula como separador (Excel pt-BR usa virgula decimal)", () => {
    const csv = paraCsv([{ sku: "FLT-0042", nome: "Filtro" }], colunas);
    expect(csv).toContain("SKU;Item");
    expect(csv).toContain("FLT-0042;Filtro");
  });

  it("comeca com BOM UTF-8 para acento nao corromper no Excel", () => {
    const csv = paraCsv([{ sku: "FLT-0042", nome: "Filtro" }], colunas);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("escapa valor que contem ponto e virgula entre aspas", () => {
    const csv = paraCsv([{ sku: "A;B", nome: "x" }], colunas);
    expect(csv).toContain('"A;B"');
  });

  it("escapa aspas duplicando-as dentro do campo entre aspas", () => {
    const csv = paraCsv([{ sku: 'A"B', nome: "x" }], colunas);
    expect(csv).toContain('"A""B"');
  });

  it("trata valor nulo como campo vazio", () => {
    const csv = paraCsv([{ sku: "FLT-0042", nome: null }], colunas);
    expect(csv).toContain("FLT-0042;");
  });
});
