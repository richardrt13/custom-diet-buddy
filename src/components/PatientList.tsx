// src/components/PatientList.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Eye, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
  status: 'active' | 'inactive';
}

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: () => void;
}

export default function PatientList({ onSelectPatient, onAddPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: "Erro ao buscar pacientes", description: error.message, variant: "destructive" });
      } else {
        setPatients(data as Patient[]);
      }
    }
    setLoading(false);
  };


  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-medium">
      <CardHeader className="bg-gradient-to-r from-info/5 to-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-info" />
            Meus Pacientes
          </CardTitle>
          <Button onClick={onAddPatient} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
           <p>Carregando pacientes...</p>
        ) : filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map(patient => (
              <Card key={patient.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                      <Badge
                        variant={patient.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="text-sm mb-4">
                      <div className="font-medium text-info flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                         Criado em: {formatDate(patient.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <Button
                      onClick={() => navigate(`/patient/${patient.id}`)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                     <Button
                      onClick={() => onSelectPatient(patient)}
                      className="w-full"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Criar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum paciente encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}