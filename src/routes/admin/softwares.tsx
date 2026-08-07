import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/softwares")({
  component: AdminSoftwares,
});

function AdminSoftwares() {
  const [softwares, setSoftwares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "",
    category: "",
    status: "published"
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("softwares")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erro ao carregar softwares");
    } else {
      setSoftwares(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (sw: any = null) => {
    if (sw) {
      setEditingSoftware(sw);
      setFormData({
        name: sw.name,
        description: sw.description,
        version: sw.version,
        category: sw.category,
        status: sw.status
      });
    } else {
      setEditingSoftware(null);
      setFormData({
        name: "",
        description: "",
        version: "",
        category: "",
        status: "published"
      });
    }
    setFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fileUrl = editingSoftware?.file_url || "";

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `softwares/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      }

      const swData = {
        ...formData,
        file_url: fileUrl,
        updated_at: new Date().toISOString()
      };

      if (editingSoftware) {
        const { error } = await supabase
          .from("softwares")
          .update(swData)
          .eq("id", editingSoftware.id);
        if (error) throw error;
        toast.success("Software atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("softwares")
          .insert([swData]);
        if (error) throw error;
        toast.success("Software criado com sucesso");
      }

      setIsDialogOpen(false);
      fetchSoftwares();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar software");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    const { error } = await supabase
      .from("softwares")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Excluído com sucesso");
      fetchSoftwares();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Softwares</h1>
          <p className="text-muted-foreground">Gerencie seus programas de computador.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Software
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : softwares.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum software cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              softwares.map((sw) => (
                <TableRow key={sw.id}>
                  <TableCell className="font-medium">{sw.name}</TableCell>
                  <TableCell>{sw.version}</TableCell>
                  <TableCell>{sw.category}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${sw.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sw.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(sw)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(sw.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSoftware ? "Editar Software" : "Adicionar Novo Software"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Software</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input id="version" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} placeholder="ex: 1.0.0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="ex: Utilitário" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo do Programa (Opcional se já existir)</Label>
              <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Software
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
