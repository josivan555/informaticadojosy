import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Laptop, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/downloads")({
  component: AdminDownloads,
});

function AdminDownloads() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["admin-download-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("download_history")
        .select(`
          *,
          softwares (name),
          profiles:user_id (email)
        `)
        .order("downloaded_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Histórico de Downloads</h1>
        <p className="text-muted-foreground">Veja quem baixou o quê e quando.</p>
      </div>

      <Card className="bg-[#112240] border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle>Todos os Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg border-slate-800">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Usuário</TableHead>
                  <TableHead className="text-slate-400">Software</TableHead>
                  <TableHead className="text-slate-400">Data e Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : !history || history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum download registrado.</TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-medium">
                        {(row as any).profiles?.email || "Usuário desconhecido"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-primary" />
                          {row.softwares?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(row.downloaded_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
