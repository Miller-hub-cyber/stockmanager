import { z } from "zod";

/** Campo de texto opcional: string vazia do form vira `undefined` (nao grava valor). */
const opcional = (max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().max(max).optional());

export const esquemaLogin = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail invalido"),
  senha: z.string().min(6, "A senha precisa ter no minimo 6 caracteres"),
});

export const esquemaSaida = z.object({
  itemId: z.string().uuid(),
  depositoId: z.string().uuid(),
  quantidade: z.coerce.number().positive("Informe uma quantidade maior que zero"),
  centroCustoId: z.string().uuid().nullable().optional(),
  veiculoId: z.string().uuid().nullable().optional(),
  funcionarioId: z.string().uuid().nullable().optional(),
  kmVeiculo: z.coerce.number().nonnegative().nullable().optional(),
  motivo: z.string().max(200).optional(),
}).refine(
  (d) => Boolean(d.centroCustoId || d.veiculoId || d.funcionarioId),
  { message: "Toda saida precisa de um destino: veiculo, setor ou funcionario." }
);

export const esquemaEntrada = z.object({
  itemId: z.string().uuid(),
  depositoId: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  custoUnitario: z.coerce.number().nonnegative(),
  fornecedorId: z.string().uuid().nullable().optional(),
  numeroNf: z.string().max(60).optional(),
});

export const esquemaItem = z.object({
  sku: z.string().min(2, "Informe o SKU").max(40),
  nome: z.string().min(3, "Informe o nome do item").max(160),
  descricao: opcional(500),
  unidade: z.string().min(1, "Informe a unidade").max(6),
  tipo: z.enum(["peca", "consumivel", "epi", "ferramenta", "pneu", "lubrificante", "outro"]),
  estoqueMinimo: z.coerce.number().nonnegative(),
  pontoPedido: z.coerce.number().nonnegative(),
  categoriaId: z.string().uuid().nullable().optional(),
  fornecedorId: z.string().uuid().nullable().optional(),
  codigoBarras: opcional(64),
});

export const esquemaCategoria = z.object({
  nome: z.string().min(2, "Informe o nome da categoria").max(80),
});

export const esquemaDeposito = z.object({
  nome: z.string().min(2, "Informe o nome do deposito").max(120),
  descricao: opcional(300),
});

export const esquemaCentroCusto = z.object({
  nome: z.string().min(2, "Informe o nome do centro de custo").max(120),
  codigo: opcional(20),
});

export const esquemaFuncionario = z.object({
  nome: z.string().min(2, "Informe o nome do funcionario").max(120),
  matricula: opcional(30),
  funcao: opcional(80),
});

export const esquemaFornecedor = z.object({
  nome: z.string().min(2, "Informe o nome do fornecedor").max(160),
  cnpj: opcional(20),
  telefone: opcional(20),
  email: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email("E-mail invalido").optional()
  ),
  endereco: opcional(200),
  prazoEntregaDias: z.coerce.number().int().nonnegative().default(7),
});

/** Aceita numero com virgula decimal (padrao pt-BR/Excel) alem de ponto. */
const numeroPtBr = () =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.replace(",", ".") : v),
    z.coerce.number().nonnegative("Numero invalido")
  );

export const esquemaLinhaImportacaoItem = z.object({
  sku: z.string().min(1, "SKU obrigatorio").max(40),
  nome: z.string().min(1, "Nome obrigatorio").max(160),
  unidade: z.string().min(1, "Unidade obrigatoria").max(6),
  tipo: z.preprocess(
    (v) => (v === "" || v === undefined ? "consumivel" : v),
    z.enum(["peca", "consumivel", "epi", "ferramenta", "pneu", "lubrificante", "outro"], {
      errorMap: () => ({ message: "Tipo invalido" }),
    })
  ),
  categoria: opcional(80),
  fornecedor: opcional(160),
  estoqueMinimo: numeroPtBr(),
  pontoPedido: numeroPtBr(),
  codigoBarras: opcional(64),
  saldoInicial: numeroPtBr(),
  custoInicial: numeroPtBr(),
});

export const esquemaVeiculo = z.object({
  placa: z.string().min(5, "Informe a placa").max(10),
  modelo: opcional(80),
  ano: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.coerce.number().int().min(1950).max(2100).optional()
  ),
  kmAtual: z.coerce.number().nonnegative().default(0),
});
