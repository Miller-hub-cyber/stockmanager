import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinoPorPerfil } from "@/lib/perfil";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("perfil")
    .eq("id", user.id)
    .single();

  // Logado no Auth mas sem usuario ativo: "/login" mandaria de volta para ca (loop).
  if (!usuario) redirect("/sem-acesso");

  redirect(destinoPorPerfil(usuario.perfil));
}
