"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModalProfissional } from "@/components/modal-profissional";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Profissional = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  especialidade: string | null;
  cor: string;
  tipoComissao: string;
  percentualComissao: number | null;
  salarioFixo: number | null;
  whatsappAtivo: boolean;
};

function labelComissao(prof: Profissional) {
  if (prof.tipoComissao === "INTEGRAL") return "100%";
  if (prof.tipoComissao === "PERCENTUAL" && prof.percentualComissao != null) return `${prof.percentualComissao}%`;
  if (prof.tipoComissao === "SALARIO_FIXO" && prof.salarioFixo != null)
    return `R$ ${prof.salarioFixo.toFixed(2).replace(".", ",")}`;
  return "—";
}

function labelTipo(tipo: string) {
  const mapa: Record<string, string> = {
    PERCENTUAL: "Comissão",
    SALARIO_FIXO: "Salário Fixo",
    INTEGRAL: "Sócia",
    MISTO: "Misto",
  };
  return mapa[tipo] ?? tipo;
}

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [profSelecionado, setProfSelecionado] = useState<string | undefined>();

  async function carregar() {
    setCarregando(true);
    const r = await fetch("/api/profissionais");
    const dados = await r.json();
    setProfissionais(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setProfSelecionado(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(id: string) {
    setProfSelecionado(id);
    setModalAberto(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Profissionais & Comissão</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${profissionais.length} profissional(is) cadastrada(s)`}
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
          <Plus size={16} />
          Nova Profissional
        </Button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : profissionais.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <p className="text-base">Nenhuma profissional cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profissionais.map((prof) => (
            <div
              key={prof.id}
              onClick={() => abrirEdicao(prof.id)}
              className="bg-white rounded-xl border border-[#e8dcc4] p-5 hover:border-[#B89968]/40 cursor-pointer transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: prof.cor }}
                >
                  {iniciais(prof.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#5a4530] truncate">{prof.nome}</p>
                  <span className="inline-block bg-[#f5f0e8] text-[#9a7d50] text-xs px-2 py-0.5 rounded-full mt-0.5">
                    {labelTipo(prof.tipoComissao)}
                  </span>
                </div>
              </div>
              {prof.especialidade && (
                <p className="text-sm text-[#9a7d50] mb-3 line-clamp-2">{prof.especialidade}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-[#e8dcc4]">
                <span className="text-xs text-[#9a7d50]">Remuneração</span>
                <span className="text-sm font-semibold text-[#B89968]">{labelComissao(prof)}</span>
              </div>
              {prof.whatsappAtivo && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600">WhatsApp conectado</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalProfissional
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={carregar}
        profissionalId={profSelecionado}
      />
    </div>
  );
}
