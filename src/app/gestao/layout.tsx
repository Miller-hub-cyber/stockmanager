import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/sessao";
import { logout } from "@/actions/logout";
import { Logo } from "@/components/Logo";
import { MenuLateral } from "./MenuLateral";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const ultima = partes.length > 1 ? partes[partes.length - 1] : "";
  return `${partes[0]?.[0] ?? ""}${ultima[0] ?? ""}`.toUpperCase();
}

export default async function LayoutGestao({ children }: { children: React.ReactNode }) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className="flex min-h-screen bg-nevoa">
      <aside className="flex w-[210px] flex-shrink-0 flex-col bg-aco">
        <div className="flex h-14 flex-shrink-0 items-center border-b border-grafite px-4">
          <Logo className="h-7 text-aco" />
        </div>

        <MenuLateral />

        <div className="mt-auto border-t border-grafite p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-laranja font-display text-xs font-bold text-aco">
              {iniciais(usuario.nome)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-corpo text-xs font-semibold text-white">{usuario.nome}</div>
              <div className="truncate font-dado text-[11px] uppercase text-laranja">{usuario.perfil}</div>
            </div>
          </div>
          <form action={logout} className="mt-2">
            <button type="submit" className="font-corpo text-xs text-bruma-luz hover:text-white">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1 [&>*]:animate-entrada">{children}</div>
    </div>
  );
}
