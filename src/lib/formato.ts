export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const quantidade = (n: number) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export const dataHora = (d: string | Date) =>
  new Date(d).toLocaleString("pt-BR", { timeZone: "America/Belem", dateStyle: "short", timeStyle: "short" });

export const data = (d: string | Date) =>
  new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Belem" });

/** Recebe uma data truncada ao mes (ex.: "2026-08-01") e devolve "ago/2026". */
export const mesAno = (dataIso: string) =>
  new Date(`${dataIso}T00:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");

/**
 * Traduz o erro do Postgres para mensagem util na interface.
 * Os codigos vem das excecoes definidas em 0002_triggers.sql.
 */
export function traduzirErro(mensagem: string): string {
  if (mensagem.includes("SALDO_INSUFICIENTE")) {
    const m = mensagem.match(/disponivel ([\d.,]+)/i);
    return `Saldo insuficiente${m ? `. Disponivel: ${m[1]}` : ""}. Faca o ajuste por inventario antes de registrar.`;
  }
  if (mensagem.includes("MOVIMENTACAO_IMUTAVEL"))
    return "Movimentacao nao pode ser alterada. Registre um estorno.";
  if (mensagem.includes("MOVIMENTACAO_JA_ESTORNADA"))
    return "Esta movimentacao ja foi estornada.";
  if (mensagem.includes("saida_exige_destino"))
    return "Toda saida precisa de um destino: veiculo, setor ou funcionario.";
  if (mensagem.includes("SALDO_DERIVADO"))
    return "O saldo resulta das movimentacoes e nao pode ser editado.";
  if (mensagem.includes("PLACA_INVALIDA"))
    return "Informe o numero da frota ou placa.";
  if (mensagem.includes("NOME_INVALIDO"))
    return "Informe o nome do mecanico.";
  if (mensagem.includes("SEM_PERMISSAO"))
    return "Voce nao tem permissao para esta acao.";
  if (mensagem.includes("duplicate key value violates unique constraint")) {
    if (mensagem.includes("itens_empresa_id_sku_key")) return "Ja existe um item cadastrado com esse SKU.";
    if (mensagem.includes("veiculos_empresa_id_placa_key"))
      return "Ja existe um veiculo cadastrado com essa placa.";
    return "Ja existe um registro cadastrado com esses dados.";
  }
  if (mensagem.includes("violates foreign key constraint"))
    return "Referencia invalida. Verifique os dados selecionados.";
  if (mensagem.includes("violates row-level security policy"))
    return "Voce nao tem permissao para esta acao.";
  return "Nao foi possivel concluir. Tente novamente.";
}

/** Traduz o erro do Supabase Auth para mensagem util na tela de login. */
export function traduzirErroAuth(mensagem: string): string {
  if (mensagem.includes("Invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (mensagem.includes("Email not confirmed"))
    return "E-mail ainda nao confirmado. Verifique sua caixa de entrada.";
  if (mensagem.includes("User not found"))
    return "E-mail ou senha incorretos.";
  if (mensagem.includes("Too many requests"))
    return "Muitas tentativas seguidas. Aguarde um momento antes de tentar de novo.";
  if (mensagem.includes("fetch failed") || mensagem.includes("network"))
    return "Sem conexao com o servidor. Verifique sua internet e tente novamente.";
  return "Nao foi possivel entrar. Tente novamente.";
}
