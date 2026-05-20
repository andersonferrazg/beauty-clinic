"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [tenant, setTenant] = useState<{ nome: string; iniciais: string; logoUrl: string | null }>({
    nome: "Beauty Clinic",
    iniciais: "BC",
    logoUrl: null,
  });

  useEffect(() => {
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((data) => setTenant({ nome: data.nome, iniciais: data.iniciais, logoUrl: data.logoUrl }))
      .catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Email ou senha incorretos.");
        setCarregando(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setErro("Erro ao conectar: " + String(err));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f0e8] to-[#ede4d3] p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#B89968]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#B89968]/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-xl border-[#B89968]/20">
        <CardHeader className="text-center pb-2">
          {/* Logo do tenant */}
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center shadow-lg overflow-hidden">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.nome} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-serif text-2xl font-bold tracking-wider">
                {tenant.iniciais}
              </span>
            )}
          </div>
          <CardTitle className="text-2xl font-serif text-[#5a4530]">
            {tenant.nome}
          </CardTitle>
          <CardDescription className="text-[#9a7d50] tracking-widest text-xs uppercase mt-1">
            Sistema de Gestão
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#5a4530]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="border-[#B89968]/30 focus-visible:ring-[#B89968]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[#5a4530]">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="border-[#B89968]/30 focus-visible:ring-[#B89968] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a7d50] hover:text-[#B89968] transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-[#B89968] hover:bg-[#9a7d50] text-white shadow-md mt-2"
            >
              {carregando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-[#9a7d50] mt-6">
            {tenant.nome} © {new Date().getFullYear()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
