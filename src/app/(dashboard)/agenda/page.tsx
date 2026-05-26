"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ModalAgendamento } from "@/components/modal-agendamento";
import { ChevronLeft, ChevronRight, Plus, AlertCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mini calendário popup ─────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA_CAL = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function CalendarioPopup({
  dataAtual,
  onSelecionar,
  onFechar,
}: {
  dataAtual: Date;
  onSelecionar: (d: Date) => void;
  onFechar: () => void;
}) {
  const hoje = new Date();
  const [mesVis, setMesVis] = useState(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
  const [selecionado, setSelecionado] = useState(new Date(dataAtual));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onFechar();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onFechar]);

  const ano = mesVis.getFullYear();
  const mes = mesVis.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  function navMes(delta: number) {
    setMesVis(new Date(ano, mes + delta, 1));
  }

  const celulas = Array.from({ length: primeiroDia + diasNoMes }, (_, i) =>
    i < primeiroDia ? null : i - primeiroDia + 1
  );
  // completar para múltiplos de 7
  while (celulas.length % 7 !== 0) celulas.push(null);

  function isSelecionado(dia: number) {
    return (
      selecionado.getDate() === dia &&
      selecionado.getMonth() === mes &&
      selecionado.getFullYear() === ano
    );
  }

  function isHoje(dia: number) {
    return (
      hoje.getDate() === dia &&
      hoje.getMonth() === mes &&
      hoje.getFullYear() === ano
    );
  }

  return (
    <div
      ref={ref}
      className="absolute top-full mt-1 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-[#e8dcc4] w-72 overflow-hidden"
    >
      {/* Cabeçalho com data selecionada */}
      <div className="bg-[#B89968] px-4 py-3">
        <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Data</p>
        <p className="text-white text-lg font-bold">
          {selecionado.getDate()} de {MESES[selecionado.getMonth()]}
        </p>
      </div>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navMes(-1)} className="p-1 rounded hover:bg-[#faf5ee] text-[#9a7d50]">
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => {}}
          className="text-sm font-semibold text-[#5a4530] flex items-center gap-1"
        >
          {MESES[mes]} {ano}
          <ChevronRight size={12} className="rotate-90 text-[#9a7d50]" />
        </button>
        <button onClick={() => navMes(1)} className="p-1 rounded hover:bg-[#faf5ee] text-[#9a7d50]">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cabeçalho dias da semana */}
      <div className="grid grid-cols-7 px-2 mb-1">
        {DIAS_SEMANA_CAL.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#9a7d50] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {celulas.map((dia, idx) => (
          <div key={idx} className="flex items-center justify-center py-0.5">
            {dia ? (
              <button
                onClick={() => setSelecionado(new Date(ano, mes, dia))}
                className={cn(
                  "w-8 h-8 rounded-full text-sm transition-colors font-medium",
                  isSelecionado(dia)
                    ? "bg-[#B89968] text-white"
                    : isHoje(dia)
                    ? "bg-[#B89968]/15 text-[#B89968] font-bold"
                    : "text-[#5a4530] hover:bg-[#faf5ee]"
                )}
              >
                {dia}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#e8dcc4]">
        <button
          onClick={onFechar}
          className="text-sm font-semibold text-[#9a7d50] hover:text-[#5a4530] px-3 py-1.5"
        >
          CANCELAR
        </button>
        <button
          onClick={() => { onSelecionar(selecionado); onFechar(); }}
          className="text-sm font-semibold text-[#B89968] hover:text-[#9a7d50] px-3 py-1.5"
        >
          OK
        </button>
      </div>
    </div>
  );
}

// ── Constantes de layout ──────────────────────────────────────────────────────
const ALTURA_SLOT = 48; // px por slot de 30min  (= 96px/hora)

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatarDataISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diaSemanaAbrev(d: number) {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d];
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function semanaDosDias(data: Date): Date[] {
  const dias: Date[] = [];
  const seg = new Date(data);
  seg.setDate(data.getDate() - (data.getDay() + 6) % 7); // começa na segunda
  for (let i = 0; i < 7; i++) {
    const d = new Date(seg);
    d.setDate(seg.getDate() + i);
    dias.push(d);
  }
  return dias;
}

// ── Tipos ────────────────────────────────────────────────────────────────────
type Profissional = { id: string; nome: string; cor: string; possuiAgenda?: boolean };

type Agendamento = {
  id: string;
  profissionalId: string;
  profissional: { id: string; nome: string; cor: string };
  cliente: { id: string; nome: string; telefone1: string | null } | null;
  status: { id: string; nome: string; cor: string } | null;
  inicio: string;
  fim: string;
  corCustom: string | null;
  observacao: string | null;
  motivoBloqueio: string | null;
  confirmacaoManualPendente: boolean;
  itens: { servico: { nome: string } }[];
};

// ── Componente ────────────────────────────────────────────────────────────────
function salvarDataLocal(d: Date) {
  try { localStorage.setItem("agendaData", formatarDataISO(d)); } catch {}
}

export default function AgendaPage() {
  const hoje = new Date();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [profissionaisCarregadas, setProfissionaisCarregadas] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [templateWpp, setTemplateWpp] = useState(`Oii {primeiro_nome} 💖\n\nPassando para confirmar nosso horário amanhã ({dia_semana}) {data_curta} ás {hora}h\n\nPor gentileza, confirme o recebimento desta mensagem. Caso não haja resposta, o seu horário será automaticamente cancelado.\nTolerância de atraso é de 10 minutos.\n\nAgradeço a compreensão 🥰`);
  const [horaInicio, setHoraInicio] = useState(6);
  const [horaFim, setHoraFim] = useState(21);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalDataInicial, setModalDataInicial] = useState<Date>(new Date());
  const [modalHoraInicial, setModalHoraInicial] = useState(9 * 60);
  const [modalProfissionalId, setModalProfissionalId] = useState("");
  const [modalAgendamentoId, setModalAgendamentoId] = useState<string | undefined>();
  const [calAberto, setCalAberto] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  const dataStr = formatarDataISO(dataAtual);
  const ehHoje = formatarDataISO(hoje) === dataStr;
  const diasSemana = semanaDosDias(dataAtual);

  const TOTAL_SLOTS = Math.max((horaFim - horaInicio) * 2, 1);
  const SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    idx: i,
    hora: horaInicio + Math.floor(i / 2),
    minuto: (i % 2) * 30,
    ehHoraCheia: i % 2 === 0,
  }));

  function posicaoBloco(inicio: string, fim: string) {
    const ini = new Date(inicio);
    const fi = new Date(fim);
    const totalMin = TOTAL_SLOTS * 30;
    const minIni = Math.max(0, (ini.getHours() - horaInicio) * 60 + ini.getMinutes());
    const minFim = Math.min(totalMin, (fi.getHours() - horaInicio) * 60 + fi.getMinutes() + (fi.getDate() !== ini.getDate() ? 24 * 60 : 0));
    const durMin = Math.max(0, minFim - minIni);
    return {
      top: `${(minIni / totalMin) * 100}%`,
      height: `${Math.max((durMin / totalMin) * 100, 1.8)}%`,
    };
  }

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("agendaData");
      if (salvo) { const d = new Date(salvo + "T12:00"); if (!isNaN(d.getTime())) setDataAtual(d); }
    } catch {}
    Promise.all([
      fetch("/api/profissionais").then((r) => r.json()),
      fetch("/api/me/sessao").then((r) => r.json()),
    ])
      .then(([profs, sessao]: [Profissional[], { permissoes?: { isAdmin?: boolean }; profissionalId?: string | null }]) => {
        const comAgenda = (profs as Profissional[]).filter((p) => p.possuiAgenda !== false);
        if (!sessao?.permissoes?.isAdmin && sessao?.profissionalId) {
          const propria = comAgenda.filter((p) => p.id === sessao.profissionalId);
          // se a profissional não tem coluna na agenda (ex: recepcionista), vê todas
          setProfissionais(propria.length > 0 ? propria : comAgenda);
        } else {
          setProfissionais(comAgenda);
        }
        setProfissionaisCarregadas(true);
      })
      .catch(() => setProfissionaisCarregadas(true));
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.mensagemConfirmacaoWpp) setTemplateWpp(d.config.mensagemConfirmacaoWpp);
        if (d.config?.horaInicioAgenda != null) setHoraInicio(d.config.horaInicioAgenda);
        if (d.config?.horaFimAgenda != null) setHoraFim(d.config.horaFimAgenda);
      })
      .catch(console.error);
  }, []);

  const carregarAgendamentos = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await fetch(`/api/agendamentos?data=${dataStr}`);
      const dados = await r.json();
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [dataStr]);

  useEffect(() => { carregarAgendamentos(); }, [carregarAgendamentos]);

  function navegar(delta: number) {
    const nova = new Date(dataAtual);
    nova.setDate(nova.getDate() + delta);
    setDataAtual(nova);
    salvarDataLocal(nova);
  }

  function abrirNovoAgendamento(profissionalId: string, horaMin: number) {
    setModalDataInicial(dataAtual);
    setModalHoraInicial(horaMin);
    setModalProfissionalId(profissionalId);
    setModalAgendamentoId(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(agendamentoId: string) {
    setModalAgendamentoId(agendamentoId);
    setModalAberto(true);
  }

  function abrirNovo() {
    setModalDataInicial(dataAtual);
    setModalHoraInicial(9 * 60);
    setModalProfissionalId("");
    setModalAgendamentoId(undefined);
    setModalAberto(true);
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f6f8]">

      {/* ── Barra de navegação semanal + nomes das profissionais ───────────── */}
      <div className="bg-white border-b border-[#e8dcc4] sticky top-[52px] lg:top-0 z-30 px-3 py-1">
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => navegar(-7)}
            className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#9a7d50] flex-shrink-0"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 flex justify-around gap-0.5">
            {diasSemana.map((dia) => {
              const diaStr = formatarDataISO(dia);
              const isAtual = diaStr === dataStr;
              const isHojeFlag = formatarDataISO(hoje) === diaStr;
              return (
                <button
                  key={diaStr}
                  onClick={() => { const d = new Date(dia); setDataAtual(d); salvarDataLocal(d); }}
                  className={cn(
                    "flex flex-col items-center px-2 py-1 rounded-xl transition-colors min-w-[42px]",
                    isAtual
                      ? "bg-[#B89968] text-white"
                      : isHojeFlag
                      ? "bg-[#B89968]/10 text-[#B89968]"
                      : "text-[#5a4530] hover:bg-[#faf5ee]"
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    {diaSemanaAbrev(dia.getDay())}
                  </span>
                  <span className="text-base font-bold leading-tight">
                    {dia.getDate()}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {String(dia.getMonth() + 1).padStart(2, "0")}/
                    {String(dia.getFullYear()).slice(-2)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => navegar(7)}
            className="p-1.5 rounded-lg hover:bg-[#faf5ee] text-[#9a7d50] flex-shrink-0"
          >
            <ChevronRight size={16} />
          </button>

          {/* Botão calendário — visível só no desktop */}
          <div className="relative flex-shrink-0 hidden lg:block">
            <button
              onClick={() => setCalAberto(!calAberto)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                calAberto ? "bg-[#B89968] text-white" : "hover:bg-[#faf5ee] text-[#9a7d50]"
              )}
            >
              <CalendarDays size={16} />
            </button>
            {calAberto && (
              <CalendarioPopup
                dataAtual={dataAtual}
                onSelecionar={(d) => { setDataAtual(d); salvarDataLocal(d); }}
                onFechar={() => setCalAberto(false)}
              />
            )}
          </div>

          <button
            onClick={() => { setDataAtual(hoje); salvarDataLocal(hoje); }}
            className={cn(
              "ml-1 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 transition-colors hidden lg:block",
              ehHoje
                ? "bg-[#B89968] text-white"
                : "border border-[#B89968]/40 text-[#B89968] hover:bg-[#B89968]/10"
            )}
          >
            Hoje
          </button>

          {carregando && (
            <div className="w-3.5 h-3.5 border-2 border-[#B89968] border-t-transparent rounded-full animate-spin ml-1 flex-shrink-0" />
          )}
        </div>

        {/* ── Linha com nomes das profissionais — sempre visível ───────────── */}
        {/* -mx-3 cancela o px-3 do pai; pl-14 (56px) compensa a coluna de horários do grid */}
        <div className="flex border-t border-[#e8dcc4]/60 mt-1 pt-1 pb-0.5 -mx-3 pl-14">
          {!profissionaisCarregadas ? (
            [1, 2].map((i) => (
              <div key={i} className="flex-1 flex items-center justify-center gap-1.5 px-1">
                <div className="w-5 h-5 rounded-full bg-[#e8dcc4] animate-pulse flex-shrink-0" />
                <div className="h-2.5 w-20 bg-[#e8dcc4] rounded animate-pulse" />
              </div>
            ))
          ) : (
            profissionais.map((prof) => (
              <div key={prof.id} className="flex-1 flex items-center justify-center gap-1.5 px-1 min-w-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: prof.cor }}
                >
                  {iniciais(prof.nome)}
                </div>
                <span className="text-[11px] font-medium text-[#5a4530] truncate">
                  {prof.nome.replace("Dra. ", "")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Grade de horários ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto" ref={gridRef}>
        <div style={{ minWidth: `${56 + Math.max(profissionais.length, profissionaisCarregadas ? 1 : 2) * 100}px` }}>

        {/* Grade de horários */}
        <div
          className="flex"
          style={{ minWidth: `${56 + profissionais.length * 100}px` }}
        >
          {/* Coluna de horas */}
          <div className="w-14 flex-shrink-0 bg-white border-r border-[#e8dcc4]">
            <div className="relative" style={{ height: `${TOTAL_SLOTS * ALTURA_SLOT}px` }}>
              {SLOTS.map((slot) => (
                <div
                  key={slot.idx}
                  className="absolute w-full"
                  style={{ top: `${slot.idx * ALTURA_SLOT}px`, height: `${ALTURA_SLOT}px` }}
                >
                  {slot.ehHoraCheia ? (
                    <span className="text-[10px] text-[#9a7d50] block text-right pr-2 -mt-1.5 select-none">
                      {String(slot.hora).padStart(2, "0")}:00
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#9a7d50]/50 block text-right pr-2 -mt-1.5 select-none">
                      {String(slot.hora).padStart(2, "0")}:30
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Colunas por profissional */}
          {profissionais.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20 text-[#9a7d50] text-sm">
              Nenhuma profissional cadastrada.
            </div>
          ) : (
            profissionais.map((prof) => {
              const agsDaProf = agendamentos.filter((a) => a.profissionalId === prof.id);

              return (
                <div
                  key={prof.id}
                  className="flex-1 min-w-[100px] border-r border-[#e8dcc4] last:border-r-0"
                >
                  {/* Grade de slots */}
                  <div
                    className="relative"
                    style={{ height: `${TOTAL_SLOTS * ALTURA_SLOT}px` }}
                  >
                    {/* Slots clicáveis (30min cada) */}
                    {SLOTS.map((slot) => (
                      <div
                        key={slot.idx}
                        className={cn(
                          "absolute w-full cursor-pointer hover:bg-[#B89968]/5 transition-colors",
                          slot.ehHoraCheia
                            ? "border-t border-[#e8dcc4]"
                            : "border-t border-[#e8dcc4]/40 border-dashed"
                        )}
                        style={{
                          top: `${slot.idx * ALTURA_SLOT}px`,
                          height: `${ALTURA_SLOT}px`,
                        }}
                        onClick={() =>
                          abrirNovoAgendamento(prof.id, slot.hora * 60 + slot.minuto)
                        }
                      />
                    ))}

                    {/* Blocos de agendamento */}
                    {agsDaProf.map((ag) => {
                      const { top, height } = posicaoBloco(ag.inicio, ag.fim);
                      const ehBloqueio = !ag.cliente;
                      const cor = ehBloqueio ? "transparent" : (ag.corCustom || ag.status?.cor || ag.profissional.cor);
                      const corTexto = ehBloqueio ? "#9ca3af" : "#fff";
                      const estiloBloqueio = ehBloqueio ? {
                        background: "repeating-linear-gradient(-45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)",
                        border: "1px solid #d1d5db",
                      } : {};
                      const nomeServico = ag.itens[0]?.servico.nome ?? (ag.motivoBloqueio || "Bloqueio");
                      const temTelefone = !!ag.cliente?.telefone1;

                      function gerarLinkWA() {
                        if (!ag.cliente?.telefone1) return "#";
                        const d = new Date(ag.inicio);
                        const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "long" });
                        const diaSemanaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                        const dataCurta = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
                        const hora = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
                        const primeiroNome = ag.cliente.nome.split(" ")[0];
                        const msg = templateWpp
                          .replace(/\{primeiro_nome\}/g, primeiroNome)
                          .replace(/\{dia_semana\}/g, diaSemanaFormatado)
                          .replace(/\{data_curta\}/g, dataCurta)
                          .replace(/\{hora\}/g, hora);
                        const numero = ag.cliente.telefone1.replace(/\D/g,"");
                        const comDDI = numero.startsWith("55") ? numero : `55${numero}`;
                        const texto = encodeURIComponent(msg);
                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                        return isMobile
                          ? `whatsapp://send?phone=${comDDI}&text=${texto}`
                          : `https://web.whatsapp.com/send?phone=${comDDI}&text=${texto}`;
                      }

                      return (
                        <div
                          key={ag.id}
                          className="absolute left-0.5 right-0.5 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:brightness-95 transition-all z-10"
                          style={{ top, height, minHeight: "28px" }}
                          onClick={(e) => { e.stopPropagation(); abrirEdicao(ag.id); }}
                        >
                          <div
                            className="h-full px-2 py-1.5 flex flex-col gap-0.5 relative"
                            style={{ backgroundColor: cor, color: corTexto, ...estiloBloqueio }}
                          >
                            {/* Linha 1: horário + status */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] opacity-90 font-semibold whitespace-nowrap">
                                {formatarHora(ag.inicio)}–{formatarHora(ag.fim)}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {ag.status && (
                                  <span className="text-[10px] bg-black/20 px-1 rounded whitespace-nowrap leading-tight">
                                    ♦ {ag.status.nome}
                                  </span>
                                )}
                                {ag.confirmacaoManualPendente && (
                                  <AlertCircle size={10} className="text-yellow-200 flex-shrink-0" />
                                )}
                                {/* Botão WhatsApp */}
                                {!ehBloqueio && temTelefone && (
                                  <a
                                    href={gerarLinkWA()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                                    title={`WhatsApp: ${ag.cliente?.nome}`}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.123 1.523 5.855L0 24l6.335-1.506A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.504-5.17-1.385l-.37-.217-3.763.895.946-3.661-.24-.383A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Linha 2: nome da cliente */}
                            <span className="text-[13px] font-bold truncate leading-tight">
                              {ehBloqueio ? (ag.motivoBloqueio || "Bloqueio") : ag.cliente?.nome}
                            </span>

                            {/* Linha 3: serviço */}
                            {!ehBloqueio && (
                              <span className="text-[11px] opacity-90 truncate leading-tight">
                                {nomeServico}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Linha do horário atual */}
                    {ehHoje && (() => {
                      const agora = new Date();
                      const min = (agora.getHours() - horaInicio) * 60 + agora.getMinutes();
                      if (min < 0 || min > TOTAL_SLOTS * 30) return null;
                      const pct = (min / (TOTAL_SLOTS * 30)) * 100;
                      return (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none"
                          style={{ top: `${pct}%` }}
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 -mt-1 absolute" />
                          <div className="border-t-2 border-red-500 w-full" />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>{/* fecha wrapper minWidth */}
      </div>

      {/* ── Controles mobile (calendário + Hoje) ao lado do hambúrguer ── */}
      <div className="fixed top-4 right-3 z-50 lg:hidden flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setCalAberto(!calAberto)}
            className={cn(
              "p-2 rounded-md shadow-md transition-colors",
              calAberto
                ? "bg-[#B89968] text-white"
                : "bg-[#1a1208] text-[#B89968]"
            )}
          >
            <CalendarDays size={18} />
          </button>
          {calAberto && (
            <CalendarioPopup
              dataAtual={dataAtual}
              onSelecionar={(d) => { setDataAtual(d); salvarDataLocal(d); }}
              onFechar={() => setCalAberto(false)}
            />
          )}
        </div>
        <button
          onClick={() => { setDataAtual(hoje); salvarDataLocal(hoje); }}
          className={cn(
            "px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-md transition-colors",
            ehHoje
              ? "bg-[#B89968] text-white"
              : "bg-[#1a1208] text-[#B89968]"
          )}
        >
          Hoje
        </button>
      </div>

      {/* ── Botão flutuante ── */}
      <button
        onClick={abrirNovo}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#B89968] hover:bg-[#9a7d50] text-white shadow-xl flex items-center justify-center z-30 transition-colors"
        title="Novo agendamento"
      >
        <Plus size={24} />
      </button>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <ModalAgendamento
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={carregarAgendamentos}
        dataInicial={modalDataInicial}
        horaInicial={modalHoraInicial}
        profissionalInicial={modalProfissionalId}
        agendamentoId={modalAgendamentoId}
      />
    </div>
  );
}
