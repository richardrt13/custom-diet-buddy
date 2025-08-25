import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Eye, Calendar } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  lastPlan: Date | null;
  totalPlans: number;
  status: 'active' | 'inactive';
}

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: () => void;
}

export default function PatientList({ onSelectPatient, onAddPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - in real app would come from backend
  const [patients] = useState<Patient[]>([
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@email.com",
      phone: "(11) 99999-9999",
      lastPlan: new Date(2024, 0, 15),
      totalPlans: 3,
      status: 'active'
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@email.com", 
      phone: "(11) 88888-8888",
      lastPlan: new Date(2024, 0, 10),
      totalPlans: 5,
      status: 'active'
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana@email.com",
      phone: "(11) 77777-7777",
      lastPlan: null,
      totalPlans: 0,
      status: 'inactive'
    }
  ]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(date);
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
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map(patient => (
            <Card key={patient.id} className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                  </div>
                  <Badge 
                    variant={patient.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-medium text-primary">{patient.totalPlans}</div>
                    <div className="text-muted-foreground">Planos criados</div>
                  </div>
                  <div>
                    <div className="font-medium text-info flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(patient.lastPlan)}
                    </div>
                    <div className="text-muted-foreground">Último plano</div>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelectPatient(patient)}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum paciente encontrado</p>
            {searchTerm && (
              <p className="text-sm">Tente ajustar os termos de busca</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}