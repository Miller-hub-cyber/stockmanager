import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FormularioPrimeiroAcesso } from "./FormularioPrimeiroAcesso";

export const metadata: Metadata = {
  title: "Primeiro acesso — StockManager",
};

export default function PaginaPrimeiroAcesso() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-carbono p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-3">
          <Logo comSubtitulo className="mx-auto block h-14 text-carbono" />
        </h1>
        <p className="mb-8 text-center font-corpo text-sm text-bruma-luz">
          Use o código de convite que o administrador te enviou.
        </p>
        <FormularioPrimeiroAcesso />
      </div>
    </main>
  );
}
