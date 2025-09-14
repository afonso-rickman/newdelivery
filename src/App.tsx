// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import Orders from "./pages/Orders";
import AdminOrders from "./pages/AdminOrders";
import Entregador from "./pages/Entregador";
import PDV from "./pages/PDV";
import Api from "./pages/Api";
import NotFound from "./pages/NotFound";
import ShoppingCart from "./components/ShoppingCart";
import Checkout from "./pages/Checkout";
import AppLayout from "@/components/layouts/AppLayout";
import AdminRegister from "./pages/AdminRegister";
import AdminCupons from "@/pages/AdminCupons";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { EmpresaProvider } from "@/contexts/EmpresaContext";

const queryClient = new QueryClient();

const PrivateRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) => {
  const { currentUser, loading } = useAuth();
  const { slug } = useParams();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!currentUser) {
    // 🔹 Mantém consistência do fluxo de login por slug
    return slug ? <Navigate to={`/${slug}/login`} /> : <Navigate to="/login" />;
  }

  // Admin global tem acesso a tudo
  if (currentUser.role === "admin" || currentUser.role === "developer") {
    return <>{children}</>;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/:slug/login" element={<Login />} />
              <Route path="/:slug/register" element={<Register />} />
              <Route path="/admin-register" element={<AdminRegister />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<NotFound />} />

              {/* Rota inicial com cardápio global */}
              <Route
                path="/"
                element={
                  <AppLayout>
                    <Index />
                  </AppLayout>
                }
              />

              {/* Rotas de cliente com slug */}
              <Route
                path="/:slug"
                element={
                  <EmpresaProvider>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </EmpresaProvider>
                }
              />

              {/* Rotas administrativas com slug */}
              <Route
                path="/:slug/admin-dashboard"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/admin"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <Admin />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/admin-orders"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminOrders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/admin-coupons"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <AdminCupons />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/pdv"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <PDV />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/api/*"
                element={
                  <PrivateRoute role="admin">
                    <AppLayout>
                      <Api />
                    </AppLayout>
                  </PrivateRoute>
                }
              />

              {/* Outras rotas protegidas */}
              <Route
                path="/:slug/orders"
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <Orders />
                    </AppLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/:slug/entregador"
                element={
                  <PrivateRoute role="entregador">
                    <AppLayout>
                      <Entregador />
                    </AppLayout>
                  </PrivateRoute>
                }
              />

              {/* Página 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ShoppingCart />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
