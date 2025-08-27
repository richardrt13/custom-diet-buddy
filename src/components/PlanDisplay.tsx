// src/components/PlanDisplay.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { User, Calendar, Target, Download, Share, Edit, Save, X, Trash2, Plus } from "lucide-react";

interface Meal {
  type: string;
  foods: Array<{
    name: string;
    quantity: string;
    calories: number;
  }>;
}

interface NutritionPlan {
  patientName: string;
  maxCalories: number;
  mealType: string;
  macroPriority: string;
  foods: string[];
  generatedAt: Date;
  meals: Meal[];
  macros_summary?: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

interface PlanDisplayProps {
  plan: NutritionPlan;
  onSave?: (updatedPlan: NutritionPlan) => void;
}

// MODIFICAÇÃO: Adicionados novos labels de refeição
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Café da manhã",
  morning_snack: "Lanche da Manhã",
  lunch: "Almoço",
  afternoon_snack: "Lanche da Tarde",
  dinner: "Jantar",
  supper: "Ceia",
  snack: "Lanche", // Mantido para refeições únicas
  all: "Todas as refeições",
};

const MACRO_LABELS: Record<string, string> = {
  carbs: "Carboidratos",
  protein: "Proteínas",
  fats: "Gorduras",
  fiber: "Fibras",
  balanced: "Equilibrado",
};

export default function PlanDisplay({ plan, onSave }: PlanDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<NutritionPlan>(JSON.parse(JSON.stringify(plan)));

  useEffect(() => {
    setEditedPlan(JSON.parse(JSON.stringify(plan)));
  }, [plan]);

  const totalCalories = editedPlan.meals.reduce(
    (total, meal) =>
      total +
      meal.foods.reduce((mealTotal, food) => mealTotal + Number(food.calories || 0), 0),
    0
  );

  const handleFoodChange = (mealIndex: number, foodIndex: number, field: string, value: string | number) => {
    const newMeals = [...editedPlan.meals];
    (newMeals[mealIndex].foods[foodIndex] as any)[field] = value;
    setEditedPlan({ ...editedPlan, meals: newMeals });
  };

  const handleAddFood = (mealIndex: number) => {
    const newMeals = [...editedPlan.meals];
    newMeals[mealIndex].foods.push({ name: 'Novo Alimento', quantity: '100g', calories: 0 });
    setEditedPlan({ ...editedPlan, meals: newMeals });
  }

  const handleRemoveFood = (mealIndex: number, foodIndex: number) => {
    const newMeals = [...editedPlan.meals];
    newMeals[mealIndex].foods.splice(foodIndex, 1);
    setEditedPlan({ ...editedPlan, meals: newMeals });
  }

  const handleSave = () => {
    onSave?.(editedPlan);
    setIsEditing(false);
  }

  const handleCancel = () => {
    setEditedPlan(JSON.parse(JSON.stringify(plan)));
    setIsEditing(false);
  }

  const formatDate = (date: Date | string) => {
    const validDate = typeof date === "string" ? new Date(date) : date;
    if (!validDate || isNaN(validDate.getTime())) return "Data inválida";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(validDate);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium">
       <CardHeader className="bg-gradient-to-r from-success/10 to-info/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-success" />
            Plano para {editedPlan.patientName}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </>
            ) : (
               <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(editedPlan.generatedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Máx. {editedPlan.maxCalories} kcal
          </div>
          <Badge variant="outline">
            {MEAL_TYPE_LABELS[editedPlan.mealType] || "Refeição"}
          </Badge>
          <Badge variant="secondary">
            Foco: {MACRO_LABELS[editedPlan.macroPriority]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalCalories}</div>
            <div className="text-sm text-muted-foreground">Calorias Totais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info">{editedPlan.meals.length}</div>
            <div className="text-sm text-muted-foreground">Refeições</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{editedPlan.foods.length}</div>
            <div className="text-sm text-muted-foreground">Alimentos</div>
          </div>
        </div>

        {editedPlan.macros_summary && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Resumo de Macronutrientes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
                  <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{editedPlan.macros_summary.protein_g}g</div>
                      <div className="text-sm text-muted-foreground">Proteínas</div>
                  </div>
                  <div className="text-center">
                      <div className="text-2xl font-bold text-info">{editedPlan.macros_summary.carbs_g}g</div>
                      <div className="text-sm text-muted-foreground">Carboidratos</div>
                  </div>
                  <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{editedPlan.macros_summary.fat_g}g</div>
                      <div className="text-sm text-muted-foreground">Gorduras</div>
                  </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Refeições Planejadas</h3>
          {editedPlan.meals.map((meal, mealIndex) => (
            <Card key={mealIndex} className="shadow-soft">
              <CardHeader className="pb-3 flex-row justify-between items-center">
                <CardTitle className="text-lg text-primary">
                  {MEAL_TYPE_LABELS[meal.type] || meal.type}
                </CardTitle>
                {isEditing && (
                    <Button size="sm" variant="ghost" onClick={() => handleAddFood(mealIndex)}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Alimento
                    </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {meal.foods.map((food, foodIndex) => (
                  <div key={foodIndex} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md">
                    {isEditing ? (
                      <>
                        <Input value={food.name} onChange={e => handleFoodChange(mealIndex, foodIndex, 'name', e.target.value)} className="flex-1"/>
                        <Input value={food.quantity} onChange={e => handleFoodChange(mealIndex, foodIndex, 'quantity', e.target.value)} className="w-24"/>
                        <Input type="number" value={food.calories} onChange={e => handleFoodChange(mealIndex, foodIndex, 'calories', e.target.value)} className="w-24"/>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveFood(mealIndex, foodIndex)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">{food.quantity}</div>
                        </div>
                        <Badge variant="outline">{food.calories} kcal</Badge>
                      </>
                    )}
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center font-medium">
                  <span>Total da refeição:</span>
                  <span className="text-primary">
                    {meal.foods.reduce((total, food) => total + Number(food.calories || 0), 0)} kcal
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Separator />
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Alimentos Utilizados</h3>
          <div className="flex flex-wrap gap-2">
            {editedPlan.foods.map((food) => (
              <Badge key={food} variant="secondary" className="text-sm">
                {food}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}