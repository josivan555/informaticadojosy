import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Search } from "lucide-react";
import { StoreShell } from "@/components/store/StoreShell";
import { StoreCard } from "@/components/store/StoreCard";

export const Route = createFileRoute("/softwares/")({
  component: SoftwaresPage,
  head: () => ({
    meta: [
      { title: "Programas para PC - Informática do Josy" },
      { name: "description", content: "Baixe programas utilitários, ferramentas de produtividade e softwares exclusivos, gratuitos e premium." },
      { property: "og:title", content: "Programas para PC - Informática do Josy" },
      { property: "og:description", content: "Catálogo completo de programas gratuitos e premium para o seu computador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TABS = [
  { key: "all", label: "Todos" },
  { key: "free", label: "Gratuitos" },
  { key: "paid", label: "Premium" },
] as const;

function SoftwaresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: softwares } = useSuspenseQuery({
    queryKey: ["softwares-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("softwares")
        .select("id, name, description, version, size, category, downloads, status, created_at, price, category_id, image_url, has_purchase_link, has_download, software_categories(*)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ["software-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("software_categories").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredSoftwares = softwares.filter((sw: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      sw.name.toLowerCase().includes(term) || sw.description?.toLowerCase().includes(term);
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "free" && (!sw.price || sw.price === 0)) ||
      (activeTab === "paid" && sw.price > 0);
    const matchesCategory = selectedCategory === "all" || sw.category_id === selectedCategory;
    return matchesSearch && matchesTab && matchesCategory;
  });

  return (
    <StoreShell active="softwares" search={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="Pesquisar programas">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Programas para PC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um programa, veja os detalhes e faça o download.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          className="h-9 rounded-full border border-border bg-card px-4 text-sm text-foreground"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-muted-foreground">
          {filteredSoftwares.length} {filteredSoftwares.length === 1 ? "programa" : "programas"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {filteredSoftwares.map((sw: any) => (
          <StoreCard
            key={sw.id}
            to="/softwares/$softwareId"
            params={{ softwareId: sw.id }}
            image={sw.image_url}
            title={sw.name}
            subtitle={sw.software_categories?.name || sw.category || "Programa"}
            price={sw.price}
            meta={sw.version ? `v${sw.version}` : null}
          />
        ))}
      </div>

      {filteredSoftwares.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-20 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <h3 className="font-medium text-foreground">Nenhum programa encontrado</h3>
          <p className="text-sm text-muted-foreground">Tente mudar a busca ou os filtros.</p>
        </div>
      )}
    </StoreShell>
  );
}
