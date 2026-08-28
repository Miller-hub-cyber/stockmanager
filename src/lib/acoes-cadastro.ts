import { createClient } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/formato";
import { obterUsuarioAtual } from "@/lib/sessao";
import type { Database } from "@/types/database";

export interface ResultadoAcao {
  sucesso: boolean;
  erro?: string;
}

type TabelaCadastro =
  | "categorias"
  | "depositos"
  | "centros_custo"
  | "funcionarios"
  | "fornecedores"
  | "veiculos"
  | "itens";

/**
 * So cadastro pode ser alterado por admin ou gestor (CLAUDE.md). O RLS ja
 * bloqueia no banco; isto e so pra dar um erro claro em vez de deixar a
 * Server Action tentar e traduzir uma rejeicao generica de RLS.
 */
export async function exigirGestorOuAdmin(): Promise<{ empresaId: string } | { erro: string }> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) return { erro: "Sessao expirada. Faca login novamente." };
  if (usuario.perfil !== "admin" && usuario.perfil !== "gestor") {
    return { erro: "Voce nao tem permissao para esta acao." };
  }
  return { empresaId: usuario.empresaId };
}

export async function inserirRegistro<T extends TabelaCadastro>(
  tabela: T,
  dados: Database["public"]["Tables"][T]["Insert"]
): Promise<ResultadoAcao> {
  const supabase = createClient();
  // A uniao de tabelas nao deixa o insert generico tipar o parametro certo
  // sozinho; cada Server Action que chama isto ja valida o formato real.
  const { error } = await supabase.from(tabela).insert(dados as never);
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}

export async function atualizarRegistro<T extends TabelaCadastro>(
  tabela: T,
  id: string,
  dados: Database["public"]["Tables"][T]["Update"]
): Promise<ResultadoAcao> {
  const supabase = createClient();
  const { error } = await supabase
    .from(tabela)
    .update(dados as never)
    .eq("id" as never, id);
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}

export async function desativarRegistro(tabela: TabelaCadastro, id: string): Promise<ResultadoAcao> {
  const supabase = createClient();
  const { error } = await supabase
    .from(tabela)
    .update({ ativo: false } as never)
    .eq("id" as never, id);
  if (error) return { sucesso: false, erro: traduzirErro(error.message) };
  return { sucesso: true };
}
