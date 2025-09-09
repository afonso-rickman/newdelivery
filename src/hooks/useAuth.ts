import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useProtectPage } from "@/hooks/useProtectPage.ts";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
