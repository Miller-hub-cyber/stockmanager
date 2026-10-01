import { describe, expect, it } from "vitest";
import { filtrosParaQuery, lerFiltros, padraoContem, rotuloTipo } from "./relatorio-movimentacoes";

const UUID = "3f2b8c1e-9a4d-4b6e-8f0a-1c2d3e4f5a6b";

describe("lerFiltros", () => {
  it("aceita datas e ids validos", () => {
    expect(lerFiltros({ de: "2026-09-01", ate: "2026-09-23", veiculoId: UUID })).toEqual({
      de: "2026-09-01",
      ate: "2026-09-23",
      veiculoId: UUID,
    });
  });

  it("ignora valores invalidos em vez de quebrar", () => {
    expect(lerFiltros({ de: "ontem", veiculoId: "abc" })).toEqual({
      de: undefined,
      ate: undefined,
      veiculoId: undefined,
    });
  });
});

describe("padraoContem", () => {
  it("escapa curingas do LIKE", () => {
    expect(padraoContem("12212")).toBe("%12212%");
    expect(padraoContem("10%_\\")).toBe("%10\\%\\_\\\\%");
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
