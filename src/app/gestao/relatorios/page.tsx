import { CartaoAtalho } from "@/components/ui";
import { Truck, Users, List, Package, ShoppingCart, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

const RELATORIOS = [
  {
    href: "/gestao/relatorios/entradas",
    titulo: "Relatório de entradas",
    descricao: "O que entrou, de qual fornecedor, para qual frota e quem pediu.",
    Icone: TrendingUp,
  },
  {
    href: "/gestao/relatorios/saidas",
    titulo: "Relatório de saídas",
    descricao: "O que saiu, para qual frota ou setor.",
    Icone: TrendingDown,
  },
  {
    href: "/gestao/relatorios/geral",
    titulo: "Relatório geral",
    descricao: "Entradas e saídas juntas, com estornos.",
    Icone: ArrowLeftRight,
  },
  {
    href: "/gestao/relatorios/consumo-veiculo",
    titulo: "Consumo por veículo",
    descricao: "Custo de material por placa e por período.",
    Icone: Truck,
  },
  {
    href: "/gestao/relatorios/consumo-centro",
    titulo: "Consumo por centro de custo",
    descricao: "Distribuição do gasto entre setores.",
    Icone: Users,
  },
  {
    href: "/gestao/relatorios/kardex",
    titulo: "Kardex por item",
    descricao: "Histórico completo de entradas e saídas.",
    Icone: List,
  },
  {
    href: "/gestao/relatorios/itens-parados",
    titulo: "Itens parados",
    descricao: "Sem saída há mais de 90 dias.",
    Icone: Package,
  },
  {
    href: "/gestao/relatorios/valor-estoque",
    titulo: "Valor imobilizado",
    descricao: "Saldo multiplicado pelo custo médio.",
    Icone: ShoppingCart,
  },
];

export default function PaginaRelatorios() {
  return (
    <main className="p-6 sm:p-8">
      <h1 className="titulo-tela">Relatórios</h1>
      <p className="mt-1 font-corpo text-sm text-bruma-texto">Todos exportáveis em CSV.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RELATORIOS.map((relatorio, indice) => (
          <CartaoAtalho key={relatorio.href} {...relatorio} indice={indice} />
        ))}
      </div>
    </main>
  );
}
