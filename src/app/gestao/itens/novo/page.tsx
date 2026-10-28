import { createClient } from "@/lib/supabase/server";
import { FormularioItem } from "../FormularioItem";

export default async function PaginaNovoItem() {
  const supabase = createClient();
  const [{ data: categorias }, { data: fornecedores }, { data: catalogo }] = await Promise.all([
    supabase.from("categorias").select("id, nome").order("nome"),
    supabase.from("fornecedores").select("id, nome").eq("ativo", true).order("nome"),
    // ~300 linhas: cabe inteiro e a busca roda no navegador, sem ida ao servidor por tecla.
    supabase.from("catalogo_itens").select("nome, grupo, tipo, unidade, ncm").order("nome"),
  ]);

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="titulo-tela">Novo item</h1>
        <div className="mt-6">
          <FormularioItem
            categorias={categorias ?? []}
            fornecedores={fornecedores ?? []}
            catalogo={catalogo ?? []}
          />
        </div>
      </div>
    </main>
  );
}
