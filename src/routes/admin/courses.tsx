import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    pages: "",
    level: "",
    category: "",
    status: "published",
    paddle_product_id: "",
    paddle_price_id: "",
    mercadopago_link: "",
    image_url: ""
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erro ao carregar cursos");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (course: any = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        price: course.price.toString(),
        pages: course.pages?.toString() || "",
        level: course.level || "",
        category: course.category || "",
        status: course.status,
        paddle_product_id: course.paddle_product_id || "",
        paddle_price_id: course.paddle_price_id || "",
        mercadopago_link: course.mercadopago_link || "",
        image_url: course.image_url || ""
      });

    } else {
      setEditingCourse(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        pages: "",
        level: "",
        category: "",
        status: "published",
        paddle_product_id: "",
        paddle_price_id: "",
        mercadopago_link: "",
        image_url: ""
      });

    }
    setFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let fileUrl = editingCourse?.file_url || "";

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `courses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      }

      const courseData: any = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        pages: formData.pages ? parseInt(formData.pages) : null,
        level: formData.level,
        category: formData.category,
        status: formData.status,
        file_url: fileUrl,
        paddle_product_id: formData.paddle_product_id || null,
        paddle_price_id: formData.paddle_price_id || null,
        mercadopago_link: formData.mercadopago_link || null,
        updated_at: new Date().toISOString()
      };



      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", editingCourse.id);
        if (error) throw error;
        toast.success("Curso atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("courses")
          .insert([courseData]);
        if (error) throw error;
        toast.success("Curso criado com sucesso");
      }

      setIsDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar curso");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Excluído com sucesso");
      fetchCourses();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cursos em PDF</h1>
          <p className="text-muted-foreground">Gerencie seus materiais educativos.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Curso
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Nível</TableHead>
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
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum curso cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>R$ {course.price.toFixed(2)}</TableCell>
                  <TableCell>{course.level}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(course.id)}>
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
            <DialogTitle>{editingCourse ? "Editar Curso" : "Adicionar Novo Curso"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Curso</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pages">Páginas</Label>
                <Input id="pages" type="number" value={formData.pages} onChange={(e) => setFormData({...formData, pages: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Input id="level" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} placeholder="ex: Iniciante" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="ex: Windows, Office, Segurança" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mercadopago_link">Link de Pagamento Mercado Pago</Label>
              <Input id="mercadopago_link" value={formData.mercadopago_link} onChange={(e) => setFormData({...formData, mercadopago_link: e.target.value})} placeholder="https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paddle_product_id">Paddle Product ID</Label>
                <Input id="paddle_product_id" value={formData.paddle_product_id} onChange={(e) => setFormData({...formData, paddle_product_id: e.target.value})} placeholder="pro_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddle_price_id">Paddle Price ID</Label>
                <Input id="paddle_price_id" value={formData.paddle_price_id} onChange={(e) => setFormData({...formData, paddle_price_id: e.target.value})} placeholder="pri_..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo PDF (Opcional se já existir)</Label>
              <Input id="file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Curso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
