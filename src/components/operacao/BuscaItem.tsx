"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Etiqueta } from "@/components/ui";

// @zxing/browser (~180kB) so entra no bundle quando a camera e realmente aberta.
const LeitorCodigoBarras = dynamic(
  () => import("./LeitorCodigoBarras").then((m) => m.LeitorCodigoBarras),
  { ssr: false }
);

export interface ItemComSaldo {
  id: string;
  sku: string;
  nome: string;
  unidade: string;
  estoqueMinimo: number;
  pontoPedido: number;
  custoMedio: number;
  saldo: number;
}

interface BuscaItemProps {
  depositoId: string;
  onSelecionar: (item: ItemComSaldo) => void;
}

async function buscarItens(depositoId: string, termo: string): Promise<ItemComSaldo[]> {
  const supabase = createClient();
  let consulta = supabase
    .from("itens")
    .select("id, sku, nome, unidade, estoque_minimo, ponto_pedido, custo_medio")
    .eq("ativo", true)
    .order("nome")
    .limit(8);

  if (termo.trim()) {
    consulta = consulta.or(`nome.ilike.%${termo}%,sku.ilike.%${termo}%`);
  }

  const { data: itens } = await consulta;
  if (!itens || itens.length === 0) return [];

  const { data: saldos } = await supabase
    .from("saldos")
    .select("item_id, quantidade")
    .eq("deposito_id", depositoId)
    .in(
      "item_id",
      itens.map((i) => i.id)
    );
  const mapaSaldo = new Map((saldos ?? []).map((s) => [s.item_id, s.quantidade]));

  return itens.map((i) => ({
    id: i.id,
    sku: i.sku,
    nome: i.nome,
    unidade: i.unidade,
    estoqueMinimo: i.estoque_minimo,
    pontoPedido: i.ponto_pedido,
    custoMedio: i.custo_medio,
    saldo: mapaSaldo.get(i.id) ?? 0,
  }));
}

async function buscarPorCodigoBarras(depositoId: string, codigo: string): Promise<ItemComSaldo | null> {
  const supabase = createClient();
  const { data: item } = await supabase
    .from("itens")
    .select("id, sku, nome, unidade, estoque_minimo, ponto_pedido, custo_medio")
    .eq("ativo", true)
    .eq("codigo_barras", codigo)
    .maybeSingle();
  if (!item) return null;

  const { data: saldo } = await supabase
    .from("saldos")
    .select("quantidade")
    .eq("deposito_id", depositoId)
    .eq("item_id", item.id)
    .maybeSingle();

  return {
    id: item.id,
    sku: item.sku,
    nome: item.nome,
    unidade: item.unidade,
    estoqueMinimo: item.estoque_minimo,
    pontoPedido: item.ponto_pedido,
    custoMedio: item.custo_medio,
    saldo: saldo?.quantidade ?? 0,
  };
}

export function BuscaItem({ depositoId, onSelecionar }: BuscaItemProps) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ItemComSaldo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [leitorAberto, setLeitorAberto] = useState(false);
  const [avisoScan, setAvisoScan] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    const tempo = setTimeout(async () => {
      const itens = await buscarItens(depositoId, termo);
      if (!cancelado) {
        setResultados(itens);
        setCarregando(false);
      }
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(tempo);
    };
  }, [termo, depositoId]);

  async function aoDetectarCodigo(codigo: string) {
    setLeitorAberto(false);
    const item = await buscarPorCodigoBarras(depositoId, codigo);
    if (item) {
      setAvisoScan(null);
      onSelecionar(item);
    } else {
      setAvisoScan("Código não encontrado. Tente buscar pelo nome ou SKU.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          title="Ler código de barras"
          onClick={() => setLeitorAberto(true)}
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-grafite bg-aco"
        >
          <Camera size={22} className="text-petroleo-claro" />
        </button>
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bruma"
          />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar item ou SKU"
            className="h-14 w-full rounded border border-grafite bg-aco pl-11 pr-4 font-corpo text-[15px] text-white outline-none placeholder:text-bruma"
          />
        </div>
      </div>

      {avisoScan && <p className="font-corpo text-xs text-carmim">{avisoScan}</p>}

      <div className="flex flex-col gap-2">
        {carregando && <p className="font-corpo text-sm text-bruma">Buscando...</p>}
        {!carregando && resultados.length === 0 && (
          <p className="py-2 font-corpo text-sm text-bruma">
            Nenhum item encontrado. Verifique o SKU ou cadastre o item na gestão.
          </p>
        )}
        {!carregando &&
          resultados.map((item) => (
            <Etiqueta
              key={item.id}
              nome={item.nome}
              sku={item.sku}
              saldo={item.saldo}
              unidade={item.unidade}
              minimo={item.estoqueMinimo}
              pontoPedido={item.pontoPedido}
              escuro
              onClick={() => {
                setAvisoScan(null);
                onSelecionar(item);
              }}
            />
          ))}
      </div>

      {leitorAberto && (
        <LeitorCodigoBarras onDetectado={aoDetectarCodigo} onFechar={() => setLeitorAberto(false)} />
      )}
    </div>
  );
}
