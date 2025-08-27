// src/pages/ShoppingListsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ShoppingList {
  id: string;
  created_at: string;
  list_details: {
    lista_de_compras: {
        categoria: string;
        itens: { item: string; quantidade: string }[];
    }[];
    observacoes: string;
  };
}

export default function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchShoppingLists() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // MODIFICAÇÃO: Busca na nova tabela 'shopping_lists'
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id, created_at, list_details")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar listas de compras:", error);
      } else if (data) {
        setLists(data as ShoppingList[]);
      }
      setLoading(false);
    }

    fetchShoppingLists();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const countTotalItems = (list: ShoppingList['list_details']['lista_de_compras']) => {
    if (!list) return 0;
    return list.reduce((total, category) => total + category.itens.length, 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4 md:p-8">
       <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCart className="h-6 w-6" />
            Histórico de Listas de Compras
          </CardTitle>
          <CardDescription>
            Visualize todas as listas de compras geradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando listas...</p>
          ) : (
            <div className="space-y-4">
                {lists.length > 0 ? (
                lists.map((list) => (
                    <Card key={list.id} className="shadow-soft">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                    Lista de {formatDate(list.created_at)}
                                </CardTitle>
                                <Badge variant="secondary">{countTotalItems(list.list_details.lista_de_compras)} itens</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {list.list_details.lista_de_compras.map((category, index) => (
                                    <div key={index}>
                                        <h4 className="font-semibold text-primary">{category.categoria}</h4>
                                        <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm">
                                            {category.itens.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item.quantidade} de {item.item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            {list.list_details.observacoes && (
                                <>
                                <hr className="my-4"/>
                                <p className="text-sm text-muted-foreground italic">
                                    <strong>Observação:</strong> {list.list_details.observacoes}
                                </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma lista de compras encontrada.</p>
                    </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
