import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const { currentUser, loading: authUserLoading } = useAuthState();
  const { empresa, loading: empresaLoading } = useEmpresa(
    authUserLoading ? null : currentUser?.id ?? null
  );

  const [pratos, setPratos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!empresa?.id) return;

    const fetchPratos = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("empresa_id", empresa.id);

      if (error) {
        console.error("Erro ao buscar pratos:", error.message);
      } else {
        setPratos(data || []);
      }
    };

    fetchPratos();
  }, [empresa]);

  if (empresaLoading || authUserLoading) {
    return <p>Carregando cardápio...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cardápio da {empresa?.nome}</h1>
        <Button onClick={() => navigate("/admin-dashboard")}>Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pratos.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            Nenhum prato encontrado.
          </p>
        ) : (
          pratos.map((prato) => (
            <div
              key={prato.id}
              className="p-4 border border-gray-200 rounded-md shadow-sm bg-white"
            >
              <h2 className="text-lg font-semibold">{prato.nome}</h2>
              <p className="text-gray-600">
                R$ {prato.preco?.toFixed(2).replace(".", ",")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
