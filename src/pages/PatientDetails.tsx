// src/pages/PatientDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, TrendingUp, Weight, Ruler, Percent, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
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
import { Textarea } from "@/components/ui/textarea";
import PlanDisplay from "@/components/PlanDisplay";

interface Patient {
  id: string;
  name: string;
  email: string | null;
}

interface Metric {
  id: string;
  metric_date: string;
  weight: number | null;
  height: number | null;
  body_fat_percentage: number | null;
  notes: string | null;
}

interface SavedPlan {
    id: string;
    created_at: string;
    plan_details: any;
}

export default function PatientDetails() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMetricDialogOpen, setMetricDialogOpen] = useState(false);

  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newBodyFat, setNewBodyFat] = useState("");
  const [newNotes, setNewNotes] = useState("");


  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, name, email')
      .eq('id', patientId)
      .single();

    if (patientError || !patientData) {
      toast({ title: "Erro", description: "Paciente não encontrado.", variant: "destructive" });
      navigate("/");
      return;
    }
    setPatient(patientData);

    const { data: metricsData, error: metricsError } = await supabase
      .from('patient_metrics')
      .select('*')
      .eq('patient_id', patientId)
      .order('metric_date', { ascending: true });

    if (metricsError) {
      toast({ title: "Erro ao buscar métricas", description: metricsError.message, variant: "destructive" });
    } else {
        const typedMetricsData = metricsData as Metric[];
        setMetrics(typedMetricsData);
        if (typedMetricsData.length > 0) {
            const latestMetric = typedMetricsData[typedMetricsData.length - 1];
            setNewHeight(latestMetric.height?.toString() || "");
        }
    }
    
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if(plansError) {
        toast({ title: "Erro ao buscar planos", description: plansError.message, variant: "destructive" });
    } else {
        setPlans(plansData as SavedPlan[]);
    }


    setLoading(false);
  };
  
  const handleViewPlan = (planDetails: any) => {
    setSelectedPlan(planDetails);
    setPlanModalOpen(true);
  };


  const handleSaveMetric = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !patientId) return;

    const { error } = await supabase.from('patient_metrics').insert({
        patient_id: patientId,
        user_id: user.id,
        weight: newWeight ? Number(newWeight) : null,
        height: newHeight ? Number(newHeight) : null,
        body_fat_percentage: newBodyFat ? Number(newBodyFat) : null,
        notes: newNotes,
    });

    if (error) {
        toast({ title: "Erro ao salvar medição", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Sucesso!", description: "Nova medição salva." });
        setMetricDialogOpen(false);
        fetchPatientData();
    }
  };


  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const formattedMetrics = metrics.map(m => ({
    ...m,
    name: new Date(m.metric_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }));


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4 md:p-8">
       <Button variant="outline" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Dashboard
        </Button>

      {loading ? (
        <p>Carregando...</p>
      ) : patient && (
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle className="text-3xl">{patient.name}</CardTitle>
                    <CardDescription>{patient.email}</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Últimos Indicadores</CardTitle>
                        <Dialog open={isMetricDialogOpen} onOpenChange={setMetricDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Adicionar Medição</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nova Medição</DialogTitle>
                                    <DialogDescription>
                                        Adicione os novos indicadores de saúde para {patient.name}. A data será a de hoje.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="weight" className="text-right">Peso (kg)</Label>
                                        <Input id="weight" type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="height" className="text-right">Altura (m)</Label>
                                        <Input id="height" type="number" value={newHeight} onChange={e => setNewHeight(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="bodyfat" className="text-right">Gordura (%)</Label>
                                        <Input id="bodyfat" type="number" value={newBodyFat} onChange={e => setNewBodyFat(e.target.value)} className="col-span-3" />
                                    </div>
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="notes" className="text-right">Notas</Label>
                                        <Textarea id="notes" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button onClick={handleSaveMetric}>Salvar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Weight className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Peso</p>
                            <p className="text-2xl font-bold">{latestMetric?.weight || 'N/A'} kg</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Ruler className="h-8 w-8 text-success" />
                        <div>
                            <p className="text-sm text-muted-foreground">Altura</p>
                            <p className="text-2xl font-bold">{latestMetric?.height || 'N/A'} m</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Percent className="h-8 w-8 text-info" />
                        <div>
                            <p className="text-sm text-muted-foreground">Gordura Corporal</p>
                            <p className="text-2xl font-bold">{latestMetric?.body_fat_percentage || 'N/A'} %</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Evolução do Peso</CardTitle>
                </CardHeader>
                 <CardContent>
                    {metrics.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} name="Peso (kg)" />
                        </LineChart>
                    </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground">Adicione mais medições para ver a evolução.</p>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Planos Alimentares Salvos</CardTitle>
                </CardHeader>
                 <CardContent>
                    {plans.length > 0 ? (
                        <div className="space-y-2">
                           {plans.map(plan => (
                               <div key={plan.id} className="flex justify-between items-center p-3 border rounded-md">
                                   <div>
                                       <p className="font-medium">Plano de {new Date(plan.created_at).toLocaleDateString('pt-BR')}</p>
                                       <p className="text-sm text-muted-foreground">{plan.plan_details.maxCalories} kcal - Foco: {plan.plan_details.macroPriority}</p>
                                   </div>
                                   <Button variant="secondary" size="sm" onClick={() => handleViewPlan(plan.plan_details)}>
                                        Visualizar
                                   </Button>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">Nenhum plano alimentar foi criado para este paciente.</p>
                    )}
                </CardContent>
            </Card>

        </div>
      )}

        <Dialog open={isPlanModalOpen} onOpenChange={setPlanModalOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Plano Alimentar</DialogTitle>
                </DialogHeader>
                {selectedPlan && <PlanDisplay plan={selectedPlan} />}
                 <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}