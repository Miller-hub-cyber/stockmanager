import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const CAMINHOS_PUBLICOS = ["/login", "/design", "/manifest.json"];

/**
 * Supabase so esta utilizavel quando as duas variaveis publicas existem.
 * Sem elas `createServerClient` lanca excecao — e como o middleware roda em
 * toda requisicao, isso derrubaria o site inteiro com 500, inclusive /login.
 */
const SUPABASE_CONFIGURADO = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function ehCaminhoPublico(pathname: string): boolean {
  if (pathname.startsWith("/icons/")) return true;
  return CAMINHOS_PUBLICOS.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}

function redirecionarPara(request: NextRequest, pathname: string): NextResponse {
  const destino = request.nextUrl.clone();
  destino.pathname = pathname;
  return NextResponse.redirect(destino);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publico = ehCaminhoPublico(pathname);

  // Sem Supabase configurado nao ha sessao para renovar nem usuario para
  // checar. Deixa o que e publico passar e manda o resto para o login, em
  // vez de estourar 500 em toda rota. O login real continua dependendo de um
  // projeto Supabase valido — so a navegacao deixa de quebrar.
  if (!SUPABASE_CONFIGURADO) {
    return publico ? NextResponse.next() : redirecionarPara(request, "/login");
  }

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGravar: { name: string; value: string; options: CookieOptions }[]) {
          cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          cookiesParaGravar.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !publico) {
    return redirecionarPara(request, "/login");
  }

  if (user && pathname.startsWith("/login")) {
    return redirecionarPara(request, "/");
  }

  if (user && pathname.startsWith("/gestao")) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("id", user.id)
      .single();

    if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
      return redirecionarPara(request, "/operacao/saida");
    }
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
