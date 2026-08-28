import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioDeposito } from "../FormularioDeposito";

export default async function PaginaEditarDeposito({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: deposito } = await supabase
    .from("depositos")
    .select("id, nome, descricao")
    .eq("id", params.id)
    .single();

  if (!deposito) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Editar depósito</h1>
        <div className="mt-6">
          <FormularioDeposito deposito={deposito} />
        </div>
      </div>
    </main>
  );
}
