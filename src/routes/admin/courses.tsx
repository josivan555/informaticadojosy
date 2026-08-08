import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const courseSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().min(10, "Descrição é obrigatória"),
  price: z.coerce.number().min(0),
  level: z.string().nullable(),
  pages: z.coerce.number().min(0).nullable(),
  status: z.string().nullable(),
  mercadopago_link: z.string().nullable(),
  video_url: z.string().nullable(),
  image_url: z.string().nullable(),
  file_url: z.string().nullable(),
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
      description: "",
      price: 0,
      level: "Básico",
      pages: 0,
      status: "active",
      mercadopago_link: "",
      video_url: "",
      image_url: null,
      file_url: null,
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      if (editingId) {
        const { error } = await supabase
          .from("courses")
          .update(values)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success(editingId ? "Curso atualizado!" : "Curso adicionado!");
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error("Erro ao salvar curso: " + error.message);
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
      description: course.description || "",
      price: course.price || 0,
      level: course.level || "Básico",
      pages: course.pages || 0,
      status: course.status || "active",
      mercadopago_link: course.mercadopago_link || "",
      video_url: course.video_url || "",
      image_url: course.image_url || null,
      file_url: course.file_url || null,
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
    const file = e.target.files?.[0];
    if (!file) return;

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
          <h1 className="text-3xl font-bold text-white">Cursos</h1>
          <p className="text-slate-400">Gerencie seus cursos em PDF e vídeos.</p>
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
          <DialogContent className="max-w-2xl bg-[#0d1b33] border-slate-800 text-white max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Curso" : "Novo Curso"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="bg-slate-900 border-slate-700" />
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
                        <Textarea {...field} value={field.value || ""} className="bg-slate-900 border-slate-700 min-h-[100px]" />
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
                          <Input type="number" step="0.01" {...field} className="bg-slate-900 border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mercadopago_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Mercado Pago</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://..." className="bg-slate-900 border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Vídeo (Youtube/Vimeo)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="https://..." className="bg-slate-900 border-slate-700" />
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
                          <Input {...field} value={field.value || ""} placeholder="Básico / Intermediário" className="bg-slate-900 border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel className="text-white">Capa do Curso</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        className="bg-slate-900 border-slate-700"
                        onChange={(e) => handleFileUpload(e, "image_url")}
                      />
                    </div>
                  </FormItem>
                  <FormItem>
                    <FormLabel className="text-white">Arquivo PDF</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        className="bg-slate-900 border-slate-700"
                        onChange={(e) => handleFileUpload(e, "file_url")}
                      />
                    </div>
                  </FormItem>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormItem>
                    <FormLabel className="text-white">Upload de Vídeo (Opcional)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="video/*"
                        className="bg-slate-900 border-slate-700"
                        onChange={(e) => handleFileUpload(e, "video_url")} 
                      />
                    </div>
                  </FormItem>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={mutation.isPending}>
                    {mutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar Curso"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center bg-[#0d1b33] px-4 py-2 rounded-lg border border-slate-800">
        <Search className="h-4 w-4 text-slate-400 mr-2" />
        <Input
          placeholder="Buscar cursos..."
          className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#0d1b33] rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Curso</TableHead>
              <TableHead className="text-slate-400">Nível</TableHead>
              <TableHead className="text-slate-400">Preço</TableHead>
              <TableHead className="text-slate-400 text-right">Ações</TableHead>
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
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  Nenhum curso encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses?.map((course) => (
                <TableRow key={course.id} className="border-slate-800 hover:bg-slate-900/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {course.image_url ? (
                        <img src={course.image_url} className="h-10 w-10 rounded object-cover border border-slate-700" alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">{course.title}</div>
                        <div className="text-xs text-slate-500">{course.pages || 0} páginas</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {course.level || "Básico"}
                  </TableCell>
                  <TableCell className="text-white">
                    R$ {course.price?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => handleEdit(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400" onClick={() => {
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

