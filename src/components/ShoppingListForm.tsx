// src/components/ShoppingListForm.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingCart, Users, Calendar, Target, Plus, Trash2, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MealPlanDisplay from "./MealPlanDisplay";

interface Person {
  gender: string;
  weight: string;
  height: string;
  age: string;
  tmb: string;
}

// LINHA MODIFICADA: Adicionada a interface de props
interface ShoppingListFormProps {
  onShoppingListGenerated: (listData: any) => void;
}

// LINHA MODIFICADA: Adicionada a prop 'onShoppingListGenerated'
export default function ShoppingListForm({ onShoppingListGenerated }: ShoppingListFormProps) {
  const [objective, setObjective] = useState("");
  const [people, setPeople] = useState<Person[]>([{ gender: "", weight: "", height: "", age: "", tmb: "" }]);
  const [timePeriod, setTimePeriod] = useState("");
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();

  const handleAddPerson = () => {
    setPeople([...people, { gender: "", weight: "", height: "", age: "", tmb: "" }]);
  };

  const handleRemovePerson = (index: number) => {
    const newPeople = people.filter((_, i) => i !== index);
    setPeople(newPeople);
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const newPeople = [...people];
    newPeople[index][field] = value;
    setPeople(newPeople);
  };

  const validateForm = () => {
    if (!objective) {
      toast({ title: "Campo obrigatório", description: "Por favor, selecione o objetivo principal.", variant: "destructive" });
      return false;
    }
    if (!timePeriod) {
      toast({ title: "Campo obrigatório", description: "Por favor, selecione o período de tempo.", variant: "destructive" });
      return false;
    }
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      if (!person.gender || !person.weight || !person.height || !person.age) {
        toast({
          title: `Dados incompletos para a Pessoa ${i + 1}`,
          description: "Preencha gênero, peso, altura e idade para todas as pessoas.",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const generateShoppingList = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingList(true);
    setShoppingList(null);
    setMealPlan(null);

    try {
      const response = await fetch("/api/generate-shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective, people, timePeriod }),
      });

      if (!response.ok) throw new Error("Failed to generate shopping list");

      const data = await response.json();
      setShoppingList(data);

      // LINHA MODIFICADA: Chama a função para salvar a lista no banco de dados
      onShoppingListGenerated({ listData: data, objective, people, timePeriod });

      toast({
        title: "Lista de Compras Gerada e Salva!",
        description: "Agora você pode gerar um plano alimentar com base na lista.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar lista de compras",
        description: "Ocorreu um erro ao se comunicar com a IA. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingList(false);
    }
  };

  const generateMealPlan = async () => {
    setIsGeneratingPlan(true);
    setMealPlan(null);

    try {
      const response = await fetch("/api/generate-meal-plan-from-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shoppingList, people, timePeriod, objective }),
      });

      if (!response.ok) throw new Error("Failed to generate meal plan");
      
      const data = await response.json();
      setMealPlan(data);
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
      setIsGeneratingPlan(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium">
      <CardHeader className="bg-gradient-to-r from-success/5 to-info/5">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ShoppingCart className="h-6 w-6 text-success" />
          Gerador de Lista de Compras
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objetivo Principal *
            </Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger><SelectValue placeholder="Selecione o objetivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="ganho de massa">Ganho de Massa Muscular</SelectItem>
                <SelectItem value="manutencao">Manutenção de Peso</SelectItem>
                <SelectItem value="saude geral">Saúde Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período de Tempo *
            </Label>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger><SelectValue placeholder="Selecione o período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1 dia">1 Dia</SelectItem>
                <SelectItem value="7 dias">7 Dias</SelectItem>
                <SelectItem value="30 dias">30 Dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pessoas ({people.length}) *
            </Label>
            <Button onClick={handleAddPerson} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Pessoa
            </Button>
          </div>
          {people.map((person, index) => (
            <Card key={index} className="p-4 relative">
              <CardContent className="flex flex-wrap gap-4 p-0">
                <div className="flex-1 space-y-1 min-w-[150px]">
                  <Label htmlFor={`gender-${index}`}>Gênero *</Label>
                  <Select value={person.gender} onValueChange={(value) => handlePersonChange(index, "gender", value)}>
                    <SelectTrigger id={`gender-${index}`}><SelectValue placeholder="Gênero" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1 min-w-[150px]">
                  <Label htmlFor={`weight-${index}`}>Peso (kg) *</Label>
                  <Input id={`weight-${index}`} type="number" placeholder="Ex: 70" value={person.weight} onChange={(e) => handlePersonChange(index, "weight", e.target.value)} />
                </div>
                <div className="flex-1 space-y-1 min-w-[150px]">
                  <Label htmlFor={`height-${index}`}>Altura (cm) *</Label>
                  <Input id={`height-${index}`} type="number" placeholder="Ex: 175" value={person.height} onChange={(e) => handlePersonChange(index, "height", e.target.value)} />
                </div>
                <div className="flex-1 space-y-1 min-w-[150px]">
                  <Label htmlFor={`age-${index}`}>Idade *</Label>
                  <Input id={`age-${index}`} type="number" placeholder="Ex: 30" value={person.age} onChange={(e) => handlePersonChange(index, "age", e.target.value)} />
                </div>
                <div className="flex-1 space-y-1 min-w-[150px]">
                  <Label htmlFor={`tmb-${index}`} className="flex items-center gap-1">
                    TMB (Opcional)
                  </Label>
                  <Input id={`tmb-${index}`} type="number" placeholder="Ex: 1800" value={person.tmb} onChange={(e) => handlePersonChange(index, "tmb", e.target.value)} />
                </div>
              </CardContent>
              {people.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => handleRemovePerson(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>

        <Separator />

        <Button onClick={generateShoppingList} disabled={isGeneratingList} className="w-full text-lg py-6">
          {isGeneratingList ? "Gerando lista de compras..." : "Gerar Lista de Compras com IA"}
        </Button>

        {shoppingList && (
          <div className="space-y-4 pt-4">
            <Alert>
              <ShoppingCart className="h-4 w-4" />
              <AlertTitle>Lista de Compras Gerada!</AlertTitle>
              <AlertDescription className="mt-2 space-y-4">
                <Textarea
                  readOnly
                  value={shoppingList.lista_de_compras.map((category: any) =>
                    `${category.categoria}:\n` + category.itens.map((item: any) => `- ${item.quantidade} de ${item.item}`).join('\n')
                  ).join('\n\n')}
                  rows={15}
                  className="mt-2 bg-muted/50"
                />
                <h4 className="font-semibold mt-4">Observações da IA:</h4>
                <p className="text-sm">{shoppingList.observacoes}</p>
              </AlertDescription>
            </Alert>

            <Separator />

            <Button
              onClick={generateMealPlan}
              disabled={isGeneratingPlan || !shoppingList}
              className="w-full text-lg py-6"
              variant="success"
            >
              <Utensils className="mr-2 h-5 w-5" />
              {isGeneratingPlan ? "Montando Plano Alimentar..." : "Montar Plano Alimentar com Base na Lista"}
            </Button>
          </div>
        )}

        {mealPlan ? <MealPlanDisplay mealPlan={mealPlan} /> : null}
      </CardContent>
    </Card>
  );
}