"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  profissionalId?: string;
};

const CORES = [
  "#B89968", "#9a7d50", "#c084fc", "#34d399", "#60a5fa",
  "#f87171", "#fb923c", "#facc15", "#a3e635", "#22d3ee",
];

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
};

export function ModalProfissional({ aberto, onFechar, onSalvo, profissionalId }: Props) {
  const ehEdicao = !!profissionalId;
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) {
      setCampos(CAMPOS_VAZIOS);
      setErro("");
      setConfirmarExclusao(false);
      return;
    }
    if (!profissionalId) return;

    setCarregando(true);
    fetch(`/api/profissionais/${profissionalId}`)
      .then((r) => r.json())
      .then((p) => {
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
        });
      })
      .finally(() => setCarregando(false));
  }, [aberto, profissionalId]);

  function set<K extends keyof typeof CAMPOS_VAZIOS>(campo: K, valor: typeof CAMPOS_VAZIOS[K]) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    if (!campos.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true);
    setErro("");

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
    };

    const url = ehEdicao ? `/api/profissionais/${profissionalId}` : "/api/profissionais";
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
    if (!profissionalId) return;
    await fetch(`/api/profissionais/${profissionalId}`, { method: "DELETE" });
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
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
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Telefone</Label>
                  <Input
                    value={campos.telefone}
                    onChange={(e) => set("telefone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="border-[#B89968]/30"
                  />
                </div>
              </div>

              {/* Tipo de comissão */}
              <div>
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
