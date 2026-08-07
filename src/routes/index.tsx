import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, BookOpen, ChevronRight, Laptop, Star, ShieldCheck, Zap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
    title: "SoftCourse - Download de Programas e Cursos em PDF",
    meta: [
      { name: "description", content: "O melhor portal para baixar softwares utilitários e adquirir cursos especializados em PDF." },
      { property: "og:title", content: "SoftCourse - Downloads & Cursos" },
      { property: "og:description", content: "Encontre os melhores softwares e cursos digitais em um só lugar." },
    ],
  }),
});

function Index() {
  const { data: softwares } = useSuspenseQuery(softwaresQueryOptions);
  const { data: courses } = useSuspenseQuery(coursesQueryOptions);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

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

  const handleBuyCourse = (course: any) => {
    // @ts-ignore
    if (!window.Paddle) {
      toast.error("Erro ao carregar sistema de pagamentos");
      return;
    }

    if (!course.paddle_price_id && !course.mercadopago_link) {
      toast.error("Este curso ainda não possui um método de pagamento configurado");
      return;
    }

    if (course.mercadopago_link) {
      window.open(course.mercadopago_link, '_blank');
      return;
    }

    setIsCheckoutLoading(course.id);
    
    // @ts-ignore
    window.Paddle.Checkout.open({
      items: [{ priceId: course.paddle_price_id, quantity: 1 }],
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'pt'
      },
      eventCallback: (data: any) => {
        if (data.name === 'checkout.completed') {
          toast.success("Compra realizada com sucesso!");
          if (course.file_url) {
            window.open(course.file_url, '_blank');
          }
        }
        if (data.name === 'checkout.closed') {
          setIsCheckoutLoading(null);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" />
            <span>SoftCourse</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#softwares" className="hover:text-primary transition-colors">Softwares</a>
            <a href="#cursos" className="hover:text-primary transition-colors">Cursos</a>
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth">Entrar</a>
            </Button>
            <Button size="sm">Começar Agora</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden border-b">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-[800px] space-y-6">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                Plataforma All-in-One de Software & Educação
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Turbine seu computador e sua <span className="text-primary">carreira</span>.
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px]">
                Baixe ferramentas exclusivas para produtividade e adquira conhecimentos práticos com nossos cursos em PDF de alta qualidade.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="h-12 px-8" asChild>
                  <a href="#softwares">
                    Explorar Softwares <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8" asChild>
                  <a href="#cursos">Ver Cursos</a>
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> Downloads Seguros
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" /> Conteúdo Premium
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-2/3 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        </section>

        {/* Software Section */}
        <section id="softwares" className="py-20 bg-muted/30">
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
              {softwares.map((sw: any) => (
                <Card key={sw.id} className="group hover:shadow-lg transition-all duration-300">
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
                  <CardFooter>
                    <Button 
                      className="w-full group-hover:bg-primary transition-colors"
                      onClick={() => sw.file_url && window.open(sw.file_url, '_blank')}
                      disabled={!sw.file_url}
                    >
                      <Download className="mr-2 h-4 w-4" /> {sw.file_url ? 'Baixar Agora' : 'Em breve'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {softwares.length === 0 && (
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
              <Button variant="link" className="p-0">Ver todos cursos</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course: any) => (
                <div key={course.id} className="flex flex-col lg:flex-row gap-6 p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex-shrink-0 w-full lg:w-48 h-64 bg-muted rounded-xl flex items-center justify-center relative overflow-hidden group">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
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
              {courses.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhum curso disponível no momento.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                  <Zap className="h-5 w-5 text-primary" fill="currentColor" />
                  <span>SoftCourse</span>
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
              © 2026 SoftCourse. Todos os direitos reservados.
              <p className="mt-4 text-xs opacity-50">Após a confirmação do pagamento no Mercado Pago, você receberá automaticamente um e-mail com o link de download e o comprovante da sua compra.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
