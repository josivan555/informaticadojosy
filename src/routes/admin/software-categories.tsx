import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  adminListCategories,
  adminSaveCategory,
  adminDeleteCategory,
} from "@/lib/admin-content.functions";

export const Route = createFileRoute("/admin/software-categories")({
  component: AdminSoftwareCategories,
});

function AdminSoftwareCategories() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListCategories);
  const saveFn = useServerFn(adminSaveCategory);
  const deleteFn = useServerFn(adminDeleteCategory);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listFn({ data: undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: (input: { id?: string; name: string; description?: string | null }) =>
      saveFn({ data: input }),
    onSuccess: () => {
      toast.success("Categoria salva!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Categoria removida!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setOpen(true);
  };

  const openEdit = (c: { id: string; name: string; description: string | null }) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description ?? "");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorias de Softwares</h1>
          <p className="text-muted-foreground">Organize seus programas por categoria.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Programas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.software_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remover esta categoria?")) deleteMutation.mutate(c.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="store-theme bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Antivírus" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!name.trim() || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    id: editingId ?? undefined,
                    name: name.trim(),
                    description: description.trim() || null,
                  })
                }
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
