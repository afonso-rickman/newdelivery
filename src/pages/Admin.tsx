import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { MenuItem, Category, Variation, VariationGroup } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuItemsTab } from "@/components/admin/MenuItemsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { VariationsTab } from "@/components/admin/VariationsTab";
import { VariationGroupsTab } from "@/components/admin/VariationGroupsTab";
import { Database } from "lucide-react";
import { SeedDataButton } from "@/components/admin/SeedDataButton"; 
import { supabase } from "@/lib/supabaseClient";

const Admin = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { empresa, loading: empresaLoading } = useEmpresa(slug ?? null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [variationGroups, setVariationGroups] = useState<VariationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");

  // 🔹 Agora usamos o ID vindo do hook
  const empresaId = empresa?.id ?? null;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (empresaId) {
      loadData();
    } else {
      console.warn("Nenhum empresaId encontrado. Dados podem não ser carregados.");
      setLoading(false);
    }
  }, [currentUser, navigate, empresaId]);

  const loadData = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("empresa_id", empresaId);

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("empresa_id", empresaId);

      if (itemsError) throw itemsError;
      setMenuItems(itemsData);

      const { data: variationGroupsData, error: variationGroupsError } = await supabase
        .from("variation_groups")
        .select("*")
        .eq("empresa_id", empresaId);

      if (variationGroupsError) throw variationGroupsError;
      setVariationGroups(variationGroupsData);

      const { data: variationsData, error: variationsError } = await supabase
        .from("variations")
        .select("*")
        .eq("empresa_id", empresaId);

      if (variationsError) throw variationsError;
      setVariations(variationsData);

      toast({
        title: "Sucesso",
        description: "Dados do cardápio carregados do Supabase.",
      });
    } catch (error) {
      console.error("Admin: Erro ao carregar dados do Supabase:", error);
      toast({
        title: "Aviso",
        description: "Erro ao carregar dados do Supabase.",
        variant: "destructive",
      });
      setMenuItems([]);
      setCategories([]);
      setVariations([]);
      setVariationGroups([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
        {/* Header e botões */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            Cardápio {empresaLoading ? "Carregando..." : empresa?.nome ?? "Empresa não encontrada"}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <SeedDataButton onDataChange={loadData} />
            <Button
              onClick={() => navigate(`/${slug}/admin-dashboard`)}
              variant="outline"
              className="w-full sm:w-auto text-sm"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {loading && <div className="text-center py-4 text-sm">Carregando dados...</div>}

        {!loading && (menuItems.length === 0 || categories.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 mb-2">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <h3 className="font-medium text-yellow-800 text-sm sm:text-base">
                Coleções do Supabase Vazias
              </h3>
            </div>
            <p className="text-yellow-700 mb-3 text-xs sm:text-sm leading-relaxed">
              Parece que as coleções do Supabase estão vazias para esta empresa.
              Use o botão "Importar Dados Iniciais Supabase" acima para popular o cardápio.
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto p-1">
            <TabsTrigger value="menu">Itens</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="variations">Variações</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
          </TabsList>

          <div className="w-full overflow-x-hidden">
            <TabsContent value="menu">
              <MenuItemsTab
                menuItems={menuItems}
                categories={categories}
                variations={variations}
                variationGroups={variationGroups}
                loading={loading}
                onDataChange={loadData}
              />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesTab
                categories={categories}
                loading={loading}
                onDataChange={loadData}
              />
            </TabsContent>
            <TabsContent value="variations">
              <VariationsTab
                variations={variations}
                categories={categories}
                loading={loading}
                onDataChange={loadData}
              />
            </TabsContent>
            <TabsContent value="groups">
              <VariationGroupsTab
                variationGroups={variationGroups}
                variations={variations}
                loading={loading}
                onDataChange={loadData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
