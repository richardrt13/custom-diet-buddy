// src/components/MealPlanDisplay.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Flame } from "lucide-react";

interface Meal {
  nome: string;
  descricao: string;
  calorias_aproximadas: number;
}

interface DailyPlan {
  dia: string;
  refeicoes: Meal[];
}

interface PersonPlan {
  pessoa: string;
  descricao_pessoa: string;
  objetivo_individual: string;
  plano_diario: DailyPlan[];
}

interface MealPlanDisplayProps {
  mealPlan: {
    planos_alimentares: PersonPlan[];
  };
}

export default function MealPlanDisplay({ mealPlan }: MealPlanDisplayProps) {
  if (!mealPlan || !mealPlan.planos_alimentares) {
    return null;
  }

  return (
    <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Plano Alimentar Detalhado</h2>
        <Accordion type="single" collapsible className="w-full">
            {mealPlan.planos_alimentares.map((personPlan, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {personPlan.pessoa}: {personPlan.descricao_pessoa}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <p className="mb-4 text-sm text-muted-foreground">{personPlan.objetivo_individual}</p>
                    {personPlan.plano_diario.map((dailyPlan, dayIndex) => (
                        <Card key={dayIndex} className="mb-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    {dailyPlan.dia}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {dailyPlan.refeicoes.map((meal, mealIndex) => (
                                    <li key={mealIndex} className="p-3 rounded-md border">
                                        <p className="font-semibold">{meal.nome}</p>
                                        <p className="text-sm text-gray-700">{meal.descricao}</p>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Flame className="h-3 w-3 mr-1"/>
                                            ~{meal.calorias_aproximadas} kcal
                                        </div>
                                    </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </AccordionContent>
            </AccordionItem>
            ))}
      </Accordion>
    </div>
  );
}