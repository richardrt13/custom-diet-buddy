import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, Brain, TrendingUp, FileText, CalendarDays } from "lucide-react";
import NutritionPlanForm from "@/components/NutritionPlanForm";
import PlanDisplay from "@/components/PlanDisplay";
import PatientList from "@/components/PatientList";
import heroImage from "@/assets/nutrition-hero.jpg";

const Index = () => {
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handlePlanGenerated = (plan: any) => {
    setGeneratedPlan(plan);
    setActiveTab("plan");
  };

  const handleSelectPatient = (patient: any) => {
    console.log("Selected patient:", patient);
    setActiveTab("create-plan");
  };

  const handleAddPatient = () => {
    console.log("Add new patient");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-primary to-success rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NutriPlan Pro</h1>
                <p className="text-sm text-muted-foreground">Planos alimentares inteligentes</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Brain className="h-4 w-4 mr-2" />
              IA Ativa
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="create-plan" className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              Criar Plano
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              Plano Gerado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img 
                src={heroImage} 
                alt="Nutrition planning interface" 
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-success/60" />
              <div className="absolute inset-0 flex items-center justify-center text-center text-white p-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Planos Alimentares Inteligentes
                  </h1>
                  <p className="text-xl mb-6 max-w-2xl">
                    Crie planos nutricionais personalizados com IA para seus pacientes
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90"
                    onClick={() => setActiveTab("create-plan")}
                  >
                    Começar Agora
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">247</div>
                  <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planos Criados</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">1.2k</div>
                  <p className="text-xs text-muted-foreground">+8% desde o mês passado</p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-info">94%</div>
                  <p className="text-xs text-muted-foreground">+2% desde o mês passado</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab("patients")}
                >
                  <Users className="h-6 w-6" />
                  Gerenciar Pacientes
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab("create-plan")}
                >
                  <FileText className="h-6 w-6" />
                  Criar Novo Plano
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList 
              onSelectPatient={handleSelectPatient}
              onAddPatient={handleAddPatient}
            />
          </TabsContent>

          <TabsContent value="create-plan">
            <NutritionPlanForm onPlanGenerated={handlePlanGenerated} />
          </TabsContent>

          <TabsContent value="plan">
            {generatedPlan ? (
              <PlanDisplay plan={generatedPlan} />
            ) : (
              <Card className="w-full max-w-4xl mx-auto shadow-medium">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum plano gerado</h3>
                  <p className="text-muted-foreground mb-6">
                    Crie um plano alimentar para visualizá-lo aqui
                  </p>
                  <Button onClick={() => setActiveTab("create-plan")}>
                    Criar Plano Alimentar
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
