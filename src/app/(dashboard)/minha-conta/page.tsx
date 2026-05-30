"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DisponibilidadeDia = { ativo: boolean; horaInicio: number; horaFim: number };

const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DISP_PADRAO: DisponibilidadeDia[] = Array.from({ length: 7 }, () => ({
  ativo: false,
  horaInicio: 9,
  horaFim: 18,
}));

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
            (x: { diaSemana: number; horaInicio: number; horaFim: number }) => x.diaSemana === i
          );
          if (encontrado) return { ativo: true, horaInicio: encontrado.horaInicio, horaFim: encontrado.horaFim };
          return { ...def };
        });
        setDisponibilidade(dispCarregada);
      })
      .finally(() => setCarregando(false));
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
          .map((d, i) => d.ativo ? { diaSemana: i, horaInicio: d.horaInicio, horaFim: d.horaFim } : null)
          .filter(Boolean),
      }),
    });
    setSalvando(false);
    setSalvoOk(true);
    setTimeout(() => setSalvoOk(false), 2500);
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

          {/* Disponibilidade */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#5a4530]">Disponibilidade para Agendamento Online</p>
              <p className="text-xs text-[#9a7d50] mt-0.5">Marque os dias e horários que você atende. Pode alterar quando quiser.</p>
            </div>
            <div className="space-y-2">
              {DISP_PADRAO.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
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
                      <span className="text-xs text-[#9a7d50]">até</span>
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
                    </>
                  )}
                </div>
              ))}
            </div>
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
              {salvoOk ? "Salvo!" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
