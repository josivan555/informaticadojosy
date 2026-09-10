import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Laptop, ChevronLeft, ShieldCheck, Zap, Star, Menu } from "lucide-react";
import { toast } from "sonner";
import { getFreeSoftwareDownloadUrl } from "@/lib/downloads.functions";
import { StorageImage } from "@/components/StorageImage";

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
  const router = useRouter();

  const { data: sw } = useSuspenseQuery({
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

  const { data: allSoftwares } = useSuspenseQuery(allSoftwaresQueryOptions);

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
          <Button
            variant="ghost"
            onClick={() => router.history.back()}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="max-w-md mx-auto md:mx-0 rounded-2xl overflow-hidden border border-primary/20 bg-slate-900 shadow-2xl p-4">
                  <StorageImage
                    value={sw.image_url}
                    alt={sw.name}
                    className="w-full h-auto max-h-[520px] object-contain rounded-xl"
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
          </div>

          {/* Right-side menu */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-800 bg-[#112240] p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Menu className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-white">Todos os Softwares</h2>
              </div>
              <nav className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 space-y-2">
                {(allSoftwares || []).map((item: any) => {
                  const isActive = item.id === sw.id;
                  return (
                    <Link
                      key={item.id}
                      to="/softwares/$softwareId"
                      params={{ softwareId: item.id }}
                      className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-[#162a4a] border border-transparent"
                      }`}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                        <StorageImage
                          value={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          fallback={<Laptop className="h-4 w-4 text-primary/30" />}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-slate-200"}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {item.category || "Software"}
                          {item.price > 0 && " • Pago"}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
