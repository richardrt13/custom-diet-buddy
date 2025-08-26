import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, FileText, CalendarDays, LogOut, TrendingUp } from "lucide-react";
import NutritionPlanForm from "@/components/NutritionPlanForm";
import PlanDisplay from "@/components/PlanDisplay";
import PatientList from "@/components/PatientList";
import heroImage from "@/assets/nutrition-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Interfaces para os dados
interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
  status: 'active' | 'inactive';
}

interface Plan {
    id: string;
    patient_id: string;
    plan_details: any;
    created_at: Date;
}


const Index = () => {
  const [generatedPlan, setGeneratedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const { toast } = useToast();
  const [stats, setStats] = useState({ activePatients: 0, plansCreated: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: patientsCount, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { count: plansCount, error: plansError } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (patientsError || plansError) {
      console.error("Erro ao buscar estatísticas:", patientsError || plansError);
    } else {
      setStats({
        activePatients: patientsCount || 0,
        plansCreated: plansCount || 0
      });
    }
  };

  const handlePlanGenerated = async (planData: any) => {
      if (!selectedPatient) {
          toast({ title: "Nenhum paciente selecionado", description: "Selecione um paciente antes de gerar um plano.", variant: "destructive" });
          return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
          .from('plans')
          .insert([{
              user_id: user.id,
              patient_id: selectedPatient.id,
              plan_details: planData
          }])
          .select()
          .single();

      if (error) {
          toast({ title: "Erro ao salvar o plano", description: error.message, variant: "destructive" });
      } else {
          setGeneratedPlan(data as Plan);
          setActiveTab("plan");
          fetchStats(); // Atualiza as estatísticas
          toast({ title: "Plano salvo com sucesso!", description: `Plano alimentar criado para ${selectedPatient.name}` });
      }
  };


  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab("create-plan");
  };

  const handleAddPatientClick = () => {
    setNewPatientName("");
    setAddPatientOpen(true);
  };

  const handleCreatePatient = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newPatientName.trim()) {
        toast({ title: "Nome do paciente é obrigatório.", variant: "destructive" });
        return;
    };

    const { error } = await supabase.from('patients').insert([{ name: newPatientName.trim(), user_id: user.id }]);

    if (error) {
        toast({ title: "Erro ao criar paciente", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Paciente adicionado com sucesso!" });
        setAddPatientOpen(false);
        fetchStats();
        // Recarregar a lista de pacientes (idealmente, o componente PatientList faria isso sozinho)
        setActiveTab("patients"); // Mudar de aba para forçar a recarga
        setActiveTab("dashboard");
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.activePatients}</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Planos Criados</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.plansCreated}</div>
                </CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-info">94%</div>
                  <p className="text-xs text-muted-foreground">Dados fictícios</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList
              onSelectPatient={handleSelectPatient}
              onAddPatient={handleAddPatientClick}
            />
          </TabsContent>

          <TabsContent value="create-plan">
             {selectedPatient ? (
              <NutritionPlanForm onPlanGenerated={handlePlanGenerated} />
            ) : (
                <Card className="w-full max-w-4xl mx-auto shadow-medium">
                    <CardContent className="p-12 text-center">
                        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Nenhum paciente selecionado</h3>
                        <p className="text-muted-foreground mb-6">
                            Vá para a aba "Pacientes" para selecionar um ou adicionar um novo.
                        </p>
                        <Button onClick={() => setActiveTab("patients")}>
                            Ver Pacientes
                        </Button>
                    </CardContent>
                </Card>
            )}
          </TabsContent>

          <TabsContent value="plan">
            {generatedPlan ? (
              <PlanDisplay plan={generatedPlan.plan_details} />
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

        <Dialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                    <DialogDescription>
                        Insira o nome do novo paciente para começar a criar planos alimentares.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={newPatientName}
                            onChange={(e) => setNewPatientName(e.target.value)}
                            className="col-span-3"
                            placeholder="Nome completo do paciente"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleCreatePatient}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default Index;