// src/services/authService.ts
import { supabase } from "@/lib/supabaseClient";

export const authService = {
  // ... signIn, signOut, getCurrentUser já existentes

  /**
   * Faz registro de novo usuário no Supabase Auth
   * + cria entrada na tabela usuarios vinculada à empresa
   */
  signUp: async (
    email: string,
    password: string,
    nome: string,
    telefone: string | null,
    slug: string
  ) => {
    console.log("[authService] Iniciando signup", { email, slug });

    // 1. Buscar empresa pelo slug
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id, slug, nome")
      .eq("slug", slug)
      .single();

    if (empresaError || !empresa) {
      console.error("[authService] Empresa não encontrada pelo slug:", slug, empresaError);
      throw new Error("Empresa não encontrada");
    }

    // 2. Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("[authService] Erro ao criar usuário no Supabase Auth:", error);
      throw new Error(error?.message || "Erro ao criar usuário");
    }

    // 3. Inserir usuário na tabela usuarios com empresa_id
    const { error: insertError } = await supabase.from("usuarios").insert([
      {
        id: data.user.id,
        email,
        nome,
        telefone,
        empresa_id: empresa.id,
        role: "cliente", // ou admin, dependendo do fluxo
      },
    ]);

    if (insertError) {
      console.error("[authService] Erro ao inserir na tabela usuarios:", insertError);
      throw new Error("Erro ao salvar usuário na tabela usuarios");
    }

    console.log("[authService] Usuário registrado com sucesso!");
    return data.user;
  },
};
