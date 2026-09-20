import { redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/sessao";
import { logout } from "@/actions/logout";
import { AbasOperacao } from "./AbasOperacao";

export default async function LayoutOperacao({ children }: { children: React.ReactNode }) {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");

  return (
    <div className="min-h-screen bg-nevoa">
      <div className="flex justify-center p-4 sm:p-6">
        <div className="w-full max-w-[480px] overflow-hidden rounded-lg border border-grafite shadow-lg">
          <div className="flex min-h-[calc(100vh-32px)] flex-col bg-carbono sm:min-h-[calc(100vh-48px)]">
            <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-grafite bg-aco px-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-2 rounded-sm bg-petroleo-claro" />
                <span className="font-display text-[17px] font-bold text-white">
                  Stock<span className="text-petroleo-claro">Manager</span>
                </span>
              </div>
              <form action={logout}>
                <button type="submit" className="font-dado text-xs text-bruma-luz hover:text-white">
                  {usuario.nome.split(" ")[0]} · Sair
                </button>
              </form>
            </div>

            <AbasOperacao />

            <div className="flex flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
