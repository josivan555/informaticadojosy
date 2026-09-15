import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminListSoftwares } from "@/lib/admin-content.functions";
import { compressImage } from "@/lib/compress-image";
import { Plus, Search, Pencil, Trash2, Sparkles, Loader2, Monitor, LayoutGrid, List } from "lucide-react";
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
import { StorageImage } from "@/components/StorageImage";

const softwareSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().nullable(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  price: z.coerce.number().min(0),
  version: z.string().nullable(),
  size: z.string().nullable(),
  status: z.string(),
  mercadopago_link: z.string().nullable(),
  image_url: z.string().nullable(),
  file_url: z.string().nullable(),
  external_download_url: z.string().nullable(),
  video_url: z.string().nullable(),
  video_urls: z.array(z.string()),
});

type SoftwareFormValues = z.infer<typeof softwareSchema>;

export const Route = createFileRoute("/admin/softwares")({
  component: AdminSoftwares,
});

function AdminSoftwares() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const queryClient = useQueryClient();
  const generateDescriptionFn = useServerFn(generateSoftwareDescription);

  const form = useForm<SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
    defaultValues: {
      name: "",
      description: null,
      price: 0,
      status: "active",
      version: null,
      size: null,
      mercadopago_link: null,
      category_id: "",
      image_url: null,
      file_url: null,
      external_download_url: null,
      video_url: null,
      video_urls: [],
    },
  });

  const { data: softwares, isLoading } = useQuery({
    queryKey: ["admin-softwares"],
    queryFn: async () => {
      return (await adminListSoftwares()) as any[];
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
      const priceValue = typeof values.price === 'string' ? parseFloat(values.price) : values.price;
      
      const cleanedValues = {
        name: values.name,
        description: values.description || null,
        version: values.version || null,
        size: values.size || null,
        mercadopago_link: values.mercadopago_link || null,
        external_download_url: values.external_download_url || null,
        video_url: values.video_url || null,
        video_urls: (values.video_urls || []).map((v) => v.trim()).filter(Boolean),
        category_id: values.category_id || null,
        price: isNaN(priceValue) ? 0 : priceValue,
        status: values.status || 'active',
        image_url: values.image_url || null,
        file_url: values.file_url || null,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("softwares")
          .update(cleanedValues)
          .eq("id", editingId);
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("softwares")
          .insert([cleanedValues]);
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-softwares"] });
      toast.success(editingId ? "Software atualizado!" : "Software cadastrado!");
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`);
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
      description: software.description || null,
      category_id: software.category_id || "",
      price: software.price || 0,
      version: software.version || null,
      size: software.size || null,
      status: software.status || "active",
      mercadopago_link: software.mercadopago_link || null,
      image_url: software.image_url || null,
      file_url: software.file_url || null,
      external_download_url: software.external_download_url || null,
      video_url: software.video_url || null,
      video_urls: Array.isArray(software.video_urls) ? software.video_urls : [],
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
      toast.success("Gerado!");
    } catch {
      toast.error("Erro ao gerar");
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
    const filePath = `${field === "image_url" ? "covers" : field === "video_url" ? "videos" : "files"}/${fileName}`;
    try {
      const { error: uploadError } = await supabase.storage.from("softwares").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("softwares").getPublicUrl(filePath);
      form.setValue(field, publicUrl);
      toast.success("Enviado!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    }
  };

  const filteredSoftwares = softwares?.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Softwares</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de programas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background rounded-lg p-1 border border-border">
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-8 w-8 p-0">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
            <DialogTrigger asChild>
              <Button
                className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                onClick={() => {
                  setEditingId(null);
                  form.reset({
                    name: "",
                    description: null,
                    price: 0,
                    status: "active",
                    version: null,
                    size: null,
                    mercadopago_link: null,
                    category_id: "",
                    image_url: null,
                    file_url: null,
                    external_download_url: null,
                    video_url: null,
                    video_urls: [],
                  });
                }}
              >
                <Plus className="h-4 w-4" /> Adicionar Software
              </Button>
            </DialogTrigger>
            <DialogContent className="store-theme max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Software" : "Novo Software"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-background border-border" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="category_id" render={({ field }) => (
                      <FormItem><FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent className="store-theme bg-background border-border text-foreground">
                            {categories?.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center"><FormLabel>Descrição</FormLabel>
                        <Button type="button" variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 gap-1 h-7" onClick={handleGenerateDescription} disabled={isGeneratingDescription}>
                          {isGeneratingDescription ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Gerar com IA
                        </Button>
                      </div>
                      <FormControl><Textarea {...field} value={field.value || ""} className="bg-background border-border min-h-[100px]" /></FormControl><FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>Preço</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? 0} className="bg-background border-border" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Pagamento</label>
                      <p className="text-xs text-muted-foreground">
                        Cobrança automática pelo Mercado Pago (Pix ou cartão) com base no preço acima. Não precisa de link.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Capa</label>
                      <div className="flex flex-col gap-2">
                        {form.watch("image_url") && (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-background">
                            <StorageImage
                              value={form.watch("image_url")}
                              className="w-full h-full object-cover"
                              alt="Preview"
                              fallback={<div className="w-full h-full flex items-center justify-center"><Monitor className="h-8 w-8 text-muted-foreground" /></div>}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => form.setValue("image_url", null)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="bg-background border-border" 
                          onChange={(e) => handleFileUpload(e, "image_url")} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Arquivo</label>
                      <Input 
                        type="file" 
                        className="bg-background border-border" 
                        onChange={(e) => handleFileUpload(e, "file_url")} 
                      />
                      {form.watch("file_url") && <p className="text-[10px] text-emerald-400">Arquivo carregado</p>}
                    </div>
                  </div>
                  <FormField control={form.control} name="external_download_url" render={({ field }) => (
                    <FormItem><FormLabel>Link Externo</FormLabel><FormControl><Input {...field} value={field.value || ""} className="bg-background border-border" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="video_urls" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Vídeos do YouTube</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-cyan-600"
                          onClick={() => field.onChange([...(field.value || []), ""])}
                        >
                          <Plus className="h-3 w-3" /> Adicionar vídeo
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(field.value || []).length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Nenhum vídeo. Clique em "Adicionar vídeo" e cole o link do YouTube.
                          </p>
                        )}
                        {(field.value || []).map((url, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={url}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="bg-background border-border"
                              onChange={(e) => {
                                const next = [...(field.value || [])];
                                next[index] = e.target.value;
                                field.onChange(next);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-500"
                              onClick={() => field.onChange((field.value || []).filter((_, i) => i !== index))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "active"}>
                        <FormControl><SelectTrigger className="bg-background border-border"><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent className="store-theme bg-background border-border text-foreground">
                          <SelectItem value="active">Rascunho</SelectItem>
                          <SelectItem value="published">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <DialogFooter className="pt-4 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-transparent border-border text-foreground hover:bg-secondary" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="button" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-foreground font-bold" disabled={mutation.isPending} onClick={async () => { if (await form.trigger()) mutation.mutate(form.getValues()); else toast.error("Preencha os campos obrigatórios."); }}>
                      {mutation.isPending ? "Salvando..." : (editingId ? "Atualizar" : "Criar")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center bg-card px-4 py-2 rounded-lg border border-border">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input placeholder="Buscar softwares..." className="bg-transparent border-none focus-visible:ring-0 text-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {viewMode === "list" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Software</TableHead>
                <TableHead className="text-muted-foreground">Categoria</TableHead>
                <TableHead className="text-muted-foreground">Preço</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-cyan-500" /></TableCell></TableRow>
              ) : filteredSoftwares?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhum software.</TableCell></TableRow>
              ) : (
                filteredSoftwares?.map((software) => (
                  <TableRow key={software.id} className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded overflow-hidden border border-border bg-secondary shrink-0">
                          <StorageImage value={software.image_url} alt={software.name} className="h-full w-full object-cover" fallback={<div className="h-full w-full flex items-center justify-center"><Monitor className="h-5 w-5 text-muted-foreground" /></div>} />
                        </div>
                        <div><div className="font-medium text-foreground">{software.name}</div><div className="text-xs text-muted-foreground">{software.version || "v1.0"}</div></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{software.software_categories?.name || "Sem categoria"}</TableCell>
                    <TableCell className="text-foreground">{software.price === 0 ? <span className="text-emerald-400 font-medium">Grátis</span> : `R$ ${software.price?.toFixed(2)}`}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleEdit(software)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(software.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
          ) : (
            filteredSoftwares?.map((software) => (
              <div key={software.id} className="bg-card rounded-xl border border-border overflow-hidden group hover:border-cyan-500/50 transition-all flex flex-col">
                <div className="aspect-video relative bg-background overflow-hidden">
                  <StorageImage value={software.image_url} alt={software.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" fallback={<div className="w-full h-full flex items-center justify-center"><Monitor className="h-12 w-12 text-muted-foreground" /></div>} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 border-none text-foreground" onClick={() => handleEdit(software)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 bg-red-500/50 hover:bg-red-500 border-none text-foreground" onClick={() => { if (confirm("Remover?")) deleteMutation.mutate(software.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-foreground line-clamp-1">{software.name}</h3><div className="text-xs font-bold text-cyan-400">{software.price === 0 || !software.price ? "GRÁTIS" : `R$ ${software.price.toFixed(2)}`}</div></div>
                  <div className="text-xs text-muted-foreground mb-2">{software.software_categories?.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{software.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
