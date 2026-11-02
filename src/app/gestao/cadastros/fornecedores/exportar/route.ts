import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { paraCsv, respostaCsv } from "@/lib/csv";

/** Telefone fica so na planilha: a tela de fornecedores mostra apenas o nome. */
export async function GET() {
  const usuario = await obterUsuarioAtual();
  if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = await createClient();
  const { data: fornecedores } = await supabase
    .from("fornecedores")
    .select("nome, telefone")
    .eq("ativo", true)
    .order("nome");

  const csv = paraCsv(
    (fornecedores ?? []).map((f) => ({ nome: f.nome, telefone: f.telefone ?? "" })),
    [
      { chave: "nome", rotulo: "Fornecedor" },
      { chave: "telefone", rotulo: "Telefone" },
    ]
  );

  return respostaCsv(csv, "fornecedores.csv");
}
