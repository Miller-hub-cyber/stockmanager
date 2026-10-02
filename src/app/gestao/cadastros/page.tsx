import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CircleAlert, Factory, FolderTree, Package, Plus, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BuscaCadastros, type RegistroBusca } from "./BuscaCadastros";

interface CartaoCadastro {
  rota: string;
  titulo: string;
  descricao: string;
  icone: ReactNode;
  /** Registros ativos; `null` quando a consulta falhou. */
  total: number | null;
  rodape: string;
  /** Nenhum registro, nem inativo: o cartão vira convite para o primeiro cadastro. */
  semRegistros: boolean;
  /** Texto do estado vazio ("Nenhum veículo ainda"). */
  vazio: string;
}

interface Pendencia {
  destaque: string;
  texto: string;
  efeito: string;
  href: string;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Ativos no número grande; inativos no rodapé (exclusão não existe, só `ativo = false`). */
function contagem<T extends { ativo: boolean }>(linhas: T[] | null) {
  if (!linhas) return { total: null, rodape: "Não foi possível carregar", semRegistros: false };
  const inativos = linhas.filter((l) => !l.ativo).length;
  return {
    total: linhas.length - inativos,
    rodape: inativos ? plural(inativos, "inativo", "inativos") : "Todos ativos",
    semRegistros: linhas.length === 0,
  };
}

export default async function PaginaCadastros() {
  const supabase = createClient();

  const [categorias, depositos, fornecedores, centros, veiculos, itensSemCategoria, itensComCategoria] =
    await Promise.all([
      supabase.from("categorias").select("id, nome").order("nome"),
      supabase.from("depositos").select("id, nome, descricao, ativo").order("nome"),
      supabase.from("fornecedores").select("id, nome, cnpj, ativo").order("nome"),
      supabase.from("centros_custo").select("id, nome, codigo, ativo").order("nome"),
      supabase.from("veiculos").select("id, placa, modelo, ativo").order("placa"),
      supabase.from("itens").select("id", { count: "exact", head: true }).eq("ativo", true).is("categoria_id", null),
      supabase.from("itens").select("id", { count: "exact", head: true }).eq("ativo", true).not("categoria_id", "is", null),
    ]);

  const usoCategorias = itensComCategoria.count ?? 0;
  const cartoes: Record<"categorias" | "depositos" | "fornecedores" | "centros" | "veiculos", CartaoCadastro> = {
    categorias: {
      rota: "/gestao/cadastros/categorias",
      titulo: "Categorias",
      descricao: "Agrupam os itens do estoque.",
      icone: <FolderTree size={20} />,
      total: categorias.data?.length ?? null,
      semRegistros: categorias.data?.length === 0,
      rodape: itensComCategoria.error
        ? "Não foi possível carregar"
        : usoCategorias
          ? `Em ${plural(usoCategorias, "item ativo", "itens ativos")}`
          : "Nenhum item usa ainda",
      vazio: "Nenhuma categoria ainda",
    },
    depositos: {
      rota: "/gestao/cadastros/depositos",
      titulo: "Depósitos",
      descricao: "Locais de armazenamento do estoque.",
      icone: <Building2 size={20} />,
      ...contagem(depositos.data),
      vazio: "Nenhum depósito ainda",
    },
    fornecedores: {
      rota: "/gestao/cadastros/fornecedores",
      titulo: "Fornecedores",
      descricao: "Origem das entradas de estoque.",
      icone: <Factory size={20} />,
      ...contagem(fornecedores.data),
      vazio: "Nenhum fornecedor ainda",
    },
    centros: {
      rota: "/gestao/cadastros/centros-custo",
      titulo: "Centros de custo",
      descricao: "Setores usados como destino de saída.",
      icone: <Package size={20} />,
      ...contagem(centros.data),
      vazio: "Nenhum centro de custo ainda",
    },
    veiculos: {
      rota: "/gestao/cadastros/veiculos",
      titulo: "Veículos",
      descricao: "Frota usada como destino de saída.",
      icone: <Truck size={20} />,
      ...contagem(veiculos.data),
      vazio: "Nenhum veículo ainda",
    },
  };

  const registros: RegistroBusca[] = [
    ...(categorias.data ?? []).map((c) => ({
      id: c.id,
      tipo: "Categoria",
      nome: c.nome,
      href: `/gestao/cadastros/categorias/${c.id}`,
    })),
    ...(depositos.data ?? []).map((d) => ({
      id: d.id,
      tipo: "Depósito",
      nome: d.nome,
      detalhe: d.descricao ?? undefined,
      href: `/gestao/cadastros/depositos/${d.id}`,
      inativo: !d.ativo,
    })),
    ...(fornecedores.data ?? []).map((f) => ({
      id: f.id,
      tipo: "Fornecedor",
      nome: f.nome,
      detalhe: f.cnpj ?? undefined,
      href: `/gestao/cadastros/fornecedores/${f.id}`,
      inativo: !f.ativo,
    })),
    ...(centros.data ?? []).map((c) => ({
      id: c.id,
      tipo: "Centro de custo",
      nome: c.nome,
      detalhe: c.codigo ?? undefined,
      href: `/gestao/cadastros/centros-custo/${c.id}`,
      inativo: !c.ativo,
    })),
    ...(veiculos.data ?? []).map((v) => ({
      id: v.id,
      tipo: "Veículo",
      nome: v.placa,
      detalhe: v.modelo ?? undefined,
      href: `/gestao/cadastros/veiculos/${v.id}`,
      inativo: !v.ativo,
    })),
  ];

  // Falha de consulta não pode virar "nada pendente".
  const pendenciasIndisponiveis = Boolean(itensSemCategoria.error || fornecedores.error);
  const pendencias: Pendencia[] = [];
  const semCategoria = itensSemCategoria.count ?? 0;
  if (semCategoria > 0) {
    pendencias.push({
      destaque: plural(semCategoria, "item", "itens"),
      texto: "sem categoria",
      efeito: "Entram como “Sem categoria” no valor imobilizado.",
      href: "/gestao/itens?categoria=sem",
    });
  }
  const semCnpj = (fornecedores.data ?? []).filter((f) => f.ativo && !f.cnpj?.trim());
  if (semCnpj.length > 0) {
    pendencias.push({
      destaque: plural(semCnpj.length, "fornecedor", "fornecedores"),
      texto: "sem CNPJ",
      efeito: "Cadastro incompleto para identificar quem vendeu.",
      href: semCnpj.length === 1 ? `/gestao/cadastros/fornecedores/${semCnpj[0].id}` : "/gestao/cadastros/fornecedores",
    });
  }

  const colunas: { titulo: string; conteudo: ReactNode }[] = [
    {
      titulo: "Estoque",
      conteudo: (
        <>
          <Cartao cartao={cartoes.categorias} indice={0} />
          <Cartao cartao={cartoes.depositos} indice={3} />
        </>
      ),
    },
    {
      titulo: "Entradas",
      conteudo: (
        <>
          <Cartao cartao={cartoes.fornecedores} indice={1} />
          <div className="animate-entrada rounded border border-dashed border-bruma/50 bg-nevoa p-4" style={{ animationDelay: "120ms" }}>
            <div className="font-display text-sm font-semibold text-tinta">Dica</div>
            <p className="mt-1 font-corpo text-xs text-bruma-texto">
              Item com fornecedor cadastrado aparece em Compras com o prazo de entrega desse fornecedor.
            </p>
          </div>
        </>
      ),
    },
    {
      titulo: "Saídas",
      conteudo: (
        <>
          <Cartao cartao={cartoes.centros} indice={2} />
          <Cartao cartao={cartoes.veiculos} indice={5} />
        </>
      ),
    },
  ];

  return (
    <main className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titulo-tela">Cadastros</h1>
          <p className="mt-1 font-corpo text-sm text-bruma-texto">Dados de apoio usados em entradas, saídas e relatórios.</p>
        </div>
        <BuscaCadastros registros={registros} />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {colunas.map((coluna) => (
          <section key={coluna.titulo}>
            <h2 className="font-display text-rotulo uppercase text-bruma-texto">{coluna.titulo}</h2>
            <div className="mt-3 flex flex-col gap-3">{coluna.conteudo}</div>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded border border-giz bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-giz px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-tinta">
            <CircleAlert size={18} aria-hidden="true" className="text-cobalto" />
            Precisa de atenção
          </h2>
          <span className="font-corpo text-xs text-bruma-texto">
            {pendencias.length
              ? plural(pendencias.length, "pendência", "pendências")
              : pendenciasIndisponiveis
                ? ""
                : "Nada pendente"}
          </span>
        </div>
        {pendenciasIndisponiveis && pendencias.length === 0 ? (
          <p className="px-5 py-4 font-corpo text-sm text-bruma-texto">Não foi possível verificar as pendências agora.</p>
        ) : pendencias.length === 0 ? (
          <p className="px-5 py-4 font-corpo text-sm text-bruma-texto">Todos os itens têm categoria e todos os fornecedores ativos têm CNPJ.</p>
        ) : (
          <ul>
            {pendencias.map((p) => (
              <li key={p.texto} className="flex items-center justify-between gap-4 border-b border-giz px-5 py-3.5 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-corpo text-sm text-tinta">
                    <span className="font-semibold">{p.destaque}</span> {p.texto}
                  </div>
                  <div className="font-corpo text-xs text-bruma-texto">{p.efeito}</div>
                </div>
                <Link
                  href={p.href}
                  className="flex flex-shrink-0 items-center gap-1 font-corpo text-sm font-semibold text-cobalto hover:underline"
                >
                  Resolver <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Cartao({ cartao, indice }: { cartao: CartaoCadastro; indice: number }) {
  const { rota, titulo, descricao, icone, total, rodape, vazio, semRegistros: semNenhum } = cartao;

  return (
    <article
      style={{ animationDelay: `${indice * 30}ms` }}
      className="animate-entrada rounded border border-giz bg-white p-5 transition-colors duration-150 hover:border-bruma"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-laranja-fundo text-laranja-texto">
          {icone}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-tight text-tinta">{titulo}</h3>
          <p className="mt-0.5 font-corpo text-xs text-bruma-texto">{descricao}</p>
        </div>
        <span className="font-display text-[28px] font-bold leading-none text-tinta">{total ?? "—"}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-giz pt-3">
        <span className="min-w-0 truncate font-corpo text-xs text-bruma-texto">{semNenhum ? vazio : rodape}</span>
        {semNenhum ? (
          <Link
            href={`${rota}/novo`}
            className="inline-flex h-9 flex-shrink-0 items-center rounded bg-nevoa px-3 font-display text-sm font-semibold text-cobalto transition-[background-color,transform] duration-150 ease-mola hover:bg-giz active:scale-95"
          >
            Cadastrar o primeiro
          </Link>
        ) : (
          <div className="flex flex-shrink-0 items-center gap-3">
            <Link href={rota} className="font-corpo text-sm font-semibold text-cobalto hover:underline">
              Ver lista
            </Link>
            <Link
              href={`${rota}/novo`}
              className="inline-flex h-9 items-center gap-1 rounded bg-cobalto px-3 font-display text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-mola hover:bg-cobalto-claro active:scale-95"
            >
              <Plus size={15} aria-hidden="true" />
              Novo
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
