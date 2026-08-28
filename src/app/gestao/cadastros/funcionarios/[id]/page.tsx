import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioFuncionario } from "../FormularioFuncionario";

export default async function PaginaEditarFuncionario({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("id, nome, matricula, funcao")
    .eq("id", params.id)
    .single();

  if (!funcionario) notFound();

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-tela text-tinta">Editar funcionário</h1>
        <div className="mt-6">
          <FormularioFuncionario funcionario={funcionario} />
        </div>
      </div>
    </main>
  );
}
