// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Settings,
  LogOut,
  ArrowLeft,
  Calculator,
  Percent,
  Users,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/hooks/useAuth";
import { useProtectPage } from "@/hooks/useProtectPage";
import { useAuthState } from "@/hooks/useAuthState";
import { useEmpresa } from "@/hooks/useEmpresa";
import DelivererManagementModal from "@/components/DelivererManagementModal";

const AdminDashboard = () => {
  useProtectPage("admin");

  const { slug } = useParams<{ slug: string }>(); // 🔹 Captura o slug da URL
  const navigate = useNavigate();
  const { logOut } = useAuth();
  const { currentUser, loading: authUserLoading } = useAuthState();
  const { empresa, loading: empresaDataLoading } = useEmpresa(
    authUserLoading ? null : currentUser?.id ?? null
  );

  const [isDelivererModalOpen, setIsDelivererModalOpen] = useState(false);

  const totalLoading = authUserLoading || empresaDataLoading;

  useEffect(() => {
    console.log("AdminDashboard: Estado da empresa atualizado.");
    console.log("authUserLoading:", authUserLoading);
    console.log("currentUser:", currentUser);
    console.log("empresa:", empresa);
    console.log("totalLoading:", totalLoading);
  }, [currentUser, empresa, empresaDataLoading, authUserLoading, totalLoading]);

  const handleOpenDelivererModal = () => {
    if (totalLoading) {
      console.log("AdminDashboard: Carregando dados, não abrindo modal.");
      return;
    }
    if (!empresa?.id) {
      console.warn("AdminDashboard: empresa.id não disponível.");
      return;
    }
    console.log("Abrindo modal de entregadores com empresaId:", empresa.id);
    setIsDelivererModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Painel de Administração</h1>
          {empresa?.nome && (
            <p className="text-gray-600 text-lg mt-1">{empresa.nome}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/${slug}`)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Cardápio
          </Button>
          <Button
            onClick={logOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Bem-vindo, Administrador!</h2>
        <p className="text-gray-600">
          Use este painel para gerenciar todos os aspectos do seu restaurante.
          Você pode visualizar e atualizar pedidos, gerenciar o cardápio completo
          e acessar o sistema de PDV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Pedidos */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Ver Pedidos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os pedidos do restaurante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/${slug}/admin-orders`}>Acessar Pedidos</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cardápio */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Gerenciamento do Cardápio</CardTitle>
            <CardDescription>
              Gerencie categorias, itens do menu, grupos e variações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/${slug}/admin`}>Gerenciar Cardápio</Link>
            </Button>
          </CardContent>
        </Card>

        {/* PDV */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl">Ponto de Venda</CardTitle>
            <CardDescription>
              Acesse o sistema de ponto de venda para registrar pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/${slug}/pdv`}>Acessar PDV</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cupons */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
              <Percent className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Cupons de Desconto</CardTitle>
            <CardDescription>
              Crie e gerencie cupons promocionais para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/${slug}/admin-coupons`}>Gerenciar Cupons</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Entregadores */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Gerenciar Entregadores</CardTitle>
            <CardDescription>
              Cadastre, visualize e gerencie seus entregadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleOpenDelivererModal}
              className="w-full"
              disabled={totalLoading || !empresa?.id}
            >
              {totalLoading ? "Carregando..." : "Acessar Entregadores"}
            </Button>
          </CardContent>
        </Card>

        {/* Pedidos em rota */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Pedidos em Rota de Entrega</CardTitle>
            <CardDescription>
              Visualize aqui todos os pedidos ainda não finalizados/entregues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/${slug}/entregador`}>Ver Pedidos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Entregadores */}
      {isDelivererModalOpen && empresa?.id && (
        <DelivererManagementModal
          isOpen={isDelivererModalOpen}
          onClose={() => setIsDelivererModalOpen(false)}
          empresaId={empresa.id}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
