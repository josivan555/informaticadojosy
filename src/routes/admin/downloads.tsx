import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminListDownloads } from "@/lib/admin-content.functions";

export const Route = createFileRoute("/admin/downloads")({
  component: AdminDownloads,
});

function AdminDownloads() {
  const listFn = useServerFn(adminListDownloads);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-downloads"],
    queryFn: () => listFn({ data: undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Downloads</h1>
        <p className="text-muted-foreground">Últimos downloads feitos pelos usuários.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
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
