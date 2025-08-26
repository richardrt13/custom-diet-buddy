// src/components/PlanDisplay.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Target, Download, Share } from "lucide-react";

interface Meal {
  type: string;
  foods: Array<{
    name: string;
    quantity: string;
    calories: number;
  }>;
}

interface NutritionPlan {
  id: number;
  patientName: string;
  maxCalories: number;
  mealType: string;
  macroPriority: string;
  foods: string[];
  generatedAt: Date;
  meals: Meal[];
}

interface PlanDisplayProps {
  plan: NutritionPlan;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
  all: "Todas as refeições"
};

const MACRO_LABELS: Record<string, string> = {
  carbs: "Carboidratos",
  protein: "Proteínas",
  fats: "Gorduras",
  fiber: "Fibras"
};

export default function PlanDisplay({ plan }: PlanDisplayProps) {
  const totalCalories = plan.meals.reduce((total, meal) =>
    total + meal.foods.reduce((mealTotal, food) => mealTotal + food.calories, 0), 0
  );

  const formatDate = (date: Date | string) => {
    // CORREÇÃO: Garante que a data seja um objeto Date válido
    const validDate = typeof date === 'string' ? new Date(date) : date;
    if (!validDate || isNaN(validDate.getTime())) return "Data inválida";

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(validDate);
  };


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium">
      <CardHeader className="bg-gradient-to-r from-success/10 to-info/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-success" />
            Plano para {plan.patientName}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(plan.generatedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Máx. {plan.maxCalories} kcal
          </div>
          <Badge variant="outline">
            {MEAL_TYPE_LABELS[plan.mealType]}
          </Badge>
          <Badge variant="secondary">
            Foco: {MACRO_LABELS[plan.macroPriority]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalCalories}</div>
            <div className="text-sm text-muted-foreground">Calorias Totais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info">{plan.meals.length}</div>
            <div className="text-sm text-muted-foreground">Refeições</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{plan.foods.length}</div>
            <div className="text-sm text-muted-foreground">Alimentos</div>
          </div>
        </div>

        <Separator />

        {/* Meals */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Refeições Planejadas</h3>

          {plan.meals.map((meal, mealIndex) => (
            <Card key={mealIndex} className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary">
                  {MEAL_TYPE_LABELS[meal.type]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {meal.foods.map((food, foodIndex) => (
                  <div key={foodIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-muted-foreground">{food.quantity}</div>
                    </div>
                    <Badge variant="outline">
                      {food.calories} kcal
                    </Badge>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center font-medium">
                  <span>Total da refeição:</span>
                  <span className="text-primary">
                    {meal.foods.reduce((total, food) => total + food.calories, 0)} kcal
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Foods Used */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Alimentos Utilizados</h3>
          <div className="flex flex-wrap gap-2">
            {plan.foods.map(food => (
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