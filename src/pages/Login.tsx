import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, LogIn, UserPlus, KeyRound } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot_password";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (authMode === "forgot_password") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
        setAuthMode("login");
      }
    } else {
      let error = null;

      if (authMode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        error = signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        error = signUpError;
      }

      if (error) {
        toast({
          title: `Erro de ${
            authMode === "login" ? "autenticação" : "cadastro"
          }`,
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title:
            authMode === "login"
              ? "Login bem-sucedido!"
              : "Cadastro realizado!",
          description:
            authMode === "login"
              ? "Redirecionando para o painel."
              : "Verifique seu e-mail para confirmar a conta.",
        });
        if (authMode === "login") {
          navigate("/");
        } else {
          setAuthMode("login"); // Switch to login after successful sign-up
        }
      }
    }
    setLoading(false);
  };

  const toggleAuthMode = () => {
    setAuthMode(
      authMode === "login"
        ? "signup"
        : authMode === "signup"
        ? "login"
        : "login"
    );
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-primary/5">
      <Card className="w-full max-w-sm mx-auto shadow-medium">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-primary to-success rounded-lg flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">NutriPlan Pro</h1>
              <p className="text-sm text-muted-foreground">
                Inteligência para seus planos
              </p>
            </div>
          </div>
          <CardTitle>
            {authMode === "login" && "Acesse sua conta"}
            {authMode === "signup" && "Crie sua conta"}
            {authMode === "forgot_password" && "Recuperar Senha"}
          </CardTitle>
          <CardDescription>
            {authMode === "login" && "Bem-vindo de volta!"}
            {authMode === "signup" && "Comece a criar planos hoje mesmo."}
            {authMode === "forgot_password" &&
              "Enviaremos um link para o seu e-mail para redefinir a senha."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {authMode !== "forgot_password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Processando..."
                : authMode === "login"
                ? "Entrar"
                : authMode === "signup"
                ? "Criar conta"
                : "Enviar link"}
              {authMode === "login" && <LogIn className="ml-2 h-4 w-4" />}
              {authMode === "signup" && <UserPlus className="ml-2 h-4 w-4" />}
              {authMode === "forgot_password" && (
                <KeyRound className="ml-2 h-4 w-4" />
              )}
            </Button>
          </form>
          {authMode === "login" && (
            <Button
              variant="link"
              size="sm"
              className="w-full mt-2"
              onClick={() => setAuthMode("forgot_password")}
            >
              Esqueceu sua senha?
            </Button>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="link" className="w-full" onClick={toggleAuthMode}>
            {authMode === "login" && "Não tem uma conta? Cadastre-se"}
            {authMode === "signup" && "Já tem uma conta? Faça login"}
            {authMode === "forgot_password" && "Lembrou a senha? Faça login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}