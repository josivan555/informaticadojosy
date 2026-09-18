import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Send, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/store/StoreShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendContactMessage } from "@/lib/contact.functions";

const CONTACT_EMAIL = "informaticadojosy@gmail.com";

export const Route = createFileRoute("/contato")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contato - Informática do Josy" },
      { name: "description", content: "Fale com a Informática do Josy: dúvidas sobre programas, cursos em PDF, licenças e suporte." },
      { property: "og:title", content: "Contato - Informática do Josy" },
      { property: "og:description", content: "Envie sua mensagem e fale direto com o Josy sobre programas, cursos e licenças." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const send = useServerFn(sendContactMessage);

  const mutation = useMutation({
    mutationFn: async () => send({ data: form }),
    onSuccess: () => {
      toast.success("Mensagem enviada! Responderei em breve.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Não foi possível enviar sua mensagem.");
    },
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <StoreShell active="contact" searchPlaceholder="Pesquisar programas e cursos">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Contato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Precisa de ajuda com um programa, curso ou licença? Envie sua mensagem que eu respondo pelo seu e-mail.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <Input id="name" value={form.name} onChange={update("name")} maxLength={100} required placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Seu e-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} maxLength={255} required placeholder="voce@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp / telefone (opcional)</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} maxLength={30} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto (opcional)</Label>
              <Input id="subject" value={form.subject} onChange={update("subject")} maxLength={150} placeholder="Dúvida sobre um programa" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea id="message" value={form.message} onChange={update("message")} maxLength={2000} required rows={6} placeholder="Escreva aqui como posso ajudar..." />
          </div>
          <Button type="submit" className="mt-5 rounded-full" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar mensagem
          </Button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">E-mail</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-primary hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Atendimento</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  As mensagens enviadas por este formulário chegam direto no painel da Informática do Josy e são respondidas por e-mail.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </StoreShell>
  );
}
