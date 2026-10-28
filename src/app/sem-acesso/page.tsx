import type { Metadata } from "next";
import { logout } from "@/actions/logout";
import { Logo } from "@/components/Logo";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";

export const metadata: Metadata = {
  title: "Sem acesso — StockManager",
};

/**
 * Conta logada no Supabase Auth sem linha ativa em `usuarios` (desativada
 * ou criada sem convite). Fica fora de "/" para nao entrar em loop com o
 * redirecionamento do login.
 */
export default function PaginaSemAcesso() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-carbono p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1>
          <Logo comSubtitulo className="mx-auto block h-14 text-carbono" />
        </h1>
        <Aviso tipo="alerta" titulo="Seu acesso não está liberado" escuro>
          Sua conta foi desativada ou ainda não foi vinculada à empresa. Fale com o administrador do sistema.
        </Aviso>
        <form action={logout}>
          <Botao type="submit" variante="secundario" tamanho="grande" escuro>
            Sair
          </Botao>
        </form>
      </div>
    </main>
  );
}
