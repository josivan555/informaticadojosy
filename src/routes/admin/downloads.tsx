import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Laptop, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminListDownloads } from "@/lib/admin-content.functions";

export const Route = createFileRoute("/admin/downloads")({
  component: AdminDownloads,
  head: () => ({
    meta: [
      { title: "Métricas de Downloads - Informática do Josy" },
      { name: "description", content: "Métricas administrativas de downloads dos programas." },
      { property: "og:title", content: "Métricas de Downloads - Informática do Josy" },
      { property: "og:description", content: "Métricas administrativas de downloads dos programas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AdminDownloads() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const listFn = useServerFn(adminListDownloads);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-downloads", period],
    queryFn: () => listFn({ data: { period } }),
  });

  const periods = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "all", label: "Todo o período" },
  ] as const;
  const rows = data?.history ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Métricas de Downloads</h1>
          <p className="text-muted-foreground">Desempenho e histórico dos programas baixados.</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end" aria-label="Filtrar período">
          {periods.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={period === item.value ? "default" : "outline"}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary"><Download className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Downloads</p><p className="text-2xl font-bold text-foreground">{isLoading ? "—" : data?.total ?? 0}</p></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary"><Laptop className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Programas baixados</p><p className="text-2xl font-bold text-foreground">{isLoading ? "—" : data?.programs ?? 0}</p></div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary"><Medal className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="text-sm text-muted-foreground">Mais baixado</p><p className="truncate text-lg font-bold text-foreground">{isLoading ? "—" : data?.topProgram?.name ?? "Nenhum"}</p></div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Programas mais baixados</h2>
          <p className="text-sm text-muted-foreground">Classificação no período selecionado.</p>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando classificação...</div>
        ) : !data?.ranking.length ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum download neste período.</div>
        ) : (
          <div className="space-y-4">
            {data.ranking.map((item, index) => (
              <div key={item.software_id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3">
                <span className="text-center text-sm font-semibold text-muted-foreground">{index + 1}º</span>
                <div className="min-w-0">
                  <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <progress
                    value={item.percentage}
                    max={100}
                    aria-label={`${item.percentage}% dos downloads`}
                    className="h-2 w-full overflow-hidden rounded-full accent-primary"
                  />
                </div>
                <span className="min-w-16 text-right text-sm font-semibold text-foreground">{item.count} {item.count === 1 ? "download" : "downloads"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div>
        <h2 className="text-xl font-semibold text-foreground">Histórico recente</h2>
        <p className="text-sm text-muted-foreground">Até 200 registros do período selecionado.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Programa</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  Nenhum download registrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      {row.software_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.user_email}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(row.downloaded_at).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
