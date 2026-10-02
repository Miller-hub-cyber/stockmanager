import { describe, expect, it } from "vitest";
import { descreverMeses, descreverPeriodo, inicioDoMes, resolverPeriodo, somarDias } from "./periodo";
import { ehChaveRelatorio, rotaExportacao, rotaRelatorio } from "./relatorios";

const HOJE = "2026-10-02";

describe("somarDias", () => {
  it("atravessa mes, ano e fevereiro bissexto", () => {
    expect(somarDias(HOJE, -6)).toBe("2026-09-26");
    expect(somarDias("2026-01-03", -5)).toBe("2025-12-29");
    expect(somarDias("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("inicioDoMes", () => {
  it("trunca a data no dia 1", () => {
    expect(inicioDoMes("2026-09-17")).toBe("2026-09-01");
  });
});

describe("resolverPeriodo", () => {
  it("usa os ultimos 30 dias, contando hoje, quando nada vem na URL", () => {
    expect(resolverPeriodo({}, HOJE)).toEqual({ opcao: "30d", de: "2026-09-03", ate: HOJE });
  });

  it("calcula 7 dias e o ano corrente", () => {
    expect(resolverPeriodo({ periodo: "7d" }, HOJE)).toEqual({ opcao: "7d", de: "2026-09-26", ate: HOJE });
    expect(resolverPeriodo({ periodo: "ano" }, HOJE)).toEqual({ opcao: "ano", de: "2026-01-01", ate: HOJE });
  });

  it("no personalizado le de/ate e ignora data invalida", () => {
    expect(resolverPeriodo({ periodo: "personalizado", de: "2026-08-01", ate: "31/08/2026" }, HOJE)).toEqual({
      opcao: "personalizado",
      de: "2026-08-01",
      ate: undefined,
    });
  });

  it("ignora de/ate da URL quando o periodo nao e personalizado", () => {
    expect(resolverPeriodo({ periodo: "7d", de: "2020-01-01" }, HOJE).de).toBe("2026-09-26");
  });

  it("cai no padrao com opcao desconhecida", () => {
    expect(resolverPeriodo({ periodo: "90d" }, HOJE).opcao).toBe("30d");
  });
});

describe("descreverPeriodo", () => {
  it("omite o ano do inicio quando e o mesmo do fim", () => {
    expect(descreverPeriodo("2026-09-03", HOJE)).toBe("03/09 a 02/10/2026");
    expect(descreverPeriodo("2025-12-15", "2026-01-10")).toBe("15/12/2025 a 10/01/2026");
  });

  it("descreve dia unico, limites abertos e ausencia de periodo", () => {
    expect(descreverPeriodo(HOJE, HOJE)).toBe("02/10/2026");
    expect(descreverPeriodo("2026-09-03", null)).toBe("desde 03/09/2026");
    expect(descreverPeriodo(null, HOJE)).toBe("até 02/10/2026");
    expect(descreverPeriodo()).toBe("todo o período");
  });
});

describe("descreverMeses", () => {
  it("converte o periodo nos meses que ele toca", () => {
    expect(descreverMeses("2026-09-03", HOJE)).toBe("de set/2026 a out/2026");
    expect(descreverMeses("2025-12-15", "2026-01-10")).toBe("de dez/2025 a jan/2026");
    expect(descreverMeses("2026-10-01", HOJE)).toBe("em out/2026");
    expect(descreverMeses("2026-09-03")).toBe("desde set/2026");
    expect(descreverMeses()).toBe("em todos os meses");
  });
});

describe("rotas de relatorio", () => {
  it("monta a querystring so com os filtros presentes", () => {
    expect(rotaRelatorio("entradas", { de: "2026-09-03", ate: HOJE })).toBe(
      "/gestao/relatorios/entradas?de=2026-09-03&ate=2026-10-02"
    );
    expect(rotaExportacao("valor-estoque")).toBe("/gestao/relatorios/valor-estoque/exportar");
    expect(rotaExportacao("geral", { formato: "xlsx", veiculoId: null })).toBe(
      "/gestao/relatorios/geral/exportar?formato=xlsx"
    );
  });

  it("reconhece so as chaves do catalogo", () => {
    expect(ehChaveRelatorio("kardex")).toBe(true);
    expect(ehChaveRelatorio("toString")).toBe(false);
  });
});
