import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = {
  title: "Entrar — StockManager",
};

export default function PaginaLogin() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-carbono p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8">
          <Logo comSubtitulo className="mx-auto block h-14 text-carbono" />
        </h1>
        <FormularioLogin />
      </div>
    </main>
  );
}
