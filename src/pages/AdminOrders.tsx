import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AdminOrders() {
  const { currentUser, loading: authUserLoading } = useAuthState();
  const { empresa, loading: empresaLoading } = useEmpresa(
    authUserLoading ? null : currentUser?.id ?? null
  );

  const [pedidos, setPedidos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!empresa?.id) return;

    const fetchPedidos = async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("empresa_id", empresa.id);

      if (error) {
        console.error("Erro ao buscar pedidos:", error.message);
      } else {
        setPedidos(data || []);
      }
    };

    fetchPedidos();
  }, [empresa]);

  if (empresaLoading || authUserLoading) {
    return <p>Carregando pedidos...</p>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos da {empresa?.nome}</h1>
        <Button onClick={() => navigate("/admin-dashboard")}>Dashboard</Button>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-gray-500 text-center">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className="p-4 border border-gray-200 rounded-md shadow-sm bg-white"
            >
              <p className="font-semibold">Pedido #{pedido.id}</p>
              <p>Status: {pedido.status}</p>
              <p>Total: R$ {pedido.total?.toFixed(2).replace(".", ",")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
