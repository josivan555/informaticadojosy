import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminListCourses } from "@/lib/admin-content.functions";
import { compressImage } from "@/lib/compress-image";
import { Plus, Search, Pencil, Trash2, Sparkles, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateSoftwareDescription } from "@/lib/ai.functions";
import { StorageImage } from "@/components/StorageImage";

const courseSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().nullable(),
  price: z.coerce.number().min(0),
  level: z.string().nullable(),
  pages: z.coerce.number().min(0).nullable(),
  status: z.string(),
  mercadopago_link: z.string().nullable(),
  video_url: z.string().nullable(),
  image_url: z.string().nullable(),
  file_url: z.string().nullable(),
  external_download_url: z.string().nullable(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export const Route = createFileRoute("/admin/courses")({
  component: AdminCourses,
});

function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const queryClient = useQueryClient();
  const generateDescriptionFn = useServerFn(generateSoftwareDescription);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: null,
      price: 0,
      level: "Básico",
      pages: 0,
      status: "published",
      mercadopago_link: null,
      video_url: null,
      image_url: null,
      file_url: null,
      external_download_url: null,
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      return (await adminListCourses()) as any[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      // Clean up values: convert undefined/empty to null for database
      const cleanedValues = {
        title: values.title,
        description: values.description || null,
        level: values.level || null,
        mercadopago_link: values.mercadopago_link || null,
        video_url: values.video_url || null,
        external_download_url: values.external_download_url || null,
        price: values.price || 0,
        status: values.status || 'published',
        pages: values.pages || null,
        image_url: values.image_url || null,
        file_url: values.file_url || null,
      };

      console.log("Saving course with values:", values);
      console.log("Cleaned values for Supabase:", cleanedValues);

      if (editingId) {
        const { data, error } = await supabase
          .from("courses")
          .update(cleanedValues)
          .eq("id", editingId);
        
        if (error) {
          console.error("Supabase update error (courses):", error);
          if (error.code === '42501' || error.message?.includes('permission')) {
             throw new Error("Permissão negada ao atualizar curso. Verifique seu status de administrador.");
          }
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from("courses")
          .insert([cleanedValues]);
        
        if (error) {
          console.error("Supabase insert error (courses):", error);
          if (error.code === '42501' || error.message?.includes('permission')) {
            throw new Error("Permissão negada ao criar curso. Verifique seu status de administrador.");
          }
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success(editingId ? "Curso atualizado com sucesso!" : "Curso cadastrado com sucesso!");
      setIsDialogOpen(false);
      form.reset({
        title: "",
        description: null,
        price: 0,
        level: "Básico",
        pages: 0,
        status: "published",
        mercadopago_link: null,
        video_url: null,
        image_url: null,
        file_url: null,
        external_download_url: null,
      });
      setEditingId(null);
    },
    onError: (error: any) => {
      console.error("Mutation error detail (courses):", error);
      toast.error(`Erro ao salvar curso: ${error.message || 'Erro desconhecido'}. Verifique se todos os campos obrigatórios (*) estão preenchidos corretamente.`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso removido!");
    },
  });

  const handleEdit = (course: any) => {
    setEditingId(course.id);
    form.reset({
      title: course.title,
      description: course.description || null,
      price: course.price || 0,
      level: course.level || "Básico",
      pages: course.pages || 0,
      status: course.status || "published",
      mercadopago_link: course.mercadopago_link || null,
      video_url: course.video_url || null,
      image_url: course.image_url || null,
      file_url: course.file_url || null,
      external_download_url: course.external_download_url || null,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateDescription = async () => {
    const title = form.getValues("title");
    if (!title) {
      toast.error("Digite o título do curso primeiro");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const result = await generateDescriptionFn({ data: { name: title } });
      form.setValue("description", result.description);
      toast.success("Descrição gerada com IA!");
    } catch (error) {
      toast.error("Erro ao gerar descrição");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "file_url" | "video_url") => {
    const original = e.target.files?.[0];
    if (!original) return;
    const file = field === "image_url" ? await compressImage(original) : original;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${field === "image_url" ? "covers" : field === "video_url" ? "videos" : "courses"}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(field === "image_url" ? "softwares" : field === "video_url" ? "softwares" : "courses")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(field === "image_url" ? "softwares" : field === "video_url" ? "softwares" : "courses")
        .getPublicUrl(filePath);

      form.setValue(field, publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    }
  };

  const filteredCourses = courses?.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground">Gerencie seus cursos em PDF e vídeos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="store-theme max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Curso" : "Novo Curso"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Descrição</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-cyan-400 hover:text-cyan-300 gap-1 h-7"
                          onClick={handleGenerateDescription}
                          disabled={isGeneratingDescription}
                        >
                          {isGeneratingDescription ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Gerar com IA
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} className="bg-background border-border min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="bg-background border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground leading-none">Pagamento</label>
                    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      Cobrança automática pelo Mercado Pago com o preço acima. O PDF é liberado sozinho após o pagamento aprovado.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Vídeo (Youtube/Vimeo)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://..." className="bg-background border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Básico / Intermediário" className="bg-background border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Capa do Curso</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        className="bg-background border-border cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(e, "image_url");
                        }}
                      />
                      {form.watch("image_url") && (
                        <div className="mt-2 relative group w-full">
                          <div className="w-full h-32 rounded-md border border-border overflow-hidden bg-background">
                            <StorageImage value={form.watch("image_url")} alt="Preview" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>} />
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                            <span className="text-[10px] text-foreground">Capa Carregada</span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => form.setValue("image_url", null)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground leading-none">Arquivo PDF</label>
                      <Input
                        type="file"
                        accept=".pdf"
                        className="bg-background border-border"
                        onChange={(e) => handleFileUpload(e, "file_url")}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground leading-none">
                        Adicionar arquivo (ZIP, RAR ou outro)
                      </label>
                      <Input
                        type="file"
                        className="bg-background border-border"
                        onChange={(e) => handleFileUpload(e, "file_url")}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use para enviar vários PDFs de uma vez em um arquivo compactado.
                      </p>
                      {form.watch("file_url") && (
                        <p className="text-xs text-foreground break-all">
                          Arquivo enviado: {String(form.watch("file_url")).split("/").pop()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="external_download_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de Download Externo (Opcional - caso já esteja em um servidor)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="https://..." className="bg-background border-border" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Upload de Vídeo (Opcional)</label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="video/*"
                        className="bg-background border-border"
                        onChange={(e) => handleFileUpload(e, "video_url")} 
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4 flex flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 bg-transparent border-border text-foreground hover:bg-secondary"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-foreground" 
                    disabled={mutation.isPending}
                    onClick={async () => {
                      const isValid = await form.trigger();
                      if (!isValid) {
                        console.log("Form invalid (courses):", form.formState.errors);
                        toast.error("Por favor, preencha o título do curso.");
                        return;
                      }
                      mutation.mutate(form.getValues());
                    }}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : editingId ? "Atualizar" : "Criar Curso"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>


      <div className="flex items-center bg-card px-4 py-2 rounded-lg border border-border">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input
          placeholder="Buscar cursos..."
          className="bg-transparent border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Curso</TableHead>
              <TableHead className="text-muted-foreground">Nível</TableHead>
              <TableHead className="text-muted-foreground">Preço</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-cyan-500" />
                </TableCell>
              </TableRow>
            ) : filteredCourses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Nenhum curso encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses?.map((course) => (
                <TableRow key={course.id} className="border-border hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded border border-border bg-secondary">
                        <StorageImage
                          value={course.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                          fallback={
                            <div className="h-full w-full flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          }
                        />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.pages || 0} páginas</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.level || "Básico"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    R$ {course.price?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleEdit(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => {
                        if (confirm("Tem certeza que deseja remover este curso?")) {
                          deleteMutation.mutate(course.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

