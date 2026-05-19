"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Copy, Check, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

type MsgTemplate = {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: string;
  tipo: "confirmacao" | "lembrete" | "aniversario" | "personalizada";
};

const TEMPLATES_PADRAO: MsgTemplate[] = [
  {
    id: "1",
    titulo: "Confirmação de Agendamento",
    descricao: "Enviado automaticamente 1 dia antes do atendimento",
    tipo: "confirmacao",
    conteudo: `Olá, *{nome_cliente}*! 😊

Passando para confirmar seu agendamento amanhã:

📅 *{data}* às *{hora}*
💆 Serviço: *{servico}*
👩 Profissional: *{profissional}*
📍 LB Beauty Clinic

Confirme sua presença respondendo:
✅ *SIM* - Confirmado
❌ *NÃO* - Cancelar

Qualquer dúvida, estou à disposição! 💛`,
  },
  {
    id: "2",
    titulo: "Lembrete no Dia",
    descricao: "Lembrete enviado no dia do atendimento",
    tipo: "lembrete",
    conteudo: `Bom dia, *{nome_cliente}*! 🌟

Lembrando do seu agendamento hoje:

⏰ *{hora}*
💆 {servico}
👩 Com {profissional}

Te esperamos! 🌸
LB Beauty Clinic`,
  },
  {
    id: "3",
    titulo: "Mensagem de Aniversário",
    descricao: "Enviada automaticamente no aniversário da cliente",
    tipo: "aniversario",
    conteudo: `*Feliz Aniversário, {nome_cliente}!* 🎂🎉

Que este novo ciclo seja repleto de alegrias, saúde e muito brilho! ✨

Como presente especial, você ganhou *{desconto}% de desconto* no seu próximo atendimento conosco! 🎁

Validade: até {data_validade}

Com carinho,
LB Beauty Clinic 💛`,
  },
  {
    id: "4",
    titulo: "Cancelamento",
    descricao: "Confirmação de cancelamento de agendamento",
    tipo: "personalizada",
    conteudo: `Olá, *{nome_cliente}*!

Seu agendamento do dia *{data}* às *{hora}* foi cancelado conforme solicitado.

Para reagendar, entre em contato conosco! 📲

LB Beauty Clinic 💛`,
  },
];

const VARS = [
  { var: "{nome_cliente}", desc: "Nome da cliente" },
  { var: "{data}", desc: "Data do agendamento" },
  { var: "{hora}", desc: "Horário" },
  { var: "{servico}", desc: "Nome do serviço" },
  { var: "{profissional}", desc: "Nome da profissional" },
  { var: "{desconto}", desc: "Percentual de desconto" },
  { var: "{data_validade}", desc: "Data de validade da oferta" },
];

export default function MensagensPage() {
  const [selecionado, setSelecionado] = useState<MsgTemplate>(TEMPLATES_PADRAO[0]);
  const [editando, setEditando] = useState(false);
  const [conteudoEdit, setConteudoEdit] = useState("");
  const [copiado, setCopiado] = useState(false);

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function iniciarEdicao() {
    setConteudoEdit(selecionado.conteudo);
    setEditando(true);
  }

  function salvarEdicao() {
    setSelecionado((prev) => ({ ...prev, conteudo: conteudoEdit }));
    setEditando(false);
  }

  const corPorTipo: Record<string, string> = {
    confirmacao: "#B89968",
    lembrete: "#3b82f6",
    aniversario: "#ec4899",
    personalizada: "#9a7d50",
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Mensagens Pré-definidas</h1>
        <p className="text-sm text-[#9a7d50] mt-1">Templates de WhatsApp personalizáveis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Lista de templates */}
        <div className="space-y-2">
          {TEMPLATES_PADRAO.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelecionado(t); setEditando(false); }}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-colors",
                selecionado.id === t.id
                  ? "border-[#B89968] bg-[#B89968]/5"
                  : "border-[#e8dcc4] bg-white hover:border-[#B89968]/40"
              )}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: corPorTipo[t.tipo] + "20" }}>
                  <MessageSquare size={14} style={{ color: corPorTipo[t.tipo] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#5a4530] leading-snug">{t.titulo}</p>
                  <p className="text-xs text-[#9a7d50] mt-0.5">{t.descricao}</p>
                </div>
              </div>
            </button>
          ))}

          <div className="pt-2">
            <p className="text-xs text-[#9a7d50] px-1">
              A integração completa com WhatsApp (envio automático) será implementada em breve.
            </p>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#e8dcc4] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8dcc4] bg-[#faf5ee]">
              <div>
                <p className="text-sm font-semibold text-[#5a4530]">{selecionado.titulo}</p>
                <p className="text-xs text-[#9a7d50]">{selecionado.descricao}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copiar(selecionado.conteudo)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9a7d50] hover:text-[#5a4530] border border-[#e8dcc4] rounded-lg transition-colors"
                >
                  {copiado ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={editando ? salvarEdicao : iniciarEdicao}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#B89968] text-white rounded-lg hover:bg-[#9a7d50] transition-colors"
                >
                  <Edit3 size={12} />
                  {editando ? "Salvar" : "Editar"}
                </button>
              </div>
            </div>

            {editando ? (
              <textarea
                value={conteudoEdit}
                onChange={(e) => setConteudoEdit(e.target.value)}
                rows={14}
                className="w-full p-4 text-sm text-[#5a4530] font-mono focus:outline-none resize-none"
              />
            ) : (
              <div className="p-4">
                {/* Simulação de bolha do WhatsApp */}
                <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none p-4 max-w-sm shadow-sm ml-2">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {selecionado.conteudo}
                  </pre>
                  <p className="text-xs text-gray-400 text-right mt-2">09:27 ✓✓</p>
                </div>
              </div>
            )}
          </div>

          {/* Variáveis disponíveis */}
          <div className="mt-4 bg-white rounded-xl border border-[#e8dcc4] p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-3">Variáveis disponíveis</p>
            <div className="flex flex-wrap gap-2">
              {VARS.map((v) => (
                <div key={v.var} className="flex items-center gap-1.5 bg-[#f5f0e8] px-2.5 py-1 rounded-lg">
                  <code className="text-xs font-mono text-[#B89968]">{v.var}</code>
                  <span className="text-xs text-[#9a7d50]">→ {v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
