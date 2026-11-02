// Junta as migrations num arquivo so para colar no SQL Editor do projeto de
// producao: node supabase/producao/gerar-schema.mjs
// O arquivo gerado nao vai para o git: as migrations continuam sendo a fonte.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(AQUI, "..", "migrations");

// 0005 cria a empresa e os dados ficticios. 0007 vincula o admin de teste a
// essa empresa. Em producao, 01_empresa_e_admin.sql faz esse papel.
const SO_DE_TESTE = ["0005_seed.sql", "0007_seed_usuario.sql"];

const arquivos = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith(".sql") && !SO_DE_TESTE.includes(f))
  .sort();

const blocos = arquivos.map((f) => readFileSync(join(MIGRATIONS, f), "utf8").trimEnd());
writeFileSync(join(AQUI, "00_schema.sql"), blocos.join("\n\n") + "\n");

console.log(`00_schema.sql gerado com ${arquivos.length} migrations (${arquivos[0]} a ${arquivos.at(-1)}).`);
