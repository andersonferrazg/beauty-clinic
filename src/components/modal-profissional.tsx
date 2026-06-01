"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  profissionalId?: string;
};

type DisponibilidadeDia = { ativo: boolean; horaInicio: number; horaFim: number; ativo2: boolean; horaInicio2: number; horaFim2: number };
const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DISP_PADRAO: DisponibilidadeDia[] = Array.from({ length: 7 }, () => ({
  ativo: false,
  horaInicio: 9,
  horaFim: 13,
  ativo2: false,
  horaInicio2: 14,
  horaFim2: 18,
}));

const CORES = [
  "#B89968", "#9a7d50", "#c084fc", "#34d399", "#60a5fa",
  "#f87171", "#fb923c", "#facc15", "#a3e635", "#22d3ee",
];

type Permissoes = {
  isAdmin: boolean;
  verAgenda: boolean;
  realizarAgendamentos: boolean;
  verContatoCliente: boolean;
  verValoresServicos: boolean;
  acessarClientes: boolean;
  acessarServicos: boolean;
  acessarProdutos: boolean;
  acessarDespesas: boolean;
  acessarFinanceiro: boolean;
  verComissoesReceber: boolean;
  verPagamentosComissao: boolean;
  acessarProntuarios: boolean;
  acessarRelatorios: boolean;
};

const PERMISSOES_PADRAO: Permissoes = {
  isAdmin: false,
  verAgenda: true,
  realizarAgendamentos: true,
  verContatoCliente: true,
  verValoresServicos: true,
  acessarClientes: false,
  acessarServicos: false,
  acessarProdutos: false,
  acessarDespesas: false,
  acessarFinanceiro: false,
  verComissoesReceber: false,
  verPagamentosComissao: false,
  acessarProntuarios: false,
  acessarRelatorios: false,
};

const PERMISSOES_LABELS: { key: keyof Permissoes; label: string; grupo: string }[] = [
  { key: "isAdmin", label: "Administrador (acesso total)", grupo: "ESPECIAL" },
  { key: "verAgenda", label: "Ver agenda", grupo: "AGENDA" },
  { key: "realizarAgendamentos", label: "Realizar agendamentos", grupo: "AGENDA" },
  { key: "verContatoCliente", label: "Ver contato do cliente", grupo: "AGENDA" },
  { key: "verValoresServicos", label: "Ver valores dos serviços", grupo: "AGENDA" },
  { key: "acessarClientes", label: "Acessar Clientes", grupo: "MÓDULOS" },
  { key: "acessarServicos", label: "Acessar Serviços", grupo: "MÓDULOS" },
  { key: "acessarProdutos", label: "Acessar Produtos", grupo: "MÓDULOS" },
  { key: "acessarDespesas", label: "Acessar Despesas", grupo: "MÓDULOS" },
  { key: "acessarFinanceiro", label: "Acessar Financeiro", grupo: "MÓDULOS" },
  { key: "verComissoesReceber", label: "Ver Comissões a Receber", grupo: "MÓDULOS" },
  { key: "verPagamentosComissao", label: "Ver Pagamentos de Comissão", grupo: "MÓDULOS" },
  { key: "acessarProntuarios", label: "Acessar Prontuários", grupo: "MÓDULOS" },
  { key: "acessarRelatorios", label: "Acessar Relatórios", grupo: "MÓDULOS" },
];

function mascaraCpf(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraCnpj(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

const CAMPOS_VAZIOS = {
  nome: "",
  email: "",
  telefone: "",
  especialidade: "",
  registro: "",
  tipoComissao: "PERCENTUAL" as "PERCENTUAL" | "SALARIO_FIXO" | "INTEGRAL" | "SEM_COMISSAO",
  percentualComissao: "",
  salarioFixo: "",
  direcaoComissao: "CLINICA_PAGA" as "CLINICA_PAGA" | "COLABORADORA_PAGA",
  frequenciaComissao: "MENSAL" as "DIARIA" | "SEMANAL" | "QUINZENAL" | "MENSAL",
  cor: "#B89968",
  // Acesso ao Sistema
  naoTemLogin: false,
  loginEmail: "",
  senha: "",
  // Documento
  tipoDocumento: "CPF" as "CPF" | "CNPJ",
  cpf: "",
  cnpj: "",
  // Toggles
  naoPossuiAgenda: false,
  profissionalTerceiro: false,
  agendamentoOnlineAtivo: false,
  emailNotificacoes: "",
  comissaoSobre: "BRUTO" as "BRUTO" | "LIQUIDO",
};

export function ModalProfissional({ aberto, onFechar, onSalvo, profissionalId }: Props) {
  const ehEdicao = !!profissionalId;
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [permissoes, setPermissoes] = useState<Permissoes>(PERMISSOES_PADRAO);
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia[]>(DISP_PADRAO);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarAvancado, setMostrarAvancado] = useState(false);

  useEffect(() => {
    if (!aberto) {
      setCampos(CAMPOS_VAZIOS);
      setPermissoes(PERMISSOES_PADRAO);
      setDisponibilidade(DISP_PADRAO);
      setErro("");
      setConfirmarExclusao(false);
      setMostrarAvancado(false);
      return;
    }
    if (!profissionalId) return;

    setCarregando(true);
    fetch(`/api/profissionais/${profissionalId}`)
      .then((r) => r.json())
      .then((p) => {
        const temUsuario = !!p.usuario;
        const tipoDoc: "CPF" | "CNPJ" = p.cnpj ? "CNPJ" : "CPF";
        setCampos({
          nome: p.nome ?? "",
          email: p.email ?? "",
          telefone: p.telefone ?? "",
          especialidade: p.especialidade ?? "",
          registro: p.registro ?? "",
          tipoComissao: p.tipoComissao ?? "PERCENTUAL",
          percentualComissao: p.percentualComissao?.toString() ?? "",
          salarioFixo: p.salarioFixo?.toString() ?? "",
          direcaoComissao: p.direcaoComissao ?? "CLINICA_PAGA",
          frequenciaComissao: p.frequenciaComissao ?? "MENSAL",
          cor: p.cor ?? "#B89968",
          naoTemLogin: !temUsuario,
          loginEmail: p.usuario?.email ?? "",
          senha: "",
          tipoDocumento: tipoDoc,
          cpf: p.cpf ? mascaraCpf(p.cpf) : "",
          cnpj: p.cnpj ? mascaraCnpj(p.cnpj) : "",
          naoPossuiAgenda: p.possuiAgenda === false,
          profissionalTerceiro: !!p.profissionalTerceiro,
          agendamentoOnlineAtivo: !!p.agendamentoOnlineAtivo,
          emailNotificacoes: p.emailNotificacoes ?? "",
          comissaoSobre: (p.comissaoSobre as "BRUTO" | "LIQUIDO") ?? "BRUTO",
        });
        if (p.usuario?.permissoes) {
          const perm = p.usuario.permissoes;
          setPermissoes({
            isAdmin: !!perm.isAdmin,
            verAgenda: !!perm.verAgenda,
            realizarAgendamentos: !!perm.realizarAgendamentos,
            verContatoCliente: !!perm.verContatoCliente,
            verValoresServicos: !!perm.verValoresServicos,
            acessarClientes: !!perm.acessarClientes,
            acessarServicos: !!perm.acessarServicos,
            acessarProdutos: !!perm.acessarProdutos,
            acessarDespesas: !!perm.acessarDespesas,
            acessarFinanceiro: !!perm.acessarFinanceiro,
            verComissoesReceber: !!perm.verComissoesReceber,
            verPagamentosComissao: !!perm.verPagamentosComissao,
            acessarProntuarios: !!perm.acessarProntuarios,
            acessarRelatorios: !!perm.acessarRelatorios,
          });
        }
        if (p.profissionalTerceiro) setMostrarAvancado(true);
        const dispCarregada = DISP_PADRAO.map((d, i) => {
          const encontrado = (p.disponibilidades ?? []).find(
            (x: { diaSemana: number; horaInicio: number; horaFim: number; horaInicio2?: number | null; horaFim2?: number | null }) => x.diaSemana === i
          );
          if (encontrado) return { ativo: true, horaInicio: encontrado.horaInicio, horaFim: encontrado.horaFim, ativo2: encontrado.horaInicio2 != null, horaInicio2: encontrado.horaInicio2 ?? 14, horaFim2: encontrado.horaFim2 ?? 18 };
          return { ...d };
        });
        setDisponibilidade(dispCarregada);
      })
      .finally(() => setCarregando(false));
  }, [aberto, profissionalId]);

  function set<K extends keyof typeof CAMPOS_VAZIOS>(campo: K, valor: typeof CAMPOS_VAZIOS[K]) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  function togglePermissao(key: keyof Permissoes) {
    setPermissoes((prev) => {
      const proximo = { ...prev, [key]: !prev[key] };
      // Se ativou isAdmin, liga todos
      if (key === "isAdmin" && proximo.isAdmin) {
        for (const k of Object.keys(PERMISSOES_PADRAO) as (keyof Permissoes)[]) {
          proximo[k] = true;
        }
      }
      // Se desativou isAdmin, mantém o resto como está
      return proximo;
    });
  }

  const qtdPermissoes = (Object.values(permissoes) as boolean[]).filter(Boolean).length;

  async function salvar() {
    if (!campos.nome.trim()) { setErro("Nome é obrigatório."); return; }

    const criarLogin = !campos.naoTemLogin;

    if (criarLogin) {
      if (!campos.loginEmail.trim()) { setErro("E-mail de login é obrigatório."); return; }
      if (!ehEdicao && !campos.senha) { setErro("Senha temporária é obrigatória para criar o login."); return; }
      if (campos.senha && campos.senha.length < 4) { setErro("Senha deve ter ao menos 4 caracteres."); return; }
    }

    setSalvando(true);
    setErro("");

    const cpfNumeros = campos.cpf.replace(/\D/g, "");
    const cnpjNumeros = campos.cnpj.replace(/\D/g, "");

    const payload = {
      nome: campos.nome.trim(),
      email: campos.email || null,
      telefone: campos.telefone || null,
      especialidade: campos.especialidade || null,
      registro: campos.registro || null,
      tipoComissao: campos.tipoComissao,
      percentualComissao: campos.percentualComissao ? parseFloat(campos.percentualComissao) : null,
      salarioFixo: campos.salarioFixo ? parseFloat(campos.salarioFixo) : null,
      direcaoComissao: campos.direcaoComissao,
      frequenciaComissao: campos.frequenciaComissao,
      cor: campos.cor,
      cpf: campos.tipoDocumento === "CPF" && cpfNumeros ? cpfNumeros : null,
      cnpj: campos.tipoDocumento === "CNPJ" && cnpjNumeros ? cnpjNumeros : null,
      possuiAgenda: !campos.naoPossuiAgenda,
      profissionalTerceiro: campos.profissionalTerceiro,
      agendamentoOnlineAtivo: campos.agendamentoOnlineAtivo,
      emailNotificacoes: campos.emailNotificacoes || null,
      comissaoSobre: campos.comissaoSobre,
      criarLogin,
      loginEmail: criarLogin ? campos.loginEmail.trim() : null,
      senha: criarLogin && campos.senha ? campos.senha : null,
      permissoes: criarLogin ? permissoes : null,
      disponibilidades: disponibilidade
        .map((d, i) => d.ativo ? { diaSemana: i, horaInicio: d.horaInicio, horaFim: d.horaFim, horaInicio2: d.ativo2 ? d.horaInicio2 : null, horaFim2: d.ativo2 ? d.horaFim2 : null } : null)
        .filter(Boolean),
    };

    const url = ehEdicao ? `/api/profissionais/${profissionalId}` : "/api/profissionais";
    const method = ehEdicao ? "PATCH" : "POST";

    try {
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({ erro: "Erro ao salvar." }));
        setErro(data.erro || "Erro ao salvar.");
        setSalvando(false);
        return;
      }

      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!profissionalId) return;
    await fetch(`/api/profissionais/${profissionalId}`, { method: "DELETE" });
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
            {ehEdicao ? "Editar Profissional" : "Nova Profissional"}
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#B89968]" />
            </div>
          ) : (
            <>
              {/* Preview do avatar */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: campos.cor }}
                >
                  {campos.nome
                    ? campos.nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
                    : "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5a4530]">{campos.nome || "Nome da profissional"}</p>
                  <p className="text-xs text-[#9a7d50]">{campos.especialidade || "Especialidade"}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Nome completo *</Label>
                <Input
                  value={campos.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Nome da profissional"
                  className="border-[#B89968]/30"
                />
              </div>

              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Especialidade</Label>
                <Input
                  value={campos.especialidade}
                  onChange={(e) => set("especialidade", e.target.value)}
                  placeholder="Ex: Estética, Cílios, Unhas..."
                  className="border-[#B89968]/30"
                />
              </div>

              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Registro profissional (CRM, CRBM, CRF...)</Label>
                <Input
                  value={campos.registro}
                  onChange={(e) => set("registro", e.target.value)}
                  placeholder="Ex: CRBM1 65076"
                  className="border-[#B89968]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail (contato)</Label>
                  <Input
                    type="email"
                    value={campos.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-[#B89968]/30"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Telefone</Label>
                  <Input
                    value={campos.telefone}
                    onChange={(e) => set("telefone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>

              {/* ─── Acesso ao Sistema ─── */}
              <div className="border-t border-[#e8dcc4] pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="naoTemLogin"
                    checked={campos.naoTemLogin}
                    onChange={(e) => set("naoTemLogin", e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#B89968]"
                  />
                  <label htmlFor="naoTemLogin" className="text-xs text-[#5a4530] select-none cursor-pointer">
                    Não preciso de usuário/senha (não terá login)
                  </label>
                </div>

                {!campos.naoTemLogin && (
                  <>
                    <div>
                      <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail (que a Profissional usará para login)</Label>
                      <Input
                        type="email"
                        value={campos.loginEmail}
                        onChange={(e) => set("loginEmail", e.target.value)}
                        placeholder="login@exemplo.com"
                        className="border-[#B89968]/30"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-[#9a7d50] mb-1 block">
                        Senha temporária {ehEdicao ? "(deixe vazio para manter a atual)" : "(obrigatória para primeiro login)"}
                      </Label>
                      <Input
                        type="text"
                        value={campos.senha}
                        onChange={(e) => set("senha", e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="border-[#B89968]/30 font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-[#9a7d50] mb-1.5 block">
                        Permissões — o que esta usuária pode acessar
                        <span className="ml-2 text-[10px] text-[#B89968]">({qtdPermissoes} selecionadas)</span>
                      </Label>
                      <div className="border border-[#e8dcc4] rounded-lg p-3 max-h-56 overflow-y-auto space-y-2 bg-[#faf5ee]/30">
                        {(["ESPECIAL", "AGENDA", "MÓDULOS"] as const).map((grupo) => (
                          <div key={grupo}>
                            <p className="text-[10px] font-semibold text-[#9a7d50] uppercase tracking-wide mb-1">
                              {grupo}
                            </p>
                            <div className="space-y-1">
                              {PERMISSOES_LABELS.filter((p) => p.grupo === grupo).map((p) => (
                                <label
                                  key={p.key}
                                  className={cn(
                                    "flex items-center gap-2 text-xs text-[#5a4530] cursor-pointer hover:bg-white px-1 py-0.5 rounded",
                                    p.key !== "isAdmin" && permissoes.isAdmin && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={permissoes[p.key]}
                                    onChange={() => togglePermissao(p.key)}
                                    disabled={p.key !== "isAdmin" && permissoes.isAdmin}
                                    className="w-3.5 h-3.5 accent-[#B89968]"
                                  />
                                  <span>{p.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ─── Documento ─── */}
              <div className="border-t border-[#e8dcc4] pt-4 space-y-2">
                <Label className="text-xs text-[#9a7d50] mb-1 block">Documento</Label>
                <div className="flex gap-3 mb-2">
                  {(["CPF", "CNPJ"] as const).map((tipo) => (
                    <label key={tipo} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoDocumento"
                        checked={campos.tipoDocumento === tipo}
                        onChange={() => set("tipoDocumento", tipo)}
                        className="accent-[#B89968]"
                      />
                      <span className="text-xs text-[#5a4530]">{tipo}</span>
                    </label>
                  ))}
                </div>
                {campos.tipoDocumento === "CPF" ? (
                  <Input
                    value={campos.cpf}
                    onChange={(e) => set("cpf", mascaraCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="border-[#B89968]/30"
                  />
                ) : (
                  <Input
                    value={campos.cnpj}
                    onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    className="border-[#B89968]/30"
                  />
                )}
              </div>

              {/* ─── Disponibilidade para Agendamento Online ─── */}
              <div className="border-t border-[#e8dcc4] pt-4 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wide mb-0.5">
                    Dias disponíveis para agendamento online
                  </p>
                  <p className="text-[11px] text-[#9a7d50] mb-3">
                    Marque os dias que ela atende. Pode alterar quando quiser (ex: no fim do ano adicionar sábado e domingo).
                  </p>
                </div>
                <div className="space-y-2">
                  {DISP_PADRAO.map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDisponibilidade((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], ativo: !next[i].ativo };
                            return next;
                          })}
                          className={cn(
                            "w-10 text-xs font-semibold py-1 rounded border transition-colors flex-shrink-0",
                            disponibilidade[i].ativo
                              ? "bg-[#B89968] text-white border-[#B89968]"
                              : "bg-white text-[#9a7d50] border-[#e8dcc4]"
                          )}
                        >
                          {NOMES_DIAS[i]}
                        </button>
                        {disponibilidade[i].ativo && (
                          <>
                            <select
                              value={disponibilidade[i].horaInicio}
                              onChange={(e) => setDisponibilidade((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], horaInicio: Number(e.target.value) };
                                return next;
                              })}
                              className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1 text-[#5a4530] bg-white"
                            >
                              {Array.from({ length: 24 }, (_, h) => (
                                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                              ))}
                            </select>
                            <span className="text-xs text-[#9a7d50]">–</span>
                            <select
                              value={disponibilidade[i].horaFim}
                              onChange={(e) => setDisponibilidade((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], horaFim: Number(e.target.value) };
                                return next;
                              })}
                              className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1 text-[#5a4530] bg-white"
                            >
                              {Array.from({ length: 24 }, (_, h) => (
                                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                              ))}
                            </select>
                            {!disponibilidade[i].ativo2 && (
                              <button
                                type="button"
                                onClick={() => setDisponibilidade((prev) => {
                                  const next = [...prev];
                                  next[i] = { ...next[i], ativo2: true };
                                  return next;
                                })}
                                className="text-xs text-[#B89968] hover:text-[#9a7d50] font-bold px-1 leading-none"
                                title="Adicionar 2º período"
                              >+</button>
                            )}
                          </>
                        )}
                      </div>
                      {disponibilidade[i].ativo && disponibilidade[i].ativo2 && (
                        <div className="flex items-center gap-2 pl-12">
                          <select
                            value={disponibilidade[i].horaInicio2}
                            onChange={(e) => setDisponibilidade((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], horaInicio2: Number(e.target.value) };
                              return next;
                            })}
                            className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1 text-[#5a4530] bg-white"
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                            ))}
                          </select>
                          <span className="text-xs text-[#9a7d50]">–</span>
                          <select
                            value={disponibilidade[i].horaFim2}
                            onChange={(e) => setDisponibilidade((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], horaFim2: Number(e.target.value) };
                              return next;
                            })}
                            className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1 text-[#5a4530] bg-white"
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setDisponibilidade((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], ativo2: false };
                              return next;
                            })}
                            className="text-xs text-[#9a7d50] hover:text-red-400 px-1 leading-none"
                            title="Remover 2º período"
                          >×</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Agendamento Online (toggle + e-mail) ─── */}
              <div className="border-t border-[#e8dcc4] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Agendamento Online</p>
                    <p className="text-[11px] text-[#9a7d50] mt-0.5">Permite que clientes marquem horário com esta profissional</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("agendamentoOnlineAtivo", !campos.agendamentoOnlineAtivo)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${campos.agendamentoOnlineAtivo ? "bg-[#B89968]" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${campos.agendamentoOnlineAtivo ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {campos.agendamentoOnlineAtivo && (
                  <div>
                    <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail para notificações (opcional)</Label>
                    <Input
                      type="email"
                      value={campos.emailNotificacoes}
                      onChange={(e) => set("emailNotificacoes", e.target.value)}
                      placeholder="email@exemplo.com"
                      className="border-[#B89968]/30"
                    />
                    <p className="text-[11px] text-[#9a7d50] mt-0.5">Recebe aviso quando uma cliente marcar horário com ela</p>
                  </div>
                )}
              </div>

              {/* ─── Não Possui Agenda ─── */}
              <div className="border-t border-[#e8dcc4] pt-4">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="naoPossuiAgenda"
                    checked={campos.naoPossuiAgenda}
                    onChange={(e) => set("naoPossuiAgenda", e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#B89968]"
                  />
                  <label htmlFor="naoPossuiAgenda" className="text-xs text-[#5a4530] select-none cursor-pointer">
                    <span className="font-medium">Não Possui Agenda</span>
                    <p className="text-[11px] text-[#9a7d50] mt-0.5">
                      Marque para profissionais que não atendem (ex: recepção, administrativo). Não aparece como coluna na agenda.
                    </p>
                  </label>
                </div>
              </div>

              {/* Tipo de comissão */}
              <div className="border-t border-[#e8dcc4] pt-4">
                <Label className="text-xs text-[#9a7d50] mb-1.5 block">Modelo de remuneração</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "PERCENTUAL", label: "% Comissão" },
                    { value: "SALARIO_FIXO", label: "Salário Fixo" },
                    { value: "INTEGRAL", label: "Integral (100%)" },
                    { value: "SEM_COMISSAO", label: "Sem comissão" },
                  ] as const).map((op) => (
                    <button
                      key={op.value}
                      onClick={() => set("tipoComissao", op.value)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium border transition-colors",
                        campos.tipoComissao === op.value
                          ? "bg-[#B89968] text-white border-[#B89968]"
                          : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                      )}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {campos.tipoComissao === "PERCENTUAL" && (
                <>
                  {/* Direção da comissão */}
                  <div>
                    <Label className="text-xs text-[#9a7d50] mb-1.5 block">Quem paga a comissão?</Label>
                    <div className="flex gap-2">
                      {([
                        { value: "CLINICA_PAGA", label: "Clínica → Colaboradora", desc: "Clínica repassa % dos atendimentos" },
                        { value: "COLABORADORA_PAGA", label: "Colaboradora → Clínica", desc: "Colaboradora paga % para a clínica" },
                      ] as const).map((op) => (
                        <button
                          key={op.value}
                          onClick={() => set("direcaoComissao", op.value)}
                          className={cn(
                            "flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-colors text-center",
                            campos.direcaoComissao === op.value
                              ? "bg-[#5a4530] text-white border-[#5a4530]"
                              : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                          )}
                        >
                          <div>{op.label}</div>
                          <div className={cn("text-[10px] mt-0.5", campos.direcaoComissao === op.value ? "text-white/70" : "text-[#9a7d50]/70")}>{op.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#9a7d50] mb-1 block">Percentual (%)</Label>
                    <Input
                      type="number"
                      value={campos.percentualComissao}
                      onChange={(e) => set("percentualComissao", e.target.value)}
                      placeholder="Ex: 30"
                      min="0" max="100"
                      className="border-[#B89968]/30"
                    />
                  </div>
                </>
              )}

              {campos.tipoComissao === "INTEGRAL" && (
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1.5 block">Quem paga?</Label>
                  <div className="flex gap-2">
                    {([
                      { value: "CLINICA_PAGA", label: "Clínica → Colaboradora" },
                      { value: "COLABORADORA_PAGA", label: "Colaboradora → Clínica" },
                    ] as const).map((op) => (
                      <button
                        key={op.value}
                        onClick={() => set("direcaoComissao", op.value)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                          campos.direcaoComissao === op.value
                            ? "bg-[#5a4530] text-white border-[#5a4530]"
                            : "bg-white text-[#9a7d50] border-[#e8dcc4]"
                        )}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {campos.tipoComissao === "SALARIO_FIXO" && (
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Salário fixo (R$)</Label>
                  <Input
                    type="number"
                    value={campos.salarioFixo}
                    onChange={(e) => set("salarioFixo", e.target.value)}
                    placeholder="Ex: 2500.00"
                    className="border-[#B89968]/30"
                  />
                </div>
              )}

              {/* Frequência de acerto */}
              {campos.tipoComissao !== "SEM_COMISSAO" && (
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1.5 block">Frequência de acerto</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([
                      { value: "DIARIA",    label: "Diário" },
                      { value: "SEMANAL",   label: "Semanal" },
                      { value: "QUINZENAL", label: "15 dias" },
                      { value: "MENSAL",    label: "Mensal" },
                    ] as const).map((op) => (
                      <button
                        key={op.value}
                        onClick={() => set("frequenciaComissao", op.value)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-medium border transition-colors",
                          campos.frequenciaComissao === op.value
                            ? "bg-[#B89968] text-white border-[#B89968]"
                            : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                        )}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comissão sobre bruto ou líquido */}
              {campos.tipoComissao !== "SEM_COMISSAO" && (
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1.5 block">Comissão calculada sobre</Label>
                  <div className="flex gap-2">
                    {([
                      { value: "BRUTO",   label: "Valor bruto",   desc: "antes das taxas" },
                      { value: "LIQUIDO", label: "Valor líquido",  desc: "após descontar taxas" },
                    ] as const).map((op) => (
                      <button
                        key={op.value}
                        onClick={() => set("comissaoSobre", op.value)}
                        className={cn(
                          "flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-colors text-center",
                          campos.comissaoSobre === op.value
                            ? "bg-[#B89968] text-white border-[#B89968]"
                            : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                        )}
                      >
                        <div>{op.label}</div>
                        <div className={cn("text-[10px] mt-0.5", campos.comissaoSobre === op.value ? "text-white/70" : "text-[#9a7d50]/70")}>{op.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cor */}
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Cor na agenda</Label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => set("cor", cor)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform",
                        campos.cor === cor ? "border-[#5a4530] scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>

              {/* ─── Opções avançadas ─── */}
              <div className="border-t border-[#e8dcc4] pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarAvancado((v) => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#B89968] hover:text-[#9a7d50]"
                >
                  {mostrarAvancado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {mostrarAvancado ? "Esconder opções avançadas" : "Ver opções avançadas"}
                </button>

                {mostrarAvancado && (
                  <div className="mt-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="profissionalTerceiro"
                        checked={campos.profissionalTerceiro}
                        onChange={(e) => set("profissionalTerceiro", e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#B89968]"
                      />
                      <label htmlFor="profissionalTerceiro" className="text-xs text-[#5a4530] select-none cursor-pointer">
                        <span className="font-medium">Profissional terceiro</span>
                        <p className="text-[11px] text-[#9a7d50] mt-0.5">
                          As atividades do Profissional terceiro não são incluídas no financeiro da empresa. Perfeito para profissionais que apenas pagam aluguel do espaço.
                        </p>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex items-center gap-2">
          {ehEdicao && !confirmarExclusao && (
            <button onClick={() => setConfirmarExclusao(true)} className="text-red-400 hover:text-red-600 mr-auto">
              <Trash2 size={16} />
            </button>
          )}
          {confirmarExclusao && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-red-600">Excluir profissional?</span>
              <button onClick={excluir} className="text-xs text-red-600 font-semibold hover:underline">Sim</button>
              <button onClick={() => setConfirmarExclusao(false)} className="text-xs text-[#9a7d50] hover:underline">Não</button>
            </div>
          )}
          {erro && <p className="text-xs text-red-500 mr-auto">{erro}</p>}
          <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">Cancelar</Button>
          <Button size="sm" onClick={salvar} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {ehEdicao ? "Salvar" : "Criar Profissional"}
          </Button>
        </div>
      </div>
    </div>
  );
}
