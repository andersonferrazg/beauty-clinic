"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalServico } from "@/components/modal-servico";
import { Search, Plus, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Servico = {
  id: string;
  nome: string;
  categoria: string | null;
  duracaoMin: number;
  preco: number;
  precoVariavel: boolean;
  cor: string;
};

function formatarDuracao(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

function formatarPreco(preco: number, variavel: boolean) {
  if (variavel) return "Variável";
  return `R$ ${preco.toFixed(2).replace(".", ",")}`;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<string | undefined>();

  async function carregar(q = "") {
    setCarregando(true);
    const r = await fetch(`/api/servicos${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const dados = await r.json();
    setServicos(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  function abrirNovo() {
    setServicoSelecionado(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(id: string) {
    setServicoSelecionado(id);
    setModalAberto(true);
  }

  // Agrupar por categoria
  const grupos = servicos.reduce<Record<string, Servico[]>>((acc, s) => {
    const cat = s.categoria || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Serviços & Pacotes</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${servicos.length} serviço(s) cadastrado(s)`}
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
          <Plus size={16} />
          Novo Serviço
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar serviço..."
            className="pl-9 border-[#B89968]/30"
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : servicos.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <p className="text-base mb-1">Nenhum serviço encontrado.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grupos).map(([categoria, itens]) => (
            <div key={categoria}>
              <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2 px-1">
                {categoria}
              </h2>
              <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
                {itens.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => abrirEdicao(s.id)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 hover:bg-[#faf5ee] cursor-pointer transition-colors",
                      i < itens.length - 1 ? "border-b border-[#e8dcc4]" : ""
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor }} />
                      <span className="text-sm font-medium text-[#5a4530]">{s.nome}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-[#9a7d50]">
                        <Clock size={11} />
                        {formatarDuracao(s.duracaoMin)}
                      </span>
                      <span className={cn(
                        "text-sm font-semibold w-24 text-right",
                        s.precoVariavel ? "text-[#9a7d50] italic text-xs" : "text-[#5a4530]"
                      )}>
                        {formatarPreco(s.preco, s.precoVariavel)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalServico
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => carregar(busca)}
        servicoId={servicoSelecionado}
      />
    </div>
  );
}
