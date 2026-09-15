import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronLeft, ChevronRight, Download, ShieldCheck, Star, Loader2, ArrowRight } from "lucide-react";
import { getPurchasedDownloadUrl } from "@/lib/downloads.functions";
import { useServerFn } from "@tanstack/react-start";
import { createCourseCheckout, getCoursePurchaseStatus } from "@/lib/mercadopago.functions";
import { StoreShell } from "@/components/store/StoreShell";
import { StorageImage } from "@/components/StorageImage";
import { StorageVideo } from "@/components/StorageVideo";

const COURSE_COLUMNS =
  "id, title, description, price, pages, level, status, created_at, updated_at, image_url, video_url, has_purchase_link, has_download";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetails,
  loader: async ({ params, context }) => {
    const { courseId } = params;
    return context.queryClient.ensureQueryData({
      queryKey: ["course", courseId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("courses")
          .select(COURSE_COLUMNS)
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
      meta: [
        { title: `${course?.title || "Curso"} - Informática do Josy` },
        { name: "description", content: course?.description || "Detalhes do curso" },
        { property: "og:title", content: course?.title },
        { property: "og:description", content: course?.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
});

function CourseDetails() {
  const params = Route.useParams();
  const router = useRouter();
  const { data: course } = useSuspenseQuery({
    queryKey: ["course", params.courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(COURSE_COLUMNS)
        .eq("id", params.courseId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const createCheckout = useServerFn(createCourseCheckout);
  const purchaseStatus = useServerFn(getCoursePurchaseStatus);

  useEffect(() => {
    let active = true;
    const checkPurchaseStatus = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;
      try {
        const { purchased } = await purchaseStatus({ data: { courseId: params.courseId } });
        if (active && purchased) setHasPurchased(true);
      } catch {
        // ignora
      }
    };

    checkPurchaseStatus();
    const onFocus = () => checkPurchaseStatus();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [params.courseId, purchaseStatus]);

  const handleBuy = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();

    if (!authSession) {
      toast.error("Você precisa estar logado para comprar");
      window.location.href = "/auth";
      return;
    }

    if (!course.price || course.price <= 0) {
      toast.error("Este curso é gratuito");
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckout({ data: { courseId: course.id } });
      toast.info("Redirecionando para o Mercado Pago...");
      window.location.href = checkoutUrl;
    } catch {
      toast.error("Não foi possível iniciar a compra agora");
      setIsCheckoutLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const { url } = await getPurchasedDownloadUrl({
        data: { kind: "course", itemId: params.courseId },
      });
      window.open(url, "_blank");
    } catch {
      toast.error("Arquivo não disponível");
    }
  };

  return (
    <StoreShell active="courses">
      {/* Trilha de navegação */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground hover:underline">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/courses" className="hover:text-foreground hover:underline">Cursos</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-foreground">{course.title}</span>
        </nav>
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="text-muted-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Conteúdo principal */}
        <div className="space-y-8 lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <StorageImage
                value={course.image_url}
                alt={course.title}
                className="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {course.level || "Iniciante ao Avançado"}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {course.title}
              </h1>
              <p className="mt-1 text-sm text-primary">Informática do Josy</p>
            </div>
          </div>

          <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {course.description}
          </p>

          {course.video_url && (
            <section>
              <h2 className="text-xl font-semibold text-foreground">Vídeo de apresentação</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-sm">
                <StorageVideo value={course.video_url} className="h-full w-full" />
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold text-foreground">O que você vai aprender</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                "Conteúdo prático e direto ao ponto",
                "Material didático em alta definição",
                "Acesso vitalício ao arquivo PDF",
                "Suporte especializado incluso",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cartão de compra */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">R$ {course.price?.toFixed(2)}</div>
              <p className="mt-1 text-sm text-muted-foreground">Pagamento único, acesso imediato</p>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Formato</span>
                <span className="font-medium text-foreground">Digital (PDF)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Páginas</span>
                <span className="font-medium text-foreground">{course.pages || "--"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Idioma</span>
                <span className="font-medium text-foreground">Português (BR)</span>
              </div>
            </div>

            <div className="mt-6">
              {hasPurchased ? (
                <Button className="h-12 w-full rounded-md text-base font-semibold" onClick={handleDownload}>
                  <Download className="mr-2 h-5 w-5" /> Baixar PDF Agora
                </Button>
              ) : (
                <Button
                  className="h-12 w-full rounded-md text-base font-semibold"
                  onClick={handleBuy}
                  disabled={isCheckoutLoading}
                >
                  {isCheckoutLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>Comprar Agora <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Garantia de satisfação de 7 dias</p>
            </div>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
