"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { esquemaVeiculo } from "@/lib/validacao";
import { exigirGestorOuAdmin, inserirRegistro, type ResultadoAcao } from "@/lib/acoes-cadastro";

export async function criarVeiculo(_estado: ResultadoAcao, formData: FormData): Promise<ResultadoAcao> {
  const acesso = await exigirGestorOuAdmin();
  if ("erro" in acesso) return { sucesso: false, erro: acesso.erro };

  const validado = esquemaVeiculo.safeParse({
    placa: formData.get("placa"),
    modelo: formData.get("modelo"),
    ano: formData.get("ano"),
    kmAtual: formData.get("kmAtual"),
  });
  if (!validado.success) {
    return { sucesso: false, erro: validado.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const resultado = await inserirRegistro("veiculos", {
    empresa_id: acesso.empresaId,
    placa: validado.data.placa.toUpperCase(),
    modelo: validado.data.modelo ?? null,
    ano: validado.data.ano ?? null,
    km_atual: validado.data.kmAtual,
  });
  if (!resultado.sucesso) return resultado;
  revalidatePath("/gestao/cadastros/veiculos");
  redirect("/gestao/cadastros/veiculos");
}
