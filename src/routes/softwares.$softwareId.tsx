import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Laptop, ChevronLeft, ShieldCheck, Zap, Star, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getFreeSoftwareDownloadUrl, getPurchasedDownloadUrl } from "@/lib/downloads.functions";
import { createSoftwareCheckout, getSoftwarePurchaseStatus } from "@/lib/mercadopago.functions";
import { StorageImage } from "@/components/StorageImage";
import { StoreShell } from "@/components/store/StoreShell";

const allSoftwaresQueryOptions = {
  queryKey: ["softwares-menu"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("softwares")
      .select("id, name, category, category_id, price, image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export const Route = createFileRoute("/softwares/$softwareId")({
  component: SoftwareDetails,
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(allSoftwaresQueryOptions);
    return queryClient.ensureQueryData({
      queryKey: ["software", params.softwareId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("softwares")
          .select("id, name, description, version, size, category, downloads, status, created_at, updated_at, price, category_id, image_url, video_url, video_urls, has_purchase_link, has_download")
          .eq("id", params.softwareId)
          .single();
        if (error) throw error;
        return data;
      },
    });
  },
  head: ({ loaderData }) => {
    const sw = loaderData;
    if (!sw) return {};
    const title = `${sw.name} - Informática do Josy`;
    const description = sw.description?.substring(0, 160) || `Baixe o software ${sw.name} na Informática do Josy.`;
    return {
      title,
      meta: [
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
});

function SoftwareDetails() {
  const { softwareId } = Route.useParams();
  const router = useRouter();

  const { data: sw } = useSuspenseQuery({
    queryKey: ["software", softwareId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("softwares")
        .select("id, name, description, version, size, category, downloads, status, created_at, updated_at, price, category_id, image_url, video_url, video_urls, has_purchase_link, has_download")
        .eq("id", softwareId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: allSoftwares } = useSuspenseQuery(allSoftwaresQueryOptions);

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const createCheckout = useServerFn(createSoftwareCheckout);
  const purchaseStatus = useServerFn(getSoftwarePurchaseStatus);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        const { purchased } = await purchaseStatus({ data: { softwareId } });
        if (active && purchased) setHasPurchased(true);
      } catch {
        // ignora
      }
    };
    check();
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [softwareId, purchaseStatus]);


  if (!sw) {
    return (
      <StoreShell active="softwares">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Software não encontrado</h1>
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        </div>
      </StoreShell>
    );
  }

  const isFree = !sw.price || sw.price <= 0;
  const otherSoftwares = (allSoftwares || []).filter((s) => s.id !== sw.id).slice(0, 8);

  const handleDownload = async () => {
    if (!sw.has_download) {
      toast.error("Em breve: download ainda não disponível");
      return;
    }
    try {
      const { url } = isFree
        ? await getFreeSoftwareDownloadUrl({ data: { softwareId: sw.id } })
        : await getPurchasedDownloadUrl({ data: { kind: "software", itemId: sw.id } });
      window.open(url, "_blank");
    } catch {
      toast.error("Link de download não disponível");
    }
  };

  const handleBuy = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Você precisa estar logado para comprar");
      window.location.href = "/auth";
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckout({ data: { softwareId: sw.id } });
      toast.info("Redirecionando para o Mercado Pago...");
      window.location.href = checkoutUrl;
    } catch {
      toast.error("Não foi possível iniciar a compra agora");
      setIsCheckoutLoading(false);
    }
  };

  return (
    <StoreShell active="softwares">
      {/* Trilha de navegação + voltar */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground hover:underline">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/softwares" className="hover:text-foreground hover:underline">Programas</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-foreground">{sw.name}</span>
        </nav>
        <Button variant="ghost" size="sm" onClick={() => router.history.back()} className="text-muted-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Cabeçalho do aplicativo, estilo Microsoft Store */}
      <section className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <StorageImage
            value={sw.image_url}
            alt={sw.name}
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <Laptop className="h-12 w-12 text-muted-foreground/40" />
              </div>
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{sw.name}</h1>
          <p className="mt-1 text-sm text-primary">Informática do Josy</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{sw.category || "Utilitário"}</span>
            <span>•</span>
            <span>Versão {sw.version || "1.0"}</span>
            <span>•</span>
            <span>{sw.size || "N/A"}</span>
            <span>•</span>
            <span>{sw.downloads || 0} downloads</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-lg font-semibold text-foreground">
              {isFree ? "Gratuito" : `R$ ${sw.price!.toFixed(2)}`}
            </div>
            {isFree || hasPurchased ? (
              <Button size="lg" className="rounded-md px-10 font-semibold" onClick={handleDownload}>
                <Download className="mr-2 h-5 w-5" />
                {isFree ? "Obter" : "Baixar agora"}
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-md px-10 font-semibold"
                onClick={handleBuy}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Download className="mr-2 h-5 w-5" />
                )}
                Comprar com Pix ou cartão
              </Button>
            )}
            {sw.name.trim().toLowerCase().startsWith("bingo show master") && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-md px-6 font-semibold"
                asChild
              >
                <a
                  href="https://cheerful-making-zone.lovable.app/planos"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Comprar licença
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Descrição */}
      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-foreground">Descrição</h2>
        <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">
          {sw.description}
        </p>
      </section>

      {/* Vídeos de demonstração */}
      {(sw.video_urls?.length ?? 0) > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Zap className="h-5 w-5 text-primary" /> Vídeos
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {sw.video_urls.map((url: string, i: number) => (
              <div key={i} className="aspect-video overflow-hidden rounded-xl border border-border bg-black shadow-sm">
                <iframe
                  src={url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vídeo de demonstração */}
      {sw.video_url && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Zap className="h-5 w-5 text-primary" /> Demonstração em vídeo
          </h2>
          <div className="mt-4 aspect-video max-w-3xl overflow-hidden rounded-xl border border-border bg-black shadow-sm">
            <iframe
              src={sw.video_url.replace("watch?v=", "embed/")}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Capa em tamanho maior */}
      {sw.image_url && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Captura de tela</h2>
          <div className="mt-4 max-w-xl overflow-hidden rounded-xl border border-border bg-card p-3 shadow-sm">
            <StorageImage
              value={sw.image_url}
              alt={`Capa do ${sw.name}`}
              className="h-auto max-h-[420px] w-full rounded-lg object-contain"
              fallback={
                <div className="flex aspect-video items-center justify-center bg-secondary">
                  <Laptop className="h-12 w-12 text-muted-foreground/40" />
                </div>
              }
            />
          </div>
        </section>
      )}

      {/* Destaques */}
      <section className="mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <Star className="mb-2 h-5 w-5 text-yellow-500" />
          <div className="font-semibold text-foreground">Alta performance</div>
          <div className="mt-1 text-sm text-muted-foreground">Otimizado para sistemas modernos.</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
          <div className="font-semibold text-foreground">100% seguro</div>
          <div className="mt-1 text-sm text-muted-foreground">Verificado contra ameaças.</div>
        </div>
      </section>

      {/* Mais programas */}
      {otherSoftwares.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Mais programas</h2>
            <Link to="/softwares" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {otherSoftwares.map((s) => (
              <Link
                key={s.id}
                to="/softwares/$softwareId"
                params={{ softwareId: s.id }}
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-xl border border-border bg-secondary">
                  <StorageImage
                    value={s.image_url}
                    alt={s.name}
                    className="h-full w-full object-cover"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center">
                        <Laptop className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    }
                  />
                </div>
                <div className="mt-3 text-center">
                  <div className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {s.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {s.price && s.price > 0 ? `R$ ${s.price.toFixed(2)}` : "Gratuito"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </StoreShell>
  );
}
