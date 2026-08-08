import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Pencil, Trash2, Sparkles, Loader2, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generateSoftwareDescription } from "@/lib/ai.functions";

const softwareSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().min(10, "Descrição é obrigatória"),
  category_id: z.string().nullable().optional(),
  price: z.coerce.number().min(0),
  version: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  status: z.string().default("active"),
  mercadopago_link: z.string().url("Link inválido").nullable().optional().or(z.literal("")),
  image_url: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
});

type SoftwareFormValues = z.infer<typeof softwareSchema>;

export const Route = createFileRoute("/admin/softwares")({
  component: AdminSoftwares,
});

function AdminSoftwares() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const queryClient = useQueryClient();
  const generateDescriptionFn = useServerFn(generateSoftwareDescription);

  const form = useForm<SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      status: "active",
      version: "",
      size: "",
      mercadopago_link: "",
    },
  });

  const { data: softwares, isLoading } = useQuery({
    queryKey: ["admin-softwares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("softwares")
        .select(`
          *,
          software_categories(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["software-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("software_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: SoftwareFormValues) => {
      if (editingId) {
        const { error } = await supabase
          .from("softwares")
          .update(values)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("softwares").insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-softwares"] });
      toast.success(editingId ? "Software atualizado!" : "Software adicionado!");
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    },
    onError: (error) => {
      toast.error("Erro ao salvar software: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("softwares").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-softwares"] });
      toast.success("Software removido!");
    },
  });

  const handleEdit = (software: any) => {
    setEditingId(software.id);
    form.reset({
      name: software.name,
      description: software.description || "",
      category_id: software.category_id || undefined,
      price: software.price || 0,
      version: software.version || "",
      size: software.size || "",
      status: software.status || "active",
      mercadopago_link: software.mercadopago_link || "",
      image_url: software.image_url || "",
      file_url: software.file_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleGenerateDescription = async () => {
    const name = form.getValues("name");
    if (!name) {
      toast.error("Digite o nome do software primeiro");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const result = await generateDescriptionFn({ data: { name } });
      form.setValue("description", result.description);
      toast.success("Descrição gerada com IA!");
    } catch (error) {
      toast.error("Erro ao gerar descrição");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "file_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${field === "image_url" ? "covers" : "files"}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("softwares")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("softwares")
        .getPublicUrl(filePath);

      form.setValue(field, publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    }
  };

  const filteredSoftwares = softwares?.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Softwares</h1>
          <p className="text-slate-400">Gerencie seu catálogo de programas.</p>
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
              Adicionar Software
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#0d1b33] border-slate-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Software" : "Novo Software"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-slate-900 border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-900 border-slate-700">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white">
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        <Textarea {...field} className="bg-slate-900 border-slate-700 min-h-[100px]" />
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
                        <FormLabel>Preço (0 para gratuito)</FormLabel>
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
                        <FormLabel>Link Mercado Pago (Opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." className="bg-slate-900 border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Capa do Software</FormLabel>
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
                    <FormLabel>Arquivo (Zip/Exe)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        className="bg-slate-900 border-slate-700"
                        onChange={(e) => handleFileUpload(e, "file_url")}
                      />
                    </div>
                  </FormItem>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={mutation.isPending}>
                    {mutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar Software"}
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
          placeholder="Buscar softwares..."
          className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#0d1b33] rounded-xl border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Software</TableHead>
              <TableHead className="text-slate-400">Categoria</TableHead>
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
            ) : filteredSoftwares?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  Nenhum software encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredSoftwares?.map((software) => (
                <TableRow key={software.id} className="border-slate-800 hover:bg-slate-900/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {software.image_url ? (
                        <img src={software.image_url} className="h-10 w-10 rounded object-cover border border-slate-700" alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-800 flex items-center justify-center">
                          <Laptop className="h-5 w-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">{software.name}</div>
                        <div className="text-xs text-slate-500">{software.version || "v1.0"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {software.software_categories?.name || "Sem categoria"}
                  </TableCell>
                  <TableCell className="text-white">
                    {software.price === 0 ? (
                      <span className="text-emerald-400 font-medium">Grátis</span>
                    ) : (
                      `R$ ${software.price?.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => handleEdit(software)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400" onClick={() => {
                        if (confirm("Tem certeza que deseja remover este software?")) {
                          deleteMutation.mutate(software.id);
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

