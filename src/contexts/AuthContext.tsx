import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { onAuthStateChanged, signOut } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  empresa_id?: string;
  nome?: string;
  telefone?: string;
  slug?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, empresaSlug: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Login com suporte a empresa (slug)
  const signIn = useCallback(
    async (email: string, password: string, empresaSlug: string) => {
      setLoading(true);
      try {
        const result = await import("@/services/authService").then((m) =>
          m.signIn(email, password, empresaSlug)
        );

        if (result) {
          const { user, empresa, usuario } = result;
          setCurrentUser({
            id: user.id,
            email: user.email ?? undefined,
            role: usuario.role,
            empresa_id: usuario.empresa_id,
            nome: usuario.nome,
            telefone: usuario.telefone,
            slug: empresa.slug,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 🔹 Logout
  const handleSignOut = useCallback(async () => {
    await signOut();
    setCurrentUser(null);
  }, []);

  // 🔹 Persistência da sessão
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("role, empresa_id, nome, telefone")
          .eq("id", user.id)
          .single();

        setCurrentUser({
          id: user.id,
          email: user.email ?? undefined,
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
      unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
