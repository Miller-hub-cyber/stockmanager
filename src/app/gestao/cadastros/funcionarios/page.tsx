import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { desativarFuncionario } from "@/actions/desativarFuncionario";
import { Tabela, TabelaCabecalho, TabelaLinha, TabelaCelula, Botao, BotaoConfirmar, PontoEstado } from "@/components/ui";
import { cores } from "@/lib/tokens";

export default async function PaginaFuncionarios() {
  const supabase = createClient();
  const { data: funcionarios } = await supabase
    .from("funcionarios")
    .select("id, nome, matricula, funcao, ativo")
    .order("nome");
  const lista = funcionarios ?? [];

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-tela text-tinta">Funcionários</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Usados como destino de saída e ficha de EPI.</p>
        </div>
        <div className="w-48">
          <Botao href="/gestao/cadastros/funcionarios/novo">Novo funcionário</Botao>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded border border-giz bg-white p-8 text-center font-corpo text-sm text-bruma-texto">
          Nenhum funcionário cadastrado.{" "}
          <Link href="/gestao/cadastros/funcionarios/novo" className="text-petroleo hover:underline">
            Cadastre o primeiro
          </Link>
          .
        </div>
      ) : (
        <Tabela>
          <TabelaCabecalho>
            <TabelaCelula cabecalho>Nome</TabelaCelula>
            <TabelaCelula cabecalho mono className="max-w-[110px] flex-none">
              Matrícula
            </TabelaCelula>
            <TabelaCelula cabecalho className="max-w-[140px] flex-none">
              Função
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[100px] flex-none">
              Status
            </TabelaCelula>
            <TabelaCelula cabecalho align="direita" className="max-w-[180px] flex-none">
              Ações
            </TabelaCelula>
          </TabelaCabecalho>
          {lista.map((funcionario) => (
            <TabelaLinha key={funcionario.id}>
              <TabelaCelula>{funcionario.nome}</TabelaCelula>
              <TabelaCelula mono className="max-w-[110px] flex-none text-bruma-texto">
                {funcionario.matricula ?? "—"}
              </TabelaCelula>
              <TabelaCelula className="max-w-[140px] flex-none text-bruma-texto">
                {funcionario.funcao ?? "—"}
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[100px] flex-none">
                <PontoEstado
                  cor={funcionario.ativo ? cores.musgo : cores.bruma}
                  texto={funcionario.ativo ? "Ativo" : "Inativo"}
                  estado={funcionario.ativo ? "normal" : "inativo"}
                />
              </TabelaCelula>
              <TabelaCelula align="direita" className="max-w-[180px] flex-none">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/gestao/cadastros/funcionarios/${funcionario.id}`}
                    className="font-corpo text-sm text-petroleo hover:underline"
                  >
                    Editar
                  </Link>
                  {funcionario.ativo && (
                    <form action={desativarFuncionario.bind(null, funcionario.id)} className="w-24">
                      <BotaoConfirmar mensagem={`Desativar o funcionário "${funcionario.nome}"?`}>
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
