// src/pages/AdminOrders.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Firestore
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
// Supabase
import { supabase } from "@/lib/supabaseClient";

import { Order } from "@/types/order";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateOrder, getOrdersByDateRange } from "@/services/orderService";
import OrderDetails from "@/components/OrderDetails";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Database } from "lucide-react";

interface Deliverer {
  id: string;
  nome: string;
}

const AdminOrders: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [empresa, setEmpresa] = useState<any | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // entregadores
  const [isDelivererSelectionModalOpen, setIsDelivererSelectionModalOpen] = useState(false);
  const [availableDeliverers, setAvailableDeliverers] = useState<Deliverer[]>([]);
  const [selectedDelivererId, setSelectedDelivererId] = useState<string>("");
  const [orderToAssignDeliverer, setOrderToAssignDeliverer] = useState<Order | null>(null);
  const [loadingDeliverers, setLoadingDeliverers] = useState(false);

  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: today,
    to: today
  });

  // total summary
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // ── Fetch empresa pelo slug ──
  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from("empresas")
          .select("id, nome")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("AdminOrders: Erro ao buscar empresa pelo slug:", error);
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
      } catch (err) {
        console.error("AdminOrders: Exceção ao buscar empresa:", err);
        toast({
          title: "Erro",
          description: "Erro ao carregar a empresa.",
          variant: "destructive",
        });
      }
    };

    fetchEmpresa();
  }, [slug, toast]);

  // ── Função principal de carregamento (mantém lógica original, mas filtra por empresaId) ──
  const loadOrders = async (status: string, range: DateRange | undefined) => {
    console.log("loadOrders: Iniciando (status, range):", status, range);
    try {
      setLoading(true);
      setError(null);

      if (!range?.from) {
        setOrders([]);
        setLoading(false);
        return;
      }

      if (!empresaId) {
        console.warn("loadOrders: empresaId não definido — pedidos não serão carregados.");
        setOrders([]);
        setLoading(false);
        return;
      }

      const startDate = range.from;
      const endDate = range.to || range.from;

      let fetchedOrders: Order[] = [];

      if (status === "to_deduct") {
        fetchedOrders = await getOrdersByDateRange(startDate, endDate, undefined, "payroll_discount", "a_receber");
      } else {
        fetchedOrders = await getOrdersByDateRange(
          startDate,
          endDate,
          status === "all" ? undefined : status
        );
      }

      // Filtra pelo empresaId — suporta tanto 'empresa_id' (snake) quanto 'empresaId' (camel)
      const filtered = (fetchedOrders || []).filter(o => {
        return (o as any).empresa_id === empresaId || (o as any).empresaId === empresaId;
      });

      console.log(`loadOrders: retornados ${fetchedOrders.length}, após filtro por empresa ${filtered.length}`);

      setOrders(filtered);
      setLoading(false);
    } catch (err: any) {
      console.error("loadOrders: Erro ao carregar pedidos:", err);
      setError("Não foi possível carregar os pedidos. Tente novamente.");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // ── Listener Firestore + chamadas iniciais ──
  useEffect(() => {
    console.log("useEffect principal: activeStatus/dateRange/empresaId mudaram — recarregando pedidos e (re)criando listener.");
    // Sempre (re)carrega pedidos quando os filtros mudam
    loadOrders(activeStatus, dateRange);

    // Se não houver range.from, não cria listener
    if (!dateRange?.from) return;

    // Cria listener no Firestore (mantendo comportamento original).
    // Observação: filter por empresa no query do Firestore pode não corresponder ao nome exato do campo
    // usado no Firestore; por segurança chamamos loadOrders() quando houver mudanças
    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(dateRange.to || dateRange.from);
    end.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const ordersRef = collection(db, "orders");

    const ordersQuery = query(
      ordersRef,
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        console.log("onSnapshot: Mudança detectada nos pedidos — atualizando via loadOrders()");
        // Recarrega e filtra por empresaId
        loadOrders(activeStatus, dateRange);

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const createdAt = data.createdAt?.toDate?.() || new Date();
            const isRecent = (new Date().getTime() - createdAt.getTime()) < 10000;

            if (isRecent && data.status === "pending") {
              toast({
                title: "Novo pedido recebido!",
                description: `Cliente: ${data.customerName}`,
              });
              console.log("onSnapshot: novo pedido pendente detectado:", data.customerName);
            }
          }
        });
      },
      (err) => {
        console.error("onSnapshot: Erro no listener:", err);
        toast({
          title: "Erro",
          description: "Não foi possível monitorar novos pedidos.",
          variant: "destructive",
        });
      }
    );

    return () => {
      console.log("useEffect cleanup: Desinscrevendo listener de pedidos.");
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus, dateRange, empresaId]); // incluiu empresaId para recarregar quando definido

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log("handleDateRangeChange:", range);
    setDateRange(range);
  };

  const handleViewOrder = (order: Order) => {
    console.log("handleViewOrder:", order?.id);
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  // busca entregadores ativos via Supabase (recebe empresaId)
  const fetchAvailableDeliverers = async (empresaIdParam: string) => {
    console.log("fetchAvailableDeliverers: empresaId=", empresaIdParam);
    setLoadingDeliverers(true);
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, role, status_entregador, empresa_id")
        .eq("empresa_id", empresaIdParam);

      if (error) {
        console.error("fetchAvailableDeliverers: erro supabase:", error);
        toast({
          title: "Erro",
          description: "Erro ao buscar entregadores.",
          variant: "destructive",
        });
        setAvailableDeliverers([]);
        setSelectedDelivererId("");
        setLoadingDeliverers(false);
        return;
      }

      console.log("fetchAvailableDeliverers: dados brutos:", data);
      const filtered: Deliverer[] = (data || [])
        .filter((u: any) => u.role === "entregador" && u.status_entregador === "ativo")
        .map((u: any) => ({ id: u.id, nome: u.nome }));

      setAvailableDeliverers(filtered);
      setSelectedDelivererId(filtered.length > 0 ? filtered[0].id : "");
    } catch (err) {
      console.error("fetchAvailableDeliverers: exceção:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar entregadores.",
        variant: "destructive",
      });
      setAvailableDeliverers([]);
      setSelectedDelivererId("");
    } finally {
      setLoadingDeliverers(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus?: Order["status"],
    cancellationReason?: string,
    paymentStatus?: "a_receber" | "recebido"
  ) => {
    console.log("handleUpdateOrderStatus:", orderId, newStatus, paymentStatus);
    try {
      // Se for transição para delivering e pedido estava ready => abrir seleção de entregador
      if (newStatus === "delivering" && selectedOrder?.status === "ready") {
        console.log("Abrindo modal de escolha de entregador para o pedido:", selectedOrder.id);
        if (selectedOrder && (selectedOrder as any).empresa_id) {
          setOrderToAssignDeliverer(selectedOrder);
          await fetchAvailableDeliverers((selectedOrder as any).empresa_id);
          setIsDelivererSelectionModalOpen(true);
          return;
        } else {
          toast({
            title: "Aviso",
            description: "Empresa do pedido não disponível para atribuição de entregador.",
            variant: "destructive",
          });
          return;
        }
      }

      const updateData: any = {};
      if (newStatus) updateData.status = newStatus;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      console.log("handleUpdateOrderStatus: chamando updateOrder com", updateData);
      const updatedOrder = await updateOrder(orderId, updateData);

      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder(updatedOrder);

        const statusMessage = newStatus
          ? `Status alterado para ${newStatus}`
          : paymentStatus
            ? `Status de pagamento alterado`
            : "Pedido atualizado";

        toast({
          title: "Pedido atualizado",
          description: statusMessage,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Pedido não encontrado ou não atualizado.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("handleUpdateOrderStatus: erro:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleAssignDelivererAndDeliver = async () => {
    console.log("handleAssignDelivererAndDeliver: pedido", orderToAssignDeliverer?.id, "-> entregador", selectedDelivererId);
    if (!orderToAssignDeliverer || !selectedDelivererId) {
      toast({ title: "Erro", description: "Selecione um entregador.", variant: "destructive" });
      return;
    }

    try {
      const updatedOrder = await updateOrder(orderToAssignDeliverer.id, {
        status: "delivering",
        entregador_id: selectedDelivererId,
      });

      if (updatedOrder) {
        setOrders(prev => prev.map(o => o.id === orderToAssignDeliverer.id ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderToAssignDeliverer.id) setSelectedOrder(updatedOrder);

        toast({
          title: "Pedido atualizado",
          description: `Pedido ${orderToAssignDeliverer.id.substring(0,6)} atribuído ao entregador.`,
        });

        setIsDelivererSelectionModalOpen(false);
        setOrderToAssignDeliverer(null);
        setSelectedDelivererId("");
      } else {
        toast({ title: "Aviso", description: "Não foi possível atribuir entregador.", variant: "destructive" });
      }
    } catch (err) {
      console.error("handleAssignDelivererAndDeliver: erro:", err);
      toast({ title: "Erro", description: "Erro ao atribuir entregador.", variant: "destructive" });
    }
  };

  const translateStatus = (status: Order["status"]) => {
    const map: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceito",
      confirmed: "Aceito",
      preparing: "Em produção",
      ready: "Pronto para Entrega",
      delivering: "Saiu para entrega",
      received: "Recebido",
      delivered: "Entrega finalizada",
      cancelled: "Cancelado",
      to_deduct: "A descontar",
      paid: "Pago",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "accepted": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-purple-100 text-purple-800";
      case "ready": return "bg-green-100 text-green-800";
      case "delivering": return "bg-indigo-100 text-indigo-800";
      case "received":
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "to_deduct": return "bg-orange-100 text-orange-800";
      case "paid": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatAddress = (address: Order['address']) => {
    if (!address) return "Endereço não disponível";
    const street = (address as any).street || '';
    const number = (address as any).number || '';
    const complement = (address as any).complement || '';
    const neighborhood = (address as any).neighborhood || '';
    const city = (address as any).city || '';
    const state = (address as any).state || '';
    const zipCode = (address as any).zipCode || '';
    let formatted = `${street}, ${number}`;
    if (complement) formatted += `, ${complement}`;
    formatted += ` - ${neighborhood}, ${city} - ${state}`;
    if (zipCode) formatted += ` (${zipCode})`;
    return formatted;
  };

  const formatFullDate = (dateInput: any) => {
    let date: Date;
    if (dateInput && typeof (dateInput as any).toDate === "function") {
      date = (dateInput as any).toDate();
    } else if (typeof dateInput === "string") {
      date = new Date(dateInput);
    } else {
      date = dateInput || new Date();
    }
    if (isNaN(date.getTime())) return "Data inválida";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  };

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "confirmed", label: "Aceitos" },
    { value: "preparing", label: "Em Produção" },
    { value: "ready", label: "Prontos" },
    { value: "delivering", label: "Em Entrega" },
    { value: "received", label: "Recebidos" },
    { value: "delivered", label: "Finalizados" },
    { value: "cancelled", label: "Cancelados" },
    { value: "to_deduct", label: "A descontar" },
    { value: "paid", label: "Pagos" }
  ];

  const handleRetryLoad = () => {
    loadOrders(activeStatus, dateRange);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Pedidos {empresa?.nome ? `- ${empresa.nome}` : ""}</h1>
        <Button onClick={() => navigate(`/${slug}/admin-dashboard`)} variant="outline">
          Página de Administração
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por status:</label>
            <Select value={activeStatus} onValueChange={(v) => { setActiveStatus(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por período:</label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {loading ? (
          <p className="col-span-full text-center text-gray-500">Carregando pedidos...</p>
        ) : error ? (
          <div className="col-span-full text-center text-red-500">
            <p>{error}</p>
            <Button onClick={handleRetryLoad} className="mt-2">Tentar Novamente</Button>
          </div>
        ) : orders.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">Nenhum pedido encontrado para o período selecionado.</p>
        ) : (
          orders.map((order) => {
            try {
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 py-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pedido #{order.id.substring(0, 6)}</p>
                        <p className="text-sm font-medium text-gray-700">{formatFullDate((order as any).createdAt)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="font-semibold">{(order as any).customerName}</div>
                      <div className="text-sm text-gray-500">{(order as any).customerPhone}</div>
                      <div className="text-xs text-gray-600 mt-1">Endereço: {formatAddress(order.address)}</div>
                      {(order as any).entregador_id && (
                        <div className="text-xs text-gray-600 mt-1">
                          Entregador: {availableDeliverers.find(d => d.id === (order as any).entregador_id)?.nome || (order as any).entregador_id}
                        </div>
                      )}
                      {order.status === "delivered" && (order as any).deliveredAt && (
                        <div className="text-xs text-green-700 font-semibold mt-1">
                          Entrega Finalizada: {formatFullDate((order as any).deliveredAt)}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Itens: {(order as any).items?.length || 0}</p>
                      <p className="font-medium">Total: R$ {(order.total || 0).toFixed(2)}</p>
                      <Button onClick={() => handleViewOrder(order)} variant="outline" className="w-full mt-2">Ver detalhes</Button>

                      {order.status !== "received" && order.status !== "delivered" && (
                        <Button
                          onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                          variant="secondary"
                          className="w-full mt-2"
                        >
                          ✅ Marcar como Recebido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            } catch (renderErr) {
              console.error("Erro ao renderizar pedido:", renderErr, order);
              toast({
                title: "Erro de Renderização",
                description: `Não foi possível exibir o pedido ${order.id.substring(0,6)}.`,
                variant: "destructive",
              });
              return null;
            }
          })
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg border-t-4 border-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total de Pedidos no Período</p>
            <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Valor Total das Vendas</p>
            <p className="text-2xl font-bold text-green-600">R$ {totalSales.toFixed(2)}</p>
          </div>
        </div>
        {dateRange?.from && (
          <div className="text-center mt-2 text-sm text-gray-500">
            Período: {dateRange.from.toLocaleDateString('pt-BR')}
            {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && ` até ${dateRange.to.toLocaleDateString('pt-BR')}`}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>Visualize e atualize o status do pedido</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              discountAmount={(selectedOrder as any).discountAmount || 0}
              couponCode={(selectedOrder as any).couponCode}
              couponType={(selectedOrder as any).couponType}
              couponValue={(selectedOrder as any).couponValue}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de seleção de entregador */}
      <Dialog open={isDelivererSelectionModalOpen} onOpenChange={setIsDelivererSelectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Entregador</DialogTitle>
            <DialogDescription>Selecione o entregador responsável por este pedido.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="deliverer-select" className="text-sm font-medium mb-2 block">Entregador:</label>
            {loadingDeliverers ? (
              <p className="text-gray-500">Carregando entregadores...</p>
            ) : (
              <Select value={selectedDelivererId} onValueChange={setSelectedDelivererId} disabled={availableDeliverers.length === 0}>
                <SelectTrigger id="deliverer-select" className="w-full">
                  <SelectValue placeholder="Selecione um entregador" />
                </SelectTrigger>
                <SelectContent>
                  {availableDeliverers.length > 0 ? availableDeliverers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                  )) : <div className="px-4 py-2 text-sm text-gray-500">Nenhum entregador ativo disponível.</div>}
                </SelectContent>
              </Select>
            )}
            {availableDeliverers.length === 0 && !loadingDeliverers && (
              <p className="text-sm text-red-500 mt-2">Nenhum entregador ativo encontrado. Verifique a tabela 'usuarios' no Supabase.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDelivererSelectionModalOpen(false);
              setOrderToAssignDeliverer(null);
              setSelectedDelivererId("");
            }}>Cancelar</Button>
            <Button onClick={handleAssignDelivererAndDeliver} disabled={!selectedDelivererId || availableDeliverers.length === 0 || loadingDeliverers}>Atribuir e Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
