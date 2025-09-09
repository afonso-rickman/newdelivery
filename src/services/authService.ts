// services/authService.ts
import { supabase } from "@/lib/supabaseClient";

interface Usuario {
  id: string;
  empresa_id: string | null;
  role: string | null;
  nome?: string;
  telefone?: string;
  email?: string;
}

// ---------- SIGN UP ----------
export async function signUp(
  email: string,
  password: string,
  empresaId: string,
  nome?: string,
  telefone?: string,
  role: string = "cliente"
): Promise<any> {
  // Cria usuário no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const user = data.user;

  // Se o usuário foi criado, insere na tabela 'usuarios'
  if (user) {
    await supabase.from("usuarios").upsert({
      id: user.id, // mesmo id do auth.users
      empresa_id: empresaId,
      nome,
      telefone,
      email,
      role,
    });
  }

  return data;
}

// ---------- SIGN IN ----------
export async function signIn(
  email: string,
  password: string,
  empresaId: string
): Promise<Usuario | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) return null;

  // Busca os dados do usuário vinculado à empresa
  const { data: usuarios, error: userError } = await supabase
    .from("usuarios")
    .select("id, empresa_id, role, nome, telefone, email")
    .eq("id", data.user.id)
    .eq("empresa_id", empresaId)
    .single();

  if (userError) throw userError;

  return usuarios as Usuario;
}

// ---------- LOG OUT ----------
export async function logOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}