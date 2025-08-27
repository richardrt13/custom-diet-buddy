// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, FileText, CalendarDays, LogOut, TrendingUp, Trash2, Eye, ShoppingCart } from "lucide-react";
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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShoppingListForm from "@/components/ShoppingListForm";

// Interfaces
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
    patients: { name: string }; // Para obter o nome do paciente através de um join
}

const Index = () => {
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [isAddPatientOpen, setAddPatientOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const { toast } = useToast();
  const [stats, setStats] = useState({ activePatients: 0, plansCreated: 0 });

  useEffect(() => {
    fetchStats();
    fetchAllPlans();
  }, []);

  const fetchAllPlans = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
          .from('plans')
          .select(`
              id,
              created_at,
              plan_details,
              patients ( name )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

      if (error) {
          console.error("Erro ao buscar planos:", error);
      } else if (data) {
          setAllPlans(data as any);
      }
  };


  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count: patientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { count: plansCount } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setStats({
      activePatients: patientsCount || 0,
      plansCreated: plansCount || 0
    });
  };

  const handlePlanGenerated = async (planData: any, patientId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
          .from('plans')
          .insert([{
              user_id: user.id,
              patient_id: patientId,
              plan_details: { ...planData, generatedAt: new Date() } // Espalha os dados e adiciona a data
          }])
          .select()
          .single();

      if (error) {
          toast({ title: "Erro ao salvar o plano", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Plano salvo com sucesso!"});
          await fetchAllPlans();
          await fetchStats();
          setActiveTab("plans");
      }
  };

  const handleSavePlan = async (updatedPlanDetails: any) => {
    if (!viewingPlan) return;

    const { error } = await supabase
      .from('plans')
      .update({ plan_details: updatedPlanDetails })
      .eq('id', viewingPlan.id);

    if (error) {
      toast({ title: "Erro ao salvar o plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Plano alimentar atualizado." });
      setPlanModalOpen(false);
      fetchAllPlans();
    }
  };


  const handleDeletePlan = async (planId: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', planId);

    if (error) {
        toast({ title: "Erro ao deletar plano", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Plano deletado com sucesso!" });
        fetchAllPlans();
        fetchStats();
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab("create-plan");
  };

  useEffect(() => {
      if(activeTab !== 'create-plan') {
          setSelectedPatient(null);
      }
  }, [activeTab]);

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
        // Forçar a atualização da lista de pacientes
        setActiveTab("dashboard"); // Mude para uma aba temporária
        setTimeout(() => setActiveTab("patients"), 50); // Mude de volta para forçar o re-render
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
                <h1 className="text-xl font-bold">NutriPlan</h1>
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
            <TabsList className="grid w-full grid-cols-5 gap-1">
                <TabsTrigger value="dashboard" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Dashboard
                </TabsTrigger>
                <TabsTrigger value="patients" className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Pacientes
                </TabsTrigger>
                <TabsTrigger value="create-plan" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Criar Plano
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Planos Gerados
                </TabsTrigger>
                <TabsTrigger value="shopping-list" className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    Lista de Compras
                </TabsTrigger>
            </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img src={heroImage} alt="Nutrition planning interface" className="w-full h-64 object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-success/60" />
              <div className="absolute inset-0 flex items-center justify-center text-center text-white p-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">Planos Alimentares Inteligentes</h1>
                  <p className="text-xl mb-6 max-w-2xl">Crie planos nutricionais personalizados com IA para seus pacientes</p>
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => setActiveTab("create-plan")}>Começar Agora</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => setActiveTab("patients")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-primary">{stats.activePatients}</div></CardContent>
              </Card>
              <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => setActiveTab("plans")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Planos Criados</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-success">{stats.plansCreated}</div></CardContent>
              </Card>
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold text-info">94%</div><p className="text-xs text-muted-foreground">Dados fictícios</p></CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <PatientList key={activeTab} onSelectPatient={handleSelectPatient} onAddPatient={handleAddPatientClick} />
          </TabsContent>

          <TabsContent value="create-plan">
             <NutritionPlanForm patient={selectedPatient} onPlanGenerated={handlePlanGenerated} />
          </TabsContent>

          <TabsContent value="plans">
            <Card className="w-full max-w-4xl mx-auto shadow-medium">
                <CardHeader>
                    <CardTitle>Histórico de Planos Gerados</CardTitle>
                </CardHeader>
                <CardContent>
                    {allPlans.length > 0 ? (
                        <div className="space-y-3">
                            {allPlans.map(plan => (
                                <div key={plan.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{plan.patients.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Criado em: {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setViewingPlan(plan); setPlanModalOpen(true); }}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o plano alimentar.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>Deletar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum plano foi gerado ainda.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shopping-list">
              <ShoppingListForm />
          </TabsContent>
        </Tabs>
      </main>

       <Dialog open={isAddPatientOpen} onOpenChange={setAddPatientOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                    <DialogDescription>Insira o nome do novo paciente para começar a criar planos alimentares.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="col-span-3" placeholder="Nome completo do paciente" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleCreatePatient}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isPlanModalOpen} onOpenChange={setPlanModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Plano Alimentar</DialogTitle>
                </DialogHeader>
                {viewingPlan && <PlanDisplay plan={viewingPlan.plan_details} onSave={handleSavePlan}/>}
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default Index;