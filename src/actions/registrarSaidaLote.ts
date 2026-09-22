"use server";

import { createClient } from "@/lib/supabase/server";
import { esquemaSaidaLote } from "@/lib/validacao";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";

export interface ResultadoMovimentacao {
  sucesso: boolean;
  erro?: string;
}

/** Registra varios itens na mesma saida: mesmo destino (veiculo/centro/funcionario) para todas as linhas. */
export async function registrarSaidaLote(dados: unknown): Promise<ResultadoMovimentacao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { sucesso: false, erro: "Sessao expirada. Faca login novamente." };
  if (!["admin", "gestor", "almoxarife"].includes(usuario.perfil)) {
    return { sucesso: false, erro: "Voce nao tem permissao para registrar saida." };
  }

  const validado = esquemaSaidaLote.safeParse(dados);
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const supabase = createClient();

  // Frota digitada na hora (ainda sem cadastro): resolve para um veiculo_id de
  // verdade via funcao security definer, ja que almoxarife nao tem INSERT direto
  // em veiculos (ver 0004_rls.sql e 0009_veiculo_por_placa.sql).
  let veiculoId = validado.data.veiculoId ?? null;
  if (!veiculoId && validado.data.veiculoPlaca) {
    const { data: veiculoResolvido, error: erroVeiculo } = await supabase.rpc("fn_obter_ou_criar_veiculo", {
      p_placa: validado.data.veiculoPlaca,
    });
    if (erroVeiculo || !veiculoResolvido) {
      return { sucesso: false, erro: traduzirErro(erroVeiculo?.message ?? "") };
    }
    veiculoId = veiculoResolvido;
  }

  // Nome do mecanico digitado na hora (ainda sem cadastro): mesma logica da placa acima.
  let funcionarioId = validado.data.funcionarioId ?? null;
  if (!funcionarioId && validado.data.funcionarioNome) {
    const { data: funcionarioResolvido, error: erroFuncionario } = await supabase.rpc(
      "fn_obter_ou_criar_funcionario",
      { p_nome: validado.data.funcionarioNome }
    );
    if (erroFuncionario || !funcionarioResolvido) {
      return { sucesso: false, erro: traduzirErro(erroFuncionario?.message ?? "") };
    }
    funcionarioId = funcionarioResolvido;
  }

  const linhas = validado.data.itens.map((item) => ({
    empresa_id: usuario.empresaId,
    item_id: item.itemId,
    deposito_id: validado.data.depositoId,
    tipo: "saida" as const,
    quantidade: item.quantidade,
    centro_custo_id: validado.data.centroCustoId ?? null,
    veiculo_id: veiculoId,
    funcionario_id: funcionarioId,
    km_veiculo: validado.data.kmVeiculo ?? null,
    motivo: validado.data.motivo ?? null,
    usuario_id: usuario.id,
  }));

  const { error } = await supabase.from("movimentacoes").insert(linhas);

  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}
