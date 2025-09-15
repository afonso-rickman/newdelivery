// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { authService, type Usuario } from "@/services/authService";

interface AuthContextType {
  currentUser: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string, slug?: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone?: string,
    empresaId?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signIn = async (email: string, password: string, slug?: string) => {
    const user = await authService.signIn(email, password, slug);
    setCurrentUser(user);
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    empresaId?: string
  ) => {
    const user = await authService.signUp(
      email,
      password,
      name,
      phone,
      empresaId
    );
    setCurrentUser(user);
  };

  const signOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 Hook useAuth
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
