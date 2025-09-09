import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, type Usuario } from "@/services/authService";

interface AuthContextType {
  currentUser: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string, slug?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega sessão persistida do usuário
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await authService.getCurrentUser();
        if (mounted) setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário atual:", error);
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string, slug?: string) => {
    setLoading(true);
    try {
      const user = await authService.signIn(email, password, slug);
      setCurrentUser(user);
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } finally {
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook auxiliar (pode usar esse em vez de importar direto o contexto)
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider");
  }
  return context;
};
