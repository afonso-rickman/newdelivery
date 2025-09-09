// src/contexts/AuthContext.tsx
import React, { createContext, useEffect, useState, useContext } from "react";
import { User } from "@supabase/supabase-js";
import { signUp, signIn, logOut } from "@/services/authService";
import { supabase } from "@/lib/supabaseClient";

interface UserAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface CustomUser extends User {
  role?: string;
  empresa_id?: string;
  nome?: string;
  telefone?: string;
  address?: UserAddress;
}

interface AuthContextType {
  currentUser: CustomUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    empresaId: string,
    nome?: string,
    telefone?: string,
    role?: string
  ) => Promise<void>;
  signIn: (
    email: string,
    password: string,
    empresaId: string
  ) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        // Busca os dados extras da tabela usuarios
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setCurrentUser({
          ...session.user,
          role: usuario?.role,
          empresa_id: usuario?.empresa_id,
          nome: usuario?.nome,
          telefone: usuario?.telefone,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignUp = async (
    email: string,
    password: string,
    empresaId: string,
    nome?: string,
    telefone?: string,
    role?: string
  ) => {
    setLoading(true);
    await signUp(email, password, empresaId, nome, telefone, role);
    setLoading(false);
  };

  const handleSignIn = async (
    email: string,
    password: string,
    empresaId: string
  ) => {
    setLoading(true);
    const usuario = await signIn(email, password, empresaId);
    if (usuario) {
      setCurrentUser({
        ...usuario,
      } as CustomUser);
    }
    setLoading(false);
  };

  const handleLogOut = async () => {
    await logOut();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        logOut: handleLogOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};