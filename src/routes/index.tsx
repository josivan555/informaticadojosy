import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import heroBannerAsset from "@/assets/main-hero-banner.png.asset.json";
import { StoreShell } from "@/components/store/StoreShell";
import { StoreCard } from "@/components/store/StoreCard";

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

const softwaresQueryOptions = {
  queryKey: ["softwares", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("softwares")
      .select("id, name, description, version, size, category, downloads, status, created_at, price, category_id, image_url, has_purchase_link, has_download")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return data || [];
  },
};

const coursesQueryOptions = {
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, price, pages, level, status, created_at, image_url, has_purchase_link, has_download")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export const Route = createFileRoute("/")({
  component: Index,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(allSoftwaresQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Informática do Josy - Download de Programas e Cursos em PDF" },
      { name: "description", content: "Baixe programas gratuitos para PC e adquira cursos em PDF com pagamento por Pix ou cartão." },
      { property: "og:title", content: "Informática do Josy - Downloads & Cursos" },
      { property: "og:description", content: "Programas gratuitos, utilitários e cursos digitais em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SectionHeader({ title, subtitle, to }: { title: string; subtitle?: string; to: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Button variant="link" className="h-auto p-0 text-primary" asChild>
        {/* @ts-ignore */}
        <Link to={to}>
          Ver tudo <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function Index() {
  const [search, setSearch] = useState("");
  const { data: allSoftwares } = useSuspenseQuery(allSoftwaresQueryOptions);
  const { data: softwares } = useQuery(softwaresQueryOptions);
  const { data: courses } = useQuery(coursesQueryOptions);

  const term = search.trim().toLowerCase();
  const list = (softwares || []).filter((sw: any) => !term || sw.name?.toLowerCase().includes(term));
  const freeList = list.filter((sw: any) => !sw.price || sw.price === 0);
  const paidList = list.filter((sw: any) => sw.price > 0);
  const courseList = (courses || []).filter((c: any) => !term || c.title?.toLowerCase().includes(term));

  return (
    <StoreShell active="home" search={search} onSearchChange={setSearch}>
      {/* Destaque principal */}
      <section className="mb-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <img src={heroBannerAsset.url} alt="Informática do Josy" className="h-auto w-full object-cover" />
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">Programas e cursos para o seu PC</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Baixe utilitários gratuitos e aprenda com cursos em PDF. Pague com Pix ou cartão.
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="rounded-md" asChild>
              <Link to="/softwares">Ver programas</Link>
            </Button>
            <Button variant="outline" className="rounded-md" asChild>
              <Link to="/courses">Ver cursos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Principais gratuitos */}
      <section className="mb-10">
        <SectionHeader title="Principais gratuitos" subtitle="Programas para baixar sem pagar nada" to="/softwares" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {freeList.slice(0, 10).map((sw: any) => (
            <StoreCard
              key={sw.id}
              to="/softwares/$softwareId"
              params={{ softwareId: sw.id }}
              image={sw.image_url}
              title={sw.name}
              subtitle={sw.category || "Programa"}
              price={sw.price}
            />
          ))}
          {freeList.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Nenhum programa gratuito publicado ainda.
            </p>
          )}
        </div>
      </section>

      {/* Programas premium */}
      {paidList.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Programas premium" subtitle="Ferramentas pagas do catálogo" to="/softwares" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {paidList.slice(0, 10).map((sw: any) => (
              <StoreCard
                key={sw.id}
                to="/softwares/$softwareId"
                params={{ softwareId: sw.id }}
                image={sw.image_url}
                title={sw.name}
                subtitle={sw.category || "Programa"}
                price={sw.price}
                meta={sw.version ? `v${sw.version}` : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cursos */}
      <section className="mb-10">
        <SectionHeader title="Cursos em PDF" subtitle="Pague com Pix ou cartão e receba o link do PDF" to="/courses" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {courseList.map((course: any) => (
            <StoreCard
              key={course.id}
              to="/courses/$courseId"
              params={{ courseId: course.id }}
              image={course.image_url}
              title={course.title}
              subtitle={course.level || "Curso em PDF"}
              price={course.price}
              meta={course.pages ? `${course.pages} pág.` : null}
            />
          ))}
          {courseList.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Nenhum curso disponível no momento.
            </p>
          )}
        </div>
      </section>

      {/* Lista completa em coluna, estilo catálogo */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Todo o catálogo</h2>
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {(allSoftwares || []).map((sw: any) => (
            <Link
              key={sw.id}
              to="/softwares/$softwareId"
              params={{ softwareId: sw.id }}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary"
            >
              <span className="flex-1 truncate text-sm font-medium text-card-foreground">{sw.name}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">{sw.category || "Programa"}</span>
              <span className="text-sm text-card-foreground">
                {sw.price > 0 ? `R$ ${sw.price.toFixed(2)}` : "Grátis"}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </StoreShell>
  );
}
