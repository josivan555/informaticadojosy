import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [{ title: "Entrar ou Cadastrar - Informática do Josy" }],
  }),
});

function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        setIsSuccess(true);
        toast.success("Cadastro realizado! Verifique seu e-mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/admin" });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter mb-4">
            <img src={logoAsset.url} alt="Logo" className="h-10 w-10 object-contain rounded-md" />
            <span>INFORMÁTICA do Josy</span>
          </div>
          <CardTitle className="text-2xl">
            {isSuccess ? "Verifique seu E-mail" : isSignUp ? "Criar Conta" : "Entrar"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSuccess 
              ? "Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e a pasta de spam) para ativar sua conta."
              : isSignUp 
                ? "Cadastre-se para acessar seus cursos adquiridos" 
                : "Entre com suas credenciais"}
          </CardDescription>
        </CardHeader>
        
        {!isSuccess ? (
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  autoComplete="username"
                  placeholder="exemplo@gmail.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-2">
                  *Downloads gratuitos não exigem cadastro. A conta é necessária apenas para acessar cursos comprados.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Cadastrar" : "Entrar"}
              </Button>
              <Button 
                variant="link" 
                type="button" 
                className="px-0 font-normal"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Já tem uma conta? Entre aqui" : "Precisa de uma conta? Cadastre-se"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="flex flex-col items-center pb-6 space-y-4">
            <div className="p-1 bg-primary/10 rounded-full mb-2">
              <img src={logoAsset.url} alt="Logo" className="h-12 w-12 object-contain animate-pulse" />
            </div>
            <p className="text-sm text-center text-muted-foreground px-2">
              Se você não recebeu o e-mail, verifique sua pasta de spam ou clique no botão abaixo para tentar novamente.
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: email,
                    options: {
                      emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    }
                  });
                  if (error) throw error;
                  toast.success(`E-mail de confirmação reenviado para ${email}! Verifique sua caixa de entrada.`);
                } catch (error: any) {
                  toast.error(`Falha ao reenviar: ${error.message || "Tente novamente em instantes"}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reenviar e-mail"}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={() => setIsSuccess(false)}>
              Voltar ao login
            </Button>
            <Button asChild variant="link" className="text-xs text-muted-foreground">
              <Link to="/">Voltar para a página inicial</Link>
            </Button>
          </CardContent>
        )}
        {!isSuccess && (
          <div className="pb-6 px-6 text-center">
            <Button asChild variant="link" className="text-xs text-muted-foreground p-0 h-auto">
              <Link to="/">← Voltar para a página inicial</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
