import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const CAMINHOS_PUBLICOS = ["/login", "/design", "/prototipo", "/manifest.json"];

function ehCaminhoPublico(pathname: string): boolean {
  if (pathname.startsWith("/icons/")) return true;
  return CAMINHOS_PUBLICOS.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
  const publico = ehCaminhoPublico(pathname);

  if (!user && !publico) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    return NextResponse.redirect(destino);
  }

  if (user && pathname.startsWith("/login")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    return NextResponse.redirect(destino);
  }

  if (user && pathname.startsWith("/gestao")) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("perfil")
      .eq("id", user.id)
      .single();

    if (!usuario || !["admin", "gestor"].includes(usuario.perfil)) {
      const destino = request.nextUrl.clone();
      destino.pathname = "/operacao/saida";
      return NextResponse.redirect(destino);
    }
  }

  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
