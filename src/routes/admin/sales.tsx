import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/sales")({
  component: SalesPanelPage,
});

function SalesPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel de vendas</h1>
        <p className="text-muted-foreground">Acesse o painel externo de vendas e licenças.</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Gerenciamento de vendas
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Clique no botão abaixo para abrir o painel de vendas em uma nova aba.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="rounded-md px-8 font-semibold" asChild>
            <a
              href="https://cheerful-making-zone.lovable.app/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Abrir painel de vendas
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
