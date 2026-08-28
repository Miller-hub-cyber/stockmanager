"use server";

import { createClient } from "@/lib/supabase/server";
import { esquemaSaida } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

export interface ResultadoMovimentacao {
  sucesso: boolean;
  erro?: string;
}

export async function registrarSaida(dados: unknown): Promise<ResultadoMovimentacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (!["admin", "gestor", "almoxarife"].includes(usuario.perfil)) {
    return { sucesso: false, erro: "Voce nao tem permissao para registrar saida." };
  }

  const validado = esquemaSaida.safeParse(dados);
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("movimentacoes").insert({
    empresa_id: usuario.empresaId,
    item_id: validado.data.itemId,
    deposito_id: validado.data.depositoId,
    tipo: "saida",
    quantidade: validado.data.quantidade,
    centro_custo_id: validado.data.centroCustoId ?? null,
    veiculo_id: validado.data.veiculoId ?? null,
    funcionario_id: validado.data.funcionarioId ?? null,
    km_veiculo: validado.data.kmVeiculo ?? null,
    motivo: validado.data.motivo ?? null,
    usuario_id: usuario.id,
  });

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}
