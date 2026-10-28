import { describe, expect, it } from "vitest";
import { filtrarCatalogo, normalizar, type EntradaCatalogo } from "./catalogo";

const entrada = (nome: string): EntradaCatalogo => ({
  nome,
  grupo: "Filtros",
  tipo: "peca",
  unidade: "UN",
  ncm: null,
});

const catalogo = [
  entrada("Filtro de óleo do motor"),
  entrada("Filtro de combustível"),
  entrada("Óleo de motor 15W40"),
  entrada("Pastilha de freio dianteira"),
];

describe("normalizar", () => {
  it("remove acento e caixa", () => {
    expect(normalizar("  Óleo HIDRÁULICO ")).toBe("oleo hidraulico");
  });
});

describe("filtrarCatalogo", () => {
  it("ignora acento no que foi digitado", () => {
    expect(filtrarCatalogo(catalogo, "combustivel").map((e) => e.nome)).toEqual(["Filtro de combustível"]);
  });

  it("casa palavras em qualquer ordem", () => {
    expect(filtrarCatalogo(catalogo, "oleo filtro").map((e) => e.nome)).toEqual(["Filtro de óleo do motor"]);
  });

  it("prioriza nome que comeca com o texto digitado", () => {
    expect(filtrarCatalogo(catalogo, "oleo").map((e) => e.nome)).toEqual([
      "Óleo de motor 15W40",
      "Filtro de óleo do motor",
    ]);
  });

  it("nao sugere nada com menos de 2 letras", () => {
    expect(filtrarCatalogo(catalogo, "f")).toEqual([]);
    expect(filtrarCatalogo(catalogo, "   ")).toEqual([]);
  });

  it("respeita o limite", () => {
    expect(filtrarCatalogo(catalogo, "de", 2)).toHaveLength(2);
  });
});
