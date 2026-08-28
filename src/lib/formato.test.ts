import { describe, expect, it } from "vitest";
import { brl, quantidade, mesAno, traduzirErro, traduzirErroAuth } from "./formato";

describe("brl", () => {
  it("formata numero como moeda brasileira", () => {
    // normaliza espaco: Intl usa NBSP (U+00A0) entre "R$" e o valor.
    expect(brl(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});

describe("quantidade", () => {
  it("formata numero com ate 3 casas decimais, sem forcar zeros", () => {
    expect(quantidade(12)).toBe("12");
    expect(quantidade(12.5)).toBe("12,5");
  });
});

describe("mesAno", () => {
  it("converte data truncada ao mes em rotulo pt-BR", () => {
    expect(mesAno("2026-08-01")).toMatch(/ago.*2026/i);
  });
});

describe("traduzirErro", () => {
  it("traduz SALDO_INSUFICIENTE extraindo o disponivel", () => {
    const mensagem = traduzirErro("SALDO_INSUFICIENTE: disponivel 3, solicitado 10");
    expect(mensagem).toContain("Saldo insuficiente");
    expect(mensagem).toContain("3");
  });

  it("traduz MOVIMENTACAO_IMUTAVEL", () => {
    expect(traduzirErro("MOVIMENTACAO_IMUTAVEL: registre um estorno")).toContain("estorno");
  });

  it("traduz violacao de unique constraint de SKU com mensagem especifica", () => {
    const mensagem = traduzirErro(
      'duplicate key value violates unique constraint "itens_empresa_id_sku_key"'
    );
    expect(mensagem).toContain("SKU");
  });

  it("traduz violacao de unique constraint generica quando nao reconhece a coluna", () => {
    const mensagem = traduzirErro('duplicate key value violates unique constraint "outra_tabela_key"');
    expect(mensagem).toContain("Ja existe");
  });

  it("cai no fallback generico para mensagem desconhecida", () => {
    expect(traduzirErro("erro totalmente desconhecido")).toBe("Nao foi possivel concluir. Tente novamente.");
  });
});

describe("traduzirErroAuth", () => {
  it("traduz credenciais invalidas", () => {
    expect(traduzirErroAuth("Invalid login credentials")).toContain("incorretos");
  });

  it("traduz falha de rede", () => {
    expect(traduzirErroAuth("fetch failed")).toContain("conexao");
  });

  it("cai no fallback generico para mensagem desconhecida", () => {
    expect(traduzirErroAuth("erro desconhecido do provedor")).toBe("Nao foi possivel entrar. Tente novamente.");
  });
});
