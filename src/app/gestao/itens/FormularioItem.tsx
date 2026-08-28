"use client";

import { useFormState, useFormStatus } from "react-dom";
import { criarItem } from "@/actions/criarItem";
import { atualizarItem } from "@/actions/atualizarItem";
import { Campo, Seletor, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import { brl } from "@/lib/formato";

const ESTADO_INICIAL: ResultadoAcao = { sucesso: false };

const TIPOS = [
  { valor: "peca", rotulo: "Peça" },
  { valor: "consumivel", rotulo: "Consumível" },
  { valor: "epi", rotulo: "EPI" },
  { valor: "ferramenta", rotulo: "Ferramenta" },
  { valor: "pneu", rotulo: "Pneu" },
  { valor: "lubrificante", rotulo: "Lubrificante" },
  { valor: "outro", rotulo: "Outro" },
] as const;

interface Item {
  id: string;
  sku: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  tipo: string;
  estoque_minimo: number;
  ponto_pedido: number;
  custo_medio: number;
  categoria_id: string | null;
  fornecedor_id: string | null;
  codigo_barras: string | null;
}

interface FormularioItemProps {
  item?: Item;
  categorias: { id: string; nome: string }[];
  fornecedores: { id: string; nome: string }[];
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioItem({ item, categorias, fornecedores }: FormularioItemProps) {
  const acao = item ? atualizarItem.bind(null, item.id) : criarItem;
  const [estado, formAction] = useFormState(acao, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Campo id="sku" name="sku" rotulo="SKU" defaultValue={item?.sku} required />
        <Campo
          id="unidade"
          name="unidade"
          rotulo="Unidade (ex.: UN, L, JG)"
          defaultValue={item?.unidade ?? "UN"}
          required
        />
      </div>
      <Campo id="nome" name="nome" rotulo="Nome do item" defaultValue={item?.nome} required />
      <Campo
        id="descricao"
        name="descricao"
        rotulo="Descrição (opcional)"
        defaultValue={item?.descricao ?? ""}
      />
      <div className="grid grid-cols-2 gap-4">
        <Seletor id="tipo" name="tipo" rotulo="Tipo" defaultValue={item?.tipo ?? "consumivel"}>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </Seletor>
        <Campo
          id="codigoBarras"
          name="codigoBarras"
          rotulo="Código de barras (opcional)"
          defaultValue={item?.codigo_barras ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Seletor
          id="categoriaId"
          name="categoriaId"
          rotulo="Categoria (opcional)"
          defaultValue={item?.categoria_id ?? ""}
        >
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Seletor>
        <Seletor
          id="fornecedorId"
          name="fornecedorId"
          rotulo="Fornecedor (opcional)"
          defaultValue={item?.fornecedor_id ?? ""}
        >
          <option value="">Sem fornecedor</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </Seletor>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Campo
          id="estoqueMinimo"
          name="estoqueMinimo"
          type="number"
          step="0.001"
          min={0}
          rotulo="Estoque mínimo"
          defaultValue={item?.estoque_minimo ?? 0}
        />
        <Campo
          id="pontoPedido"
          name="pontoPedido"
          type="number"
          step="0.001"
          min={0}
          rotulo="Ponto de pedido"
          defaultValue={item?.ponto_pedido ?? 0}
        />
      </div>
      {item && (
        <p className="font-corpo text-xs text-bruma">
          Custo médio atual: {brl(item.custo_medio)}. Recalculado automaticamente a cada entrada — não é
          editável aqui.
        </p>
      )}
      {estado.erro && <Aviso tipo="erro" titulo={estado.erro} />}
      <div className="w-40">
        <BotaoSalvar />
      </div>
    </form>
  );
}
