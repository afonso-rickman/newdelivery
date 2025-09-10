// src/pages/AdminOrders.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database } from "lucide-react";

interface Pedido {
  id: string;
  cliente_nome: string;
  status: string;
  created_at: string;
}

const AdminOrders = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [empresa, setEmpresa] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Buscar empresa pelo slug
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("empresas")
        .select("id, nome")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Erro ao buscar empresa:", error.message);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da empresa.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setEmpresa(data);
        setEmpresaId(data.id);
      }
    };

    fetchEmpresa();
  }, [slug, toast]);

  // 🔹 Buscar pedidos da empresa
  useEffect(() => {
    const fetchPedidos = async () => {
      if (!empresaId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar pedidos:", error.message);
        toast({
          title: "Erro",
          description: "Erro ao carregar pedidos do Supabase.",
          variant: "destructive",
        });
      } else {
        setPedidos(data || []);
      }

      setLoading(false);
    };

    fetchPedidos();
  }, [empresaId, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h1 className="text-2xl font-bold">
            Pedidos {empresa?.nome ?? ""}
          </h1>
          <Button
            onClick={() => navigate(`/${slug}/admin-dashboard`)}
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Loading */}
        {loading && <p className="text-center text-sm">Carregando pedidos...</p>}

        {/* Sem pedidos */}
        {!loading && pedidos.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-700 text-sm">
                Nenhum pedido encontrado para esta empresa.
              </p>
            </div>
          </div>
        )}

        {/* Lista de pedidos */}
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h2 className="font-semibold text-lg">
                Pedido #{pedido.id.slice(0, 8)}
              </h2>
              <p className="text-sm text-gray-700">
                Cliente: {pedido.cliente_nome}
              </p>
              <p className="text-sm text-gray-500">
                Status:{" "}
                <span className="font-medium text-gray-800">
                  {pedido.status}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                Criado em:{" "}
                {new Date(pedido.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
