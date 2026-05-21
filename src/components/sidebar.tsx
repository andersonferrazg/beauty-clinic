"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  Scissors,
  Package,
  DollarSign,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  ClipboardList,
  Receipt,
  Loader2,
  FileText,
  Wallet,
  Building2,
  Home,
  LayoutDashboard,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Permissoes } from "@/lib/session";

type ItemNav = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  // Função que recebe as permissões do usuário e decide se mostra o item.
  // Admin sempre vê tudo (verificado dentro da função).
  visivel: (p: Permissoes) => boolean;
};
type ItemDivisor = { divisor: true; label: string };
type NavItem = ItemNav | ItemDivisor;

const sempre = () => true;
const admin = (p: Permissoes) => p.isAdmin;

const navegacao: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, visivel: sempre },
  { href: "/agenda", label: "Agenda", icon: Calendar, visivel: (p) => p.isAdmin || p.verAgenda },
  { href: "/clientes", label: "Clientes", icon: Users, visivel: (p) => p.isAdmin || p.acessarClientes },
  { href: "/prontuarios", label: "Prontuários", icon: FileText, visivel: (p) => p.isAdmin || p.acessarProntuarios },
  { href: "/servicos", label: "Serviços & Pacotes", icon: Scissors, visivel: (p) => p.isAdmin || p.acessarServicos },
  { href: "/produtos", label: "Produtos & Estoque", icon: Package, visivel: (p) => p.isAdmin || p.acessarProdutos },
  { href: "/financeiro", label: "Cobranças", icon: Receipt, visivel: (p) => p.isAdmin || p.acessarFinanceiro },
  { href: "/gastos/clinica", label: "Gastos Clínica", icon: Building2, visivel: (p) => p.isAdmin || p.acessarDespesas },
  { href: "/gastos/casa", label: "Gastos Pessoal", icon: Home, visivel: (p) => p.isAdmin || p.acessarDespesas },
  { href: "/comissoes", label: "Comissões", icon: Wallet, visivel: (p) => p.isAdmin || p.verComissoesReceber || p.verPagamentosComissao },
  { href: "/comandas", label: "Comandas", icon: ClipboardList, visivel: (p) => p.isAdmin || p.acessarFinanceiro },
  { href: "/confirmacoes", label: "Confirmações WA", icon: Send, visivel: (p) => p.isAdmin || p.verAgenda },
  { href: "/mensagens", label: "Msgs Pré-definidas", icon: MessageSquare, visivel: (p) => p.isAdmin || p.acessarServicos },
  { href: "/profissionais", label: "Profissionais", icon: Users, visivel: admin },
  { divisor: true, label: "Relatórios" },
  { href: "/relatorios/performance", label: "Performance", icon: BarChart2, visivel: (p) => p.isAdmin || p.acessarRelatorios },
  { href: "/relatorios/financeiro", label: "Resumo Financeiro", icon: DollarSign, visivel: (p) => p.isAdmin || p.acessarRelatorios },
  { href: "/relatorios/clientes", label: "Melhores Clientes", icon: Users, visivel: (p) => p.isAdmin || p.acessarRelatorios },
  { divisor: true, label: "" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, visivel: admin },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [permissoes, setPermissoes] = useState<Permissoes | null>(null);

  useEffect(() => {
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((data) => setLogoUrl(data.logoUrl))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/me/sessao")
      .then((r) => r.json())
      .then((s) => { if (s?.permissoes) setPermissoes(s.permissoes); })
      .catch(() => {});
  }, []);

  async function sair() {
    setSaindo(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setAberto(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-[#1a1208] text-[#B89968] shadow-md"
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-[#120d07] transition-transform duration-200",
          "lg:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center flex-shrink-0 shadow overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo da clínica" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-serif text-sm font-bold">BC</span>
              )}
            </div>
            <div>
              <p className="text-[#B89968] font-serif font-semibold text-sm leading-none">
                Beauty Clinic
              </p>
              <p className="text-white/40 text-xs mt-0.5">Sistema de Gestão</p>
            </div>
          </div>
          <button
            onClick={() => setAberto(false)}
            className="lg:hidden text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navegacao
            .filter((item) => {
              if (!permissoes) return false;
              if ("divisor" in item) return true;
              return item.visivel(permissoes);
            })
            .map((item, i) => {
            if ("divisor" in item) {
              return (
                <div key={i} className="px-3 pt-4 pb-1">
                  {item.label && (
                    <p className="text-white/30 text-xs uppercase tracking-widest font-medium">
                      {item.label}
                    </p>
                  )}
                  <div className="mt-1 border-t border-white/10" />
                </div>
              );
            }

            const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
                  ativo
                    ? "bg-[#B89968]/20 text-[#B89968] font-medium"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer — Logout */}
        <div className="px-2 pb-3 pt-2 border-t border-white/10">
          <button
            onClick={sair}
            disabled={saindo}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors w-full disabled:opacity-50"
          >
            {saindo ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
