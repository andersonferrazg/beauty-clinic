"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Trash2, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalOrcamento } from "@/components/modal-orcamento";

type Agendamento = {
  id: string;
  inicio: string;
  valorTotal: number | null;
  status: { nome: string; cor: string } | null;
  profissional: { nome: string };
  itens: { servico: { nome: string } | null }[];
};

type OrcamentoRow = {
  id: string;
  status: string;
  valorTotal: number;
  dataValidade: string;
  criadoEm: string;
  agendamentoId: string | null;
};

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  clienteId?: string;
};

const STATUS_LABEL: Record<string, string> = {
  EM_ABERTO: "Em Aberto",
  APROVADO: "Aprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "EM_ABERTO": return "bg-amber-100 text-amber-800";
    case "APROVADO": return "bg-blue-100 text-blue-800";
    case "FECHADO": return "bg-emerald-100 text-emerald-800";
    case "CANCELADO": return "bg-red-100 text-red-800";
    case "EXPIRADO": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-700";
  }
}

function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CAMPOS_VAZIOS = {
  nome: "",
  telefone1: "",
  telefone2: "",
  email: "",
  cpf: "",
  rg: "",
  sexo: "",
  dataNascimento: "",
  endereco: "",
  observacao: "",
};

export function ModalCliente({ aberto, onFechar, onSalvo, clienteId }: Props) {
  const ehEdicao = !!clienteId;
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [historico, setHistorico] = useState<Agendamento[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([]);
  const [aba, setAba] = useState<"dados" | "historico" | "orcamentos">("dados");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

  // Modal de Orçamento
  const [modalOrcAberto, setModalOrcAberto] = useState(false);
  const [orcSelecionado, setOrcSelecionado] = useState<string | undefined>();

  function recarregarOrcamentos() {
    if (!clienteId) return;
    fetch(`/api/orcamentos?clienteId=${clienteId}`)
      .then((r) => r.json())
      .then((d) => setOrcamentos(Array.isArray(d) ? d : []))
      .catch(() => setOrcamentos([]));
  }

  useEffect(() => {
    if (!aberto) {
      setCampos(CAMPOS_VAZIOS);
      setHistorico([]);
      setOrcamentos([]);
      setAba("dados");
      setErro("");
      setConfirmarExclusao(false);
      return;
    }

    if (!clienteId) return;

    setCarregando(true);
    fetch(`/api/clientes/${clienteId}`)
      .then((r) => r.json())
      .then((c) => {
        setCampos({
          nome: c.nome ?? "",
          telefone1: c.telefone1 ?? "",
          telefone2: c.telefone2 ?? "",
          email: c.email ?? "",
          cpf: c.cpf ?? "",
          rg: c.rg ?? "",
          sexo: c.sexo ?? "",
          dataNascimento: c.dataNascimento
            ? new Date(c.dataNascimento).toISOString().slice(0, 10)
            : "",
          endereco: c.endereco ?? "",
          observacao: c.observacao ?? "",
        });
        setHistorico(c.agendamentos ?? []);
      })
      .finally(() => setCarregando(false));

    recarregarOrcamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, clienteId]);

  function set(campo: string, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  function mascaraCpf(v: string) {
    return v.replace(/\D/g, "").slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  async function salvar() {
    if (!campos.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true);
    setErro("");

    const payload = {
      nome: campos.nome.trim(),
      telefone1: campos.telefone1 || null,
      telefone2: campos.telefone2 || null,
      email: campos.email || null,
      cpf: campos.cpf || null,
      rg: campos.rg || null,
      sexo: campos.sexo || null,
      dataNascimento: campos.dataNascimento || null,
      endereco: campos.endereco || null,
      observacao: campos.observacao || null,
    };

    const url = ehEdicao ? `/api/clientes/${clienteId}` : "/api/clientes";
    const method = ehEdicao ? "PATCH" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);

    if (!r.ok) { setErro("Erro ao salvar."); return; }
    onSalvo();
    onFechar();
  }

  async function excluir() {
    if (!clienteId) return;
    setExcluindo(true);
    await fetch(`/api/clientes/${clienteId}`, { method: "DELETE" });
    setExcluindo(false);
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <div>
            <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
              {ehEdicao ? campos.nome || "Editar Cliente" : "Nova Cliente"}
            </h2>
            {ehEdicao && (
              <p className="text-xs text-[#9a7d50] mt-0.5">{historico.length} atendimento(s) no histórico</p>
            )}
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs (só no modo edição) */}
        {ehEdicao && (
          <div className="flex border-b border-[#e8dcc4] px-5">
            {(["dados", "historico", "orcamentos"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAba(t)}
                className={cn(
                  "py-2.5 px-1 mr-4 text-sm font-medium border-b-2 transition-colors",
                  aba === t
                    ? "border-[#B89968] text-[#B89968]"
                    : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
                )}
              >
                {t === "dados" ? "Dados" : t === "historico" ? "Histórico" : "Orçamentos"}
              </button>
            ))}
          </div>
        )}

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-5">
          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#B89968]" />
            </div>
          ) : aba === "dados" ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Nome *</Label>
                <Input
                  value={campos.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Nome completo"
                  className="border-[#B89968]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Telefone 1</Label>
                  <Input
                    value={campos.telefone1}
                    onChange={(e) => set("telefone1", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="border-[#B89968]/30"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Telefone 2</Label>
                  <Input
                    value={campos.telefone2}
                    onChange={(e) => set("telefone2", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail</Label>
                  <Input
                    type="email"
                    value={campos.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="border-[#B89968]/30"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">CPF</Label>
                  <Input
                    value={campos.cpf}
                    onChange={(e) => set("cpf", mascaraCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">RG</Label>
                  <Input
                    value={campos.rg}
                    onChange={(e) => set("rg", e.target.value)}
                    placeholder="00.000.000-0"
                    className="border-[#B89968]/30"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Sexo</Label>
                  <div className="flex gap-3 h-9 items-center">
                    {[
                      { v: "F", label: "Feminino" },
                      { v: "M", label: "Masculino" },
                    ].map((opt) => (
                      <label key={opt.v} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="sexo"
                          checked={campos.sexo === opt.v}
                          onChange={() => set("sexo", opt.v)}
                          className="accent-[#B89968]"
                        />
                        <span className="text-sm text-[#5a4530]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={campos.dataNascimento}
                    onChange={(e) => set("dataNascimento", e.target.value)}
                    className="border-[#B89968]/30"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Endereço</Label>
                  <Input
                    value={campos.endereco}
                    onChange={(e) => set("endereco", e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Observações</Label>
                <textarea
                  value={campos.observacao}
                  onChange={(e) => set("observacao", e.target.value)}
                  placeholder="Alergias, preferências, observações..."
                  rows={3}
                  className="w-full rounded-md border border-[#B89968]/30 px-3 py-2 text-sm text-[#5a4530] placeholder:text-[#9a7d50]/60 focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none"
                />
              </div>
            </div>
          ) : aba === "historico" ? (
            /* Histórico */
            <div className="space-y-2">
              {historico.length === 0 ? (
                <p className="text-sm text-[#9a7d50] text-center py-8">Nenhum atendimento registrado.</p>
              ) : (
                historico.map((ag) => {
                  const data = new Date(ag.inicio);
                  const nomeServico = ag.itens[0]?.servico?.nome ?? "—";
                  return (
                    <div key={ag.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#e8dcc4] hover:bg-[#faf5ee]">
                      <div className="flex-shrink-0 text-center">
                        <p className="text-xs text-[#9a7d50]">{data.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}</p>
                        <p className="text-lg font-bold text-[#5a4530] leading-none">{data.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5a4530] truncate">{nomeServico}</p>
                        <p className="text-xs text-[#9a7d50]">{ag.profissional.nome.split(" ")[0]}</p>
                      </div>
                      {ag.valorTotal != null && ag.valorTotal > 0 && (
                        <p className="text-sm font-semibold text-[#5a4530] flex-shrink-0">
                          {formatarBRL(ag.valorTotal)}
                        </p>
                      )}
                      {ag.status && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full text-white flex-shrink-0"
                          style={{ backgroundColor: ag.status.cor }}
                        >
                          {ag.status.nome}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Orçamentos */
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-[#9a7d50]">
                  {orcamentos.length} orçamento(s)
                </p>
                <button
                  onClick={() => {
                    setOrcSelecionado(undefined);
                    setModalOrcAberto(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#B89968] border border-[#B89968]/30 hover:bg-[#faf5ee]"
                >
                  <Plus size={12} /> Novo Orçamento
                </button>
              </div>
              {orcamentos.length === 0 ? (
                <div className="text-center py-8 text-[#9a7d50]">
                  <FileText size={24} className="mx-auto mb-2 text-[#B89968]/60" />
                  <p className="text-sm">Nenhum orçamento criado.</p>
                </div>
              ) : (
                orcamentos.map((o) => {
                  const data = new Date(o.criadoEm);
                  return (
                    <button
                      key={o.id}
                      onClick={() => {
                        setOrcSelecionado(o.id);
                        setModalOrcAberto(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#e8dcc4] hover:bg-[#faf5ee] transition-colors text-left"
                    >
                      <div className="flex-shrink-0 text-center w-10">
                        <p className="text-xs text-[#9a7d50]">{data.toLocaleDateString("pt-BR", { month: "short" }).toUpperCase()}</p>
                        <p className="text-lg font-bold text-[#5a4530] leading-none">{data.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#5a4530]">{formatarBRL(o.valorTotal)}</p>
                        {o.agendamentoId && (
                          <p className="text-xs text-emerald-700">Vinculado a agendamento</p>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                        statusBadgeClass(o.status)
                      )}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {aba === "dados" && (
          <div className="px-5 py-4 border-t border-[#e8dcc4] flex items-center gap-2">
            {ehEdicao && !confirmarExclusao && (
              <button
                onClick={() => setConfirmarExclusao(true)}
                className="text-red-400 hover:text-red-600 transition-colors mr-auto"
              >
                <Trash2 size={16} />
              </button>
            )}
            {confirmarExclusao && (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-xs text-red-600">Excluir cliente?</span>
                <button
                  onClick={excluir}
                  disabled={excluindo}
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  {excluindo ? "..." : "Sim"}
                </button>
                <button
                  onClick={() => setConfirmarExclusao(false)}
                  className="text-xs text-[#9a7d50] hover:underline"
                >
                  Não
                </button>
              </div>
            )}
            {erro && <p className="text-xs text-red-500 mr-auto">{erro}</p>}
            <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={salvar}
              disabled={salvando}
              className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {ehEdicao ? "Salvar" : "Criar Cliente"}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Orçamento (sub-modal) */}
      <ModalOrcamento
        aberto={modalOrcAberto}
        onFechar={() => setModalOrcAberto(false)}
        onSalvo={recarregarOrcamentos}
        orcamentoId={orcSelecionado}
        clienteFixo={clienteId && campos.nome ? { id: clienteId, nome: campos.nome } : null}
      />
    </div>
  );
}
