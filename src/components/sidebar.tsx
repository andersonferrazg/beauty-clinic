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
import { useState } from "react";

const navegacao = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/prontuarios", label: "Prontuários", icon: FileText },
  { href: "/servicos", label: "Serviços & Pacotes", icon: Scissors },
  { href: "/produtos", label: "Produtos & Estoque", icon: Package },
  { href: "/financeiro", label: "Cobranças", icon: Receipt },
  { href: "/gastos/clinica", label: "Gastos Clínica", icon: Building2 },
  { href: "/gastos/casa", label: "Gastos Pessoal", icon: Home },
  { href: "/comissoes", label: "Comissões", icon: Wallet },
  { href: "/comandas", label: "Comandas", icon: ClipboardList },
  { href: "/confirmacoes", label: "Confirmações WA", icon: Send },
  { href: "/mensagens", label: "Msgs Pré-definidas", icon: MessageSquare },
  { href: "/profissionais", label: "Profissionais", icon: Users },
  { divisor: true, label: "Relatórios" },
  { href: "/relatorios/performance", label: "Performance", icon: BarChart2 },
  { href: "/relatorios/financeiro", label: "Resumo Financeiro", icon: DollarSign },
  { href: "/relatorios/clientes", label: "Melhores Clientes", icon: Users },
  { divisor: true, label: "" },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

type NavItem =
  | { href: string; label: string; icon: React.ComponentType<{ size?: number }> }
  | { divisor: true; label: string };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);

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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-white font-serif text-sm font-bold">BC</span>
            </div>
            <div>
              <p className="text-[#B89968] font-serif font-semibold text-sm leading-none">
                Beauty Clinic
              </p>
              <p className="text-white/40 text-xs mt-0.5">Beauty Clinic</p>
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
          {(navegacao as unknown as NavItem[]).map((item, i) => {
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
        <div className="px-2 py-3 border-t border-white/10">
          <button
            onClick={sair}
            disabled={saindo}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors w-full disabled:opacity-50"
          >
            {saindo ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
