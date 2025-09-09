import { supabase } from "@/integrations/supabase/client";

// 🔹 Login com validação de empresa (via slug)
export async function signIn(email: string, password: string, empresaSlug: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  if (!data.user) return null;

  // Busca empresa pelo slug
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id, slug")
    .eq("slug", empresaSlug)
    .single();

  if (empresaError || !empresa) {
    throw new Error("Empresa não encontrada");
  }

  // Verifica se usuário pertence à empresa
  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, empresa_id, role, nome, telefone, email")
    .eq("id", data.user.id)
    .eq("empresa_id", empresa.id)
    .single();

  if (usuarioError || !usuario) {
    throw new Error("Usuário não tem acesso a esta empresa");
  }

  return { user: data.user, empresa, usuario };
}

// 🔹 Logout
export async function signOut() {
  await supabase.auth.signOut();
}

// 🔹 Listener para mudanças de sessão
export function onAuthStateChanged(callback: (user: any) => void) {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => listener.subscription.unsubscribe();
}
