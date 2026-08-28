import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioCentroCusto } from "../FormularioCentroCusto";

export default async function PaginaEditarCentroCusto({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: centro } = await supabase
    .from("centros_custo")
    .select("id, nome, codigo")
    .eq("id", params.id)
    .single();

  if (!centro) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Editar centro de custo</h1>
        <div className="mt-6">
          <FormularioCentroCusto centro={centro} />
        </div>
      </div>
    </main>
  );
}
