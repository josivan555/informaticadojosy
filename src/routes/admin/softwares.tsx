/**
 * Gerenciamento de softwares com upload de capa, descrição automática via IA e links de download.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { generateSoftwareDescription } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/softwares")({
  component: AdminSoftwares,
  head: () => ({
    title: "Gerenciar Softwares - Painel Admin",
  }),
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
    category_id: "",
    status: "published",
    price: 0,
    paddle_product_id: "",
    paddle_price_id: "",
    mercadopago_link: "",
    image_url: ""
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
      .select("*, software_categories(name)")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erro ao carregar softwares");
    } else {
      setSoftwares(data || []);
    }
    setLoading(false);
  };

  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("software_categories").select("*").order("name");
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const handleOpenDialog = (sw: any = null) => {
    if (sw) {
      setEditingSoftware(sw);
      setFormData({
        name: sw.name,
        description: sw.description,
        version: sw.version,
        category: sw.category,
        category_id: sw.category_id || "",
        status: sw.status,
        price: sw.price || 0,
        paddle_product_id: sw.paddle_product_id || "",
        paddle_price_id: sw.paddle_price_id || "",
        mercadopago_link: sw.mercadopago_link || "",
        image_url: sw.image_url || ""
      });
    } else {
      setEditingSoftware(null);
      setFormData({
        name: "",
        description: "",
        version: "",
        category: "",
        category_id: "",
        status: "published",
        price: 0,
        paddle_product_id: "",
        paddle_price_id: "",
        mercadopago_link: "",
        image_url: ""
      });
    }
    setFile(null);
    setIsDialogOpen(true);
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!formData.name) {
      toast.error("Digite o nome do programa primeiro");
      return;
    }
    setGeneratingAI(true);
    try {
      const result = await generateSoftwareDescription({ data: { name: formData.name } });
      setFormData({ ...formData, description: result.description });
      toast.success("Descrição gerada pela IA!");
    } catch (err) {
      toast.error("Erro ao gerar descrição");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fileUrl = editingSoftware?.file_url || "";
      let imageUrl = formData.image_url || "";

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `softwares/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);
        fileUrl = publicUrl;
      }

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `covers/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('files').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const swData = {
        ...formData,
        file_url: fileUrl,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      if (editingSoftware) {
        const { error } = await supabase.from("softwares").update(swData).eq("id", editingSoftware.id);
        if (error) throw error;
        toast.success("Software atualizado com sucesso");
      } else {
        const { error } = await supabase.from("softwares").insert([swData]);
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
                  <TableCell>{sw.software_categories?.name || sw.category}</TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSoftware ? "Editar Software" : "Adicionar Novo Software"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Software</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                >
                  {generatingAI ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                  Gerar com IA
                </Button>
              </div>
              <Textarea id="description" className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input id="version" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} placeholder="ex: 1.0.0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria</Label>
                <select 
                  id="category_id" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category_id} 
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mercadopago_link">Link Mercado Pago</Label>
                <Input id="mercadopago_link" value={formData.mercadopago_link} onChange={(e) => setFormData({...formData, mercadopago_link: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/30">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold uppercase opacity-70">Configuração Paddle (Opcional)</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddle_product_id" className="text-xs">Product ID</Label>
                <Input id="paddle_product_id" className="h-8 text-xs" value={formData.paddle_product_id} onChange={(e) => setFormData({...formData, paddle_product_id: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddle_price_id" className="text-xs">Price ID</Label>
                <Input id="paddle_price_id" className="h-8 text-xs" value={formData.paddle_price_id} onChange={(e) => setFormData({...formData, paddle_price_id: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image">Capa do Software</Label>
                <div className="flex items-center gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  {formData.image_url && !imageFile && (
                    <div className="h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                      <img src={formData.image_url} alt="Capa atual" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo (.zip, .exe)</Label>
                <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
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
