import { createFileRoute, Link, redirect, Outlet, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { Laptop, BookOpen, LayoutDashboard, LogOut, Home, User, Tags, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/admin/layout")({
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
                    <SidebarMenuButton asChild className={isActive('/admin') ? "bg-accent text-accent-foreground" : ""}>
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
        <main className="flex-1 p-8 overflow-auto ml-64">
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
