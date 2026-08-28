"use client";

import type { MouseEvent, ReactNode } from "react";
import { Botao } from "./Botao";

interface BotaoConfirmarProps {
  mensagem: string;
  children: ReactNode;
}

/** Botao de submit que pede confirmacao antes de disparar acoes destrutivas (desativar). */
export function BotaoConfirmar({ mensagem, children }: BotaoConfirmarProps) {
  function aoClicar(evento: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(mensagem)) evento.preventDefault();
  }

  return (
    <Botao type="submit" variante="perigo" onClick={aoClicar}>
      {children}
    </Botao>
  );
}
