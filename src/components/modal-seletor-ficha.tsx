"use client";

import { X, ClipboardList, Syringe, ScrollText, Camera, BookOpen, FileText, Activity, ScanLine } from "lucide-react";
import type { TipoTermo } from "@/lib/termos";
import type { TipoCartilha } from "@/lib/cartilhas";

export type TipoFicha =
  | "anamnese"
  | "planejamento"
  | "controle_sessoes"
  | TipoTermo
  | TipoCartilha
  | "documento_escaneado";

type SecaoFicha = {
  titulo: string;
  fichas: {
    tipo: TipoFicha;
    titulo: string;
    descricao: string;
    icon: React.ComponentType<{ size?: number }>;
    cor: string;
  }[];
};

const SECOES: SecaoFicha[] = [
  {
    titulo: "Avaliação & Planejamento",
    fichas: [
      { tipo: "anamnese", titulo: "Anamnese Avançada", descricao: "Questionário completo de saúde (~40 perguntas)", icon: ClipboardList, cor: "#3b82f6" },
      { tipo: "planejamento", titulo: "Planejamento de Procedimentos", descricao: "Botox por região, preenchimento, etiquetas", icon: Syringe, cor: "#B89968" },
      { tipo: "controle_sessoes", titulo: "Controle de Tratamentos e Sessões", descricao: "Registro cronológico de sessões realizadas", icon: Activity, cor: "#0891b2" },
    ],
  },
  {
    titulo: "Termos de Consentimento",
    fichas: [
      { tipo: "termo_botox", titulo: "Termo — Toxina Botulínica", descricao: "Consentimento para aplicação de Botox", icon: ScrollText, cor: "#a855f7" },
      { tipo: "termo_preenchimento", titulo: "Termo — Preenchimento Facial", descricao: "Consentimento para preenchimento facial/labial", icon: ScrollText, cor: "#ec4899" },
      { tipo: "termo_bioestimuladores", titulo: "Termo — Bioestimuladores de Colágeno", descricao: "Consentimento para bioestimuladores", icon: ScrollText, cor: "#8b5cf6" },
      { tipo: "termo_skinbooster", titulo: "Termo — Skinbooster", descricao: "Consentimento para hidratação profunda", icon: ScrollText, cor: "#06b6d4" },
      { tipo: "termo_fios_pdo", titulo: "Termo — Fios de PDO", descricao: "Consentimento para lifting com fios", icon: ScrollText, cor: "#f59e0b" },
      { tipo: "termo_peeling", titulo: "Termo — Peeling Químico", descricao: "Consentimento para peeling químico", icon: ScrollText, cor: "#ef4444" },
      { tipo: "termo_microagulhamento", titulo: "Termo — Microagulhamento", descricao: "Consentimento para micropunção", icon: ScrollText, cor: "#f97316" },
      { tipo: "termo_intradermoterapia", titulo: "Termo — Intradermoterapia", descricao: "Consentimento para mesoterapia/intradermoterapia", icon: ScrollText, cor: "#84cc16" },
      { tipo: "termo_peim", titulo: "Termo — PEIM (Microvasos)", descricao: "Consentimento para tratamento de microvasos", icon: ScrollText, cor: "#14b8a6" },
      { tipo: "termo_enzimas", titulo: "Termo — Enzimas Lipolíticas", descricao: "Consentimento para enzimas lipolíticas", icon: ScrollText, cor: "#f43f5e" },
      { tipo: "termo_rinomodelacao", titulo: "Termo — Rinomodelação", descricao: "Consentimento para rinoplastia não cirúrgica", icon: ScrollText, cor: "#6366f1" },
      { tipo: "contrato_geral", titulo: "Contrato Geral de Serviços", descricao: "Contrato de prestação de serviços estéticos", icon: FileText, cor: "#64748b" },
    ],
  },
  {
    titulo: "Cartilhas Pós-Procedimento",
    fichas: [
      { tipo: "cartilha_botox", titulo: "Cartilha Pós — Toxina Botulínica", descricao: "Orientações após aplicação de Botox", icon: BookOpen, cor: "#a855f7" },
      { tipo: "cartilha_preenchimento", titulo: "Cartilha Pós — Preenchimento Facial", descricao: "Orientações após preenchimento facial/labial", icon: BookOpen, cor: "#ec4899" },
      { tipo: "cartilha_bioestimuladores", titulo: "Cartilha Pós — Bioestimuladores", descricao: "Orientações após bioestimuladores de colágeno", icon: BookOpen, cor: "#8b5cf6" },
      { tipo: "cartilha_skinbooster", titulo: "Cartilha Pós — Skinbooster", descricao: "Orientações após skinbooster", icon: BookOpen, cor: "#06b6d4" },
      { tipo: "cartilha_fios_pdo", titulo: "Cartilha Pós — Fios de PDO", descricao: "Orientações após fios de PDO", icon: BookOpen, cor: "#f59e0b" },
      { tipo: "cartilha_peeling", titulo: "Cartilha Pós — Peeling Químico", descricao: "Orientações após peeling químico", icon: BookOpen, cor: "#ef4444" },
      { tipo: "cartilha_microagulhamento", titulo: "Cartilha Pós — Microagulhamento", descricao: "Orientações após microagulhamento", icon: BookOpen, cor: "#f97316" },
      { tipo: "cartilha_intradermoterapia", titulo: "Cartilha Pós — Intradermoterapia", descricao: "Orientações após intradermoterapia", icon: BookOpen, cor: "#84cc16" },
      { tipo: "cartilha_peim", titulo: "Cartilha Pós — PEIM (Microvasos)", descricao: "Orientações após tratamento de microvasos", icon: BookOpen, cor: "#14b8a6" },
      { tipo: "cartilha_enzimas", titulo: "Cartilha Pós — Enzimas Lipolíticas", descricao: "Orientações após enzimas lipolíticas", icon: BookOpen, cor: "#f43f5e" },
      { tipo: "cartilha_rinomodelacao", titulo: "Cartilha Pós — Rinomodelação", descricao: "Orientações após rinomodelação", icon: BookOpen, cor: "#6366f1" },
    ],
  },
  {
    titulo: "Documentos",
    fichas: [
      { tipo: "autorizacao_imagem", titulo: "Autorização de Uso de Imagem", descricao: "Liberação de uso da imagem para divulgação", icon: Camera, cor: "#10b981" },
      { tipo: "documento_escaneado", titulo: "Digitalizar Documento em Papel", descricao: "Fotografar ou escanear ficha preenchida manualmente", icon: ScanLine, cor: "#64748b" },
    ],
  },
];

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (tipo: TipoFicha) => void;
};

export function ModalSeletorFicha({ aberto, onFechar, onSelecionar }: Props) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-hidden flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Nova Ficha</h2>
            <p className="text-xs text-[#9a7d50] mt-0.5">Selecione qual ficha você quer preencher</p>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {SECOES.map((secao) => (
            <div key={secao.titulo}>
              <p className="text-[10px] font-bold text-[#9a7d50] uppercase tracking-widest mb-2 px-1">
                {secao.titulo}
              </p>
              <div className="space-y-1.5">
                {secao.fichas.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.tipo}
                      onClick={() => { onSelecionar(f.tipo); onFechar(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#e8dcc4] hover:border-[#B89968] hover:bg-[#faf5ee] transition-all text-left group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                        style={{ backgroundColor: f.cor }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#5a4530] group-hover:text-[#B89968] transition-colors leading-tight">
                          {f.titulo}
                        </p>
                        <p className="text-[11px] text-[#9a7d50] mt-0.5 leading-tight">
                          {f.descricao}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
