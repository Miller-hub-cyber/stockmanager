import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioCategoria } from "../FormularioCategoria";

export default async function PaginaEditarCategoria({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!categoria) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Editar categoria</h1>
        <div className="mt-6">
          <FormularioCategoria categoria={categoria} />
        </div>
      </div>
    </main>
  );
}
