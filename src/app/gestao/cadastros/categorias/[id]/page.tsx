import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioCategoria } from "../FormularioCategoria";

export default async function PaginaEditarCategoria(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!categoria) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="titulo-tela">Editar categoria</h1>
        <div className="mt-6">
          <FormularioCategoria categoria={categoria} />
        </div>
      </div>
    </main>
  );
}
