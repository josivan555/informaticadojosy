import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
import { Laptop, BookOpen, LayoutDashboard, LogOut, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";

export const Route = createFileRoute("/admin/layout")({
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

    if (!roleData) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <AdminProfile />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/softwares">
                        <Laptop className="h-4 w-4" />
                        <span>Softwares</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/admin/courses">
                        <BookOpen className="h-4 w-4" />
                        <span>Cursos</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mt-auto p-4 border-t">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/">
                      <Home className="h-4 w-4" />
                      <span>Voltar ao Site</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );

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
      <Avatar className="h-9 w-9 border">
        <AvatarImage src={profileUrl} alt="Admin" className="object-cover" />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col overflow-hidden text-sm">
        <span className="font-semibold truncate">
          {isAdmin ? "Josy Informática" : "Administrador"}
        </span>
        <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
      </div>
    </div>
  );
}
