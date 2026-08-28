"use client";

// Prototipo funcional. Dados em memoria, sem Supabase conectado.
import React, { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Search, Camera, Plus, Minus, Check, AlertTriangle, X, Package,
  TrendingDown, TrendingUp, LayoutDashboard, ShoppingCart, List,
  Truck, Wrench, Users, ArrowLeft, Download, CircleDot, type LucideIcon
} from "lucide-react";

/* ============================================================
   StockManager — protótipo funcional
   Design system: carbono/aço/petróleo + âmbar/carmim/musgo
   Regras replicadas do banco: saldo derivado, saída exige
   destino, saldo não pode ficar negativo, custo médio ponderado.
   ============================================================ */

const C = {
  carbono: "#14181D",
  aco: "#212933",
  grafite: "#3A4450",
  petroleo: "#0F5563",
  petroleoClaro: "#177A8F",
  ambar: "#F5A524",
  carmim: "#D64545",
  musgo: "#3F8F6F",
  nevoa: "#F1F4F6",
  giz: "#DDE3E8",
  tinta: "#1B2026",
  bruma: "#6C7885",
  branco: "#FFFFFF",
};

const FD = "'Archivo', system-ui, sans-serif";
const FB = "'IBM Plex Sans', system-ui, sans-serif";
const FM = "'IBM Plex Mono', ui-monospace, monospace";

/* ------------------------------------------------------------- tipos */
interface Item {
  id: number;
  sku: string;
  nome: string;
  cat: string;
  un: string;
  saldo: number;
  min: number;
  pp: number;
  custo: number;
  forn: string;
}

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  km: number;
}

interface Centro {
  id: number;
  nome: string;
}

interface Funcionario {
  id: number;
  nome: string;
}

type TipoDestino = "veiculo" | "centro" | "funcionario" | "entrada";

interface Movimentacao {
  id: number;
  itemId: number;
  tipo: "entrada" | "saida";
  qtd: number;
  custo: number;
  destino: string;
  tipoDestino: TipoDestino;
  data: string;
  usuario: string;
  km?: number | null;
}

interface EstadoItem {
  cor: string;
  texto: string;
}

interface Resultado {
  ok: boolean;
  titulo: string;
  detalhe: string;
}

interface DestinoSelecionado {
  tipo: "veiculo" | "centro" | "funcionario";
  id: number;
  rotulo: string;
}

interface RegistrarPayload {
  itemId: number;
  tipo: "entrada" | "saida";
  qtd: number;
  custo: number;
  destino: string;
  tipoDestino: TipoDestino;
  km: number | null;
}

type TelaOperacao = "saida" | "entrada" | "consulta";
type AbaGestao = "painel" | "itens" | "compras" | "movs" | "relatorios";

/* ---------------------------------------------------- dados iniciais */
const ITENS_INICIAIS: Item[] = [
  { id: 1, sku: "FLT-0042", nome: "Filtro de óleo Mann W950", cat: "Filtros", un: "UN", saldo: 12, min: 8, pp: 15, custo: 48.9, forn: "Distribuidora Norte" },
  { id: 2, sku: "FLT-0043", nome: "Filtro de ar Mann C30850", cat: "Filtros", un: "UN", saldo: 3, min: 6, pp: 12, custo: 132.5, forn: "Distribuidora Norte" },
  { id: 3, sku: "LUB-0011", nome: "Óleo motor 15W40 mineral", cat: "Lubrificantes", un: "L", saldo: 84, min: 40, pp: 80, custo: 22.4, forn: "Petro Insumos" },
  { id: 4, sku: "LUB-0014", nome: "ARLA 32", cat: "Lubrificantes", un: "L", saldo: 0, min: 50, pp: 100, custo: 4.2, forn: "Petro Insumos" },
  { id: 5, sku: "FRE-0003", nome: "Pastilha de freio dianteira", cat: "Freios", un: "JG", saldo: 6, min: 4, pp: 8, custo: 289.0, forn: "Auto Peças Belém" },
  { id: 6, sku: "FRE-0007", nome: "Lona de freio traseira", cat: "Freios", un: "JG", saldo: 2, min: 3, pp: 6, custo: 415.0, forn: "Auto Peças Belém" },
  { id: 7, sku: "ELE-0021", nome: "Lâmpada H7 24V", cat: "Elétrica", un: "UN", saldo: 34, min: 12, pp: 24, custo: 18.7, forn: "Auto Peças Belém" },
  { id: 8, sku: "ELE-0030", nome: "Bateria 150Ah", cat: "Elétrica", un: "UN", saldo: 4, min: 2, pp: 4, custo: 1189.0, forn: "Energia Pará" },
  { id: 9, sku: "EPI-0002", nome: "Luva de vaqueta", cat: "EPI", un: "PAR", saldo: 28, min: 20, pp: 40, custo: 14.3, forn: "Segurança Total" },
  { id: 10, sku: "EPI-0005", nome: "Bota de segurança bico composite", cat: "EPI", un: "PAR", saldo: 7, min: 10, pp: 20, custo: 128.0, forn: "Segurança Total" },
  { id: 11, sku: "INS-0018", nome: "Filme stretch 500mm", cat: "Insumos", un: "RL", saldo: 46, min: 20, pp: 40, custo: 37.9, forn: "Embala Norte" },
  { id: 12, sku: "INS-0022", nome: "Fita de arquear 16mm", cat: "Insumos", un: "RL", saldo: 9, min: 10, pp: 18, custo: 64.5, forn: "Embala Norte" },
  { id: 13, sku: "SUS-0009", nome: "Amortecedor dianteiro", cat: "Suspensão", un: "UN", saldo: 5, min: 2, pp: 4, custo: 542.0, forn: "Auto Peças Belém" },
  { id: 14, sku: "FER-0001", nome: "Torquímetro 1/2\"", cat: "Ferramentas", un: "UN", saldo: 2, min: 1, pp: 2, custo: 890.0, forn: "Ferramentas Pará" },
];

const VEICULOS: Veiculo[] = [
  { id: 1, placa: "RKN-2C41", modelo: "Scania R450", km: 412880 },
  { id: 2, placa: "PXH-7B09", modelo: "Volvo FH 460", km: 289340 },
  { id: 3, placa: "QTA-5J77", modelo: "Mercedes Actros", km: 158720 },
  { id: 4, placa: "NEG-1D22", modelo: "VW Constellation", km: 501230 },
  { id: 5, placa: "OSB-9F13", modelo: "Iveco Tector", km: 97460 },
];

const CENTROS: Centro[] = [
  { id: 1, nome: "Oficina interna" },
  { id: 2, nome: "Armazém" },
  { id: 3, nome: "Administrativo" },
];

const FUNCIONARIOS: Funcionario[] = [
  { id: 1, nome: "Almoxarife de turno" },
  { id: 2, nome: "Mecânico responsável" },
  { id: 3, nome: "Conferente" },
];

const MOV_INICIAIS: Movimentacao[] = [
  { id: 1, itemId: 1, tipo: "saida", qtd: 2, custo: 48.9, destino: "RKN-2C41", tipoDestino: "veiculo", data: "2026-08-24 09:12", usuario: "Almoxarife" },
  { id: 2, itemId: 3, tipo: "saida", qtd: 20, custo: 22.4, destino: "RKN-2C41", tipoDestino: "veiculo", data: "2026-08-24 09:14", usuario: "Almoxarife" },
  { id: 3, itemId: 11, tipo: "saida", qtd: 4, custo: 37.9, destino: "Armazém", tipoDestino: "centro", data: "2026-08-23 15:40", usuario: "Almoxarife" },
  { id: 4, itemId: 7, tipo: "entrada", qtd: 24, custo: 18.7, destino: "NF 44821", tipoDestino: "entrada", data: "2026-08-22 11:02", usuario: "Admin" },
  { id: 5, itemId: 5, tipo: "saida", qtd: 1, custo: 289.0, destino: "PXH-7B09", tipoDestino: "veiculo", data: "2026-08-21 08:55", usuario: "Almoxarife" },
];

/* ---------------------------------------------------------- helpers */
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const qtd = (n: number) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

function estadoItem(i: Item): EstadoItem {
  if (i.saldo <= 0) return { cor: C.carmim, texto: "Esgotado" };
  if (i.saldo <= i.min) return { cor: C.ambar, texto: "Abaixo do mínimo" };
  if (i.saldo <= i.pp) return { cor: C.ambar, texto: "Repor" };
  return { cor: C.musgo, texto: "Normal" };
}

function agora(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ======================================================== componentes */

function RotuloSecao({ children, escuro }: { children: ReactNode; escuro?: boolean }) {
  return (
    <div
      style={{
        fontFamily: FD, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase", color: escuro ? C.bruma : C.bruma,
      }}
    >
      {children}
    </div>
  );
}

function PontoEstado({ cor }: { cor: string }) {
  return (
    <span
      style={{
        width: 9, height: 9, borderRadius: 999, background: cor,
        display: "inline-block", flexShrink: 0,
      }}
    />
  );
}

interface EtiquetaProps {
  item: Item;
  escuro?: boolean;
  onClick?: () => void;
  ativo?: boolean;
}

function Etiqueta({ item, escuro = true, onClick, ativo }: EtiquetaProps) {
  const e = estadoItem(item);
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(ev) => {
        if (onClick && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); onClick(); }
      }}
      style={{
        background: escuro ? C.aco : C.branco,
        border: `1px solid ${ativo ? C.petroleoClaro : escuro ? C.grafite : C.giz}`,
        borderRadius: 6, padding: "14px 16px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 120ms, background 120ms",
      }}
    >
      <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 16, color: escuro ? C.branco : C.tinta, lineHeight: 1.25 }}>
        {item.nome}
      </div>
      <div style={{ fontFamily: FM, fontSize: 13, color: C.bruma, marginTop: 2 }}>
        {item.sku}
      </div>
      <div className="flex items-end justify-between" style={{ marginTop: 12 }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 34, lineHeight: 1, color: escuro ? C.branco : C.tinta }}>
            {qtd(item.saldo)}
          </span>
          <span style={{ fontFamily: FM, fontSize: 13, color: C.bruma }}>{item.un}</span>
        </div>
        <div className="flex items-center gap-2">
          <PontoEstado cor={e.cor} />
          <span style={{ fontFamily: FB, fontSize: 12, color: C.bruma }}>{e.texto}</span>
        </div>
      </div>
    </div>
  );
}

interface BotaoProps {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "perigo";
  disabled?: boolean;
  grande?: boolean;
  escuro?: boolean;
}

function Botao({ children, onClick, variante = "primario", disabled, grande, escuro }: BotaoProps) {
  const base = {
    fontFamily: FD, fontWeight: 600, borderRadius: 6, border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    transition: "background 120ms, border-color 120ms",
    padding: grande ? "0 20px" : "0 14px",
    height: grande ? 64 : 40, fontSize: grande ? 17 : 14,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
  } as const;
  const v = {
    primario: { background: C.petroleo, color: C.branco },
    secundario: {
      background: "transparent", color: escuro ? C.branco : C.tinta,
      borderColor: escuro ? C.grafite : C.giz,
    },
    perigo: { background: C.carmim, color: C.branco },
  }[variante];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...v }}>
      {children}
    </button>
  );
}

interface ChipProps {
  children: ReactNode;
  ativo?: boolean;
  onClick?: () => void;
  escuro?: boolean;
}

function Chip({ children, ativo, onClick, escuro }: ChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FB, fontSize: 14, fontWeight: 500,
        padding: "0 16px", height: 48, borderRadius: 999,
        background: ativo ? C.petroleo : escuro ? C.aco : C.branco,
        color: ativo ? C.branco : escuro ? C.branco : C.tinta,
        border: `1px solid ${ativo ? C.petroleo : escuro ? C.grafite : C.giz}`,
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "background 120ms, border-color 120ms",
      }}
    >
      {children}
    </button>
  );
}

interface TelaResultadoProps {
  resultado: Resultado | null;
  onFechar: () => void;
}

function TelaResultado({ resultado, onFechar }: TelaResultadoProps) {
  useEffect(() => {
    if (resultado?.ok) {
      const t = setTimeout(onFechar, 1400);
      return () => clearTimeout(t);
    }
  }, [resultado, onFechar]);

  if (!resultado) return null;
  const fundo = resultado.ok ? C.musgo : C.carmim;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center"
      style={{ background: fundo, padding: 32, animation: "smEntra 180ms ease-out" }}
    >
      <style>{`@keyframes smEntra{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`}</style>
      {resultado.ok ? <Check size={64} color="#fff" strokeWidth={2.5} /> : <AlertTriangle size={64} color="#fff" strokeWidth={2.5} />}
      <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 30, color: "#fff", marginTop: 20, lineHeight: 1.15 }}>
        {resultado.titulo}
      </div>
      <div style={{ fontFamily: FB, fontSize: 16, color: "rgba(255,255,255,.9)", marginTop: 10, maxWidth: 380 }}>
        {resultado.detalhe}
      </div>
      {!resultado.ok && (
        <div style={{ marginTop: 28, width: 200 }}>
          <Botao variante="secundario" onClick={onFechar} escuro>Entendi</Botao>
        </div>
      )}
    </div>
  );
}

/* ==================================================== ÁREA DE OPERAÇÃO */

const ABAS_OPERACAO: [TelaOperacao, string][] = [
  ["saida", "Saída"],
  ["entrada", "Entrada"],
  ["consulta", "Consulta"],
];

interface OperacaoProps {
  itens: Item[];
  registrar: (mov: RegistrarPayload) => void;
  tela: TelaOperacao;
  setTela: (tela: TelaOperacao) => void;
}

function Operacao({ itens, registrar, tela, setTela }: OperacaoProps) {
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Item | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [destino, setDestino] = useState<DestinoSelecionado | null>(null);
  const [km, setKm] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [custoEntrada, setCustoEntrada] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const entrada = tela === "entrada";

  const filtrados = useMemo<Item[]>(() => {
    if (!busca.trim()) return itens.slice(0, 5);
    const b = busca.toLowerCase();
    return itens.filter((i) => i.nome.toLowerCase().includes(b) || i.sku.toLowerCase().includes(b)).slice(0, 6);
  }, [busca, itens]);

  function limpar() {
    setSel(null); setQuantidade(1); setDestino(null); setBusca(""); setKm(""); setCustoEntrada("");
    inputRef.current?.focus();
  }

  function confirmar() {
    if (!sel) return;
    if (!entrada && !destino) {
      setResultado({ ok: false, titulo: "Destino obrigatório", detalhe: "Toda saída precisa ser vinculada a um veículo, setor ou funcionário." });
      return;
    }
    if (!entrada && quantidade > sel.saldo) {
      setResultado({
        ok: false, titulo: "Saldo insuficiente",
        detalhe: `Disponível: ${qtd(sel.saldo)} ${sel.un}. Faça o ajuste por inventário antes de registrar.`,
      });
      return;
    }
    const custo = entrada ? Number(custoEntrada.replace(",", ".")) || sel.custo : sel.custo;
    registrar({
      itemId: sel.id, tipo: entrada ? "entrada" : "saida", qtd: quantidade, custo,
      destino: entrada ? "Entrada manual" : destino!.rotulo,
      tipoDestino: entrada ? "entrada" : destino!.tipo,
      km: destino?.tipo === "veiculo" && km ? Number(km) : null,
    });
    setResultado({
      ok: true,
      titulo: entrada ? "Entrada registrada" : "Saída registrada",
      detalhe: `${qtd(quantidade)} ${sel.un} · ${sel.nome}${entrada ? "" : ` → ${destino!.rotulo}`}`,
    });
    limpar();
  }

  return (
    <div className="relative flex flex-col" style={{ background: C.carbono, minHeight: 640, height: "100%" }}>
      <TelaResultado resultado={resultado} onFechar={() => setResultado(null)} />

      {/* cabeçalho */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 56, background: C.aco, borderBottom: `1px solid ${C.grafite}` }}
      >
        <div className="flex items-center gap-2">
          <div style={{ width: 8, height: 20, background: C.petroleoClaro, borderRadius: 2 }} />
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 17, color: C.branco }}>
            Stock<span style={{ color: C.petroleoClaro }}>Manager</span>
          </span>
        </div>
        <span style={{ fontFamily: FM, fontSize: 12, color: C.bruma }}>ALMOXARIFE</span>
      </div>

      {/* abas */}
      <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${C.grafite}` }}>
        {ABAS_OPERACAO.map(([k, r]) => (
          <button
            key={k}
            onClick={() => { setTela(k); limpar(); }}
            style={{
              flex: 1, height: 46, fontFamily: FD, fontWeight: 600, fontSize: 14,
              background: "transparent", cursor: "pointer",
              color: tela === k ? C.branco : C.bruma,
              borderBottom: `2px solid ${tela === k ? C.petroleoClaro : "transparent"}`,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: 16, paddingBottom: 96 }}>
        {/* busca */}
        <div className="flex gap-2" style={{ marginBottom: 16 }}>
          <button
            title="Ler código de barras"
            style={{
              width: 56, height: 56, borderRadius: 6, background: C.aco,
              border: `1px solid ${C.grafite}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Camera size={22} color={C.petroleoClaro} />
          </button>
          <div className="relative flex-1">
            <Search size={18} color={C.bruma} style={{ position: "absolute", left: 14, top: 19 }} />
            <input
              ref={inputRef}
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setSel(null); }}
              placeholder="Buscar item ou SKU"
              style={{
                width: "100%", height: 56, borderRadius: 6, background: C.aco,
                border: `1px solid ${C.grafite}`, color: C.branco, paddingLeft: 42,
                paddingRight: 14, fontFamily: FB, fontSize: 15, outline: "none",
              }}
            />
          </div>
        </div>

        {/* lista ou item selecionado */}
        {!sel ? (
          <div className="flex flex-col gap-2">
            <div style={{ marginBottom: 4 }}>
              <RotuloSecao escuro>{busca ? "Resultados" : "Últimos movimentados"}</RotuloSecao>
            </div>
            {filtrados.length === 0 && (
              <div style={{ fontFamily: FB, fontSize: 14, color: C.bruma, padding: "24px 0" }}>
                Nenhum item encontrado. Verifique o SKU ou cadastre o item na gestão.
              </div>
            )}
            {filtrados.map((i) => (
              <Etiqueta key={i.id} item={i} onClick={() => { setSel(i); setQuantidade(1); }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <button onClick={limpar} style={{ background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.bruma, fontFamily: FB, fontSize: 14 }}>
                <ArrowLeft size={16} /> Trocar item
              </button>
            </div>

            <Etiqueta item={sel} ativo />

            {tela !== "consulta" && (
              <>
                <div>
                  <div style={{ marginBottom: 10 }}><RotuloSecao escuro>Quantidade</RotuloSecao></div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                      style={{ width: 56, height: 56, borderRadius: 6, background: C.aco, border: `1px solid ${C.grafite}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <Minus size={22} color={C.branco} />
                    </button>
                    <div className="flex-1 flex items-baseline justify-center gap-2">
                      <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 44, color: C.branco, lineHeight: 1 }}>{quantidade}</span>
                      <span style={{ fontFamily: FM, fontSize: 14, color: C.bruma }}>{sel.un}</span>
                    </div>
                    <button
                      onClick={() => setQuantidade((q) => q + 1)}
                      style={{ width: 56, height: 56, borderRadius: 6, background: C.aco, border: `1px solid ${C.grafite}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <Plus size={22} color={C.branco} />
                    </button>
                  </div>
                </div>

                {entrada ? (
                  <div>
                    <div style={{ marginBottom: 10 }}><RotuloSecao escuro>Custo unitário da compra</RotuloSecao></div>
                    <input
                      value={custoEntrada}
                      onChange={(e) => setCustoEntrada(e.target.value)}
                      placeholder={sel.custo.toFixed(2).replace(".", ",")}
                      inputMode="decimal"
                      style={{ width: "100%", height: 56, borderRadius: 6, background: C.aco, border: `1px solid ${C.grafite}`, color: C.branco, padding: "0 14px", fontFamily: FM, fontSize: 16, outline: "none" }}
                    />
                    <div style={{ fontFamily: FB, fontSize: 12, color: C.bruma, marginTop: 8 }}>
                      Custo médio atual: {brl(sel.custo)}. A entrada recalcula o custo médio ponderado.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 10 }}><RotuloSecao escuro>Destino · obrigatório</RotuloSecao></div>
                    <div className="flex flex-wrap gap-2">
                      {VEICULOS.slice(0, 3).map((v) => (
                        <Chip key={"v" + v.id} escuro
                          ativo={destino?.tipo === "veiculo" && destino.id === v.id}
                          onClick={() => setDestino({ tipo: "veiculo", id: v.id, rotulo: v.placa })}>
                          <span style={{ fontFamily: FM }}>{v.placa}</span>
                        </Chip>
                      ))}
                      {CENTROS.map((c) => (
                        <Chip key={"c" + c.id} escuro
                          ativo={destino?.tipo === "centro" && destino.id === c.id}
                          onClick={() => setDestino({ tipo: "centro", id: c.id, rotulo: c.nome })}>
                          {c.nome}
                        </Chip>
                      ))}
                      {FUNCIONARIOS.slice(0, 1).map((f) => (
                        <Chip key={"f" + f.id} escuro
                          ativo={destino?.tipo === "funcionario" && destino.id === f.id}
                          onClick={() => setDestino({ tipo: "funcionario", id: f.id, rotulo: f.nome })}>
                          {f.nome}
                        </Chip>
                      ))}
                    </div>

                    {destino?.tipo === "veiculo" && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ marginBottom: 10 }}><RotuloSecao escuro>Quilometragem atual · opcional</RotuloSecao></div>
                        <input
                          value={km} onChange={(e) => setKm(e.target.value)} inputMode="numeric"
                          placeholder={String(VEICULOS.find((v) => v.id === destino.id)?.km ?? "")}
                          style={{ width: "100%", height: 56, borderRadius: 6, background: C.aco, border: `1px solid ${C.grafite}`, color: C.branco, padding: "0 14px", fontFamily: FM, fontSize: 16, outline: "none" }}
                        />
                        <div style={{ fontFamily: FB, fontSize: 12, color: C.bruma, marginTop: 8 }}>
                          Permite calcular o custo por quilômetro rodado.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ação fixa no rodapé */}
      {sel && tela !== "consulta" && (
        <div
          className="flex-shrink-0"
          style={{ padding: 16, background: C.carbono, borderTop: `1px solid ${C.grafite}` }}
        >
          <Botao grande onClick={confirmar} variante={entrada ? "primario" : "primario"}>
            {entrada ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {entrada ? "Registrar entrada" : "Registrar saída"}
          </Botao>
        </div>
      )}
    </div>
  );
}

/* ====================================================== ÁREA DE GESTÃO */

interface IndicadorProps {
  rotulo: string;
  valor: ReactNode;
  sub?: string;
  cor?: string;
}

function Indicador({ rotulo, valor, sub, cor }: IndicadorProps) {
  return (
    <div style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, padding: 18 }}>
      <RotuloSecao>{rotulo}</RotuloSecao>
      <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 30, color: cor || C.tinta, marginTop: 8, lineHeight: 1 }}>
        {valor}
      </div>
      {sub && <div style={{ fontFamily: FB, fontSize: 12, color: C.bruma, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

const COLUNAS_ITENS: [string, number][] = [
  ["SKU", 110], ["Item", 0], ["Categoria", 120], ["Saldo", 90],
  ["Mínimo", 80], ["Custo médio", 110], ["Valor", 110],
];

const RELATORIOS_DISPONIVEIS: [string, string, LucideIcon][] = [
  ["Consumo por veículo", "Custo de material por placa e por período", Truck],
  ["Consumo por centro de custo", "Distribuição do gasto entre setores", Users],
  ["Kardex por item", "Histórico completo de entradas e saídas", List],
  ["Itens parados", "Sem saída há mais de 90 dias", Package],
  ["Valor imobilizado", "Saldo multiplicado pelo custo médio", ShoppingCart],
  ["Consumo anômalo", "Mesmo item saindo repetidamente para o mesmo veículo", Wrench],
];

interface GestaoProps {
  itens: Item[];
  movs: Movimentacao[];
  aba: AbaGestao;
  setAba: (aba: AbaGestao) => void;
}

function Gestao({ itens, movs, aba, setAba }: GestaoProps) {
  const [filtro, setFiltro] = useState("");
  const [cat, setCat] = useState("Todas");

  const valorTotal = itens.reduce((s, i) => s + i.saldo * i.custo, 0);
  const criticos = itens.filter((i) => i.saldo <= i.min);
  const aComprar = itens.filter((i) => i.saldo <= Math.max(i.pp, i.min));
  const categorias = ["Todas", ...Array.from(new Set(itens.map((i) => i.cat)))];

  const lista = itens.filter((i) => {
    const okBusca = !filtro || i.nome.toLowerCase().includes(filtro.toLowerCase()) || i.sku.toLowerCase().includes(filtro.toLowerCase());
    const okCat = cat === "Todas" || i.cat === cat;
    return okBusca && okCat;
  });

  const custoPorVeiculo = useMemo<[string, number][]>(() => {
    const m: Record<string, number> = {};
    movs.filter((x) => x.tipoDestino === "veiculo" && x.tipo === "saida").forEach((x) => {
      m[x.destino] = (m[x.destino] || 0) + x.qtd * x.custo;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [movs]);

  const menu: [AbaGestao, string, LucideIcon][] = [
    ["painel", "Painel", LayoutDashboard],
    ["itens", "Itens", Package],
    ["compras", "Compras", ShoppingCart],
    ["movs", "Movimentações", List],
    ["relatorios", "Relatórios", Truck],
  ];

  return (
    <div className="flex" style={{ background: C.nevoa, minHeight: 640, height: "100%" }}>
      {/* trilho lateral */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: 210, background: C.aco }}>
        <div className="flex items-center gap-2 px-4" style={{ height: 56, borderBottom: `1px solid ${C.grafite}` }}>
          <div style={{ width: 8, height: 20, background: C.petroleoClaro, borderRadius: 2 }} />
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 16, color: C.branco }}>
            Stock<span style={{ color: C.petroleoClaro }}>Manager</span>
          </span>
        </div>
        <div style={{ padding: 10 }}>
          {menu.map(([k, r, Icone]) => (
            <button key={k} onClick={() => setAba(k)}
              className="flex items-center gap-3"
              style={{
                width: "100%", height: 42, borderRadius: 6, padding: "0 12px", cursor: "pointer",
                background: aba === k ? C.petroleo : "transparent",
                color: aba === k ? C.branco : C.bruma,
                fontFamily: FB, fontSize: 14, fontWeight: aba === k ? 500 : 400,
                marginBottom: 2, transition: "background 120ms",
              }}>
              <Icone size={17} /> {r}
            </button>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      <div className="flex-1 overflow-auto" style={{ padding: 24 }}>
        {aba === "painel" && (
          <>
            <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: C.tinta }}>Painel</h1>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.bruma, marginTop: 4 }}>
              Situação do estoque em {agora()}
            </div>

            <div className="grid grid-cols-4 gap-3" style={{ marginTop: 20 }}>
              <Indicador rotulo="Valor em estoque" valor={brl(valorTotal)} sub={`${itens.length} itens ativos`} />
              <Indicador rotulo="Itens críticos" valor={criticos.length} sub="No mínimo ou abaixo" cor={criticos.length ? C.ambar : C.tinta} />
              <Indicador rotulo="Esgotados" valor={itens.filter((i) => i.saldo <= 0).length} sub="Saldo zero" cor={C.carmim} />
              <Indicador rotulo="Movimentações" valor={movs.length} sub="Total registrado" />
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginTop: 24 }}>
              <div style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, padding: 18 }}>
                <RotuloSecao>Precisa de reposição</RotuloSecao>
                <div style={{ marginTop: 12 }}>
                  {aComprar.slice(0, 6).map((i) => {
                    const e = estadoItem(i);
                    return (
                      <div key={i.id} className="flex items-center justify-between"
                        style={{ padding: "9px 0", borderBottom: `1px solid ${C.giz}` }}>
                        <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                          <PontoEstado cor={e.cor} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: FB, fontSize: 13, color: C.tinta, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.nome}</div>
                            <div style={{ fontFamily: FM, fontSize: 11, color: C.bruma }}>{i.sku}</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: FM, fontSize: 13, color: C.tinta, whiteSpace: "nowrap" }}>
                          {qtd(i.saldo)} / {qtd(i.pp)} {i.un}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, padding: 18 }}>
                <RotuloSecao>Custo por veículo</RotuloSecao>
                <div style={{ marginTop: 12 }}>
                  {custoPorVeiculo.length === 0 && (
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.bruma }}>
                      Nenhuma saída vinculada a veículo ainda.
                    </div>
                  )}
                  {custoPorVeiculo.map(([placa, valor]) => {
                    const max = custoPorVeiculo[0][1] || 1;
                    return (
                      <div key={placa} style={{ padding: "9px 0" }}>
                        <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                          <span style={{ fontFamily: FM, fontSize: 13, color: C.tinta }}>{placa}</span>
                          <span style={{ fontFamily: FM, fontSize: 13, color: C.tinta }}>{brl(valor)}</span>
                        </div>
                        <div style={{ height: 6, background: C.nevoa, borderRadius: 3 }}>
                          <div style={{ width: `${(valor / max) * 100}%`, height: 6, background: C.petroleo, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {aba === "itens" && (
          <>
            <div className="flex items-center justify-between">
              <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: C.tinta }}>Itens</h1>
              <div style={{ width: 130 }}><Botao onClick={() => {}}><Plus size={16} /> Novo item</Botao></div>
            </div>

            <div className="flex gap-2" style={{ marginTop: 18, marginBottom: 14 }}>
              <div className="relative" style={{ flex: 1, maxWidth: 340 }}>
                <Search size={16} color={C.bruma} style={{ position: "absolute", left: 12, top: 13 }} />
                <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar item ou SKU"
                  style={{ width: "100%", height: 42, borderRadius: 6, background: C.branco, border: `1px solid ${C.giz}`, color: C.tinta, paddingLeft: 36, paddingRight: 12, fontFamily: FB, fontSize: 14, outline: "none" }} />
              </div>
              <select value={cat} onChange={(e) => setCat(e.target.value)}
                style={{ height: 42, borderRadius: 6, background: C.branco, border: `1px solid ${C.giz}`, color: C.tinta, padding: "0 12px", fontFamily: FB, fontSize: 14 }}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div style={{ width: 120, marginLeft: "auto" }}>
                <Botao variante="secundario" onClick={() => {}}><Download size={15} /> CSV</Botao>
              </div>
            </div>

            <div style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, overflow: "hidden" }}>
              <div className="flex items-center" style={{ height: 40, background: C.nevoa, borderBottom: `1px solid ${C.giz}`, padding: "0 14px" }}>
                {COLUNAS_ITENS.map(([r, w], k) => (
                  <div key={r} style={{
                    width: w || undefined, flex: w ? undefined : 1,
                    fontFamily: FD, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: C.bruma,
                    textAlign: k >= 3 ? "right" : "left", paddingRight: k >= 3 ? 12 : 0,
                  }}>{r}</div>
                ))}
                <div style={{ width: 26 }} />
              </div>
              {lista.map((i) => {
                const e = estadoItem(i);
                return (
                  <div key={i.id} className="flex items-center"
                    style={{ height: 44, borderBottom: `1px solid ${C.giz}`, padding: "0 14px" }}>
                    <div style={{ width: 110, fontFamily: FM, fontSize: 13, color: C.bruma }}>{i.sku}</div>
                    <div style={{ flex: 1, fontFamily: FB, fontSize: 13, color: C.tinta, paddingRight: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.nome}</div>
                    <div style={{ width: 120, fontFamily: FB, fontSize: 13, color: C.bruma }}>{i.cat}</div>
                    <div style={{ width: 90, textAlign: "right", paddingRight: 12, fontFamily: FM, fontSize: 13, color: C.tinta }}>{qtd(i.saldo)} {i.un}</div>
                    <div style={{ width: 80, textAlign: "right", paddingRight: 12, fontFamily: FM, fontSize: 13, color: C.bruma }}>{qtd(i.min)}</div>
                    <div style={{ width: 110, textAlign: "right", paddingRight: 12, fontFamily: FM, fontSize: 13, color: C.tinta }}>{brl(i.custo)}</div>
                    <div style={{ width: 110, textAlign: "right", paddingRight: 12, fontFamily: FM, fontSize: 13, color: C.tinta }}>{brl(i.saldo * i.custo)}</div>
                    <div style={{ width: 26, display: "flex", justifyContent: "flex-end" }} title={e.texto}><PontoEstado cor={e.cor} /></div>
                  </div>
                );
              })}
              {lista.length === 0 && (
                <div style={{ padding: 28, fontFamily: FB, fontSize: 14, color: C.bruma }}>
                  Nenhum item corresponde ao filtro. Limpe a busca para ver todos.
                </div>
              )}
            </div>
          </>
        )}

        {aba === "compras" && (
          <>
            <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: C.tinta }}>Compras</h1>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.bruma, marginTop: 4 }}>
              Itens no ponto de reposição, agrupados por fornecedor
            </div>
            <div style={{ marginTop: 20 }}>
              {Array.from(new Set(aComprar.map((i) => i.forn))).map((forn) => {
                const doForn = aComprar.filter((i) => i.forn === forn);
                const total = doForn.reduce((s, i) => s + Math.max(i.pp - i.saldo, 0) * i.custo, 0);
                return (
                  <div key={forn} style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, marginBottom: 12 }}>
                    <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: `1px solid ${C.giz}` }}>
                      <span style={{ fontFamily: FD, fontWeight: 600, fontSize: 15, color: C.tinta }}>{forn}</span>
                      <span style={{ fontFamily: FM, fontSize: 14, color: C.tinta }}>{brl(total)}</span>
                    </div>
                    {doForn.map((i) => {
                      const sug = Math.max(i.pp - i.saldo, 0);
                      const e = estadoItem(i);
                      return (
                        <div key={i.id} className="flex items-center" style={{ padding: "10px 18px", borderBottom: `1px solid ${C.giz}` }}>
                          <PontoEstado cor={e.cor} />
                          <div style={{ flex: 1, marginLeft: 12 }}>
                            <div style={{ fontFamily: FB, fontSize: 13, color: C.tinta }}>{i.nome}</div>
                            <div style={{ fontFamily: FM, fontSize: 11, color: C.bruma }}>{i.sku} · saldo {qtd(i.saldo)} {i.un}</div>
                          </div>
                          <div style={{ fontFamily: FM, fontSize: 13, color: C.tinta, width: 110, textAlign: "right" }}>
                            comprar {qtd(sug)} {i.un}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {aba === "movs" && (
          <>
            <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: C.tinta }}>Movimentações</h1>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.bruma, marginTop: 4 }}>
              Histórico imutável. Correção somente por estorno.
            </div>
            <div style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, marginTop: 20, overflow: "hidden" }}>
              {[...movs].reverse().map((m) => {
                const it = itens.find((i) => i.id === m.itemId);
                const saida = m.tipo === "saida";
                return (
                  <div key={m.id} className="flex items-center" style={{ padding: "12px 18px", borderBottom: `1px solid ${C.giz}` }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                      background: saida ? "rgba(214,69,69,.1)" : "rgba(63,143,111,.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {saida ? <TrendingDown size={16} color={C.carmim} /> : <TrendingUp size={16} color={C.musgo} />}
                    </div>
                    <div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                      <div style={{ fontFamily: FB, fontSize: 13, color: C.tinta }}>{it?.nome}</div>
                      <div style={{ fontFamily: FM, fontSize: 11, color: C.bruma }}>
                        {it?.sku} · {m.destino} · {m.usuario}
                      </div>
                    </div>
                    <div style={{ width: 110, textAlign: "right", fontFamily: FM, fontSize: 13, color: saida ? C.carmim : C.musgo }}>
                      {saida ? "−" : "+"}{qtd(m.qtd)} {it?.un}
                    </div>
                    <div style={{ width: 110, textAlign: "right", fontFamily: FM, fontSize: 13, color: C.tinta }}>
                      {brl(m.qtd * m.custo)}
                    </div>
                    <div style={{ width: 96, textAlign: "right", fontFamily: FM, fontSize: 11, color: C.bruma }}>
                      {m.data.split(" ")[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {aba === "relatorios" && (
          <>
            <h1 style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: C.tinta }}>Relatórios</h1>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.bruma, marginTop: 4 }}>
              Todos exportáveis em CSV
            </div>
            <div className="grid grid-cols-2 gap-3" style={{ marginTop: 20 }}>
              {RELATORIOS_DISPONIVEIS.map(([t, d, Icone]) => (
                <div key={t} className="flex items-start gap-3"
                  style={{ background: C.branco, border: `1px solid ${C.giz}`, borderRadius: 6, padding: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 6, background: C.nevoa, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icone size={17} color={C.petroleo} />
                  </div>
                  <div>
                    <div style={{ fontFamily: FD, fontWeight: 600, fontSize: 14, color: C.tinta }}>{t}</div>
                    <div style={{ fontFamily: FB, fontSize: 12.5, color: C.bruma, marginTop: 3 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================ APP */

export default function StockManager() {
  const [modo, setModo] = useState<"operacao" | "gestao">("operacao");
  const [itens, setItens] = useState<Item[]>(ITENS_INICIAIS);
  const [movs, setMovs] = useState<Movimentacao[]>(MOV_INICIAIS);
  const [telaOp, setTelaOp] = useState<TelaOperacao>("saida");
  const [abaGestao, setAbaGestao] = useState<AbaGestao>("painel");

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  /* replica a trigger do banco: saldo derivado e custo médio ponderado */
  function registrar(mov: RegistrarPayload) {
    setItens((prev) =>
      prev.map((i) => {
        if (i.id !== mov.itemId) return i;
        if (mov.tipo === "entrada") {
          const novoSaldo = i.saldo + mov.qtd;
          const novoCusto = novoSaldo > 0
            ? (i.saldo * i.custo + mov.qtd * mov.custo) / novoSaldo
            : mov.custo;
          return { ...i, saldo: novoSaldo, custo: novoCusto };
        }
        return { ...i, saldo: i.saldo - mov.qtd };
      })
    );
    setMovs((prev) => [
      ...prev,
      { id: prev.length + 1, ...mov, data: agora(), usuario: "Almoxarife" },
    ]);
  }

  return (
    <div style={{ background: C.nevoa, minHeight: "100vh", fontFamily: FB }}>
      {/* alternador de demonstração */}
      <div className="flex items-center justify-between"
        style={{ background: C.carbono, padding: "10px 16px", borderBottom: `1px solid ${C.grafite}` }}>
        <div className="flex items-center gap-2">
          <CircleDot size={14} color={C.ambar} />
          <span style={{ fontFamily: FM, fontSize: 11, color: C.bruma, letterSpacing: "0.04em" }}>
            PROTÓTIPO · DADOS EM MEMÓRIA
          </span>
        </div>
        <div className="flex gap-2">
          {([["operacao", "Operação"], ["gestao", "Gestão"]] as [typeof modo, string][]).map(([k, r]) => (
            <button key={k} onClick={() => setModo(k)}
              style={{
                fontFamily: FD, fontWeight: 600, fontSize: 13, height: 32, padding: "0 16px",
                borderRadius: 6, cursor: "pointer",
                background: modo === k ? C.petroleo : "transparent",
                color: modo === k ? C.branco : C.bruma,
                border: `1px solid ${modo === k ? C.petroleo : C.grafite}`,
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {modo === "operacao" ? (
        <div className="flex justify-center" style={{ padding: 24 }}>
          <div style={{
            width: "100%", maxWidth: 430, borderRadius: 10, overflow: "hidden",
            border: `1px solid ${C.grafite}`, boxShadow: "0 12px 40px rgba(0,0,0,.18)",
          }}>
            <Operacao itens={itens} registrar={registrar} tela={telaOp} setTela={setTelaOp} />
          </div>
        </div>
      ) : (
        <Gestao itens={itens} movs={movs} aba={abaGestao} setAba={setAbaGestao} />
      )}
    </div>
  );
}
