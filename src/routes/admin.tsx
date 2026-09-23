import { createFileRoute, Link, redirect, Outlet, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { Laptop, BookOpen, LayoutDashboard, LogOut, Home, User, Tags, Download, TrendingUp, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }

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
});

function AdminLayout() {
  const location = useLocation();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  const mobileItems = [
    { label: "Painel", to: "/admin", icon: LayoutDashboard },
    { label: "Programas", to: "/admin/softwares", icon: Laptop },
    { label: "Categorias", to: "/admin/software-categories", icon: Tags },
    { label: "Cursos", to: "/admin/courses", icon: BookOpen },
    { label: "Downloads", to: "/admin/downloads", icon: Download },
    { label: "Mensagens", to: "/admin/messages", icon: Mail },
    { label: "Vendas", to: "/admin/sales", icon: TrendingUp },
  ] as const;

  return (
    <SidebarProvider>
      <div className="store-theme flex min-h-screen w-full flex-col bg-background text-foreground md:flex-row">
        <Sidebar className="store-theme relative h-auto w-full border-r border-border bg-card md:fixed md:h-screen md:w-64">
          <SidebarHeader className="p-4 border-b border-border">
            <div className="flex flex-row items-center gap-3">
              <img src={logoAsset.url} alt="Logo" className="h-8 w-8 object-contain rounded" />
              <AdminProfile />
            </div>
          </SidebarHeader>
          <SidebarContent className="hidden md:flex">
            <SidebarGroup>
              <SidebarGroupLabel>
                <span className="text-muted-foreground">Administração</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin') && location.pathname.split('/').length <= 2 ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/softwares') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/softwares">
                        <Laptop className="h-4 w-4" />
                        <span>Softwares</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/software-categories') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/software-categories">
                        <Tags className="h-4 w-4" />
                        <span>Categorias Softwares</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/courses') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/courses">
                        <BookOpen className="h-4 w-4" />
                        <span>Cursos</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/downloads') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/downloads">
                        <Download className="h-4 w-4" />
                        <span>Downloads</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/messages') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/messages">
                        <Mail className="h-4 w-4" />
                        <span>Mensagens</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={isActive('/admin/sales') ? "bg-accent text-accent-foreground" : ""}>
                      <Link to="/admin/sales">
                        <TrendingUp className="h-4 w-4" />
                        <span>Painel de vendas</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-4 border-t border-border flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start gap-2 border-border hover:bg-secondary text-muted-foreground" asChild>
                <Link to="/">
                  <Home className="h-4 w-4" />
                  <span>Ir para Página Inicial</span>
                </Link>
              </Button>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        <nav className="sticky top-0 z-40 flex w-full gap-1 overflow-x-auto border-y border-border bg-card px-3 py-2 md:hidden" aria-label="Administração">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.to}
                asChild
                size="sm"
                variant={isActive(item.to) ? "secondary" : "ghost"}
                className="h-14 min-w-20 shrink-0 flex-col gap-1 px-2 text-xs"
              >
                <Link to={item.to}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 md:ml-64 md:p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
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
      <Avatar className="h-9 w-9 border border-border">
        <AvatarImage src={profileUrl} alt="Admin" className="object-cover" />
        <AvatarFallback className="bg-secondary">
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden text-sm">
        <span className="font-semibold truncate text-foreground">
          {isAdmin ? "Josy Informática" : "Administrador"}
        </span>
        <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
      </div>
    </div>
  );
}