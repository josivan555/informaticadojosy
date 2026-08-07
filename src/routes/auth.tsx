import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
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
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter mb-4">
            <Zap className="h-6 w-6 text-primary" fill="currentColor" />
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
                  type="email" 
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
          <CardContent className="flex flex-col items-center pb-6">
            <Button variant="outline" className="w-full" onClick={() => setIsSuccess(false)}>
              Voltar ao login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
