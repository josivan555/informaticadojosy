import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
// Integre a validação do acesso do curso via webhook do Stripe para que o status de compra atualize automaticamente após o checkout.
// Implementar uma página pública que liste meus cursos com capa, descrição e botão para comprar via checkout.
// Implemente controle de acesso para que apenas usuários com compra ativa possam visualizar e baixar os PDFs.
// Implemente o download do PDF do curso automaticamente após a confirmação do checkout e login do usuário.
// Integre um carrinho e checkout para que as pessoas possam comprar os cursos em PDF com pagamento online.
// Adicione uma área “Meus cursos” para listar minhas compras e disponibilizar o download do PDF após a confirmação do checkout.
// Crie um painel administrativo para cadastrar cursos, enviar o PDF, definir capa, preço e controlar publicar/despublicar.
import { Download, BookOpen, ChevronRight, Laptop, Star, ShieldCheck, Zap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import heroBannerAsset from "@/assets/main-hero-banner.png.asset.json";
import profileAdminAsset from "@/assets/profile-admin.png.asset.json";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";



const softwaresQueryOptions = {
  queryKey: ["softwares"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("softwares")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

const coursesQueryOptions = {
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    title: "INFORMÁTICA do Josy - Download de Programas e Cursos em PDF",
    meta: [
      { name: "description", content: "O melhor portal para baixar softwares utilitários e adquirir cursos especializados em PDF." },
      { property: "og:title", content: "INFORMÁTICA do Josy - Downloads & Cursos" },
      { property: "og:description", content: "Encontre os melhores softwares e cursos digitais em um só lugar." },
    ],
  }),
});

function Index() {
  const { data: softwares } = useQuery(softwaresQueryOptions);
  const { data: courses } = useQuery(coursesQueryOptions);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: roleData } = useQuery({
    queryKey: ["user-role", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session!.user.id)
        .eq("role", "admin")
        .single();
      return data;
    },
  });

  const isAdmin = session?.user?.email === "informaticadojosy@gmail.com" || !!roleData;


  useEffect(() => {
    // @ts-ignore
    if (window.Paddle) {
      // @ts-ignore
      window.Paddle.Setup({ 
        seller: 12345, // ID do vendedor (Usuário deve alterar)
        environment: 'sandbox' 
      });
    }
  }, []);

  const handleBuyCourse = async (course: any) => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    
    if (!authSession) {
      toast.error("Você precisa estar logado para comprar");
      navigate({ to: "/auth" });
      return;
    }

    // Redireciona para a página de detalhes para garantir o fluxo de liberação
    navigate({ to: `/courses/${course.id}` });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-[#0a192f]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0a192f]/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="hidden sm:inline">INFORMÁTICA <span className="text-primary">do Josy</span></span>
            <span className="sm:hidden text-primary">IJ</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#softwares" className="hover:text-primary transition-colors">Softwares</a>
            <a href="#cursos" className="hover:text-primary transition-colors">Cursos</a>
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:underline transition-colors">Painel Admin</Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage 
                      src={session.user.email === "informaticadojosy@gmail.com" ? profileAdminAsset.url : undefined} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-slate-800">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                    {session.user.email === "informaticadojosy@gmail.com" ? "Josy" : "Logado"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Começar Agora</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>


      <main>
        {/* Hero Section with Banner */}
        <section className="relative overflow-hidden border-b bg-[#0a192f]">
          <div className="container mx-auto px-4 relative z-10 pt-12 pb-20">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-primary/20 bg-black/40 backdrop-blur-sm">
              <img 
                src={heroBannerAsset.url} 
                alt="Informática do Josy - Tecnologia, Conhecimento, Soluções" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="mt-12 text-center space-y-6 max-w-[800px] mx-auto">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-primary/20 text-primary border-primary/30">
                Plataforma All-in-One de Software & Educação
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
                Turbine seu computador e sua <span className="text-primary">carreira</span>.
              </h1>
              <p className="text-xl text-muted-foreground">
                Baixe ferramentas exclusivas para produtividade e adquira conhecimentos práticos com nossos cursos em PDF de alta qualidade.
              </p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center">
                <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/20" asChild>
                  <a href="#softwares">
                    Explorar Softwares <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-primary/50 text-primary hover:bg-primary/10" asChild>
                  <a href="#cursos">Ver Cursos</a>
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative background glow to match image */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none opacity-30" />
        </section>


        {/* Software Section */}
        <section id="softwares" className="py-20 bg-[#0f2244]/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Softwares para PC</h2>
                <p className="text-muted-foreground">Utilitários e ferramentas prontas para baixar.</p>
              </div>
              <Button variant="link" className="p-0" asChild>
                <Link to="/softwares">Ver todos softwares</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {softwares?.map((sw: any) => (
                <Card key={sw.id} className="group hover:shadow-lg transition-all duration-300 bg-[#112240] border-slate-800 hover:border-primary/50 text-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Laptop className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline">{sw.category}</Badge>
                    </div>
                    <CardTitle className="text-xl">{sw.name}</CardTitle>
                    <CardDescription>{sw.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Versão {sw.version}</span>
                      <span>•</span>
                      <span>{sw.size}</span>
                      <span>•</span>
                      <span>{sw.downloads} downloads</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button 
                      className="w-full group-hover:bg-primary transition-colors"
                      onClick={async () => {
                        // Record download history if user is logged in
                        const { data: { session: authSession } } = await supabase.auth.getSession();
                        if (authSession) {
                          await supabase.from("download_history").insert({
                            user_id: authSession.user.id,
                            software_id: sw.id
                          });
                        }

                        if (sw.price > 0) {
                          navigate({ to: "/softwares" }); // Redirect to software list for purchase flow
                        } else if (sw.file_url) {
                          window.open(sw.file_url, '_blank');
                        }
                      }}
                      disabled={!sw.file_url && sw.price === 0}
                    >
                      <Download className="mr-2 h-4 w-4" /> 
                      {sw.price > 0 ? `Comprar (R$ ${sw.price.toFixed(2)})` : sw.file_url ? 'Baixar Grátis' : 'Em breve'}
                    </Button>
                    {sw.price > 0 && (
                      <p className="text-[10px] text-center text-muted-foreground">
                        *Requer login para processar o pagamento
                      </p>
                    )}
                  </CardFooter>
                </Card>
              ))}
              {(!softwares || softwares.length === 0) && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhum software disponível no momento.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="cursos" className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Cursos em PDF (Pix e Cartão)</h2>
                <p className="text-muted-foreground">Aprenda novas habilidades com material didático focado, pague com Pix ou Cartão via Mercado Pago.</p>
              </div>
              <Button variant="link" className="p-0" asChild>
                <Link to="/courses">Ver todos cursos</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses?.map((course: any) => (
                <div key={course.id} className="flex flex-col lg:flex-row gap-6 p-6 rounded-2xl border border-slate-800 bg-[#112240] hover:border-primary/50 transition-colors">
                  <div className="flex-shrink-0 w-full lg:w-48 h-64 bg-muted rounded-xl flex items-center justify-center relative overflow-hidden group">
                    {course.image_url ? (
                      <img 
                        src={course.image_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Badge className="scale-110">PDF Premium</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between py-2">
                    <div className="space-y-3">
                      <Badge variant="secondary">{course.level}</Badge>
                      <h3 className="text-2xl font-bold">{course.title}</h3>
                      <p className="text-muted-foreground">{course.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-primary">{course.pages} páginas</span>
                        <span className="text-muted-foreground">Formato PDF Digital</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-3xl font-bold">R$ {course.price?.toFixed(2)}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="rounded-full px-4"
                          asChild
                        >
                          <Link to="/courses/$courseId" params={{ courseId: course.id }}>
                            Detalhes
                          </Link>
                        </Button>
                        <Button 
                          className="rounded-full px-6"
                          onClick={() => handleBuyCourse(course)}
                          disabled={(!course.paddle_price_id && !course.mercadopago_link) || isCheckoutLoading === course.id}
                        >
                          {isCheckoutLoading === course.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            (course.paddle_price_id || course.mercadopago_link) ? 'Comprar Agora' : 'Em breve'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!courses || courses.length === 0) && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhum curso disponível no momento.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-12 bg-[#0a192f]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
                  <Zap className="h-5 w-5 text-primary" fill="currentColor" />
                  <span>INFORMÁTICA <span className="text-primary">do Josy</span></span>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  A melhor fonte de ferramentas digitais e conhecimento técnico desde 2026.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Navegação</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#softwares" className="hover:text-primary">Softwares</a></li>
                  <li><a href="#cursos" className="hover:text-primary">Cursos PDF</a></li>
                  <li><a href="#" className="hover:text-primary">Suporte</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Legal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary">Privacidade</a></li>
                  <li><a href="#" className="hover:text-primary">Termos de Uso</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              © 2026 INFORMÁTICA do Josy. Todos os direitos reservados.
              <p className="mt-4 text-xs opacity-50">Após a confirmação do pagamento no Mercado Pago, você receberá automaticamente um e-mail com o link de download e o comprovante da sua compra.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
