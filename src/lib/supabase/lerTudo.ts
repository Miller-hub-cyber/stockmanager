const TAMANHO_PAGINA = 1000; // limite do PostgREST por requisicao

/** Le uma consulta inteira em paginas de 1000. */
export async function lerTudo<T>(
  buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await buscar(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(error.message);
    const pagina = data ?? [];
    todas.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) return todas;
  }
}
