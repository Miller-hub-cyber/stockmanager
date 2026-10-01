import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/sessao";
import { logout } from "@/actions/logout";
import { Logo } from "@/components/Logo";
import { MenuLateral } from "./MenuLateral";

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
          <div className="truncate font-corpo text-xs text-white">{usuario.nome}</div>
          <div className="truncate font-dado text-[11px] uppercase text-bruma-texto">{usuario.perfil}</div>
          <form action={logout} className="mt-2">
            <button type="submit" className="font-corpo text-xs text-bruma-texto hover:text-white">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
