import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { Laptop, BookOpen, LayoutDashboard, LogOut, Home, User, Tags, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";
import logoAsset from "@/assets/logo.png.asset.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData && session.user.email !== "informaticadojosy@gmail.com") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
  head: () => ({
    meta: [{ title: "Dashboard - Informática do Josy" }],
  }),
});

function AdminLayout() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0a192f] text-slate-200">
        <Sidebar className="border-r border-slate-800 bg-[#0d1b33]">
          <SidebarHeader className="p-4 border-b border-slate-800">
            <div className="flex flex-row items-center gap-3">
              <img src={logoAsset.url} alt="Logo" className="h-8 w-8 object-contain rounded" />
              <AdminProfile />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-slate-400">Administração</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/admin">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/admin/softwares">
                        <Laptop className="h-4 w-4" />
                        <span>Softwares</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/admin/software-categories">
                        <Tags className="h-4 w-4" />
                        <span>Categorias Softwares</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/admin/courses">
                        <BookOpen className="h-4 w-4" />
                        <span>Cursos</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/admin/downloads">
                        <Download className="h-4 w-4" />
                        <span>Downloads</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-4 border-t border-slate-800 flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:bg-slate-800 text-slate-300" asChild>
                <Link to="/">
                  <Home className="h-4 w-4" />
                  <span>Ir para Página Inicial</span>
                </Link>
              </Button>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut}>
                    <div className="flex items-center gap-2 text-slate-300">
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-8 overflow-auto">
          <AdminDashboard />
        </main>
      </div>
    </SidebarProvider>
  );
}

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
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-[#112240] border-slate-800 text-slate-200">
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

      <Card className="bg-[#112240] border-slate-800 text-slate-200">
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

function AdminProfile() {
  const { data: session } = useQuery({
    queryKey: ["admin-session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const userEmail = session?.user?.email;
  const isAdmin = userEmail === "informaticadojosy@gmail.com";
  const profileUrl = isAdmin ? profileAdminAsset.url : undefined;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 border border-slate-700">
        <AvatarImage src={profileUrl} alt="Admin" className="object-cover" />
        <AvatarFallback className="bg-slate-800">
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden text-sm">
        <span className="font-semibold truncate text-white">
          {isAdmin ? "Josy Informática" : "Administrador"}
        </span>
        <span className="text-xs text-slate-400 truncate">{userEmail}</span>
      </div>
    </div>
  );
}