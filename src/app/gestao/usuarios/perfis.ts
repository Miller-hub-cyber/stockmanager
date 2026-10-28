import type { PerfilUsuario } from "@/lib/perfil";

/** Perfis na ordem em que aparecem nos seletores, com o que cada um pode fazer. */
export const PERFIS: { valor: PerfilUsuario; rotulo: string; descricao: string }[] = [
  { valor: "almoxarife", rotulo: "Almoxarife", descricao: "registra entradas e saídas no celular" },
  { valor: "gestor", rotulo: "Gestor", descricao: "cadastros, relatórios e compras" },
  { valor: "consulta", rotulo: "Consulta", descricao: "só consulta saldo" },
  { valor: "admin", rotulo: "Administrador", descricao: "tudo, inclusive usuários" },
];

export const rotuloPerfil = (perfil: PerfilUsuario) => PERFIS.find((p) => p.valor === perfil)?.rotulo ?? perfil;
