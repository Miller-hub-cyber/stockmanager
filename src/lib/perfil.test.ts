import { describe, expect, it } from "vitest";
import { destinoPorPerfil } from "./perfil";

describe("destinoPorPerfil", () => {
  it("admin e gestor vao para /gestao", () => {
    expect(destinoPorPerfil("admin")).toBe("/gestao");
    expect(destinoPorPerfil("gestor")).toBe("/gestao");
  });

  it("almoxarife vai para /operacao/saida", () => {
    expect(destinoPorPerfil("almoxarife")).toBe("/operacao/saida");
  });

  it("consulta vai para /operacao/consulta", () => {
    expect(destinoPorPerfil("consulta")).toBe("/operacao/consulta");
  });
});
