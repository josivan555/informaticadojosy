import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ChevronLeft, Download, ShieldCheck, Star, Zap, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetails,
  loader: async ({ params, context }) => {
    const { courseId } = params;
    return context.queryClient.ensureQueryData({
      queryKey: ["course", courseId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();
        if (error) throw error;
        return data;
      },
    });
  },
  head: (data) => {
    const course = data.loaderData as any;
    return {
      title: `${course?.title || "Curso"} - INFORMÁTICA do Josy`,
      meta: [
        { name: "description", content: course?.description || "Detalhes do curso" },
        { property: "og:title", content: course?.title },
        { property: "og:description", content: course?.description },
      ],
    };
  },
});

function CourseDetails() {
  const params = Route.useParams();
  const { data: course } = useSuspenseQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const { data: purchase } = await supabase
        .from('checkout_sessions')
        .select('*')
        .eq('course_id', params.courseId)
        .eq('user_id', authSession.user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (purchase) {
        setHasPurchased(true);
      }
    };

    checkPurchaseStatus();
  }, [params.courseId]);

  useEffect(() => {
    // @ts-ignore
    if (window.Paddle) {
      // @ts-ignore
      window.Paddle.Setup({ 
        seller: 12345, // Usuário deve alterar
        environment: 'sandbox' 
      });
    }
  }, []);

  const handleBuy = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    
    if (!authSession) {
      toast.error("Você precisa estar logado para comprar");
      window.location.href = "/auth";
      return;
    }

    if (!course.paddle_price_id && !course.mercadopago_link) {
      toast.error("Método de pagamento não configurado");
      return;
    }

    if (course.mercadopago_link) {
      // Create a pending session before redirecting
      // In a real flow, you'd use Mercado Pago API to create a preference and get an ID
      // Here we'll use a placeholder or the link itself as reference
      await supabase.from('checkout_sessions').insert({
        user_id: authSession.user.id,
        course_id: course.id,
        payment_method: 'mercadopago',
        status: 'pending'
      });
      
      window.open(course.mercadopago_link, '_blank');
      toast.info("Redirecionando para o Mercado Pago...");
      return;
    }

    // @ts-ignore
    if (!window.Paddle) {
      toast.error("Sistema de pagamentos não carregado");
      return;
    }

    setIsCheckoutLoading(true);
    // @ts-ignore
    window.Paddle.Checkout.open({
      items: [{ priceId: course.paddle_price_id, quantity: 1 }],
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'pt'
      },
      eventCallback: async (data: any) => {
        if (data.name === 'checkout.completed') {
          // Update local session
          await supabase.from('checkout_sessions').insert({
            user_id: authSession.user.id,
            course_id: course.id,
            external_checkout_id: data.data.checkout.id,
            payment_method: 'paddle',
            status: 'completed'
          });
          
          setHasPurchased(true);
          toast.success("Compra confirmada!");
        }
        if (data.name === 'checkout.closed') {
          setIsCheckoutLoading(false);
        }
      }
    });
  };

  const handleDownload = () => {
    if (course.file_url) {
      window.open(course.file_url, '_blank');
    } else {
      toast.error("Arquivo não disponível");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200">
      <header className="border-b border-primary/10 bg-[#0a192f]/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <Zap className="h-5 w-5 text-primary" fill="currentColor" />
            <span>INFORMÁTICA <span className="text-primary">do Josy</span></span>
          </Link>

          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Início
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-3 py-1">
                {course.level || "Iniciante ao Avançado"}

              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
                {course.title}

              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="aspect-video bg-[#112240] rounded-3xl flex items-center justify-center border-2 border-slate-700 overflow-hidden relative">
              {course.image_url ? (
                <img 
                  src={course.image_url} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="h-24 w-24 text-muted-foreground/50" />
              )}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">O que você vai aprender</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Conteúdo prático e direto ao ponto",
                  "Material didático em alta definição",
                  "Acesso vitalício ao arquivo PDF",
                  "Suporte especializado incluso"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-slate-800 bg-[#112240]">
                    <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Purchase Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-primary/20 bg-[#112240] text-slate-200">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-4xl font-bold text-white">
                  R$ {course.price?.toFixed(2)}

                </CardTitle>
                <CardDescription>Pagamento único, acesso imediato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Formato</span>
                    <span className="font-medium">Digital (PDF)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Páginas</span>
                    <span className="font-medium">{course.pages || "--"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Idioma</span>
                    <span className="font-medium">Português (BR)</span>
                  </div>
                </div>

                {hasPurchased ? (
                  <Button 
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
                    onClick={handleDownload}
                  >
                    <Download className="ml-2 h-5 w-5" /> Baixar PDF Agora
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                    onClick={handleBuy}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>Comprar Agora <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                )}

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Garantia de satisfação de 7 dias
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-[#0a192f] border-t border-slate-800 py-12 mt-20">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-bold text-xl text-white">
            <Zap className="h-5 w-5 text-primary" fill="currentColor" />
            <span>INFORMÁTICA <span className="text-primary">do Josy</span></span>
          </div>
          <p className="text-sm text-muted-foreground">
            A melhor fonte de ferramentas digitais e conhecimento técnico.
          </p>
        </div>
      </footer>

    </div>
  );
}
