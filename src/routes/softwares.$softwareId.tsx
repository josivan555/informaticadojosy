import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Laptop, ChevronLeft, ShieldCheck, Zap, Star } from "lucide-react";
import { toast } from "sonner";
import { getFreeSoftwareDownloadUrl } from "@/lib/downloads.functions";
import { StorageImage } from "@/components/StorageImage";

export const Route = createFileRoute("/softwares/$softwareId")({
  component: SoftwareDetails,
  loader: async ({ params, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ["software", params.softwareId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("softwares")
          .select("id, name, description, version, size, category, downloads, status, created_at, updated_at, price, category_id, image_url, video_url, has_purchase_link, has_download")
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

  const { data: sw, isLoading } = useQuery({
    queryKey: ["software", softwareId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("softwares")
        .select("id, name, description, version, size, category, downloads, status, created_at, updated_at, price, category_id, image_url, video_url, has_purchase_link, has_download")
        .eq("id", softwareId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sw) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Software não encontrado</h1>
        <Button asChild>
          <Link to="/">Voltar para Home</Link>
        </Button>
      </div>
    );
  }

  const handleDownload = async () => {
    if (sw.price && sw.price > 0) {
      toast.info("Este software é Premium. Entre em contato ou use o link de compra.");
      return;
    }

    if (!sw.has_download) {
      toast.error("Em breve: download ainda não disponível");
      return;
    }

    try {
      const { url } = await getFreeSoftwareDownloadUrl({ data: { softwareId: sw.id } });
      window.open(url, '_blank');
    } catch {
      toast.error("Link de download não disponível");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200 pb-20">
      <header className="border-b border-primary/10 bg-[#0a192f]/90 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto h-16 flex items-center px-4">
          <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="max-w-md mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-primary/20 bg-slate-900 shadow-2xl">
              <StorageImage
                value={sw.image_url}
                alt={sw.name}
                className="w-full aspect-video object-cover"
                fallback={
                  <div className="aspect-video flex items-center justify-center bg-slate-800">
                    <Laptop className="h-20 w-20 text-primary/20" />
                  </div>
                }
              />
            </div>

            {sw.video_url && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Demonstração em Vídeo
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                  <iframe
                    src={sw.video_url.replace("watch?v=", "embed/")}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase tracking-wider text-[10px]">
                {sw.category || "Utilitário"}
              </Badge>
              <h1 className="text-4xl font-bold text-white tracking-tight">{sw.name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Versão {sw.version || "1.0"}</span>
                <span>•</span>
                <span>{sw.size || "N/A"}</span>
                <span>•</span>
                <span>{sw.downloads || 0} downloads</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#112240] border border-slate-800 space-y-4">
              <div className="text-2xl font-bold text-white">
                {sw.price && sw.price > 0 ? `R$ ${sw.price.toFixed(2)}` : "Gratuito"}
              </div>
              <Button className="w-full h-12 text-lg font-bold" onClick={handleDownload}>
                <Download className="mr-2 h-5 w-5" /> 
                {sw.price && sw.price > 0 ? "Comprar Agora" : "Baixar Agora"}
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> Sobre o Programa
              </h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                {sw.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <Star className="h-5 w-5 text-yellow-500 mb-2" />
                <div className="font-bold text-white">Alta Performance</div>
                <div className="text-xs text-slate-500">Otimizado para sistemas modernos.</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                <div className="font-bold text-white">100% Seguro</div>
                <div className="text-xs text-slate-500">Verificado contra ameaças.</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
