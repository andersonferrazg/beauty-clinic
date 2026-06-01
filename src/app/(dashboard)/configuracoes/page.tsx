"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Palette, Building2, Calendar, Download, Database, Users, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusAgenda = { id: string; nome: string; cor: string; ordem: number; contaConfirmado: boolean };

const TEMPLATE_PADRAO = `Oii {primeiro_nome} 💖

Passando para confirmar nosso horário amanhã ({dia_semana}) {data_curta} ás {hora}h

Por gentileza, confirme o recebimento desta mensagem. Caso não haja resposta, o seu horário será automaticamente cancelado.
Tolerância de atraso é de 10 minutos.

Agradeço a compreensão 🥰`;

const TEMPLATE_ANIVERSARIO_PADRAO = `Olá, {primeiro_nome}! 🎂 Feliz Aniversário! Toda a equipe da {tenant_nome} deseja um dia maravilhoso para você! ✨`;

type Config = {
  tenant: { id: string; nome: string; slug: string; cnpj: string | null; telefone: string | null; endereco: string | null; corPrimaria: string } | null;
  config: { intervaloAgendaMin: number; horarioEnvioWpp: string; mensagemConfirmacaoWpp: string | null; mensagemAniversarioWpp: string | null; urlNFSe: string | null; horaInicioAgenda: number; horaFimAgenda: number; agendamentoOnlineAtivo: boolean; emailNotificacoes: string | null } | null;
  status: StatusAgenda[];
};

const INTERVALOS = [15, 30, 60];

export default function ConfiguracoesPage() {
  const [dados, setDados] = useState<Config | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [secao, setSecao] = useState<"clinica" | "agenda" | "status" | "backup">("clinica");
  const [baixandoBackup, setBaixandoBackup] = useState(false);

  // Campos da clínica
  const [nomeCli, setNomeCli] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");

  // Campos NF
  const [urlNFSe, setUrlNFSe] = useState("");

  // Campos de agenda
  const [intervalo, setIntervalo] = useState(30);
  const [horarioWpp, setHorarioWpp] = useState("08:00");
  const [mensagemWpp, setMensagemWpp] = useState(TEMPLATE_PADRAO);
  const [mensagemAniv, setMensagemAniv] = useState(TEMPLATE_ANIVERSARIO_PADRAO);
  const [horaInicio, setHoraInicio] = useState(6);
  const [horaFim, setHoraFim] = useState(21);
  const [agendOnlineAtivo, setAgendOnlineAtivo] = useState(false);
  const [emailNotif, setEmailNotif] = useState("");
  const [slugTenant, setSlugTenant] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d: Config) => {
        setDados(d);
        if (d.tenant) {
          setSlugTenant(d.tenant.slug ?? "");
          setNomeCli(d.tenant.nome);
          setCnpj(d.tenant.cnpj ?? "");
          setTelefone(d.tenant.telefone ?? "");
          setEndereco(d.tenant.endereco ?? "");
        }
        if (d.config) {
          setIntervalo(d.config.intervaloAgendaMin);
          setHorarioWpp(d.config.horarioEnvioWpp);
          setMensagemWpp(d.config.mensagemConfirmacaoWpp ?? TEMPLATE_PADRAO);
          setMensagemAniv(d.config.mensagemAniversarioWpp ?? TEMPLATE_ANIVERSARIO_PADRAO);
          setUrlNFSe(d.config.urlNFSe ?? "");
          setHoraInicio(d.config.horaInicioAgenda ?? 6);
          setHoraFim(d.config.horaFimAgenda ?? 21);
          setAgendOnlineAtivo(d.config.agendamentoOnlineAtivo ?? false);
          setEmailNotif(d.config.emailNotificacoes ?? "");
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (!agendOnlineAtivo || !slugTenant) { setQrDataUrl(""); return; }
    const url = `${window.location.origin}/agendar/${slugTenant}`;
    QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: "#5a4530", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [agendOnlineAtivo, slugTenant]);

  async function salvar() {
    setSalvando(true);
    await fetch("/api/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant: { nome: nomeCli, cnpj, telefone, endereco },
        config: { intervaloAgendaMin: intervalo, horarioEnvioWpp: horarioWpp, mensagemConfirmacaoWpp: mensagemWpp, mensagemAniversarioWpp: mensagemAniv, urlNFSe, horaInicioAgenda: horaInicio, horaFimAgenda: horaFim, agendamentoOnlineAtivo: agendOnlineAtivo, emailNotificacoes: emailNotif || null },
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
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Configurações</h1>
        <p className="text-sm text-[#9a7d50] mt-1">Gerencie as configurações da clínica</p>
      </div>

      {/* Navegação por seções */}
      <div className="flex gap-2 mb-6 border-b border-[#e8dcc4] pb-0">
        {([
          { id: "clinica", label: "Dados da Clínica", icon: Building2 },
          { id: "agenda", label: "Agenda & WhatsApp", icon: Calendar },
          { id: "status", label: "Status de Agenda", icon: Palette },
          { id: "backup", label: "Backup", icon: Database },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSecao(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              secao === id
                ? "border-[#B89968] text-[#B89968]"
                : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Seção: Dados da Clínica */}
      {secao === "clinica" && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 space-y-4 shadow-sm">
          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Nome da Clínica</Label>
            <Input value={nomeCli} onChange={(e) => setNomeCli(e.target.value)} placeholder="LB Beauty Clinic" className="border-[#B89968]/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">CNPJ</Label>
              <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="border-[#B89968]/30" />
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="border-[#B89968]/30" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Endereço</Label>
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" className="border-[#B89968]/30" />
          </div>
          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Link do sistema de Nota Fiscal (indicado pelo seu contador)</Label>
            <Input value={urlNFSe} onChange={(e) => setUrlNFSe(e.target.value)} placeholder="https://..." className="border-[#B89968]/30" />
            <p className="text-xs text-[#9a7d50] mt-1">Ex: Florianópolis usa <span className="font-mono">e-gov.betha.com.br/e-nota</span> — cole o link que seu contador indicar.</p>
          </div>
        </div>
      )}

      {/* Seção: Agenda & WhatsApp */}
      {secao === "agenda" && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 space-y-5 shadow-sm">

          {/* Agendamento Online */}
          <div className="border border-[#e8dcc4] rounded-xl p-4 space-y-3 bg-[#faf5ee]/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#5a4530]">Agendamento Online</p>
                <p className="text-xs text-[#9a7d50]">Permite que clientes marquem horário pelo link público</p>
              </div>
              <button
                type="button"
                onClick={() => setAgendOnlineAtivo((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${agendOnlineAtivo ? "bg-[#B89968]" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agendOnlineAtivo ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {agendOnlineAtivo && slugTenant && (
              <>
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Link público para as clientes</Label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/agendar/${slugTenant}`}
                      className="flex-1 border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-xs text-[#5a4530] bg-white select-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/agendar/${slugTenant}`)}
                      className="text-xs border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-[#9a7d50] hover:bg-[#faf5ee] whitespace-nowrap"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <img src={qrDataUrl} alt="QR Code para agendamento" className="w-40 h-40 rounded-lg border border-[#e8dcc4] shadow-sm" />
                    <p className="text-[11px] text-[#9a7d50] text-center">QR Code — imprima e cole na recepção para as clientes escanearem</p>
                    <a
                      href={qrDataUrl}
                      download="qrcode-agendamento.png"
                      className="text-xs text-[#B89968] hover:text-[#9a7d50] hover:underline transition-colors"
                    >
                      Baixar QR Code (PNG)
                    </a>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail para receber notificações de novos agendamentos (opcional)</Label>
                  <input
                    type="email"
                    value={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-2 block">Horário de funcionamento da agenda</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Início</Label>
                <select
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Fim</Label>
                <select
                  value={horaFim}
                  onChange={(e) => setHoraFim(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h + 1}>{String(h + 1).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-[#9a7d50] mt-1">Faixa de horário que aparece na grade da agenda.</p>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-2 block">Intervalo de horários na agenda</Label>
            <div className="flex gap-2">
              {INTERVALOS.map((min) => (
                <button
                  key={min}
                  onClick={() => setIntervalo(min)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    intervalo === min
                      ? "bg-[#B89968] text-white border-[#B89968]"
                      : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                  )}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Horário de envio das confirmações (WhatsApp)</Label>
            <Input
              type="time"
              value={horarioWpp}
              onChange={(e) => setHorarioWpp(e.target.value)}
              className="border-[#B89968]/30 w-32"
            />
            <p className="text-xs text-[#9a7d50] mt-1">Mensagens de confirmação serão enviadas neste horário, um dia antes do agendamento.</p>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Mensagem de confirmação (WhatsApp)</Label>
            <textarea
              value={mensagemWpp}
              onChange={(e) => setMensagemWpp(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none font-mono"
            />
            <div className="mt-1.5 text-xs text-[#9a7d50] space-y-0.5">
              <p className="font-medium text-[#9a7d50]">Variáveis disponíveis:</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{primeiro_nome}"}</span> — primeiro nome da cliente</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{dia_semana}"}</span> — ex: Terça-feira</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{data_curta}"}</span> — ex: 19/05</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{hora}"}</span> — ex: 15:30</p>
            </div>
            <button
              type="button"
              onClick={() => setMensagemWpp(TEMPLATE_PADRAO)}
              className="mt-2 text-xs text-[#B89968] hover:underline"
            >
              Restaurar mensagem padrão
            </button>
          </div>

          <div className="pt-2 border-t border-[#e8dcc4]">
            <Label className="text-xs text-[#9a7d50] mb-1 block">Mensagem de aniversário (WhatsApp)</Label>
            <textarea
              value={mensagemAniv}
              onChange={(e) => setMensagemAniv(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none font-mono"
            />
            <div className="mt-1.5 text-xs text-[#9a7d50] space-y-0.5">
              <p className="font-medium text-[#9a7d50]">Variáveis disponíveis:</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{primeiro_nome}"}</span> — primeiro nome da cliente</p>
              <p><span className="font-mono bg-[#faf5ee] px-1 rounded">{"{tenant_nome}"}</span> — nome da clínica</p>
            </div>
            <p className="mt-1.5 text-xs text-[#9a7d50]">Mensagem usada quando você clica no botão &quot;Parabenizar&quot; em <span className="font-medium">Aniversariantes</span>.</p>
            <button
              type="button"
              onClick={() => setMensagemAniv(TEMPLATE_ANIVERSARIO_PADRAO)}
              className="mt-2 text-xs text-[#B89968] hover:underline"
            >
              Restaurar mensagem padrão
            </button>
          </div>
        </div>
      )}

      {/* Seção: Status da Agenda */}
      {secao === "status" && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-[#faf5ee] border-b border-[#e8dcc4]">
            <p className="text-sm text-[#9a7d50]">Status cadastrados para a agenda da clínica</p>
          </div>
          {dados?.status.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#e8dcc4] last:border-b-0">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor }} />
              <span className="text-sm font-medium text-[#5a4530] flex-1">{s.nome}</span>
              {s.contaConfirmado && (
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">confirmado</span>
              )}
            </div>
          ))}
          <div className="px-4 py-3 text-xs text-[#9a7d50]">
            A customização avançada de status (criar, editar, reordenar) será disponibilizada em breve.
          </div>
        </div>
      )}

      {/* Seção: Backup */}
      {secao === "backup" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#5a4530] mb-1 flex items-center gap-2">
              <Database size={15} className="text-[#B89968]" />
              Backup Completo
            </h3>
            <p className="text-xs text-[#9a7d50] mb-4">
              Exporta todos os dados do sistema em formato JSON. Inclui clientes, agendamentos, lançamentos financeiros, comissões e produtos.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-[#9a7d50]">
              {[
                { icon: Users, label: "Clientes e dados pessoais" },
                { icon: Calendar, label: "Histórico de agendamentos" },
                { icon: Database, label: "Lançamentos financeiros" },
                { icon: ShoppingBag, label: "Comissões e pagamentos" },
                { icon: Package, label: "Produtos e estoque" },
                { icon: Building2, label: "Profissionais e serviços" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-[#B89968]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={async () => {
                setBaixandoBackup(true);
                try {
                  const r = await fetch("/api/backup");
                  if (!r.ok) throw new Error("Erro ao gerar backup");
                  const blob = await r.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  const dataHoje = new Date().toISOString().slice(0, 10);
                  a.download = `backup-beauty-clinic-${dataHoje}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert("Erro ao gerar backup. Tente novamente.");
                } finally {
                  setBaixandoBackup(false);
                }
              }}
              disabled={baixandoBackup}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {baixandoBackup ? (
                <><Loader2 size={15} className="animate-spin" /> Gerando backup...</>
              ) : (
                <><Download size={15} /> Baixar Backup Completo</>
              )}
            </button>
          </div>
          <p className="text-xs text-[#9a7d50] px-1">
            Recomendamos fazer backup semanalmente. Guarde o arquivo em um local seguro (Google Drive, OneDrive ou HD externo).
          </p>
        </div>
      )}

      {/* Botão salvar (exceto status e backup) */}
      {secao !== "status" && secao !== "backup" && (
        <div className="flex items-center justify-end gap-3 mt-5">
          {salvoOk && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={14} />
              Salvo com sucesso!
            </span>
          )}
          <Button
            onClick={salvar}
            disabled={salvando}
            className="bg-[#B89968] hover:bg-[#9a7d50] text-white"
          >
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Salvar Configurações
          </Button>
        </div>
      )}

    </div>
  );
}
