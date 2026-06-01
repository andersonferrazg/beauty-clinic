"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, Phone, Camera, MessageCircle, Globe, Users, Loader2,
  ChevronRight, ChevronLeft, Trash2, UserCheck, MessageSquare, PhoneCall, Mail,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string; cor: string };
type InteracaoLead = { id: string; tipo: string; texto: string; criadoEm: string };

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  servicoInteresse: string | null;
  estagio: string;
  observacoes: string | null;
  clienteId: string | null;
  criadoEm: string;
  profissional: Profissional | null;
  interacoes: InteracaoLead[];
};

const ESTAGIOS = [
  { id: "NOVO", label: "Novo Lead", cor: "bg-purple-100 border-purple-300 text-purple-800", corBadge: "bg-purple-500" },
  { id: "EM_CONTATO", label: "Em Contato", cor: "bg-blue-100 border-blue-300 text-blue-800", corBadge: "bg-blue-500" },
  { id: "AGENDADO", label: "Agendado", cor: "bg-amber-100 border-amber-300 text-amber-800", corBadge: "bg-amber-500" },
  { id: "CONVERTIDO", label: "Convertido", cor: "bg-emerald-100 border-emerald-300 text-emerald-800", corBadge: "bg-emerald-500" },
  { id: "PERDIDO", label: "Perdido", cor: "bg-gray-100 border-gray-300 text-gray-600", corBadge: "bg-gray-400" },
];

const ORIGENS = [
  { id: "INSTAGRAM", label: "Instagram", icon: Camera },
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { id: "INDICACAO", label: "Indicação", icon: Users },
  { id: "SITE", label: "Site", icon: Globe },
  { id: "OUTRO", label: "Outro", icon: Phone },
];

const TIPOS_INTERACAO = [
  { id: "NOTA", label: "Nota", icon: MessageSquare },
  { id: "LIGACAO", label: "Ligação", icon: PhoneCall },
  { id: "WHATSAPP", label: "WhatsApp", icon: MessageCircle },
  { id: "EMAIL", label: "E-mail", icon: Mail },
];

function origemLabel(o: string | null) {
  return ORIGENS.find((x) => x.id === o)?.label ?? o ?? "—";
}

function diasDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const LEAD_VAZIO = {
  nome: "", telefone: "", email: "", origem: "", servicoInteresse: "", profissionalId: "", observacoes: "",
};

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [form, setForm] = useState(LEAD_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [convertendo, setConvertendo] = useState(false);

  const [novaInteracaoTipo, setNovaInteracaoTipo] = useState("NOTA");
  const [novaInteracaoTexto, setNovaInteracaoTexto] = useState("");
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [leadsData, profsData] = await Promise.all([
      fetch("/api/crm").then((r) => r.json()),
      fetch("/api/profissionais").then((r) => r.json()),
    ]);
    setLeads(Array.isArray(leadsData) ? leadsData : []);
    setProfissionais(Array.isArray(profsData) ? profsData : []);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNovoLead() {
    setLeadSelecionado(null);
    setForm(LEAD_VAZIO);
    setModalAberto(true);
  }

  function abrirLead(lead: Lead) {
    setLeadSelecionado(lead);
    setForm({
      nome: lead.nome,
      telefone: lead.telefone ?? "",
      email: lead.email ?? "",
      origem: lead.origem ?? "",
      servicoInteresse: lead.servicoInteresse ?? "",
      profissionalId: lead.profissional?.id ?? "",
      observacoes: lead.observacoes ?? "",
    });
    setNovaInteracaoTexto("");
    setNovaInteracaoTipo("NOTA");
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    const body = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      origem: form.origem,
      servicoInteresse: form.servicoInteresse,
      profissionalId: form.profissionalId || null,
      observacoes: form.observacoes,
    };
    if (leadSelecionado) {
      await fetch(`/api/crm/${leadSelecionado.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setSalvando(false);
    setModalAberto(false);
    carregar();
  }

  async function moverEstagio(lead: Lead, destino: string) {
    await fetch(`/api/crm/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estagio: destino }),
    });
    carregar();
  }

  async function excluir() {
    if (!leadSelecionado) return;
    if (!confirm(`Excluir o lead "${leadSelecionado.nome}"?`)) return;
    await fetch(`/api/crm/${leadSelecionado.id}`, { method: "DELETE" });
    setModalAberto(false);
    carregar();
  }

  async function converter() {
    if (!leadSelecionado) return;
    setConvertendo(true);
    const r = await fetch(`/api/crm/${leadSelecionado.id}/converter`, { method: "POST" });
    const data = await r.json();
    setConvertendo(false);
    if (r.ok) {
      setModalAberto(false);
      carregar();
    } else {
      alert(data.erro ?? "Erro ao converter");
    }
  }

  async function adicionarInteracao() {
    if (!leadSelecionado || !novaInteracaoTexto.trim()) return;
    setSalvandoInteracao(true);
    const r = await fetch(`/api/crm/${leadSelecionado.id}/interacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: novaInteracaoTipo, texto: novaInteracaoTexto }),
    });
    if (r.ok) {
      const interacao = await r.json();
      setLeadSelecionado((prev) => prev ? { ...prev, interacoes: [interacao, ...prev.interacoes] } : prev);
      setLeads((prev) => prev.map((l) => l.id === leadSelecionado.id ? { ...l, interacoes: [interacao, ...l.interacoes] } : l));
      setNovaInteracaoTexto("");
    }
    setSalvandoInteracao(false);
  }

  const leadsFiltrados = leads.filter((l) =>
    !busca || l.nome.toLowerCase().includes(busca.toLowerCase()) || l.telefone?.includes(busca)
  );

  const porEstagio = (estagio: string) => leadsFiltrados.filter((l) => l.estagio === estagio);

  const estagioAtualIdx = (lead: Lead) => ESTAGIOS.findIndex((e) => e.id === lead.estagio);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">CRM / Pipeline de Leads</h1>
          <p className="text-sm text-[#9a7d50] mt-0.5">
            {carregando ? "Carregando..." : `${leads.length} lead(s) no pipeline`}
          </p>
        </div>
        <button
          onClick={abrirNovoLead}
          className="flex items-center gap-2 bg-[#B89968] hover:bg-[#9a7d50] text-white px-4 py-2 rounded-lg font-medium text-sm"
        >
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full pl-9 pr-3 py-2 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
        />
      </div>

      {/* Kanban */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {ESTAGIOS.map((estagio) => {
            const cards = porEstagio(estagio.id);
            return (
              <div key={estagio.id} className="flex-shrink-0 w-64 flex flex-col">
                {/* Cabeçalho da coluna */}
                <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-l border-r", estagio.cor)}>
                  <span className="text-xs font-semibold uppercase tracking-wide">{estagio.label}</span>
                  <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold", estagio.corBadge)}>
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 bg-[#faf5ee] border border-[#e8dcc4] rounded-b-xl p-2 space-y-2 min-h-[200px]">
                  {cards.map((lead) => {
                    const idx = estagioAtualIdx(lead);
                    const prevEstagio = idx > 0 ? ESTAGIOS[idx - 1] : null;
                    const nextEstagio = idx < ESTAGIOS.length - 1 ? ESTAGIOS[idx + 1] : null;
                    const dias = diasDesde(lead.criadoEm);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white rounded-lg border border-[#e8dcc4] p-3 cursor-pointer hover:shadow-sm hover:border-[#B89968]/50 transition-all"
                        onClick={() => abrirLead(lead)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-medium text-sm text-[#5a4530] leading-tight">{lead.nome}</p>
                          {lead.profissional && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: lead.profissional.cor }}
                              title={lead.profissional.nome}
                            />
                          )}
                        </div>

                        {lead.servicoInteresse && (
                          <p className="text-xs text-[#9a7d50] mt-1 truncate">{lead.servicoInteresse}</p>
                        )}

                        {lead.telefone && (
                          <p className="text-xs text-[#9a7d50] mt-0.5">{lead.telefone}</p>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0e8d8]">
                          {lead.origem && (
                            <span className="text-[10px] text-[#9a7d50] bg-[#faf5ee] px-1.5 py-0.5 rounded">
                              {origemLabel(lead.origem)}
                            </span>
                          )}
                          <span className="text-[10px] text-[#9a7d50] ml-auto">
                            {dias === 0 ? "hoje" : `${dias}d`}
                          </span>
                        </div>

                        {/* Mover estágio */}
                        <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                          {prevEstagio && (
                            <button
                              onClick={() => moverEstagio(lead, prevEstagio.id)}
                              className="flex items-center gap-0.5 text-[10px] text-[#9a7d50] hover:text-[#5a4530] px-1.5 py-0.5 rounded hover:bg-[#faf5ee]"
                              title={`Mover para ${prevEstagio.label}`}
                            >
                              <ChevronLeft size={11} />
                            </button>
                          )}
                          <span className="flex-1" />
                          {nextEstagio && (
                            <button
                              onClick={() => moverEstagio(lead, nextEstagio.id)}
                              className="flex items-center gap-0.5 text-[10px] text-[#9a7d50] hover:text-[#5a4530] px-1.5 py-0.5 rounded hover:bg-[#faf5ee]"
                              title={`Mover para ${nextEstagio.label}`}
                            >
                              <ChevronRight size={11} />
                            </button>
                          )}
                        </div>

                        {/* Badge de interações */}
                        {lead.interacoes.length > 0 && (
                          <p className="text-[10px] text-[#9a7d50] mt-1 truncate">
                            💬 {lead.interacoes[0].texto.slice(0, 40)}{lead.interacoes[0].texto.length > 40 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {cards.length === 0 && (
                    <div className="flex items-center justify-center h-16 text-xs text-[#9a7d50]/60">
                      Sem leads aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de lead */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalAberto(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8dcc4]">
              <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
                {leadSelecionado ? leadSelecionado.nome : "Novo Lead"}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-[#9a7d50] hover:text-[#5a4530]">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Estágio atual (se editando) */}
              {leadSelecionado && (
                <div className="flex gap-1.5 flex-wrap">
                  {ESTAGIOS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setLeadSelecionado({ ...leadSelecionado, estagio: e.id });
                        moverEstagio(leadSelecionado, e.id);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        leadSelecionado.estagio === e.id
                          ? e.cor + " border-current font-semibold"
                          : "border-[#e8dcc4] text-[#9a7d50] hover:bg-[#faf5ee]"
                      )}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Campos do lead */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#9a7d50] block mb-1">Nome *</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9a7d50] block mb-1">Telefone</label>
                  <input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                    placeholder="(48) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9a7d50] block mb-1">E-mail</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9a7d50] block mb-1">Origem</label>
                  <select
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    className="w-full h-9 px-2 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] bg-white"
                  >
                    <option value="">Selecionar...</option>
                    {ORIGENS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#9a7d50] block mb-1">Profissional</label>
                  <select
                    value={form.profissionalId}
                    onChange={(e) => setForm({ ...form, profissionalId: e.target.value })}
                    className="w-full h-9 px-2 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] bg-white"
                  >
                    <option value="">Nenhuma</option>
                    {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#9a7d50] block mb-1">Serviço de interesse</label>
                  <input
                    value={form.servicoInteresse}
                    onChange={(e) => setForm({ ...form, servicoInteresse: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                    placeholder="Ex: Botox, preenchimento labial..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#9a7d50] block mb-1">Observações</label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
                    placeholder="Anotações sobre o lead..."
                  />
                </div>
              </div>

              {/* Interações (só em edição) */}
              {leadSelecionado && (
                <div className="border-t border-[#e8dcc4] pt-4">
                  <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wide mb-3">Histórico de Contato</p>

                  {/* Nova interação */}
                  <div className="space-y-2 mb-4">
                    <div className="flex gap-1.5">
                      {TIPOS_INTERACAO.map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNovaInteracaoTipo(t.id)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors",
                              novaInteracaoTipo === t.id
                                ? "bg-[#B89968] text-white border-[#B89968]"
                                : "border-[#e8dcc4] text-[#9a7d50] hover:bg-[#faf5ee]"
                            )}
                          >
                            <Icon size={11} /> {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={novaInteracaoTexto}
                        onChange={(e) => setNovaInteracaoTexto(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") adicionarInteracao(); }}
                        placeholder="Registrar contato ou anotação..."
                        className="flex-1 h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                      />
                      <button
                        onClick={adicionarInteracao}
                        disabled={salvandoInteracao || !novaInteracaoTexto.trim()}
                        className="h-9 px-3 rounded-md bg-[#B89968] text-white text-sm hover:bg-[#9a7d50] disabled:opacity-50"
                      >
                        {salvandoInteracao ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Lista de interações */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {leadSelecionado.interacoes.length === 0 ? (
                      <p className="text-xs text-[#9a7d50] text-center py-3">Nenhum contato registrado ainda</p>
                    ) : (
                      leadSelecionado.interacoes.map((inter) => {
                        const tipo = TIPOS_INTERACAO.find((t) => t.id === inter.tipo);
                        const Icon = tipo?.icon ?? MessageSquare;
                        return (
                          <div key={inter.id} className="flex gap-2 text-xs">
                            <Icon size={13} className="text-[#B89968] flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-[#5a4530]">{inter.texto}</span>
                              <span className="text-[#9a7d50] ml-2">
                                {new Date(inter.criadoEm).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e8dcc4] flex items-center justify-between">
              {leadSelecionado ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={excluir}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                  {!leadSelecionado.clienteId && leadSelecionado.estagio !== "PERDIDO" && (
                    <button
                      onClick={converter}
                      disabled={convertendo}
                      className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md"
                    >
                      {convertendo ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={13} />}
                      Converter em Cliente
                    </button>
                  )}
                  {leadSelecionado.clienteId && (
                    <a
                      href={`/clientes`}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800"
                    >
                      <UserCheck size={13} /> Ver cliente
                    </a>
                  )}
                </div>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#9a7d50] hover:bg-[#faf5ee]"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando || !form.nome.trim()}
                  className="px-4 py-2 rounded-lg bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {salvando && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
