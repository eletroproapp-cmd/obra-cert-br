import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, CheckCircle2 } from "lucide-react";

const Planejamento = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Planejamento</h1>
        <p className="text-muted-foreground">Visualize e gerencie suas instalações e manutenções</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 border-border shadow-medium">
          <CardHeader>
            <CardTitle>Calendário de Instalações</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-border shadow-medium">
          <CardHeader>
            <CardTitle>Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "09:00", title: "Instalação Residencial", client: "João Silva", status: "Em Andamento", icon: Zap, color: "text-primary" },
                { time: "14:00", title: "Manutenção Preventiva", client: "Maria Oliveira", status: "Agendado", icon: Clock, color: "text-accent" },
                { time: "16:30", title: "Vistoria Técnica", client: "Carlos Santos", status: "Concluído", icon: CheckCircle2, color: "text-success" },
              ].map((task, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <task.icon className={`h-5 w-5 mt-0.5 ${task.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <span className="text-xs text-muted-foreground">{task.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{task.client}</p>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week View */}
      <Card className="mt-6 border-border shadow-medium">
        <CardHeader>
          <CardTitle>Visão Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, index) => (
              <div key={day} className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">{day}</p>
                <div className="space-y-1">
                  {index < 5 && (
                    <>
                      <div className="p-2 bg-primary/10 text-primary text-xs rounded">
                        2 Instalações
                      </div>
                      <div className="p-2 bg-accent/10 text-accent text-xs rounded">
                        1 Manutenção
                      </div>
                    </>
                  )}
                  {index === 5 && (
                    <div className="p-2 bg-primary/10 text-primary text-xs rounded">
                      1 Instalação
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Planejamento;
