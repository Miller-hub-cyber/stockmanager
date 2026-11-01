import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

interface Cenario {
  logado: boolean;
  usuario: { perfil: string; ativo: boolean } | null;
}

const cenario: Cenario = { logado: true, usuario: null };
const signOut = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _chave: string,
    opcoes: { cookies: { setAll: (c: { name: string; value: string; options: object }[]) => void } }
  ) => ({
    auth: {
      getUser: async () => ({ data: { user: cenario.logado ? { id: "u1" } : null } }),
      signOut: async () => {
        signOut();
        opcoes.cookies.setAll([{ name: "sb-token", value: "", options: { maxAge: 0 } }]);
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: cenario.usuario }) }),
      }),
    }),
  }),
}));

async function acessar(caminho: string) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://teste.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave");
  const { proxy } = await import("./proxy");
  return proxy(new NextRequest(new URL(caminho, "http://localhost")));
}

const destino = (r: Response) => r.headers.get("location")?.replace("http://localhost", "") ?? null;

describe("proxy", () => {
  beforeEach(() => {
    signOut.mockClear();
    cenario.logado = true;
    cenario.usuario = null;
  });

  it("manda para o login quem nao tem sessao", async () => {
    cenario.logado = false;
    expect(destino(await acessar("/gestao"))).toBe("/login");
  });

  it("encerra a sessao do usuario desativado e limpa o cookie", async () => {
    cenario.usuario = { perfil: "almoxarife", ativo: false };
    const resposta = await acessar("/operacao/saida");
    expect(signOut).toHaveBeenCalledOnce();
    expect(destino(resposta)).toBe("/login");
    expect(resposta.headers.get("set-cookie")).toContain("sb-token=");
  });

  it("deixa o usuario ativo seguir na operacao sem encerrar a sessao", async () => {
    cenario.usuario = { perfil: "almoxarife", ativo: true };
    expect(destino(await acessar("/operacao/saida"))).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("tira o almoxarife da gestao", async () => {
    cenario.usuario = { perfil: "almoxarife", ativo: true };
    expect(destino(await acessar("/gestao"))).toBe("/operacao/saida");
  });

  it("deixa o gestor entrar na gestao", async () => {
    cenario.usuario = { perfil: "gestor", ativo: true };
    expect(destino(await acessar("/gestao"))).toBeNull();
  });
});
