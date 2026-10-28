import { describe, expect, it } from "vitest";
import {
  esquemaSaida,
  esquemaEntrada,
  esquemaItem,
  esquemaLogin,
  esquemaFornecedor,
  esquemaVeiculo,
  esquemaDeposito,
  esquemaConvite,
  esquemaPrimeiroAcesso,
} from "./validacao";

const ITEM_ID = "11111111-1111-1111-1111-111111111111";
const DEPOSITO_ID = "22222222-2222-2222-2222-222222222222";
const VEICULO_ID = "33333333-3333-3333-3333-333333333333";

describe("esquemaSaida", () => {
  it("rejeita saida sem nenhum destino (regra central do sistema)", () => {
    const resultado = esquemaSaida.safeParse({
      itemId: ITEM_ID,
      depositoId: DEPOSITO_ID,
      quantidade: 5,
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain("destino");
    }
  });

  it("aceita saida com veiculo como destino", () => {
    const resultado = esquemaSaida.safeParse({
      itemId: ITEM_ID,
      depositoId: DEPOSITO_ID,
      quantidade: 5,
      veiculoId: VEICULO_ID,
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita quantidade zero ou negativa", () => {
    const resultado = esquemaSaida.safeParse({
      itemId: ITEM_ID,
      depositoId: DEPOSITO_ID,
      quantidade: 0,
      veiculoId: VEICULO_ID,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita itemId que nao e uuid", () => {
    const resultado = esquemaSaida.safeParse({
      itemId: "nao-e-um-uuid",
      depositoId: DEPOSITO_ID,
      quantidade: 5,
      veiculoId: VEICULO_ID,
    });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaEntrada", () => {
  it("aceita entrada sem fornecedor nem nota fiscal (ambos opcionais)", () => {
    const resultado = esquemaEntrada.safeParse({
      itemId: ITEM_ID,
      depositoId: DEPOSITO_ID,
      quantidade: 10,
      custoUnitario: 5.5,
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita custo unitario negativo", () => {
    const resultado = esquemaEntrada.safeParse({
      itemId: ITEM_ID,
      depositoId: DEPOSITO_ID,
      quantidade: 10,
      custoUnitario: -1,
    });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaItem", () => {
  const dadosValidos = {
    sku: "FLT-0042",
    nome: "Filtro de óleo",
    unidade: "UN",
    tipo: "peca",
    estoqueMinimo: 8,
    pontoPedido: 15,
  };

  it("aceita item minimo valido", () => {
    expect(esquemaItem.safeParse(dadosValidos).success).toBe(true);
  });

  it("rejeita tipo fora do enum", () => {
    const resultado = esquemaItem.safeParse({ ...dadosValidos, tipo: "invalido" });
    expect(resultado.success).toBe(false);
  });

  it("campo opcional vazio vira undefined, nao string vazia", () => {
    const resultado = esquemaItem.safeParse({ ...dadosValidos, descricao: "" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.descricao).toBeUndefined();
    }
  });

  it("aceita NCM com pontos e grava so os 8 digitos", () => {
    const resultado = esquemaItem.safeParse({ ...dadosValidos, ncm: "8421.23.00" });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.ncm).toBe("84212300");
  });

  it("NCM vazio vira undefined e NCM incompleto e rejeitado", () => {
    const vazio = esquemaItem.safeParse({ ...dadosValidos, ncm: "" });
    expect(vazio.success && vazio.data.ncm).toBeUndefined();
    expect(esquemaItem.safeParse({ ...dadosValidos, ncm: "8421" }).success).toBe(false);
  });
});

describe("esquemaLogin", () => {
  it("rejeita e-mail invalido", () => {
    expect(esquemaLogin.safeParse({ email: "nao-e-email", senha: "123456" }).success).toBe(false);
  });

  it("rejeita senha curta", () => {
    expect(esquemaLogin.safeParse({ email: "a@b.com", senha: "123" }).success).toBe(false);
  });

  it("aceita credenciais validas", () => {
    expect(esquemaLogin.safeParse({ email: "a@b.com", senha: "123456" }).success).toBe(true);
  });
});

describe("esquemaFornecedor", () => {
  it("aplica prazo de entrega padrao de 7 dias quando omitido", () => {
    const resultado = esquemaFornecedor.safeParse({ nome: "Distribuidora Norte" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.prazoEntregaDias).toBe(7);
    }
  });

  it("rejeita e-mail invalido quando informado", () => {
    const resultado = esquemaFornecedor.safeParse({ nome: "Distribuidora Norte", email: "invalido" });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaVeiculo", () => {
  it("aplica km atual padrao de 0 quando omitido", () => {
    const resultado = esquemaVeiculo.safeParse({ placa: "RKN-2C41" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.kmAtual).toBe(0);
    }
  });

  it("rejeita ano fora do intervalo plausivel", () => {
    const resultado = esquemaVeiculo.safeParse({ placa: "RKN-2C41", ano: 1800 });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaDeposito", () => {
  it("exige nome com no minimo 2 caracteres", () => {
    expect(esquemaDeposito.safeParse({ nome: "A" }).success).toBe(false);
    expect(esquemaDeposito.safeParse({ nome: "Almoxarifado" }).success).toBe(true);
  });
});

describe("esquemaConvite", () => {
  it("normaliza e-mail para minusculas", () => {
    const r = esquemaConvite.safeParse({ nome: "Joao Silva", email: " Joao@Empresa.COM ", perfil: "almoxarife" });
    expect(r.success && r.data.email).toBe("joao@empresa.com");
  });

  it("rejeita perfil inexistente", () => {
    expect(esquemaConvite.safeParse({ nome: "Joao Silva", email: "j@e.com", perfil: "dono" }).success).toBe(false);
  });
});

describe("esquemaPrimeiroAcesso", () => {
  const base = { email: "j@e.com", codigo: "7f3a-9c21", senha: "segredo123", confirmacao: "segredo123" };

  it("aceita codigo com traco e minusculas e devolve so os 8 caracteres", () => {
    const r = esquemaPrimeiroAcesso.safeParse(base);
    expect(r.success && r.data.codigo).toBe("7F3A9C21");
  });

  it("rejeita codigo incompleto", () => {
    expect(esquemaPrimeiroAcesso.safeParse({ ...base, codigo: "7F3A" }).success).toBe(false);
  });

  it("rejeita senhas diferentes", () => {
    expect(esquemaPrimeiroAcesso.safeParse({ ...base, confirmacao: "outra1234" }).success).toBe(false);
  });
});
