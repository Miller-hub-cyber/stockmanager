import { type NextRequest } from "next/server";
import { exportarMovimentacoes } from "../../_componentes/exportar";

export const GET = (request: NextRequest) => exportarMovimentacoes("saida", request);
