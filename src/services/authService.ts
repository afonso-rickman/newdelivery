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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("[authService] Erro no Supabase Auth", error);
      throw new Error("Email ou senha inválidos");
    }

    // Busca registro do usuário na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, empresa_id, role, nome, telefone, email")
      .eq("id", data.user.id)
      .single();

    if (usuarioError || !usuario) {
      console.error("[authService] Usuário não encontrado na tabela usuarios", usuarioError);
      throw new Error("Usuário não encontrado na tabela usuarios");
    }

    // Se developer → ignora validação de empresa
    if (usuario.role === "developer") {
      return usuario;
    }

    // Se não foi passado slug → login genérico
    if (!slug) {
      return usuario;
    }

    // Busca empresa pelo slug
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id, slug")
      .eq("slug", slug)
      .single();

    if (empresaError || !empresa) {
      throw new Error("Empresa não encontrada");
    }

    // Verifica se usuário pertence a essa empresa
    if (usuario.empresa_id !== empresa.id) {
      throw new Error("Usuário não tem acesso a esta empresa");
    }

    return usuario;
  },

  /**
   * Cria usuário no Supabase Auth + vincula na tabela usuarios
   */
  signUp: async (
    email: string,
    password: string,
    nome: string,
    telefone?: string,
    empresaId?: string
  ): Promise<Usuario> => {
    console.log("[authService] Tentando signup", { email, empresaId });

    // 1. Cria usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("[authService] Erro ao criar usuário no Supabase Auth", error);
      throw new Error("Erro ao criar conta. Verifique os dados.");
    }

    const user = data.user;

    // 2. Insere também na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .insert([
        {
          id: user.id, // mesmo ID do Supabase Auth
          empresa_id: empresaId ?? null,
          nome,
          telefone,
          role: "cliente", // padrão inicial
          email,
        },
      ])
      .select("id, empresa_id, role, nome, telefone, email")
      .single();

    if (usuarioError || !usuario) {
      console.error("[authService] Erro ao inserir na tabela usuarios", usuarioError);
      throw new Error("Erro ao salvar usuário na tabela usuarios.");
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
