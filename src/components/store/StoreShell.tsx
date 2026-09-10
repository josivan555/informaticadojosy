import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, BookOpen, Search, User, LogOut, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo.png.asset.json";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";
import type { ReactNode } from "react";

interface StoreShellProps {
  children: ReactNode;
  active?: "home" | "softwares" | "courses";
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const ADMIN_EMAIL = "informaticadojosy@gmail.com";

export function StoreShell({
  children,
  active = "home",
  search,
  onSearchChange,
  searchPlaceholder = "Pesquisar programas e cursos",
}: StoreShellProps) {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { key: "home", label: "Início", icon: Home, to: "/" },
    { key: "softwares", label: "Programas", icon: LayoutGrid, to: "/softwares" },
    { key: "courses", label: "Cursos", icon: BookOpen, to: "/courses" },
  ] as const;

  return (
    <div className="store-theme min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
            <img src={logoAsset.url} alt="Informática do Josy" className="h-8 w-8 rounded-md object-contain" />
            <span className="hidden sm:inline text-base">
              INFORMÁTICA <span className="text-primary">do Josy</span>
            </span>
          </Link>

          <div className="relative mx-auto w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              readOnly={!onSearchChange}
              placeholder={searchPlaceholder}
              className="h-10 rounded-full border-border bg-secondary pl-10 text-sm"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <Link to="/admin">Painel</Link>
              </Button>
            )}
            {session ? (
              <>
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={session.user.email === ADMIN_EMAIL ? profileAdminAsset.url : undefined} className="object-cover" />
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </>
            ) : (
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4">
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col gap-1 py-6 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-accent font-semibold text-accent-foreground" : "text-foreground hover:bg-secondary"
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />}
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-4 border-t border-border pt-4">
            <Link
              to="/softwares"
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
            >
              <Download className="h-4 w-4" />
              Downloads grátis
            </Link>
          </div>
        </nav>

        <main className="min-w-0 flex-1 py-6">{children}</main>
      </div>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-8 text-center text-sm text-muted-foreground">
          © 2026 INFORMÁTICA do Josy. Todos os direitos reservados.
        </div>
      </footer>

      {/* Barra de navegação inferior no celular */}
      <div className="sticky bottom-0 z-50 flex border-t border-border bg-card md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                item.key === active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
