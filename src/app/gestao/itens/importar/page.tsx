import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormularioImportarItens } from "./FormularioImportarItens";

export default async function PaginaImportarItens() {
  const supabase = createClient();
  const { data: depositos } = await supabase.from("depositos").select("id, nome").eq("ativo", true).order("nome");

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-tela text-tinta">Importar itens</h1>
        <p className="mt-1 font-corpo text-sm text-bruma">
          Cadastra vários itens de uma vez a partir de uma planilha exportada como CSV.
        </p>

        <div className="mt-4 rounded border border-giz bg-white p-4 font-corpo text-sm text-bruma">
          <p>
            Baixe o{" "}
            <Link href="/gestao/itens/importar/modelo" className="text-petroleo hover:underline">
              modelo de planilha
            </Link>
            , preencha uma linha por item e envie o arquivo abaixo. Só SKU, Item e Unidade são
            obrigatórios — o resto pode ficar em branco. Categoria e Fornecedor são criados
            automaticamente se ainda não existirem. Se preencher Saldo inicial, o sistema lança uma
            entrada de estoque para o depósito escolhido abaixo.
          </p>
        </div>

        <div className="mt-6 max-w-lg">
          <FormularioImportarItens depositos={depositos ?? []} />
        </div>
      </div>
    </main>
  );
}
