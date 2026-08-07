import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Mail, Loader2, Zap } from "lucide-react";

export const Route = createFileRoute("/auth/confirm")({
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("Verificando seu e-mail...");
  const search = Route.useSearch() as any;

  useEffect(() => {
    const checkStatus = async () => {
      // Verifica erros na URL (comum quando o link expira)
      if (search.error || search.error_description) {
        const isExpired = search.error_description?.toLowerCase().includes("expired") || 
                         search.error_description?.toLowerCase().includes("invalid");
        setStatus(isExpired ? "expired" : "error");
        setMessage(search.error_description || "Ocorreu um erro ao verificar sua conta.");
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus("error");
        setMessage("Erro ao recuperar sessão: " + error.message);
        return;
      }

      if (session) {
        setStatus("success");
        setMessage("Seu e-mail foi confirmado com sucesso! Agora você pode acessar seus cursos.");
      } else {
        // Se não houver erro na URL nem sessão, pode ser que o usuário acessou a página diretamente
        setStatus("loading");
        setMessage("Aguardando confirmação...");
        
        // Tenta novamente após um pequeno delay, as vezes a sessão demora a injetar
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setStatus("success");
            setMessage("Seu e-mail foi confirmado com sucesso!");
          } else {
            setStatus("expired");
            setMessage("Não encontramos uma sessão ativa. O link pode ter expirado ou você já confirmou seu e-mail.");
          }
        }, 2000);
      }
    };

    checkStatus();
  }, [search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md border-primary/20 bg-[#0a192f] text-white">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-4">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" />
            <span>INFORMÁTICA do Josy</span>
          </div>
          <CardTitle className="text-2xl flex items-center gap-2">
            {status === "loading" && "Verificando..."}
            {status === "success" && "E-mail Confirmado!"}
            {status === "error" && "Erro na Confirmação"}
            {status === "expired" && "Link Expirado"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Status da sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-6 pb-8">
          <div className="p-4 rounded-full bg-primary/10">
            {status === "loading" && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
            {status === "expired" && <Mail className="h-12 w-12 text-yellow-500" />}
          </div>
          
          <p className="text-center text-slate-300">
            {message}
          </p>

          <div className="w-full pt-4">
            {status === "success" ? (
              <Button asChild className="w-full">
                <Link to="/admin">Ir para o Painel</Link>
              </Button>
            ) : status !== "loading" ? (
              <Button asChild variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                <Link to="/auth">Voltar para o Login</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
