import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Laptop, Star, ShieldCheck, Zap, Loader2, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/softwares")({
  component: SoftwaresPage,
  head: () => ({
    title: "Programas e Softwares - INFORMÁTICA do Josy",
    meta: [
      { name: "description", content: "Baixe os melhores programas utilitários, ferramentas de produtividade e softwares exclusivos." },
    ],
  }),
});

function SoftwaresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

  const { data: softwares } = useSuspenseQuery({
    queryKey: ["softwares-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("softwares")
        .select("*, software_categories(*)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useSuspenseQuery({
    queryKey: ["software-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("software_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredSoftwares = softwares.filter((sw: any) => {
    const matchesSearch = sw.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sw.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "free" && (!sw.price || sw.price === 0)) ||
                      (activeTab === "paid" && sw.price > 0);

    const matchesCategory = selectedCategory === "all" || sw.category_id === selectedCategory;
    
    return matchesSearch && matchesTab && matchesCategory;
  });

  const handleDownload = (sw: any) => {
    if (sw.price > 0) {
      if (!sw.paddle_price_id && !sw.mercadopago_link) {
        toast.error("Método de pagamento não configurado para este software");
        return;
      }

      if (sw.mercadopago_link) {
        window.open(sw.mercadopago_link, '_blank');
        return;
      }

      // @ts-ignore
      if (window.Paddle) {
        setIsCheckoutLoading(sw.id);
        // @ts-ignore
        window.Paddle.Checkout.open({
          items: [{ priceId: sw.paddle_price_id, quantity: 1 }],
          settings: { displayMode: 'overlay', theme: 'light', locale: 'pt' },
          eventCallback: (data: any) => {
            if (data.name === 'checkout.completed') {
              toast.success("Compra realizada! Iniciando download...");
              if (sw.file_url) window.open(sw.file_url, '_blank');
            }
            if (data.name === 'checkout.closed') setIsCheckoutLoading(null);
          }
        });
      } else {
        toast.error("Sistema de pagamentos não disponível");
      }
    } else {
      if (sw.file_url) {
        window.open(sw.file_url, '_blank');
        toast.success("Download iniciado!");
      } else {
        toast.error("Link de download não disponível");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200">
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-[#0a192f]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0a192f]/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" />
            <span>INFORMÁTICA <span className="text-primary">do Josy</span></span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-primary transition-colors">Início</Link>
            <Link to="/softwares" className="text-primary transition-colors">Softwares</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4">
        <div className="max-w-[800px] mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Biblioteca de Softwares</h1>
          <p className="text-lg text-muted-foreground">
            Explore nossa coleção de ferramentas e utilitários para turbinar seu fluxo de trabalho.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar programas..." 
                className="pl-10 bg-[#112240] border-slate-700 text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="flex h-10 w-full md:w-48 rounded-md border border-slate-700 bg-[#112240] px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-slate-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList className="bg-[#112240] border border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="free" className="data-[state=active]:bg-primary data-[state=active]:text-white">Gratuitos</TabsTrigger>
              <TabsTrigger value="paid" className="data-[state=active]:bg-primary data-[state=active]:text-white">Premium</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSoftwares.map((sw: any) => (
            <Card key={sw.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col bg-[#112240] border-slate-800 hover:border-primary/50 text-slate-200">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Laptop className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant={sw.price > 0 ? "default" : "secondary"}>
                    {sw.price > 0 ? `R$ ${sw.price.toFixed(2)}` : "Grátis"}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{sw.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">{sw.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider border-slate-700">{sw.software_categories?.name || sw.category}</Badge>
                  <span>v{sw.version}</span>
                  <span>•</span>
                  <span>{sw.size || "Varia"}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full group-hover:bg-primary transition-colors h-11"
                  onClick={() => handleDownload(sw)}
                  disabled={isCheckoutLoading === sw.id}
                >
                  {isCheckoutLoading === sw.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {sw.price > 0 ? (
                        <>Comprar e Baixar <Download className="ml-2 h-4 w-4" /></>
                      ) : (
                        <>Baixar Agora <Download className="ml-2 h-4 w-4" /></>
                      )}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredSoftwares.length === 0 && (
          <div className="text-center py-24 border-2 border-dashed rounded-3xl">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium">Nenhum programa encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
          </div>
        )}

        {/* Pagination Placeholder */}
        {filteredSoftwares.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" disabled><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="outline" size="sm" disabled>2</Button>
            <Button variant="outline" size="sm" disabled>3</Button>
            <Button variant="outline" size="icon" disabled><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-12 mt-20 bg-[#0a192f]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 INFORMÁTICA do Josy. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
