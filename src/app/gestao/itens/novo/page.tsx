import { createClient } from "@/lib/supabase/server";
import { FormularioItem } from "../FormularioItem";

export default async function PaginaNovoItem() {
  const supabase = createClient();
  const [{ data: categorias }, { data: fornecedores }] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-tela text-tinta">Novo item</h1>
        <div className="mt-6">
          <FormularioItem categorias={categorias ?? []} fornecedores={fornecedores ?? []} />
        </div>
      </div>
    </main>
  );
}
