import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, BookOpen, Users, Download } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = [
    { title: "Total Softwares", value: "0", icon: Laptop, color: "text-blue-500" },
    { title: "Cursos Ativos", value: "0", icon: BookOpen, color: "text-green-500" },
    { title: "Usuários", value: "1", icon: Users, color: "text-purple-500" },
    { title: "Downloads", value: "0", icon: Download, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo, Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use o menu lateral para gerenciar seus softwares e cursos PDF. Aqui você poderá carregar arquivos, definir preços e monitorar o status de publicação.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
