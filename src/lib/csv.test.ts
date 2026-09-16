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

  it("neutraliza campo que comeca com = + - ou @ para nao virar formula no Excel", () => {
    const csv = paraCsv(
      [
        { sku: "A", nome: "=CMD('/c calc')" },
        { sku: "B", nome: "+1+1" },
        { sku: "C", nome: "-1+1" },
        { sku: "D", nome: "@SUM(A1)" },
      ],
      colunas
    );
    expect(csv).toContain("A;'=CMD('/c calc')");
    expect(csv).toContain("B;'+1+1");
    expect(csv).toContain("C;'-1+1");
    expect(csv).toContain("D;'@SUM(A1)");
  });
});
