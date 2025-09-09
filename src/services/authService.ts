import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, Usuario } from "@/services/authService";

interface AuthContextType {
  currentUser: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string, slug?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário atual:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
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
    await authService.signOut();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de um AuthProvider");
  }
  return context;
};
