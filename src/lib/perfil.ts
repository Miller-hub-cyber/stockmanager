import type { Database } from "@/types/database";

export type PerfilUsuario = Database["public"]["Enums"]["perfil_usuario"];

/** Para onde o usuario vai depois do login, conforme CLAUDE.md secao 7. */
export function destinoPorPerfil(perfil: PerfilUsuario): string {
  if (perfil === "admin" || perfil === "gestor") return "/gestao";
  if (perfil === "consulta") return "/operacao/consulta";
  return "/operacao/saida";
}
