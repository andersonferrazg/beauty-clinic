"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, User, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DisponibilidadeDia = { ativo: boolean; horaInicio: number; horaFim: number; ativo2: boolean; horaInicio2: number; horaFim2: number };
type DisponibilidadeDataItem = { id: string; data: string; tipo: "DISPONIVEL" | "BLOQUEADO"; horaInicio?: number | null; horaFim?: number | null; horaInicio2?: number | null; horaFim2?: number | null };

const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DISP_PADRAO: DisponibilidadeDia[] = Array.from({ length: 7 }, () => ({
  ativo: false,
  horaInicio: 9,
  horaFim: 13,
  ativo2: false,
  horaInicio2: 14,
  horaFim2: 18,
}));

function formatarDataBR(isoStr: string) {
  const d = new Date(isoStr);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function HoraSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1 text-[#5a4530] bg-white"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
      ))}
    </select>
  );
}

export default function MinhaContaPage() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [ehProfissional, setEhProfissional] = useState(false);

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#B89968");
  const [agendOnlineAtivo, setAgendOnlineAtivo] = useState(false);
  const [emailNotif, setEmailNotif] = useState("");
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia[]>(DISP_PADRAO);

  const [datasEspecificas, setDatasEspecificas] = useState<DisponibilidadeDataItem[]>([]);
  const [novaDataForm, setNovaDataForm] = useState({
    data: "",
    tipo: "BLOQUEADO" as "DISPONIVEL" | "BLOQUEADO",
    horaInicio: 9,
    horaFim: 18,
    ativo2: false,
    horaInicio2: 14,
    horaFim2: 18,
  });
  const [salvandoData, setSalvandoData] = useState(false);

  useEffect(() => {
    fetch("/api/me/profissional")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setEhProfissional(true);
        setNome(d.nome ?? "");
        setCor(d.cor ?? "#B89968");
        setAgendOnlineAtivo(d.agendamentoOnlineAtivo ?? false);
        setEmailNotif(d.emailNotificacoes ?? "");

        const dispCarregada = DISP_PADRAO.map((def, i) => {
          const encontrado = (d.disponibilidades ?? []).find(
            (x: { diaSemana: number; horaInicio: number; horaFim: number; horaInicio2?: number | null; horaFim2?: number | null }) => x.diaSemana === i
          );
          if (encontrado) return {
            ativo: true,
            horaInicio: encontrado.horaInicio,
            horaFim: encontrado.horaFim,
            ativo2: encontrado.horaInicio2 != null,
            horaInicio2: encontrado.horaInicio2 ?? 14,
            horaFim2: encontrado.horaFim2 ?? 18,
          };
          return { ...def };
        });
        setDisponibilidade(dispCarregada);
      })
      .finally(() => setCarregando(false));

    fetch("/api/me/profissional/datas")
      .then((r) => r.ok ? r.json() : [])
      .then((d: DisponibilidadeDataItem[]) => setDatasEspecificas(d));
  }, []);

  async function salvar() {
    setSalvando(true);
    await fetch("/api/me/profissional", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agendamentoOnlineAtivo: agendOnlineAtivo,
        emailNotificacoes: emailNotif || null,
        disponibilidades: disponibilidade
          .map((d, i) => d.ativo ? {
            diaSemana: i,
            horaInicio: d.horaInicio,
            horaFim: d.horaFim,
            horaInicio2: d.ativo2 ? d.horaInicio2 : null,
            horaFim2: d.ativo2 ? d.horaFim2 : null,
          } : null)
          .filter(Boolean),
      }),
    });
    setSalvando(false);
    setSalvoOk(true);
    setTimeout(() => setSalvoOk(false), 2500);
  }

  async function adicionarData() {
    if (!novaDataForm.data) return;
    setSalvandoData(true);
    const res = await fetch("/api/me/profissional/datas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: novaDataForm.data,
        tipo: novaDataForm.tipo,
        horaInicio: novaDataForm.tipo === "DISPONIVEL" ? novaDataForm.horaInicio : undefined,
        horaFim: novaDataForm.tipo === "DISPONIVEL" ? novaDataForm.horaFim : undefined,
        horaInicio2: novaDataForm.tipo === "DISPONIVEL" && novaDataForm.ativo2 ? novaDataForm.horaInicio2 : undefined,
        horaFim2: novaDataForm.tipo === "DISPONIVEL" && novaDataForm.ativo2 ? novaDataForm.horaFim2 : undefined,
      }),
    });
    if (res.ok) {
      const novo: DisponibilidadeDataItem = await res.json();
      setDatasEspecificas((prev) => {
        const sem = prev.filter((d) => d.id !== novo.id);
        return [...sem, novo].sort((a, b) => a.data.localeCompare(b.data));
      });
      setNovaDataForm({ data: "", tipo: "BLOQUEADO", horaInicio: 9, horaFim: 18, ativo2: false, horaInicio2: 14, horaFim2: 18 });
    }
    setSalvandoData(false);
  }

  async function removerData(id: string) {
    await fetch(`/api/me/profissional/datas/${id}`, { method: "DELETE" });
    setDatasEspecificas((prev) => prev.filter((d) => d.id !== id));
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={24} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: cor }}>
          {nome ? nome[0].toUpperCase() : <User size={18} />}
        </div>
        <div>
          <h1 className="text-xl font-serif font-semibold text-[#5a4530]">Minha Conta</h1>
          <p className="text-sm text-[#9a7d50]">{nome || "Profissional"}</p>
        </div>
      </div>

      {!ehProfissional ? (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-6 text-center">
          <p className="text-sm text-[#9a7d50]">Esta página é exclusiva para profissionais com agenda.</p>
          <p className="text-xs text-[#9a7d50] mt-1">Administradores gerenciam as configurações em cada perfil de profissional.</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Agendamento Online */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#5a4530]">Agendamento Online</p>
              <p className="text-xs text-[#9a7d50] mt-0.5">Quando ativo, clientes podem marcar horário com você pelo link público da clínica</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[#5a4530]">Aceitar agendamentos online</span>
              <button
                type="button"
                onClick={() => setAgendOnlineAtivo((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${agendOnlineAtivo ? "bg-[#B89968]" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agendOnlineAtivo ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {agendOnlineAtivo && (
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">
                  E-mail para receber notificações de novos agendamentos (opcional)
                </Label>
                <Input
                  type="email"
                  value={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.value)}
                  placeholder="seu@email.com"
                  className="border-[#B89968]/30"
                />
                <p className="text-xs text-[#9a7d50] mt-1">Quando uma cliente marcar horário com você, este e-mail recebe o aviso.</p>
              </div>
            )}
          </div>

          {/* Disponibilidade Semanal */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#5a4530]">Disponibilidade Semanal</p>
              <p className="text-xs text-[#9a7d50] mt-0.5">Dias e horários que você atende toda semana. Use "+" para adicionar 2º período (ex: manhã e tarde).</p>
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
                        <HoraSelect
                          value={disponibilidade[i].horaInicio}
                          onChange={(v) => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], horaInicio: v }; return next; })}
                        />
                        <span className="text-xs text-[#9a7d50]">–</span>
                        <HoraSelect
                          value={disponibilidade[i].horaFim}
                          onChange={(v) => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], horaFim: v }; return next; })}
                        />
                        {!disponibilidade[i].ativo2 && (
                          <button
                            type="button"
                            onClick={() => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], ativo2: true }; return next; })}
                            className="text-xs text-[#B89968] hover:text-[#9a7d50] font-bold px-1 leading-none"
                            title="Adicionar 2º período"
                          >+</button>
                        )}
                      </>
                    )}
                  </div>
                  {disponibilidade[i].ativo && disponibilidade[i].ativo2 && (
                    <div className="flex items-center gap-2 pl-12">
                      <HoraSelect
                        value={disponibilidade[i].horaInicio2}
                        onChange={(v) => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], horaInicio2: v }; return next; })}
                      />
                      <span className="text-xs text-[#9a7d50]">–</span>
                      <HoraSelect
                        value={disponibilidade[i].horaFim2}
                        onChange={(v) => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], horaFim2: v }; return next; })}
                      />
                      <button
                        type="button"
                        onClick={() => setDisponibilidade((prev) => { const next = [...prev]; next[i] = { ...next[i], ativo2: false }; return next; })}
                        className="text-xs text-[#9a7d50] hover:text-red-400 px-1 leading-none"
                        title="Remover 2º período"
                      >×</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Datas Específicas */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#5a4530]">Datas Específicas</p>
              <p className="text-xs text-[#9a7d50] mt-0.5">Bloqueie um dia de folga ou configure horário especial para uma data específica. Tem prioridade sobre a disponibilidade semanal.</p>
            </div>

            {/* Formulário */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={novaDataForm.data}
                  onChange={(e) => setNovaDataForm((p) => ({ ...p, data: e.target.value }))}
                  className="text-xs border border-[#e8dcc4] rounded px-2 py-1.5 text-[#5a4530] bg-white flex-shrink-0"
                />
                <select
                  value={novaDataForm.tipo}
                  onChange={(e) => setNovaDataForm((p) => ({ ...p, tipo: e.target.value as "DISPONIVEL" | "BLOQUEADO" }))}
                  className="text-xs border border-[#e8dcc4] rounded px-1.5 py-1.5 text-[#5a4530] bg-white"
                >
                  <option value="BLOQUEADO">Bloqueado (folga)</option>
                  <option value="DISPONIVEL">Disponível (horário especial)</option>
                </select>
              </div>

              {novaDataForm.tipo === "DISPONIVEL" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HoraSelect value={novaDataForm.horaInicio} onChange={(v) => setNovaDataForm((p) => ({ ...p, horaInicio: v }))} />
                    <span className="text-xs text-[#9a7d50]">–</span>
                    <HoraSelect value={novaDataForm.horaFim} onChange={(v) => setNovaDataForm((p) => ({ ...p, horaFim: v }))} />
                    {!novaDataForm.ativo2 && (
                      <button
                        type="button"
                        onClick={() => setNovaDataForm((p) => ({ ...p, ativo2: true }))}
                        className="text-xs text-[#B89968] hover:text-[#9a7d50] font-bold px-1 leading-none"
                        title="Adicionar 2º período"
                      >+</button>
                    )}
                  </div>
                  {novaDataForm.ativo2 && (
                    <div className="flex items-center gap-2">
                      <HoraSelect value={novaDataForm.horaInicio2} onChange={(v) => setNovaDataForm((p) => ({ ...p, horaInicio2: v }))} />
                      <span className="text-xs text-[#9a7d50]">–</span>
                      <HoraSelect value={novaDataForm.horaFim2} onChange={(v) => setNovaDataForm((p) => ({ ...p, horaFim2: v }))} />
                      <button
                        type="button"
                        onClick={() => setNovaDataForm((p) => ({ ...p, ativo2: false }))}
                        className="text-xs text-[#9a7d50] hover:text-red-400 px-1 leading-none"
                        title="Remover 2º período"
                      >×</button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={adicionarData}
                disabled={!novaDataForm.data || salvandoData}
                className="flex items-center gap-1 text-xs bg-[#B89968] hover:bg-[#9a7d50] text-white px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
              >
                {salvandoData ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Adicionar data
              </button>
            </div>

            {/* Lista de datas */}
            {datasEspecificas.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-[#e8dcc4]">
                {datasEspecificas.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#faf5ee] border border-[#e8dcc4]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[#5a4530]">{formatarDataBR(d.data)}</span>
                      {d.tipo === "BLOQUEADO" ? (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Bloqueado</span>
                      ) : (
                        <span className="text-[10px] text-[#9a7d50]">
                          {d.horaInicio != null && d.horaFim != null
                            ? `${String(d.horaInicio).padStart(2, "0")}:00–${String(d.horaFim).padStart(2, "0")}:00`
                            : "Disponível"}
                          {d.horaInicio2 != null && d.horaFim2 != null
                            ? ` / ${String(d.horaInicio2).padStart(2, "0")}:00–${String(d.horaFim2).padStart(2, "0")}:00`
                            : ""}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removerData(d.id)}
                      className="text-[#9a7d50] hover:text-red-500 p-1 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botão salvar */}
          <div className="flex justify-end">
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : salvoOk ? (
                <Check size={14} className="mr-1" />
              ) : null}
              {salvoOk ? "Salvo!" : "Salvar disponibilidade"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
