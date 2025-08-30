// src/pages/ShoppingListsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Trash2, Utensils, FileDown } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import MealPlanDisplay from "@/components/MealPlanDisplay";
import jsPDF from 'jspdf';
// Importe o autoTable como um módulo padrão
import autoTable from 'jspdf-autotable';

interface ShoppingList {
  id: string;
  created_at: string;
  list_details: {
    listData?: {
        lista_de_compras?: {
            categoria: string;
            itens: { item: string; quantidade: string }[];
        }[];
        observacoes?: string;
    },
    people?: any[];
    timePeriod?: string;
    objective?: string;
  } | null;
}

export default function ShoppingListsPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<string | null>(null);
  const [isPlanDialogOpen, setPlanDialogOpen] = useState(false);
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

  const handleGenerateMealPlan = async (list: ShoppingList) => {
    if (!list.list_details || !list.list_details.listData || !list.list_details.people || !list.list_details.timePeriod || !list.list_details.objective) {
      toast({
        title: "Dados incompletos",
        description: "Não foi possível gerar o plano pois faltam informações na lista de compras.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingPlan(list.id);
    setMealPlan(null);

    try {
      const response = await fetch("/api/generate-meal-plan-from-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shoppingList: list.list_details.listData,
          people: list.list_details.people,
          timePeriod: list.list_details.timePeriod,
          objective: list.list_details.objective,
        }),
      });

      if (!response.ok) throw new Error("Falha ao gerar o plano alimentar");

      const data = await response.json();
      setMealPlan(data);
      setPlanDialogOpen(true);
      toast({
        title: "Plano Alimentar Gerado!",
        description: "Seu plano alimentar personalizado está pronto.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar plano alimentar",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(null);
    }
  };

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

  const handleExportPDF = (list: ShoppingList) => {
    if (!list.list_details?.listData?.lista_de_compras) {
        toast({
            title: "Lista Vazia",
            description: "Não é possível exportar uma lista de compras vazia.",
            variant: "destructive"
        });
        return;
    }

    const doc = new jsPDF();
    const tableData = list.list_details.listData.lista_de_compras.flatMap(category =>
        category.itens.map(item => [category.categoria, item.item, item.quantidade])
    );

    doc.text(`Lista de Compras - ${formatDate(list.created_at)}`, 14, 20);

    // Chame o autoTable como uma função, passando o 'doc' como primeiro argumento
    autoTable(doc, {
        startY: 30,
        head: [['Categoria', 'Item', 'Quantidade']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    });

    if (list.list_details.listData.observacoes) {
        const finalY = (doc as any).lastAutoTable.finalY; // Pega a posição final da tabela
        doc.setFontSize(12);
        doc.text("Observações:", 14, finalY + 15);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(list.list_details.listData.observacoes, 180);
        doc.text(splitText, 14, finalY + 22);
    }

    doc.save(`lista-de-compras-${list.created_at.split('T')[0]}.pdf`);
    toast({
        title: "PDF Exportado",
        description: "Sua lista de compras foi exportada com sucesso!"
    });
};

  const countTotalItems = (list?: ShoppingList['list_details']['listData']['lista_de_compras']) => {
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
                                  <Badge variant="secondary">{countTotalItems(list.list_details?.listData?.lista_de_compras)} itens</Badge>
                              </div>
                          </AccordionTrigger>
                           <div className="flex items-center gap-2">
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportPDF(list)}
                              >
                                <FileDown className="h-4 w-4 mr-2" />
                                Exportar PDF
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateMealPlan(list)}
                                disabled={isGeneratingPlan === list.id}
                              >
                                <Utensils className="h-4 w-4 mr-2" />
                                {isGeneratingPlan === list.id ? "Gerando..." : "Gerar Plano"}
                              </Button>
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
                        </div>
                        <AccordionContent>
                          <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                              {list.list_details?.listData?.lista_de_compras?.map((category, index) => (
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
                          {list.list_details?.listData?.observacoes && (
                              <>
                              <hr className="my-4"/>
                              <p className="text-sm text-muted-foreground italic">
                                  <strong>Observação:</strong> {list.list_details.listData.observacoes}
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
       <Dialog open={isPlanDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Plano Alimentar Gerado</DialogTitle>
          </DialogHeader>
          {mealPlan && <MealPlanDisplay mealPlan={mealPlan} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}