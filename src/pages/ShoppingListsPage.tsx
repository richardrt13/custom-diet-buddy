// src/pages/ShoppingListsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ShoppingList {
  id: string;
  created_at: string;
  list_details: {
    lista_de_compras?: { // Tornando a propriedade opcional
        categoria: string;
        itens: { item: string; quantidade: string }[];
    }[];
    observacoes?: string; // Tornando a propriedade opcional
  } | null; // list_details também pode ser nulo
}

export default function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function fetchShoppingLists() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("id, created_at, list_details")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar listas de compras:", error);
      toast({
        title: "Erro ao buscar listas",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setLists(data as ShoppingList[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchShoppingLists();
  }, []);

  const handleDeleteList = async (listId: string) => {
    const { error } = await supabase.from("shopping_lists").delete().eq("id", listId);

    if (error) {
      toast({
        title: "Erro ao deletar a lista",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lista deletada com sucesso!",
      });
      fetchShoppingLists();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const countTotalItems = (list?: ShoppingList['list_details']['lista_de_compras']) => {
    if (!list) return 0;
    return list.reduce((total, category) => total + (category.itens?.length || 0), 0);
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
            Visualize, expanda e gerencie todas as suas listas de compras geradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando listas...</p>
          ) : (
            <div className="space-y-4">
                {lists.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {lists.map((list) => (
                      <AccordionItem value={list.id} key={list.id}>
                        <div className="flex items-center justify-between pr-2">
                          <AccordionTrigger className="flex-1 text-left">
                              <div className="flex items-center gap-4">
                                  <span className="font-semibold text-lg">
                                      Lista de {formatDate(list.created_at)}
                                  </span>
                                  <Badge variant="secondary">{countTotalItems(list.list_details?.lista_de_compras)} itens</Badge>
                              </div>
                          </AccordionTrigger>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente a lista de compras.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteList(list.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <AccordionContent>
                          <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                              {list.list_details?.lista_de_compras?.map((category, index) => (
                                  <div key={`${category.categoria}-${index}`}>
                                      <h4 className="font-semibold text-primary">{category.categoria}</h4>
                                      <ul className="list-disc list-inside pl-2 text-muted-foreground text-sm space-y-1 mt-1">
                                          {category.itens.map((item, itemIndex) => (
                                              <li key={itemIndex}>{item.quantidade} de {item.item}</li>
                                          ))}
                                      </ul>
                                  </div>
                              )) ?? <p className="text-sm text-muted-foreground">Não há itens nesta lista.</p>}
                          </div>
                          {list.list_details?.observacoes && (
                              <>
                              <hr className="my-4"/>
                              <p className="text-sm text-muted-foreground italic">
                                  <strong>Observação:</strong> {list.list_details.observacoes}
                              </p>
                              </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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