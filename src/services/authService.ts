// src/services/authService.ts
import { supabase } from "@/lib/supabaseClient";

export interface Usuario {
  id: string;
  empresa_id: string | null;
  role: "admin" | "entregador" | "developer" | "cliente" | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
}

export const authService = {
  /**
   * Faz login no Supabase Auth + valida empresa pelo slug
   */
  signIn: async (email: string, password: string, slug?: string): Promise<Usuario> => {
	 console.log("[authService] Tentando login", { email, slug });
    // 1. Login no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
		console.error("[authService] Erro no Supabase Auth", error);
      throw new Error("Email ou senha inválidos");
    }

    // 2. Busca registro do usuário na tabela usuarios
	console.log("[authService] Auth OK, buscando em usuarios...");
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, empresa_id, role, nome, telefone, email")
      .eq("id", data.user.id)
      .single();

    if (usuarioError || !usuario) {
	  console.error("[authService] Usuário não encontrado na tabela usuarios", usuarioError);
      throw new Error("Usuário não encontrado na tabela usuarios");
    }

    // 3. Se usuário for developer → ignora validação de empresa
    if (usuario.role === "developer") {
      return usuario;
    }

    // 4. Se não foi passado slug → login genérico (sem empresa específica)
    if (!slug) {
      return usuario;
	    console.log("[authService] Usuário encontrado", usuario);
    }

    // 5. Busca empresa pelo slug
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (empresaError || !empresa) {
      throw new Error("Empresa não encontrada");
    }

    // 6. Verifica se usuário pertence a essa empresa
    if (usuario.empresa_id !== empresa.id) {
      throw new Error("Usuário não tem acesso a esta empresa");
    }

    return usuario;
  },

  /**
   * Logout no Supabase
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Retorna usuário atual autenticado no Supabase + dados de usuarios
   */
  getCurrentUser: async (): Promise<Usuario | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id, empresa_id, role, nome, telefone, email")
      .eq("id", user.id)
      .single();

    return usuario ?? null;
  },
};
