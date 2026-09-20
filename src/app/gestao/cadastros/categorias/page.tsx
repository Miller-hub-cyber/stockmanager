import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao } from "@/components/ui";

export default async function PaginaCategorias() {
  const supabase = createClient();
  const { data: categorias } = await supabase.from("categorias").select("id, nome").order("nome");
  const lista = categorias ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Categorias</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Agrupam os itens do estoque.</p>
        </div>
        <div className="w-40">
          <Botao href="/gestao/cadastros/categorias/novo">Nova categoria</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhuma categoria cadastrada.{" "}
          <Link href="/gestao/cadastros/categorias/novo" className="text-petroleo hover:underline">
            Cadastre a primeira
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho>Nome</TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((categoria) => (
            <TabelaLinha key={categoria.id}>
              <TabelaCelula>{categoria.nome}</TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[100px] flex-none">
                <Link
                  href={`/gestao/cadastros/categorias/${categoria.id}`}
                  className="font-corpo text-sm text-petroleo hover:underline"
                >
                  Editar
                </Link>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </Tabela>
      )}
    </main>
  );
}
