import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Ticket } from "lucide-react";

export const Route = createFileRoute("/admin/sales")({
  component: SalesPanelPage,
});

const MAIN_SALES_PANEL_URL = "https://cheerful-making-zone.lovable.app/admin";

// Endereço do painel de vendas do Bingo Show Master. Deixe vazio até o link ser informado.
const BINGO_SHOW_MASTER_SALES_PANEL_URL = "";

function SalesPanelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel de vendas</h1>
        <p className="text-muted-foreground">Acesse os painéis externos de vendas e licenças.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                href={MAIN_SALES_PANEL_URL}
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

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Ticket className="h-5 w-5 text-primary" />
              Painel de Vendas — Bingo Show Master
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {BINGO_SHOW_MASTER_SALES_PANEL_URL
                ? "Clique no botão abaixo para abrir o painel do Bingo Show Master em uma nova aba."
                : "Aguardando o endereço. Informe o link e o botão é liberado."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {BINGO_SHOW_MASTER_SALES_PANEL_URL ? (
              <Button size="lg" className="rounded-md px-8 font-semibold" asChild>
                <a
                  href={BINGO_SHOW_MASTER_SALES_PANEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Abrir painel de vendas — Bingo Show Master
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button size="lg" disabled className="rounded-md px-8 font-semibold">
                Endereço ainda não definido
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
