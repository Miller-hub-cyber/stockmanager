import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { obterUsuarioAtual } from "@/lib/sessao";
import { cancelarConvite } from "@/actions/cancelarConvite";
import { Aviso, BotaoConfirmar } from "@/components/ui";
import { data } from "@/lib/formato";
import { FormularioConvite } from "./FormularioConvite";
import { LinhaUsuario } from "./LinhaUsuario";
import { rotuloPerfil } from "./perfis";

export default async function PaginaUsuarios() {
  const atual = await obterUsuarioAtual();
  if (atual?.perfil !== "admin") {
    return (
      <main className="p-8">
        <h1 className="titulo-tela">Usuários</h1>
        <div className="mt-6 max-w-lg">
          <Aviso tipo="info" titulo="Somente o administrador gerencia usuários." />
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: usuarios }, { data: convites }] = await Promise.all([
    supabase.from("usuarios").select("id, nome, email, perfil, ativo").order("ativo", { ascending: false }).order("nome"),
    supabase
      .from("convites")
      .select("id, nome, email, perfil, expira_em")
      .is("usado_em", null)
      .is("cancelado_em", null)
      .gt("expira_em", new Date().toISOString())
      .order("criado_em", { ascending: false }),
  ]);

  // Endereco que vai na mensagem do convite: o mesmo pelo qual o admin esta acessando.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const enderecoApp = `${protocolo}://${host}`;

  const lista = usuarios ?? [];
  const pendentes = convites ?? [];

  return (
    <main className="p-6 sm:p-8">
      <h1 className="titulo-tela">Usuários</h1>
      <p className="mt-1 font-corpo text-sm text-bruma-texto">
        Quem acessa o sistema. Para liberar alguém, gere um convite e envie o código para a pessoa.
      </p>

      <div className="mt-7 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded border border-giz bg-white">
            <h2 className="border-b border-giz px-5 py-4 font-display text-base font-semibold text-tinta">
              Com acesso ({lista.filter((u) => u.ativo).length})
            </h2>
            {lista.map((u) => (
              <LinhaUsuario key={u.id} usuario={u} ehVoce={u.id === atual.id} />
            ))}
          </section>

          {pendentes.length > 0 && (
            <section className="rounded border border-giz bg-white">
              <h2 className="border-b border-giz px-5 py-4 font-display text-base font-semibold text-tinta">
                Convites aguardando ({pendentes.length})
              </h2>
              {pendentes.map((c) => (
                <div key={c.id} className="flex items-center gap-4 border-b border-giz px-5 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-corpo text-sm font-semibold text-tinta">{c.nome}</div>
                    <div className="font-corpo text-xs text-bruma-texto">
                      {c.email} · {rotuloPerfil(c.perfil)} · vale até {data(c.expira_em)}
                    </div>
                  </div>
                  <form action={cancelarConvite.bind(null, c.id)}>
                    <BotaoConfirmar mensagem={`Cancelar o convite de ${c.nome}? O código deixa de funcionar.`}>
                      Cancelar
                    </BotaoConfirmar>
                  </form>
                </div>
              ))}
              <p className="px-5 py-3 font-corpo text-xs text-bruma-texto">
                Perdeu o código? Gere um convite novo para o mesmo e-mail: o anterior é cancelado.
              </p>
            </section>
          )}
        </div>

        <section className="rounded border border-giz bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-tinta">Novo convite</h2>
          <FormularioConvite enderecoApp={enderecoApp} />
        </section>
      </div>
    </main>
  );
}
