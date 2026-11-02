import type { Database } from "@/types/database";

export type PerfilUsuario = Database["public"]["Enums"]["perfil_usuario"];

export const PERFIS: { valor: PerfilUsuario; rotulo: string }[] = [
  { valor: "admin", rotulo: "Administrador" },
  { valor: "gestor", rotulo: "Gestor" },
  { valor: "almoxarife", rotulo: "Almoxarife" },
  { valor: "consulta", rotulo: "Consulta" },
];

export function rotuloPerfil(perfil: PerfilUsuario): string {
  return PERFIS.find((p) => p.valor === perfil)?.rotulo ?? perfil;
}

/** Para onde o usuario vai depois do login, conforme CLAUDE.md secao 7. */
export function destinoPorPerfil(perfil: PerfilUsuario): string {
  if (perfil === "admin" || perfil === "gestor") return "/gestao";
  if (perfil === "consulta") return "/operacao/consulta";
  return "/operacao/saida";
}
