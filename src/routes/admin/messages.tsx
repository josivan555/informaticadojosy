import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MailOpen, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminListMessages,
  adminMarkMessageRead,
  adminDeleteMessage,
} from "@/lib/contact.functions";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const list = useServerFn(adminListMessages);
  const markRead = useServerFn(adminMarkMessageRead);
  const remove = useServerFn(adminDeleteMessage);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: () => list({ data: undefined as never }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });

  const readMutation = useMutation({
    mutationFn: (vars: { id: string; isRead: boolean }) => markRead({ data: vars }),
    onSuccess: refresh,
    onError: () => toast.error("Não foi possível atualizar a mensagem."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Mensagem excluída.");
      refresh();
    },
    onError: () => toast.error("Não foi possível excluir a mensagem."),
  });

  return (
    <div className="store-theme">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Mensagens de contato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensagens enviadas pelos visitantes na página de Contato.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : !messages || messages.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma mensagem recebida ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {m.name}{" "}
                    {!m.is_read && <Badge className="ml-2 align-middle">Nova</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""} ·{" "}
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(m.subject || "Contato - Informática do Josy")}`}>
                      Responder
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => readMutation.mutate({ id: m.id, isRead: !m.is_read })}
                  >
                    {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {m.subject && <p className="mt-3 text-sm font-medium text-foreground">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
