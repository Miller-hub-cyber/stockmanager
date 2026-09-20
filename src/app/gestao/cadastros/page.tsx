import Link from "next/link";
import { Package, Truck, Users, Building2, Factory, FolderTree } from "lucide-react";

const CADASTROS = [
  {
    href: "/gestao/cadastros/categorias",
    titulo: "Categorias",
    descricao: "Agrupam os itens do estoque.",
    Icone: FolderTree,
  },
  {
    href: "/gestao/cadastros/depositos",
    titulo: "Depósitos",
    descricao: "Locais de armazenamento do estoque.",
    Icone: Building2,
  },
  {
    href: "/gestao/cadastros/fornecedores",
    titulo: "Fornecedores",
    descricao: "Origem das entradas de estoque.",
    Icone: Factory,
  },
  {
    href: "/gestao/cadastros/centros-custo",
    titulo: "Centros de custo",
    descricao: "Setores usados como destino de saída.",
    Icone: Package,
  },
  {
    href: "/gestao/cadastros/veiculos",
    titulo: "Veículos",
    descricao: "Frota usada como destino de saída.",
    Icone: Truck,
  },
  {
    href: "/gestao/cadastros/funcionarios",
    titulo: "Funcionários",
    descricao: "Destino de saída e ficha de EPI.",
    Icone: Users,
  },
];

export default function PaginaCadastros() {
  return (
    <main className="p-6 sm:p-8">
      <h1 className="font-display text-tela text-tinta">Cadastros</h1>
      <p className="mt-1 font-corpo text-sm text-bruma-texto">Dados de apoio usados em entradas, saídas e relatórios.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CADASTROS.map(({ href, titulo, descricao, Icone }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded border border-bruma bg-white p-4 transition-colors duration-150 hover:border-petroleo-claro"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-nevoa">
              <Icone size={18} className="text-petroleo" />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-tinta">{titulo}</div>
              <div className="mt-0.5 font-corpo text-xs text-bruma-texto">{descricao}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
