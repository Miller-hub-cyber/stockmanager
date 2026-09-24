import { describe, expect, it } from "vitest";
import { filtrosParaQuery, lerFiltros, padraoContem, rotuloTipo } from "./relatorio-movimentacoes";

const UUID = "3f2b8c1e-9a4d-4b6e-8f0a-1c2d3e4f5a6b";

describe("lerFiltros", () => {
  it("aceita datas e ids validos", () => {
    expect(lerFiltros({ de: "2026-09-01", ate: "2026-09-23", veiculoId: UUID, funcionarioId: UUID })).toEqual({
      de: "2026-09-01",
      ate: "2026-09-23",
      veiculoId: UUID,
      funcionarioId: UUID,
    });
  });

  it("ignora valores invalidos em vez de quebrar", () => {
    expect(lerFiltros({ de: "ontem", veiculoId: "abc", funcionarioId: ["x", "y"] })).toEqual({
      de: undefined,
      ate: undefined,
      veiculoId: undefined,
      funcionarioId: undefined,
    });
  });
});

describe("filtro de OS", () => {
  it("le o numero da OS aparado e ignora vazio", () => {
    expect(lerFiltros({ numeroOs: "  12212 " }).numeroOs).toBe("12212");
    expect(lerFiltros({ numeroOs: "   " }).numeroOs).toBeUndefined();
    expect(lerFiltros({ numeroOs: ["a", "b"] }).numeroOs).toBeUndefined();
  });

  it("escapa curingas do LIKE", () => {
    expect(padraoContem("12212")).toBe("%12212%");
    expect(padraoContem("10%_\\")).toBe("%10\\%\\_\\\\%");
  });

  it("repassa a OS para a exportacao", () => {
    expect(filtrosParaQuery({ numeroOs: "12212" })).toBe("numeroOs=12212");
  });
});

describe("filtrosParaQuery", () => {
  it("omite filtros vazios", () => {
    expect(filtrosParaQuery({ de: "2026-09-01", veiculoId: undefined })).toBe("de=2026-09-01");
    expect(filtrosParaQuery({})).toBe("");
  });
});

describe("rotuloTipo", () => {
  it("marca estornos e movimentacoes estornadas", () => {
    expect(rotuloTipo({ tipo: "entrada", estorno_de: null, estornada: false })).toBe("Entrada");
    expect(rotuloTipo({ tipo: "saida", estorno_de: null, estornada: true })).toBe("Saída (estornada)");
    expect(rotuloTipo({ tipo: "entrada", estorno_de: UUID, estornada: false })).toBe("Estorno");
  });
});
