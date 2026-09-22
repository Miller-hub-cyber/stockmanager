import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarFornecedor } from "@/actions/desativarFornecedor";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao, BotaoConfirmar, PontoEstado } from "@/components/ui";
import { cores } from "@/lib/tokens";

export default async function PaginaFornecedores() {
  const supabase = createClient();
  const { data: fornecedores } = await supabase
    .from("fornecedores")
    .select("id, nome, telefone, email, prazo_entrega_dias, ativo")
    .order("nome");
  const lista = fornecedores ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Fornecedores</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Origem das entradas de estoque.</p>
        </div>
        <div className="w-48">
          <Botao href="/gestao/cadastros/fornecedores/novo">Novo fornecedor</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhum fornecedor cadastrado.{" "}
          <Link href="/gestao/cadastros/fornecedores/novo" className="text-petroleo hover:underline">
            Cadastre o primeiro
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho>Nome</TabelaCelula>
            <TabelaCelula cabecalho className="w-[150px] flex-none">
              Contato
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[120px] flex-none">
              Prazo entrega
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[100px] flex-none">
              Status
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="w-[180px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((fornecedor) => (
            <TabelaLinha key={fornecedor.id}>
              <TabelaCelula>{fornecedor.nome}</TabelaCelula>
              <TabelaCelula className="w-[150px] flex-none text-bruma-texto">
                {fornecedor.telefone ?? fornecedor.email ?? "—"}
              </TabelaCelula>
              <TabelaCelula align="direita" mono className="w-[120px] flex-none">
                {fornecedor.prazo_entrega_dias} dias
              </TabelaCelula>
              <TabelaCelula align="direita" className="w-[100px] flex-none">
                <PontoEstado
                  cor={fornecedor.ativo ? cores.musgo : cores.bruma}
                  texto={fornecedor.ativo ? "Ativo" : "Inativo"}
                  estado={fornecedor.ativo ? "normal" : "inativo"}
                />
              </TabelaCelula>
              <TabelaCelula align="direita" className="w-[180px] flex-none">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/gestao/cadastros/fornecedores/${fornecedor.id}`}
                    className="font-corpo text-sm text-petroleo hover:underline"
                  >
                    Editar
                  </Link>
                  {fornecedor.ativo && (
                    <form action={desativarFornecedor.bind(null, fornecedor.id)}>
                      <BotaoConfirmar mensagem={`Desativar o fornecedor "${fornecedor.nome}"?`}>
                        Desativar
                      </BotaoConfirmar>
                    </form>
                  )}
                </div>
              </TabelaCelula>
            </TabelaLinha>
          ))}
        </Tabela>
      )}
    </main>
  );
}
