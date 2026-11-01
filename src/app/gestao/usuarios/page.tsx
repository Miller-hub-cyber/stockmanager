import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { Tabela, TabelaCabecalho, TabelaCelula } from "@/components/ui";
import { FormularioUsuario } from "./FormularioUsuario";
import { LinhaUsuario } from "./LinhaUsuario";

export default async function PaginaUsuarios() {
  const atual = await obterUsuarioAtual();
  if (!atual) redirect("/login");
  if (atual.perfil !== "admin") redirect("/gestao");

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, ativo")
    .order("nome");

  return (
    <main className="min-h-screen bg-nevoa p-8">
      <div className="mb-6">
        <h1 className="titulo-tela">Usuários</h1>
        <p className="mt-1 font-corpo text-sm text-bruma-texto">
          Quem acessa o sistema e o que cada pessoa pode fazer.
        </p>
      </div>

      <section className="mb-6 rounded border border-giz bg-white p-6">
        <h2 className="font-display text-sm font-semibold text-tinta">Liberar acesso</h2>
        <p className="mb-4 mt-1 font-corpo text-sm text-bruma-texto">
          Crie o login em Authentication → Users no painel do Supabase, com senha e Auto Confirm, e
          informe o mesmo e-mail aqui.
        </p>
        <FormularioUsuario />
      </section>

      <Tabela>
        <TabelaCabecalho>
          <TabelaCelula cabecalho>Nome</TabelaCelula>
          <TabelaCelula cabecalho>E-mail</TabelaCelula>
          <TabelaCelula cabecalho className="w-[300px] flex-none">
            Perfil
          </TabelaCelula>
          <TabelaCelula cabecalho align="direita" className="w-[100px] flex-none">
            Status
          </TabelaCelula>
          <TabelaCelula cabecalho align="direita" className="w-[120px] flex-none">
            Ações
          </TabelaCelula>
        </TabelaCabecalho>
        {(usuarios ?? []).map((usuario) => (
          <LinhaUsuario key={usuario.id} usuario={usuario} proprio={usuario.id === atual.id} />
        ))}
      </Tabela>
    </main>
  );
}
