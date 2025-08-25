import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Utensils, Target, Zap, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COMMON_FOODS = [
  "Arroz", "Feijão", "Frango", "Ovos", "Leite", "Banana", "Maçã", "Brócolis", 
  "Batata", "Pão integral", "Aveia", "Salmão", "Tomate", "Alface", "Cenoura"
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Café da manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanche" },
  { value: "all", label: "Todas as refeições do dia" }
];

const MACRO_PRIORITIES = [
  { value: "carbs", label: "Carboidratos", icon: "🌾" },
  { value: "protein", label: "Proteínas", icon: "🥩" },
  { value: "fats", label: "Gorduras", icon: "🥑" },
  { value: "fiber", label: "Fibras", icon: "🥬" }
];

interface NutritionPlanFormProps {
  onPlanGenerated: (plan: any) => void;
}

export default function NutritionPlanForm({ onPlanGenerated }: NutritionPlanFormProps) {
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [customFood, setCustomFood] = useState("");
  const [patientName, setPatientName] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [mealType, setMealType] = useState("");
  const [macroPriority, setMacroPriority] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFoodToggle = (food: string) => {
    setSelectedFoods(prev => 
      prev.includes(food) 
        ? prev.filter(f => f !== food)
        : [...prev, food]
    );
  };

  const addCustomFood = () => {
    if (customFood.trim() && !selectedFoods.includes(customFood.trim())) {
      setSelectedFoods(prev => [...prev, customFood.trim()]);
      setCustomFood("");
    }
  };

  const removeFood = (food: string) => {
    setSelectedFoods(prev => prev.filter(f => f !== food));
  };

  const generatePlan = async () => {
    if (!patientName || !maxCalories || !mealType || !macroPriority || selectedFoods.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para gerar o plano alimentar.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulating AI generation
    setTimeout(() => {
      const mockPlan = {
        id: Date.now(),
        patientName,
        maxCalories: parseInt(maxCalories),
        mealType,
        macroPriority,
        foods: selectedFoods,
        generatedAt: new Date(),
        meals: generateMockMeals()
      };
      
      onPlanGenerated(mockPlan);
      setIsGenerating(false);
      
      toast({
        title: "Plano gerado com sucesso!",
        description: `Plano alimentar criado para ${patientName}`,
      });
    }, 2000);
  };

  const generateMockMeals = () => {
    const meals = [];
    const selectedMealTypes = mealType === "all" 
      ? ["breakfast", "lunch", "dinner", "snack"]
      : [mealType];

    selectedMealTypes.forEach(type => {
      const mealFoods = selectedFoods.slice(0, Math.min(3, selectedFoods.length));
      meals.push({
        type,
        foods: mealFoods.map(food => ({
          name: food,
          quantity: `${Math.floor(Math.random() * 150) + 50}g`,
          calories: Math.floor(Math.random() * 200) + 100
        }))
      });
    });

    return meals;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Utensils className="h-6 w-6 text-primary" />
          Criar Plano Alimentar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Patient Info */}
        <div className="space-y-2">
          <Label htmlFor="patient-name" className="text-base font-medium">
            Nome do Paciente *
          </Label>
          <Input
            id="patient-name"
            placeholder="Digite o nome do paciente"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="text-base"
          />
        </div>

        <Separator />

        {/* Available Foods */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Alimentos Disponíveis *</Label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COMMON_FOODS.map(food => (
              <div key={food} className="flex items-center space-x-2">
                <Checkbox
                  id={food}
                  checked={selectedFoods.includes(food)}
                  onCheckedChange={() => handleFoodToggle(food)}
                />
                <Label 
                  htmlFor={food} 
                  className="text-sm cursor-pointer flex-1"
                >
                  {food}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar alimento personalizado"
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomFood()}
              className="flex-1"
            />
            <Button onClick={addCustomFood} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {selectedFoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFoods.map(food => (
                <Badge key={food} variant="secondary" className="flex items-center gap-1">
                  {food}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFood(food)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Meal Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tipo de Refeição *
            </Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de refeição" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(meal => (
                  <SelectItem key={meal.value} value={meal.value}>
                    {meal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories" className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Calorias Máximas *
            </Label>
            <Input
              id="calories"
              type="number"
              placeholder="Ex: 2000"
              value={maxCalories}
              onChange={(e) => setMaxCalories(e.target.value)}
            />
          </div>
        </div>

        {/* Macro Priority */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Prioridade Nutricional *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MACRO_PRIORITIES.map(macro => (
              <Button
                key={macro.value}
                variant={macroPriority === macro.value ? "default" : "outline"}
                onClick={() => setMacroPriority(macro.value)}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <span className="text-2xl">{macro.icon}</span>
                <span className="text-sm">{macro.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Generate Button */}
        <Button 
          onClick={generatePlan} 
          disabled={isGenerating}
          className="w-full text-lg py-6"
          size="lg"
        >
          {isGenerating ? "Gerando plano..." : "Gerar Plano Alimentar com IA"}
        </Button>
      </CardContent>
    </Card>
  );
}