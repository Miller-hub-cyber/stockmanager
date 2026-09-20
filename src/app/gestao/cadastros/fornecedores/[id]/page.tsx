import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioFornecedor } from "../FormularioFornecedor";
import { brl, quantidade, data as formatarData } from "@/lib/formato";

export default async function PaginaEditarFornecedor({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: fornecedor }, { data: documentos }] = await Promise.all([
    supabase
      .from("fornecedores")
      .select("id, nome, cnpj, telefone, email, endereco, prazo_entrega_dias")
      .eq("id", params.id)
      .single(),
    supabase
      .from("documentos")
      .select("id, numero_nf, data")
      .eq("fornecedor_id", params.id)
      .order("data", { ascending: false })
      .limit(10),
  ]);

  if (!fornecedor) notFound();

  const idsDocumentos = (documentos ?? []).map((d) => d.id);
  const { data: entradas } =
    idsDocumentos.length > 0
      ? await supabase
          .from("movimentacoes")
          .select("id, item_id, quantidade, custo_unitario, documento_id")
          .in("documento_id", idsDocumentos)
      : { data: [] as { id: string; item_id: string; quantidade: number; custo_unitario: number; documento_id: string | null }[] };

  const idsItens = Array.from(new Set((entradas ?? []).map((e) => e.item_id)));
  const { data: itensNomes } =
    idsItens.length > 0
      ? await supabase.from("itens").select("id, nome, unidade").in("id", idsItens)
      : { data: [] as { id: string; nome: string; unidade: string }[] };
  const mapaItens = new Map((itensNomes ?? []).map((i) => [i.id, i]));
  const mapaDocumentos = new Map((documentos ?? []).map((d) => [d.id, d]));

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-tela text-tinta">{fornecedor.nome}</h1>

        <div className="mt-6">
          <span className="font-display text-rotulo uppercase text-bruma-texto">Últimas entradas</span>
          <div className="mt-2 flex flex-col gap-2">
            {(entradas ?? []).length === 0 && (
              <p className="rounded border border-giz bg-white p-4 font-corpo text-sm text-bruma-texto">
                Nenhuma entrada com nota fiscal registrada para este fornecedor ainda.
              </p>
            )}
            {(entradas ?? []).map((e) => {
              const item = mapaItens.get(e.item_id);
              const documento = e.documento_id ? mapaDocumentos.get(e.documento_id) : null;
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded border border-giz bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-corpo text-sm text-tinta">{item?.nome ?? "Item"}</div>
                    <div className="font-dado text-xs text-bruma-texto">
                      {quantidade(e.quantidade)} {item?.unidade}
                      {documento?.numero_nf ? ` · NF ${documento.numero_nf}` : ""}
                      {documento?.data ? ` · ${formatarData(documento.data)}` : ""}
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-dado text-sm text-tinta">
                    {brl(e.quantidade * e.custo_unitario)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h2 className="mt-8 font-display text-lg font-semibold text-tinta">Editar cadastro</h2>
        <div className="mt-4 max-w-lg">
          <FormularioFornecedor fornecedor={fornecedor} />
        </div>
      </div>
    </main>
  );
}
