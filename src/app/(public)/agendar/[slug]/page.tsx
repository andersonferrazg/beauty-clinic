"use client";

import { useEffect, useState, use } from "react";
import { ChevronLeft, Loader2, CheckCircle2, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type TenantInfo = { nome: string; logoUrl: string | null; corPrimaria: string; ativo: boolean };
type Servico = { id: string; nome: string; duracaoMin: number; preco: number; categoria: string | null };
type Profissional = { id: string; nome: string; especialidade: string | null; cor: string; disponibilidades: { diaSemana: number }[] };

type Passo = 1 | 2 | 3 | 4 | "sucesso";

function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mascaraTelefone(v: string) {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function mascaraCpf(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function CalendarioSimples({
  diasAtivos,
  selecionado,
  onSelecionar,
}: {
  diasAtivos: number[]; // 0=dom ... 6=sab
  selecionado: string | null;
  onSelecionar: (data: string) => void;
}) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [mesBase, setMesBase] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const primeiroDia = new Date(mesBase.getFullYear(), mesBase.getMonth(), 1);
  const ultimoDia = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const offsetInicio = primeiroDia.getDay(); // 0=dom

  const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const NOMES_MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const mesAnterior = () => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() - 1, 1));
  const proximoMes = () => setMesBase(new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1));

  const podeMesAnterior = mesBase > new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button onClick={mesAnterior} disabled={!podeMesAnterior} className="p-1 rounded disabled:opacity-30 hover:bg-gray-100">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-[#5a4530]">
          {NOMES_MESES[mesBase.getMonth()]} {mesBase.getFullYear()}
        </span>
        <button onClick={proximoMes} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={16} className="rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {NOMES_DIAS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offsetInicio }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: diasNoMes }).map((_, i) => {
          const dia = i + 1;
          const data = new Date(mesBase.getFullYear(), mesBase.getMonth(), dia);
          data.setHours(0, 0, 0, 0);
          const dataStr = `${mesBase.getFullYear()}-${String(mesBase.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const passado = data < hoje;
          const diaAtivo = diasAtivos.includes(data.getDay());
          const habilitado = !passado && diaAtivo;
          const isSelecionado = selecionado === dataStr;

          return (
            <button
              key={dia}
              onClick={() => habilitado && onSelecionar(dataStr)}
              disabled={!habilitado}
              className={cn(
                "aspect-square rounded-lg text-xs font-medium transition-colors",
                isSelecionado ? "bg-[#B89968] text-white" : "",
                habilitado && !isSelecionado ? "bg-[#faf5ee] text-[#5a4530] hover:bg-[#e8dcc4]" : "",
                !habilitado ? "text-gray-300 cursor-not-allowed" : ""
              )}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [info, setInfo] = useState<TenantInfo | null>(null);
  const [carregandoInfo, setCarregandoInfo] = useState(true);

  const [passo, setPasso] = useState<Passo>(1);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [carregandoSlots, setCarregandoSlots] = useState(false);

  const [servicoSel, setServicoSel] = useState<Servico | null>(null);
  const [profSel, setProfSel] = useState<Profissional | null>(null);
  const [dataSel, setDataSel] = useState<string | null>(null);
  const [horarioSel, setHorarioSel] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Carrega info da clínica
  useEffect(() => {
    fetch(`/api/publico/${slug}/info`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setCarregandoInfo(false));
  }, [slug]);

  // Carrega serviços ao entrar no passo 1
  useEffect(() => {
    if (passo !== 1) return;
    fetch(`/api/publico/${slug}/servicos`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setServicos(d) : setServicos([]))
      .catch(() => setServicos([]));
  }, [passo, slug]);

  // Carrega profissionais ao entrar no passo 2
  useEffect(() => {
    if (passo !== 2) return;
    fetch(`/api/publico/${slug}/profissionais`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setProfissionais(d) : setProfissionais([]))
      .catch(() => setProfissionais([]));
  }, [passo, slug]);

  // Carrega slots ao selecionar data
  useEffect(() => {
    if (!dataSel || !profSel || !servicoSel) return;
    setCarregandoSlots(true);
    setHorarioSel(null);
    fetch(`/api/publico/${slug}/horarios?profissionalId=${profSel.id}&data=${dataSel}&duracaoMin=${servicoSel.duracaoMin}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setCarregandoSlots(false));
  }, [dataSel, profSel, servicoSel, slug]);

  async function confirmar() {
    if (!nome.trim() || !telefone.trim()) { setErro("Nome e telefone são obrigatórios."); return; }
    if (!servicoSel || !profSel || !dataSel || !horarioSel) return;

    setEnviando(true);
    setErro("");

    const inicio = new Date(`${dataSel}T${horarioSel}:00`).toISOString();

    try {
      const r = await fetch(`/api/publico/${slug}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicoId: servicoSel.id,
          profissionalId: profSel.id,
          inicio,
          nome: nome.trim(),
          telefone: telefone.replace(/\D/g, ""),
          email: email.trim() || undefined,
          cpf: cpf.trim() || undefined,
          dataNascimento: dataNascimento || undefined,
          website: "", // honeypot
        }),
      });
      const data = await r.json();
      if (!r.ok) { setErro(data.erro || "Erro ao confirmar."); return; }
      setPasso("sucesso");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5ee]">
        <Loader2 size={28} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5ee] p-6">
        <p className="text-gray-500">Clínica não encontrada.</p>
      </div>
    );
  }

  if (!info.ativo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5ee] p-6">
        <div className="text-center max-w-sm">
          {info.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#B89968] flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">{info.nome.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-xl font-bold text-[#5a4530] mb-2">{info.nome}</h1>
          <p className="text-gray-500 text-sm">Agendamento online indisponível no momento.<br />Entre em contato pelo WhatsApp.</p>
        </div>
      </div>
    );
  }

  const corPrimaria = info.corPrimaria || "#B89968";

  return (
    <div className="min-h-screen bg-[#faf5ee] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        {info.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: corPrimaria }}>
            {info.nome.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[#5a4530]">{info.nome}</p>
          <p className="text-xs text-gray-400">Agendamento Online</p>
        </div>
      </div>

      {/* Indicador de passos */}
      {passo !== "sucesso" && (
        <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
          {([1, 2, 3, 4] as const).map((p) => (
            <div key={p} className={cn(
              "flex-1 h-1 rounded-full transition-colors",
              (passo as number) >= p ? "bg-[#B89968]" : "bg-gray-200"
            )} />
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 max-w-lg mx-auto w-full p-4">

        {/* Passo 1 — Serviço */}
        {passo === 1 && (
          <div>
            <h2 className="text-base font-semibold text-[#5a4530] mb-1">Qual serviço você deseja?</h2>
            <p className="text-xs text-gray-400 mb-4">Passo 1 de 4</p>
            {servicos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum serviço disponível no momento.</p>
            ) : (
              <div className="space-y-2">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setServicoSel(s); setPasso(2); }}
                    className="w-full bg-white border border-[#e8dcc4] rounded-xl p-4 text-left hover:border-[#B89968] hover:bg-[#faf5ee] transition-colors"
                  >
                    <p className="font-medium text-[#5a4530] text-sm">{s.nome}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {s.duracaoMin} min
                      </span>
                      {s.preco > 0 && (
                        <span className="text-xs text-[#B89968] font-medium">{formatarBRL(s.preco)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 2 — Profissional */}
        {passo === 2 && (
          <div>
            <button onClick={() => setPasso(1)} className="flex items-center gap-1 text-xs text-[#9a7d50] mb-3 hover:text-[#5a4530]">
              <ChevronLeft size={14} /> Voltar
            </button>
            <h2 className="text-base font-semibold text-[#5a4530] mb-1">Com quem você quer ser atendida?</h2>
            <p className="text-xs text-gray-400 mb-4">Passo 2 de 4 · {servicoSel?.nome}</p>
            {profissionais.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma profissional disponível.</p>
            ) : (
              <div className="space-y-2">
                {profissionais.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setProfSel(p); setDataSel(null); setHorarioSel(null); setPasso(3); }}
                    className="w-full bg-white border border-[#e8dcc4] rounded-xl p-4 text-left hover:border-[#B89968] hover:bg-[#faf5ee] transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: p.cor }}>
                      {p.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#5a4530] text-sm">{p.nome}</p>
                      {p.especialidade && <p className="text-xs text-gray-400">{p.especialidade}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 3 — Data e horário */}
        {passo === 3 && profSel && servicoSel && (
          <div>
            <button onClick={() => setPasso(2)} className="flex items-center gap-1 text-xs text-[#9a7d50] mb-3 hover:text-[#5a4530]">
              <ChevronLeft size={14} /> Voltar
            </button>
            <h2 className="text-base font-semibold text-[#5a4530] mb-1">Escolha o dia e horário</h2>
            <p className="text-xs text-gray-400 mb-4">Passo 3 de 4 · {profSel.nome}</p>

            <div className="bg-white border border-[#e8dcc4] rounded-xl p-4 mb-3">
              <CalendarioSimples
                diasAtivos={profSel.disponibilidades.map((d) => d.diaSemana)}
                selecionado={dataSel}
                onSelecionar={setDataSel}
              />
            </div>

            {dataSel && (
              <div className="bg-white border border-[#e8dcc4] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Clock size={12} /> Horários disponíveis
                </p>
                {carregandoSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-[#B89968]" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Nenhum horário disponível para este dia.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setHorarioSel(slot)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-medium border transition-colors",
                          horarioSel === slot
                            ? "border-[#B89968] bg-[#B89968] text-white"
                            : "border-[#e8dcc4] bg-white text-[#5a4530] hover:border-[#B89968]"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {horarioSel && dataSel && (
              <button
                onClick={() => setPasso(4)}
                className="w-full mt-4 py-3 rounded-xl text-white font-semibold text-sm"
                style={{ backgroundColor: corPrimaria }}
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {/* Passo 4 — Dados da cliente */}
        {passo === 4 && (
          <div>
            <button onClick={() => setPasso(3)} className="flex items-center gap-1 text-xs text-[#9a7d50] mb-3 hover:text-[#5a4530]">
              <ChevronLeft size={14} /> Voltar
            </button>
            <h2 className="text-base font-semibold text-[#5a4530] mb-1">Seus dados</h2>
            <p className="text-xs text-gray-400 mb-4">Passo 4 de 4</p>

            {/* Resumo */}
            <div className="bg-white border border-[#e8dcc4] rounded-xl p-3 mb-4 text-xs text-[#5a4530] space-y-1">
              <p className="flex items-center gap-2"><span className="text-gray-400">Serviço:</span> <span className="font-medium">{servicoSel?.nome}</span></p>
              <p className="flex items-center gap-2"><span className="text-gray-400">Com:</span> <span className="font-medium">{profSel?.nome}</span></p>
              <p className="flex items-center gap-2">
                <CalendarDays size={12} className="text-gray-400" />
                <span className="font-medium">
                  {dataSel && new Date(`${dataSel}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {horarioSel}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-[#e8dcc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B89968]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">WhatsApp / Telefone *</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full border border-[#e8dcc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B89968]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">E-mail (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-[#e8dcc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B89968]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">CPF (opcional — para nota fiscal)</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full border border-[#e8dcc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B89968]"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">Data de nascimento (opcional)</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full border border-[#e8dcc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B89968] text-[#5a4530]"
                />
              </div>
              {/* Honeypot — invisível */}
              <input type="text" name="website" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
            </div>

            {erro && <p className="text-xs text-red-500 mt-2">{erro}</p>}

            <button
              onClick={confirmar}
              disabled={enviando}
              className="w-full mt-5 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: corPrimaria, opacity: enviando ? 0.7 : 1 }}
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirmar Solicitação
            </button>
          </div>
        )}

        {/* Sucesso */}
        {passo === "sucesso" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <CheckCircle2 size={56} className="text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-[#5a4530] mb-2">Solicitação enviada!</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Em breve a clínica entrará em contato pelo WhatsApp para confirmar seu agendamento.
            </p>
            <div className="mt-6 bg-white border border-[#e8dcc4] rounded-xl p-4 text-xs text-[#5a4530] text-left w-full max-w-xs space-y-1">
              <p><span className="text-gray-400">Serviço:</span> <span className="font-medium">{servicoSel?.nome}</span></p>
              <p><span className="text-gray-400">Com:</span> <span className="font-medium">{profSel?.nome}</span></p>
              <p><span className="text-gray-400">Data:</span> <span className="font-medium">
                {dataSel && new Date(`${dataSel}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às {horarioSel}
              </span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
