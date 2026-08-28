import { describe, expect, it } from "vitest";
import { estadoItem, cores } from "./tokens";

describe("estadoItem", () => {
  it("classifica saldo zero ou negativo como Esgotado", () => {
    expect(estadoItem(0, 8, 15)).toEqual({ cor: cores.carmim, texto: "Esgotado" });
  });

  it("classifica saldo no minimo ou abaixo como Abaixo do minimo", () => {
    expect(estadoItem(8, 8, 15)).toEqual({ cor: cores.ambar, texto: "Abaixo do minimo" });
    expect(estadoItem(3, 8, 15)).toEqual({ cor: cores.ambar, texto: "Abaixo do minimo" });
  });

  it("classifica saldo entre o minimo e o ponto de pedido como Repor", () => {
    expect(estadoItem(10, 8, 15)).toEqual({ cor: cores.ambar, texto: "Repor" });
  });

  it("classifica saldo acima do ponto de pedido como Normal", () => {
    expect(estadoItem(20, 8, 15)).toEqual({ cor: cores.musgo, texto: "Normal" });
  });
});
