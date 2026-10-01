import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PerfilUsuario } from "@/lib/perfil";

export interface UsuarioAtual {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

/**
 * Usuario autenticado + seu perfil, ja resolvidos contra `usuarios`.
 * `cache` deduplica por requisicao: layout e pagina chamam juntos e o
 * Supabase e consultado uma vez so.
 */
export const obterUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, empresa_id, nome, email, perfil")
    .eq("id", user.id)
    .single();
  if (!usuario) return null;

  return {
    id: usuario.id,
    empresaId: usuario.empresa_id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };
});
