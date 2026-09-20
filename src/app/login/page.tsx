import type { Metadata } from "next";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = {
  title: "Entrar — StockManager",
};

export default function PaginaLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-carbono p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            Stock<span className="text-petroleo-claro">Manager</span>
          </h1>
          <p className="mt-2 font-corpo text-sm text-bruma-luz">Controle inteligente de estoque</p>
        </div>
        <FormularioLogin />
      </div>
    </main>
  );
}
