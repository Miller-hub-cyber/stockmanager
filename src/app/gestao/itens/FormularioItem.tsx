"use client";

import { useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { criarItem } from "@/actions/criarItem";
import { atualizarItem } from "@/actions/atualizarItem";
import { Campo, Seletor, Botao, Aviso } from "@/components/ui";
import type { ResultadoAcao } from "@/lib/acoes-cadastro";
import { brl } from "@/lib/formato";
import { normalizar, type EntradaCatalogo } from "@/lib/catalogo";
import { CampoNomeCatalogo } from "./CampoNomeCatalogo";

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
  ncm: string | null;
}

interface FormularioItemProps {
  item?: Item;
  categorias: { id: string; nome: string }[];
  fornecedores: { id: string; nome: string }[];
  /** Biblioteca de nomes; so usada ao criar item (na edicao o nome ja existe). */
  catalogo?: EntradaCatalogo[];
}

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" carregando={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Botao>
  );
}

export function FormularioItem({ item, categorias, fornecedores, catalogo }: FormularioItemProps) {
  const acao = item ? atualizarItem.bind(null, item.id) : criarItem;
  const [estado, formAction] = useActionState(acao, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Campos nao controlados: a sugestao so pre-preenche, o usuario pode mudar depois.
  function preencherDoCatalogo(entrada: EntradaCatalogo) {
    const campos = formRef.current?.elements;
    if (!campos) return;
    const definir = (nome: string, valor: string) => {
      const campo = campos.namedItem(nome);
      if (campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement) campo.value = valor;
    };
    definir("tipo", entrada.tipo);
    definir("unidade", entrada.unidade);
    definir("ncm", entrada.ncm ?? "");
    // Categoria da empresa com o mesmo nome do grupo do catalogo, se existir.
    const categoria = categorias.find((c) => normalizar(c.nome) === normalizar(entrada.grupo));
    if (categoria) definir("categoriaId", categoria.id);
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
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
      {!item && catalogo ? (
        <CampoNomeCatalogo catalogo={catalogo} aoEscolher={preencherDoCatalogo} />
      ) : (
        <Campo id="nome" name="nome" rotulo="Nome do item" defaultValue={item?.nome} required />
      )}
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
      <Campo
        id="ncm"
        name="ncm"
        rotulo="NCM (opcional)"
        inputMode="numeric"
        placeholder="0000.00.00"
        dica="Código fiscal de 8 dígitos. O da biblioteca é sugestão: confirme com a contabilidade."
        defaultValue={item?.ncm ?? ""}
      />
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
        <p className="font-corpo text-xs text-bruma-texto">
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
