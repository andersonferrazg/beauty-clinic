"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Copy, Check, Edit3, Plus, Trash2, X, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  nome: string;
  texto: string;
  ordem: number;
};

const VARS = [
  { var: "{nome_cliente}", desc: "Nome da cliente" },
  { var: "{nome_clinica}", desc: "Nome da clínica" },
  { var: "{data}", desc: "Data do agendamento" },
  { var: "{hora}", desc: "Horário de início" },
  { var: "{hora_fim}", desc: "Horário de fim" },
  { var: "{servico}", desc: "Nome do serviço" },
  { var: "{profissional}", desc: "Nome da profissional" },
  { var: "{valor_total}", desc: "Valor total (R$)" },
];

const TEMPLATES_INICIAIS: Omit<Msg, "id" | "ordem">[] = [
  {
    nome: "Confirmação de Agendamento",
    texto: `Olá, *{nome_cliente}*! 😊

Passando para confirmar seu agendamento:

📅 *{data}* às *{hora}*
💆 Serviço: *{servico}*
👩 Profissional: *{profissional}*
📍 {nome_clinica}

Confirme sua presença respondendo:
✅ *SIM* - Confirmado
❌ *NÃO* - Cancelar

Qualquer dúvida, estou à disposição! 💛`,
  },
  {
    nome: "Lembrete no Dia",
    texto: `Bom dia, *{nome_cliente}*! 🌟

Lembrando do seu agendamento hoje:

⏰ *{hora}*
💆 {servico}
👩 Com {profissional}

Te esperamos! 🌸
{nome_clinica}`,
  },
  {
    nome: "Pós-Atendimento",
    texto: `Olá, *{nome_cliente}*! 🌸

Esperamos que tenha gostado do seu atendimento de *{servico}* conosco!

Qualquer dúvida sobre os cuidados pós-procedimento, estamos à disposição. 💛

Com carinho,
{nome_clinica}`,
  },
  {
    nome: "Cancelamento",
    texto: `Olá, *{nome_cliente}*!

Seu agendamento do dia *{data}* às *{hora}* foi cancelado conforme solicitado.

Para reagendar, entre em contato conosco! 📲

{nome_clinica} 💛`,
  },
];

function aplicarVars(texto: string, nomeClinica: string): string {
  return texto.replace(/\{nome_clinica\}/g, nomeClinica);
}

export default function MensagensPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTexto, setNovoTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [nomeClinica, setNomeClinica] = useState("Beauty Clinic");
  const [criandoNova, setCriandoNova] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [populando, setPopulando] = useState(false);

  useEffect(() => {
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((d) => setNomeClinica(d.nome))
      .catch(() => {});
    carregarMsgs();
  }, []);

  async function carregarMsgs() {
    setCarregando(true);
    try {
      const r = await fetch("/api/msgs-predefinidas");
      const data = await r.json();
      setMsgs(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelecionadoId((prev) => prev ?? data[0].id);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function popularTemplates() {
    setPopulando(true);
    try {
      for (const t of TEMPLATES_INICIAIS) {
        await fetch("/api/msgs-predefinidas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
      }
      await carregarMsgs();
    } finally {
      setPopulando(false);
    }
  }

  async function salvarEdicao() {
    if (!novoNome.trim() || !novoTexto.trim()) return;
    setSalvando(true);
    try {
      if (criandoNova) {
        const r = await fetch("/api/msgs-predefinidas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: novoNome, texto: novoTexto }),
        });
        const nova = await r.json();
        setSelecionadoId(nova.id);
      } else if (selecionadoId) {
        await fetch(`/api/msgs-predefinidas/${selecionadoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: novoNome, texto: novoTexto }),
        });
      }
      await carregarMsgs();
      setEditando(false);
      setCriandoNova(false);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    setExcluindo(true);
    try {
      await fetch(`/api/msgs-predefinidas/${id}`, { method: "DELETE" });
      setConfirmarExcluir(null);
      if (selecionadoId === id) setSelecionadoId(null);
      await carregarMsgs();
    } finally {
      setExcluindo(false);
    }
  }

  function iniciarCriacao() {
    setCriandoNova(true);
    setEditando(true);
    setSelecionadoId(null);
    setNovoNome("");
    setNovoTexto("");
  }

  function iniciarEdicao(msg: Msg) {
    setSelecionadoId(msg.id);
    setNovoNome(msg.nome);
    setNovoTexto(msg.texto);
    setEditando(true);
    setCriandoNova(false);
  }

  function cancelarEdicao() {
    setEditando(false);
    setCriandoNova(false);
    if (!selecionadoId && msgs.length > 0) setSelecionadoId(msgs[0].id);
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(aplicarVars(texto, nomeClinica));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const selecionado = msgs.find((m) => m.id === selecionadoId) ?? null;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Mensagens Pré-definidas</h1>
          <p className="text-sm text-[#9a7d50] mt-1">Templates de WhatsApp — use direto no agendamento</p>
        </div>
        <button
          onClick={iniciarCriacao}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#B89968] text-white text-sm font-medium rounded-lg hover:bg-[#9a7d50] transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Nova
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : msgs.length === 0 && !criandoNova ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#B89968]/10 flex items-center justify-center">
            <MessageSquare size={28} className="text-[#B89968]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#5a4530]">Nenhum template ainda</p>
            <p className="text-sm text-[#9a7d50] mt-1">Crie mensagens reutilizáveis para WhatsApp</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={popularTemplates}
              disabled={populando}
              className="px-4 py-2 bg-[#B89968] text-white text-sm font-medium rounded-lg hover:bg-[#9a7d50] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {populando ? <Loader2 size={14} className="animate-spin" /> : null}
              Carregar templates padrão
            </button>
            <button
              onClick={iniciarCriacao}
              className="px-4 py-2 border border-[#B89968]/40 text-[#9a7d50] text-sm font-medium rounded-lg hover:bg-[#faf5ee] transition-colors"
            >
              Criar do zero
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Lista de templates */}
          <div className="space-y-2">
            {msgs.map((msg) => (
              <button
                key={msg.id}
                onClick={() => { setSelecionadoId(msg.id); setEditando(false); setCriandoNova(false); }}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-colors",
                  selecionadoId === msg.id && !criandoNova
                    ? "border-[#B89968] bg-[#B89968]/5"
                    : "border-[#e8dcc4] bg-white hover:border-[#B89968]/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#B89968]/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={13} className="text-[#B89968]" />
                  </div>
                  <p className="text-sm font-medium text-[#5a4530] leading-snug flex-1 min-w-0 truncate">{msg.nome}</p>
                </div>
              </button>
            ))}

            {criandoNova && (
              <div className="rounded-xl border-2 border-dashed border-[#B89968]/40 bg-[#B89968]/3 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#B89968]/20 flex items-center justify-center flex-shrink-0">
                    <Plus size={13} className="text-[#B89968]" />
                  </div>
                  <p className="text-sm font-medium text-[#B89968]">Nova mensagem</p>
                </div>
              </div>
            )}
          </div>

          {/* Editor / Preview */}
          <div className="lg:col-span-2">
            {(selecionado || criandoNova) && (
              <div className="bg-white rounded-xl border border-[#e8dcc4] shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8dcc4] bg-[#faf5ee] gap-3">
                  {editando ? (
                    <input
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Nome da mensagem..."
                      className="flex-1 text-sm font-semibold text-[#5a4530] bg-transparent outline-none border-b border-[#B89968]/40 pb-0.5 placeholder-[#9a7d50]/50"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#5a4530] flex-1 truncate">{selecionado?.nome}</p>
                  )}

                  <div className="flex gap-2 flex-shrink-0">
                    {!editando && (
                      <>
                        <button
                          onClick={() => selecionado && copiar(selecionado.texto)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9a7d50] hover:text-[#5a4530] border border-[#e8dcc4] rounded-lg transition-colors"
                        >
                          {copiado ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                          {copiado ? "Copiado!" : "Copiar"}
                        </button>
                        <button
                          onClick={() => selecionado && iniciarEdicao(selecionado)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#B89968] text-white rounded-lg hover:bg-[#9a7d50] transition-colors"
                        >
                          <Edit3 size={12} />
                          Editar
                        </button>
                        <button
                          onClick={() => selecionado && setConfirmarExcluir(selecionado.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {editando && (
                      <>
                        <button
                          onClick={cancelarEdicao}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#9a7d50] border border-[#e8dcc4] rounded-lg hover:bg-[#faf5ee] transition-colors"
                        >
                          <X size={12} />
                          Cancelar
                        </button>
                        <button
                          onClick={salvarEdicao}
                          disabled={salvando || !novoNome.trim() || !novoTexto.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#B89968] text-white rounded-lg hover:bg-[#9a7d50] disabled:opacity-50 transition-colors"
                        >
                          {salvando ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Salvar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Corpo */}
                {editando ? (
                  <textarea
                    value={novoTexto}
                    onChange={(e) => setNovoTexto(e.target.value)}
                    placeholder="Digite o texto da mensagem... use {nome_cliente}, {data}, {hora}, {servico}..."
                    rows={14}
                    className="w-full p-4 text-sm text-[#5a4530] font-mono focus:outline-none resize-none"
                  />
                ) : (
                  <div className="p-4">
                    <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none p-4 max-w-sm shadow-sm ml-2">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {selecionado ? aplicarVars(selecionado.texto, nomeClinica) : ""}
                      </pre>
                      <p className="text-xs text-gray-400 text-right mt-2">09:27 ✓✓</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variáveis */}
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
              <p className="text-xs text-[#9a7d50]/70 mt-3">
                Ao usar no agendamento, as variáveis são preenchidas automaticamente com os dados do cliente e do atendimento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação de exclusão */}
      {confirmarExcluir && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-6 shadow-xl text-center w-full max-w-xs">
            <h3 className="font-semibold text-[#5a4530] text-base mb-1">Excluir mensagem</h3>
            <p className="text-sm text-[#9a7d50] mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarExcluir(null)}
                className="flex-1 border border-[#e8dcc4] rounded-lg py-2.5 text-sm text-[#9a7d50] hover:bg-[#faf5ee] transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluir(confirmarExcluir)}
                disabled={excluindo}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {excluindo ? <Loader2 size={14} className="animate-spin" /> : null}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
