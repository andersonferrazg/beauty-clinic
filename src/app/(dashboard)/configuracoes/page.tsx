"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Check, Palette, Building2, Calendar, Download, Database,
  Users, Package, ShoppingBag, Plus, Trash2, CreditCard, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusLocal = { id: string | null; nome: string; cor: string; ordem: number; contaConfirmado: boolean; sistemico: boolean; _novo?: boolean; _excluir?: boolean };
type FormaPagamento = { id: string; nome: string; percentualTaxa: number; ativa: boolean; ordem: number; configJson?: string | null };
type TaxaParcela = { parcelas: number; taxaPct: number; recebimento: string };

const TEMPLATE_PADRAO = `Oii {primeiro_nome} 💖

Passando para confirmar nosso horário amanhã ({dia_semana}) {data_curta} ás {hora}h

Por gentileza, confirme o recebimento desta mensagem. Caso não haja resposta, o seu horário será automaticamente cancelado.
Tolerância de atraso é de 10 minutos.

Agradeço a compreensão 🥰`;

const TEMPLATE_ANIVERSARIO_PADRAO = `Olá, {primeiro_nome}! 🎂 Feliz Aniversário! Toda a equipe da {tenant_nome} deseja um dia maravilhoso para você! ✨`;

const INTERVALOS = [15, 30, 60];

export default function ConfiguracoesPage() {
  const [carregando, setCarregando] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [secao, setSecao] = useState<"clinica" | "agenda" | "status" | "pagamento" | "backup">("agenda");
  const [baixandoBackup, setBaixandoBackup] = useState(false);

  // Clínica
  const [nomeCli, setNomeCli] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [urlNFSe, setUrlNFSe] = useState("");

  // Agenda
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

  // Status
  const [statusLocal, setStatusLocal] = useState<StatusLocal[]>([]);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [salvoStatusOk, setSalvoStatusOk] = useState(false);
  const novoStatusRef = useRef(0);

  // Formas de pagamento
  const [formas, setFormas] = useState<FormaPagamento[]>([]);
  const [salvandoFormas, setSalvandoFormas] = useState(false);
  const [salvoFormasOk, setSalvoFormasOk] = useState(false);
  const [erroFormas, setErroFormas] = useState("");
  const [parcelamentoAberto, setParcelamentoAberto] = useState(false);
  const [maxParcelasCredito, setMaxParcelasCredito] = useState(12);
  const [taxasParcelamento, setTaxasParcelamento] = useState<TaxaParcela[]>([]);
  const [parcelamentoLinkAberto, setParcelamentoLinkAberto] = useState(false);
  const [maxParcelasLink, setMaxParcelasLink] = useState(12);
  const [taxasLink, setTaxasLink] = useState<TaxaParcela[]>([]);

  // Raw strings para os inputs de taxa (permite digitar decimais sem o ponto sumir)
  const [rawTaxas, setRawTaxas] = useState<Record<string, string>>({});
  const [rawTaxasParcelamento, setRawTaxasParcelamento] = useState<Record<number, string>>({});
  const [rawTaxasLink, setRawTaxasLink] = useState<Record<number, string>>({});
  const [rawTaxasProf, setRawTaxasProf] = useState<Record<number, string>>({});

  // Estado para profissional não-admin gerenciar suas próprias taxas de parcelamento
  const [profissionalId, setProfissionalId] = useState<string | null>(null);
  const [profParcelamentoAberto, setProfParcelamentoAberto] = useState(false);
  const [profMaxParcelas, setProfMaxParcelas] = useState(12);
  const [profTaxas, setProfTaxas] = useState<TaxaParcela[]>([]);
  const [profTaxaDebito, setProfTaxaDebito] = useState(0);
  const [profTaxaLink, setProfTaxaLink] = useState(0);
  const [rawProfTaxaDebito, setRawProfTaxaDebito] = useState("");
  const [rawProfTaxaLink, setRawProfTaxaLink] = useState("");
  const [salvandoProfConfig, setSalvandoProfConfig] = useState(false);
  const [salvoProfConfigOk, setSalvoProfConfigOk] = useState(false);
  const [profParcelamentoLinkAberto, setProfParcelamentoLinkAberto] = useState(false);
  const [profMaxParcelasLink, setProfMaxParcelasLink] = useState(12);
  const [profTaxasLink, setProfTaxasLink] = useState<TaxaParcela[]>([]);
  const [rawProfTaxasLink, setRawProfTaxasLink] = useState<Record<number, string>>({});

  useEffect(() => {
    async function carregar() {
      const [sessaoRes, configRes] = await Promise.all([
        fetch("/api/me/sessao").then((r) => r.json()).catch(() => null),
        fetch("/api/configuracoes").then((r) => r.json()).catch(() => null),
      ]);

      if (sessaoRes?.profissionalId) setProfissionalId(sessaoRes.profissionalId);
      if (sessaoRes?.permissoes?.isAdmin) {
        setIsAdmin(true);
        setSecao("clinica");
      }

      if (configRes) {
        if (configRes.tenant) {
          setSlugTenant(configRes.tenant.slug ?? "");
          setNomeCli(configRes.tenant.nome);
          setCnpj(configRes.tenant.cnpj ?? "");
          setTelefone(configRes.tenant.telefone ?? "");
          setEndereco(configRes.tenant.endereco ?? "");
        }
        if (configRes.config) {
          setIntervalo(configRes.config.intervaloAgendaMin);
          setHorarioWpp(configRes.config.horarioEnvioWpp);
          setMensagemWpp(configRes.config.mensagemConfirmacaoWpp ?? TEMPLATE_PADRAO);
          setMensagemAniv(configRes.config.mensagemAniversarioWpp ?? TEMPLATE_ANIVERSARIO_PADRAO);
          setUrlNFSe(configRes.config.urlNFSe ?? "");
          setHoraInicio(configRes.config.horaInicioAgenda ?? 6);
          setHoraFim(configRes.config.horaFimAgenda ?? 21);
          setAgendOnlineAtivo(configRes.config.agendamentoOnlineAtivo ?? false);
          setEmailNotif(configRes.config.emailNotificacoes ?? "");
        }
        if (configRes.status) {
          setStatusLocal(configRes.status.map((s: StatusLocal) => ({ ...s, _novo: false, _excluir: false })));
        }
      }

      setCarregando(false);
    }
    carregar();
  }, []);

  useEffect(() => {
    if ((isAdmin || profissionalId) && secao === "pagamento") {
      fetch(`/api/formas-pagamento${isAdmin ? "?incluirInativas=true" : ""}`)
        .then((r) => r.json())
        .then((data: FormaPagamento[]) => {
          setFormas(data);
          const raw: Record<string, string> = {};
          data.forEach((f) => { raw[f.id] = String(f.percentualTaxa); });
          setRawTaxas(raw);
          if (isAdmin) {
            const cc = data.find((f) => f.nome === "Cartão de Crédito");
            if (cc?.configJson) {
              try {
                const config = JSON.parse(cc.configJson);
                setMaxParcelasCredito(config.maxParcelas ?? 12);
                setTaxasParcelamento(config.taxas ?? []);
              } catch {}
            }
            const lp = data.find((f) => f.nome === "Link de Pagamento");
            if (lp?.configJson) {
              try {
                const config = JSON.parse(lp.configJson);
                setMaxParcelasLink(config.maxParcelas ?? 12);
                setTaxasLink(config.taxas ?? []);
              } catch {}
            }
          }
        })
        .catch(() => {});

      if (!isAdmin && profissionalId) {
        fetch("/api/me/config-cartao")
          .then((r) => r.json())
          .then((data: { configJsonCartao: string | null }) => {
            if (data?.configJsonCartao) {
              try {
                const config = JSON.parse(data.configJsonCartao);
                setProfMaxParcelas(config.maxParcelas ?? 12);
                setProfTaxas(config.taxas ?? []);
                if (typeof config.taxaDebito === "number") {
                  setProfTaxaDebito(config.taxaDebito);
                  setRawProfTaxaDebito(config.taxaDebito === 0 ? "" : String(config.taxaDebito));
                }
                if (typeof config.taxaLink === "number") {
                  setProfTaxaLink(config.taxaLink);
                  setRawProfTaxaLink(config.taxaLink === 0 ? "" : String(config.taxaLink));
                }
                if (typeof config.maxParcelasLink === "number") setProfMaxParcelasLink(config.maxParcelasLink);
                if (Array.isArray(config.taxasLink)) setProfTaxasLink(config.taxasLink);
              } catch {}
            }
          })
          .catch(() => {});
      }
    }
  }, [isAdmin, profissionalId, secao]);

  useEffect(() => {
    if (!agendOnlineAtivo || !slugTenant) { setQrDataUrl(""); return; }
    const url = `${window.location.origin}/agendar/${slugTenant}`;
    QRCode.toDataURL(url, { width: 180, margin: 1, color: { dark: "#5a4530", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [agendOnlineAtivo, slugTenant]);

  async function salvarAgendaClinica() {
    setSalvando(true);
    const body: Record<string, unknown> = {
      config: {
        intervaloAgendaMin: intervalo,
        horarioEnvioWpp: horarioWpp,
        mensagemConfirmacaoWpp: mensagemWpp,
        mensagemAniversarioWpp: mensagemAniv,
        horaInicioAgenda: horaInicio,
        horaFimAgenda: horaFim,
        agendamentoOnlineAtivo: agendOnlineAtivo,
        emailNotificacoes: emailNotif || null,
        ...(isAdmin ? { urlNFSe } : {}),
      },
    };
    if (secao === "clinica" && isAdmin) {
      body.tenant = { nome: nomeCli, cnpj, telefone, endereco };
    }
    await fetch("/api/configuracoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSalvando(false);
    setSalvoOk(true);
    setTimeout(() => setSalvoOk(false), 2500);
  }

  async function salvarStatus() {
    setSalvandoStatus(true);
    try {
      for (const s of statusLocal) {
        if (s._excluir && s.id && !s._novo) {
          await fetch(`/api/status-agenda/${s.id}`, { method: "DELETE" });
        } else if (s._novo && !s._excluir) {
          await fetch("/api/status-agenda", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: s.nome, cor: s.cor, contaConfirmado: s.contaConfirmado }),
          });
        } else if (!s._excluir && s.id) {
          await fetch(`/api/status-agenda/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: s.nome, cor: s.cor, contaConfirmado: s.contaConfirmado, ordem: s.ordem }),
          });
        }
      }
      // Recarregar
      const res = await fetch("/api/configuracoes");
      const data = await res.json();
      setStatusLocal(data.status.map((s: StatusLocal) => ({ ...s, _novo: false, _excluir: false })));
      setSalvoStatusOk(true);
      setTimeout(() => setSalvoStatusOk(false), 2500);
    } finally {
      setSalvandoStatus(false);
    }
  }

  function adicionarStatus() {
    const novoOrdem = statusLocal.filter((s) => !s._excluir).length;
    setStatusLocal((prev) => [
      ...prev,
      {
        id: `_novo_${++novoStatusRef.current}`,
        nome: "Novo status",
        cor: "#94a3b8",
        ordem: novoOrdem,
        contaConfirmado: false,
        sistemico: false,
        _novo: true,
        _excluir: false,
      },
    ]);
  }

  function moverStatus(idx: number, dir: -1 | 1) {
    setStatusLocal((prev) => {
      const visivel = prev.filter((s) => !s._excluir);
      const idxVisivel = visivel.findIndex((_, i) => {
        let count = 0;
        for (let j = 0; j < prev.length; j++) {
          if (!prev[j]._excluir) {
            if (count === i) return j === idx;
            count++;
          }
        }
        return false;
      });
      const troca = idxVisivel + dir;
      if (troca < 0 || troca >= visivel.length) return prev;
      const novo = [...prev];
      const realIdx = prev.indexOf(visivel[idxVisivel]);
      const realTroca = prev.indexOf(visivel[troca]);
      [novo[realIdx], novo[realTroca]] = [novo[realTroca], novo[realIdx]];
      return novo.map((s, i) => ({ ...s, ordem: i }));
    });
  }

  async function salvarFormas() {
    setSalvandoFormas(true);
    setErroFormas("");
    try {
      for (const f of formas) {
        const configJson = f.nome === "Cartão de Crédito"
          ? JSON.stringify({ maxParcelas: maxParcelasCredito, taxas: taxasParcelamento })
          : f.nome === "Link de Pagamento"
          ? JSON.stringify({ maxParcelas: maxParcelasLink, taxas: taxasLink })
          : (f.configJson ?? null);

        if (!f.id.startsWith("_novo_")) {
          await fetch(`/api/formas-pagamento/${f.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: f.nome, percentualTaxa: f.percentualTaxa, ativa: f.ativa, configJson }),
          });
        } else {
          await fetch("/api/formas-pagamento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: f.nome, percentualTaxa: f.percentualTaxa }),
          });
        }
      }
      const res = await fetch("/api/formas-pagamento?incluirInativas=true");
      setFormas(await res.json());
      setSalvoFormasOk(true);
      setTimeout(() => setSalvoFormasOk(false), 2500);
    } catch {
      setErroFormas("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvandoFormas(false);
    }
  }

  function atualizarTaxaParcela(parcelas: number, campo: string, valor: string | number) {
    setTaxasParcelamento((prev) => {
      const idx = prev.findIndex((t) => t.parcelas === parcelas);
      const base: TaxaParcela = { parcelas, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
      if (idx === -1) return [...prev, { ...base, [campo]: valor }];
      return prev.map((t, i) => (i === idx ? { ...t, [campo]: valor } : t));
    });
  }

  function atualizarTaxaLink(parcelas: number, campo: string, valor: string | number) {
    setTaxasLink((prev) => {
      const idx = prev.findIndex((t) => t.parcelas === parcelas);
      const base: TaxaParcela = { parcelas, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
      if (idx === -1) return [...prev, { ...base, [campo]: valor }];
      return prev.map((t, i) => (i === idx ? { ...t, [campo]: valor } : t));
    });
  }

  function atualizarProfTaxaParcela(parcelas: number, campo: string, valor: string | number) {
    setProfTaxas((prev) => {
      const idx = prev.findIndex((t) => t.parcelas === parcelas);
      const base: TaxaParcela = { parcelas, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
      if (idx === -1) return [...prev, { ...base, [campo]: valor }];
      return prev.map((t, i) => (i === idx ? { ...t, [campo]: valor } : t));
    });
  }

  function atualizarProfTaxaLinkParcela(parcelas: number, campo: string, valor: string | number) {
    setProfTaxasLink((prev) => {
      const idx = prev.findIndex((t) => t.parcelas === parcelas);
      const base: TaxaParcela = { parcelas, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
      if (idx === -1) return [...prev, { ...base, [campo]: valor }];
      return prev.map((t, i) => (i === idx ? { ...t, [campo]: valor } : t));
    });
  }

  async function salvarProfConfig() {
    setSalvandoProfConfig(true);
    try {
      const configJsonCartao = JSON.stringify({
        maxParcelas: profMaxParcelas,
        taxas: profTaxas,
        taxaDebito: profTaxaDebito,
        taxaLink: profTaxaLink,
        maxParcelasLink: profMaxParcelasLink,
        taxasLink: profTaxasLink,
      });
      await fetch("/api/me/config-cartao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configJsonCartao }),
      });
      setSalvoProfConfigOk(true);
      setTimeout(() => setSalvoProfConfigOk(false), 2500);
    } finally {
      setSalvandoProfConfig(false);
    }
  }

  function adicionarForma() {
    const novoId = `_novo_${Date.now()}`;
    setFormas((prev) => [...prev, { id: novoId, nome: "", percentualTaxa: 0, ativa: true, ordem: prev.length }]);
    setRawTaxas((prev) => ({ ...prev, [novoId]: "" }));
  }

  const tabs = [
    ...(isAdmin ? [{ id: "clinica" as const, label: "Dados da Clínica", icon: Building2 }] : []),
    { id: "agenda" as const, label: "Agenda & WhatsApp", icon: Calendar },
    { id: "status" as const, label: "Status de Agenda", icon: Palette },
    ...(isAdmin || profissionalId ? [{ id: "pagamento" as const, label: "Formas de Pagamento", icon: CreditCard }] : []),
    ...(isAdmin ? [{ id: "backup" as const, label: "Backup", icon: Database }] : []),
  ];

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 size={24} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Configurações</h1>
        <p className="text-sm text-[#9a7d50] mt-1">Gerencie as configurações da clínica</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#e8dcc4] overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSecao(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              secao === id
                ? "border-[#B89968] text-[#B89968]"
                : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Dados da Clínica */}
      {secao === "clinica" && isAdmin && (
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
            <Label className="text-xs text-[#9a7d50] mb-1 block">Link do sistema de Nota Fiscal</Label>
            <Input value={urlNFSe} onChange={(e) => setUrlNFSe(e.target.value)} placeholder="https://..." className="border-[#B89968]/30" />
            <p className="text-xs text-[#9a7d50] mt-1">Ex: Florianópolis usa <span className="font-mono">e-gov.betha.com.br/e-nota</span></p>
          </div>
        </div>
      )}

      {/* Agenda & WhatsApp */}
      {secao === "agenda" && (
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 space-y-5 shadow-sm">
          <div className="border border-[#e8dcc4] rounded-xl p-4 space-y-3 bg-[#faf5ee]/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#5a4530]">Agendamento Online</p>
                <p className="text-xs text-[#9a7d50]">Permite que clientes marquem horário pelo link público</p>
              </div>
              <button
                type="button"
                onClick={() => setAgendOnlineAtivo((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agendOnlineAtivo ? "bg-[#B89968]" : "bg-gray-300"}`}
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
                    <p className="text-[11px] text-[#9a7d50] text-center">QR Code — imprima e cole na recepção</p>
                    <a href={qrDataUrl} download="qrcode-agendamento.png" className="text-xs text-[#B89968] hover:underline">
                      Baixar QR Code (PNG)
                    </a>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">E-mail para notificações de novos agendamentos (opcional)</Label>
                  <input
                    type="email"
                    value={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-[#e8dcc4] rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                  />
                  {agendOnlineAtivo && !emailNotif && (
                    <p className="mt-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      ⚠️ Agendamento online está ativo mas nenhum e-mail está configurado — novos agendamentos não vão gerar alertas.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-2 block">Horário de funcionamento da agenda</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Início</Label>
                <select value={horaInicio} onChange={(e) => setHoraInicio(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Fim</Label>
                <select value={horaFim} onChange={(e) => setHoraFim(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h + 1}>{String(h + 1).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-2 block">Intervalo de horários na agenda</Label>
            <div className="flex gap-2">
              {INTERVALOS.map((min) => (
                <button key={min} onClick={() => setIntervalo(min)}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    intervalo === min ? "bg-[#B89968] text-white border-[#B89968]" : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50")}>
                  {min} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Horário de envio das confirmações (WhatsApp)</Label>
            <Input type="time" value={horarioWpp} onChange={(e) => setHorarioWpp(e.target.value)} className="border-[#B89968]/30 w-32" />
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Mensagem de confirmação (WhatsApp)</Label>
            <textarea value={mensagemWpp} onChange={(e) => setMensagemWpp(e.target.value)} rows={10}
              className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none font-mono" />
            <div className="mt-1.5 text-xs text-[#9a7d50] space-y-0.5">
              <p className="font-medium">Variáveis: <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{primeiro_nome}"}</span> <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{dia_semana}"}</span> <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{data_curta}"}</span> <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{hora}"}</span></p>
            </div>
            <button type="button" onClick={() => setMensagemWpp(TEMPLATE_PADRAO)} className="mt-2 text-xs text-[#B89968] hover:underline">
              Restaurar mensagem padrão
            </button>
          </div>

          <div className="pt-2 border-t border-[#e8dcc4]">
            <Label className="text-xs text-[#9a7d50] mb-1 block">Mensagem de aniversário (WhatsApp)</Label>
            <textarea value={mensagemAniv} onChange={(e) => setMensagemAniv(e.target.value)} rows={4}
              className="w-full rounded-lg border border-[#B89968]/30 bg-white px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none font-mono" />
            <div className="mt-1 text-xs text-[#9a7d50]">
              Variáveis: <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{primeiro_nome}"}</span> <span className="font-mono bg-[#faf5ee] px-1 rounded">{"{tenant_nome}"}</span>
            </div>
            <button type="button" onClick={() => setMensagemAniv(TEMPLATE_ANIVERSARIO_PADRAO)} className="mt-2 text-xs text-[#B89968] hover:underline">
              Restaurar mensagem padrão
            </button>
          </div>
        </div>
      )}

      {/* Status de Agenda */}
      {secao === "status" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
            {statusLocal.filter((s) => !s._excluir).map((s, idx, arr) => (
              <div key={s.id ?? idx} className="flex items-center gap-2 px-4 py-3 border-b border-[#e8dcc4] last:border-b-0">
                {/* Cor */}
                <label className="relative cursor-pointer flex-shrink-0">
                  <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-[#e8dcc4]" style={{ backgroundColor: s.cor }} />
                  <input
                    type="color"
                    value={s.cor}
                    onChange={(e) => setStatusLocal((prev) => prev.map((x) => x.id === s.id ? { ...x, cor: e.target.value } : x))}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
                {/* Nome */}
                <input
                  value={s.nome}
                  onChange={(e) => setStatusLocal((prev) => prev.map((x) => x.id === s.id ? { ...x, nome: e.target.value } : x))}
                  className="flex-1 text-sm text-[#5a4530] bg-transparent border-b border-transparent focus:border-[#B89968] focus:outline-none py-0.5 min-w-0"
                />
                {/* Toggle confirmado */}
                <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={s.contaConfirmado}
                    onChange={(e) => setStatusLocal((prev) => prev.map((x) => x.id === s.id ? { ...x, contaConfirmado: e.target.checked } : x))}
                    className="accent-[#B89968] w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-[#9a7d50] hidden sm:inline">confirmado</span>
                </label>
                {/* Reordenar */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moverStatus(statusLocal.indexOf(s), -1)} disabled={idx === 0}
                    className="text-[#9a7d50] hover:text-[#5a4530] disabled:opacity-20 leading-none">
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => moverStatus(statusLocal.indexOf(s), 1)} disabled={idx === arr.length - 1}
                    className="text-[#9a7d50] hover:text-[#5a4530] disabled:opacity-20 leading-none">
                    <ChevronDown size={13} />
                  </button>
                </div>
                {/* Excluir */}
                {!s.sistemico ? (
                  <button onClick={() => setStatusLocal((prev) => prev.map((x) => x.id === s.id ? { ...x, _excluir: true } : x))}
                    className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="w-[14px] flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          <button onClick={adicionarStatus}
            className="flex items-center gap-2 text-sm text-[#B89968] hover:text-[#9a7d50] font-medium transition-colors">
            <Plus size={15} />
            Novo status
          </button>

          <div className="flex items-center justify-end gap-3 pt-1">
            {salvoStatusOk && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo!</span>}
            <Button onClick={salvarStatus} disabled={salvandoStatus} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
              {salvandoStatus ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Salvar Status
            </Button>
          </div>
        </div>
      )}

      {/* Formas de Pagamento */}
      {secao === "pagamento" && isAdmin && (
        <div className="space-y-3">
          <p className="text-xs text-[#9a7d50]">Configure as formas de pagamento e suas taxas. O sistema calculará automaticamente o valor líquido nos lançamentos.</p>
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_100px_auto_auto] gap-2 px-4 py-2 bg-[#faf5ee] border-b border-[#e8dcc4] text-xs text-[#9a7d50] font-medium">
              <span>Nome</span>
              <span className="text-center">Taxa %</span>
              <span className="text-center">Ativa</span>
              <span className="w-7" />
            </div>
            {formas.map((f) => (
              <div key={f.id} className={cn("grid grid-cols-[1fr_100px_auto_auto] gap-2 items-center px-4 py-2.5 border-b border-[#e8dcc4] last:border-b-0", !f.ativa && "opacity-50")}>
                <input
                  value={f.nome}
                  onChange={(e) => setFormas((prev) => prev.map((x) => x.id === f.id ? { ...x, nome: e.target.value } : x))}
                  className="text-sm text-[#5a4530] bg-transparent border-b border-transparent focus:border-[#B89968] focus:outline-none py-0.5"
                  placeholder="Nome da forma"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rawTaxas[f.id] ?? String(f.percentualTaxa)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setRawTaxas((prev) => ({ ...prev, [f.id]: raw }));
                      const num = parseFloat(raw.replace(",", "."));
                      if (!isNaN(num)) setFormas((prev) => prev.map((x) => x.id === f.id ? { ...x, percentualTaxa: num } : x));
                    }}
                    onBlur={(e) => {
                      const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                      const fmt = Number.isInteger(num) ? String(num) : num.toFixed(2);
                      setRawTaxas((prev) => ({ ...prev, [f.id]: fmt }));
                      setFormas((prev) => prev.map((x) => x.id === f.id ? { ...x, percentualTaxa: num } : x));
                    }}
                    className="w-full text-sm text-center text-[#5a4530] border border-[#e8dcc4] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                  />
                  <span className="text-xs text-[#9a7d50]">%</span>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => setFormas((prev) => prev.map((x) => x.id === f.id ? { ...x, ativa: !x.ativa } : x))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${f.ativa ? "bg-[#B89968]" : "bg-gray-300"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${f.ativa ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <button onClick={() => setFormas((prev) => prev.map((x) => x.id === f.id ? { ...x, ativa: false } : x))}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Configuração de parcelamento — Cartão de Crédito */}
          {formas.some((f) => f.nome === "Cartão de Crédito" && f.ativa) && (
            <div className="border border-[#e8dcc4] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setParcelamentoAberto((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf5ee] text-sm font-medium text-[#5a4530] hover:bg-[#f0e8d5] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#B89968]" />
                  Configurar parcelamento do Cartão de Crédito
                </span>
                <ChevronDown size={14} className={cn("transition-transform text-[#9a7d50]", parcelamentoAberto && "rotate-180")} />
              </button>

              {parcelamentoAberto && (
                <div className="bg-white p-4 space-y-3 border-t border-[#e8dcc4]">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-[#9a7d50] whitespace-nowrap">Máximo de parcelas:</Label>
                    <select
                      value={maxParcelasCredito}
                      onChange={(e) => setMaxParcelasCredito(Number(e.target.value))}
                      className="border border-[#e8dcc4] rounded-lg px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                    >
                      {[6, 9, 12, 15, 18].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-[#e8dcc4] overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_110px] gap-2 px-3 py-2 bg-[#faf5ee] text-xs font-semibold text-[#5a4530] border-b border-[#e8dcc4]">
                      <span>Parcelas</span>
                      <span>Você recebe em</span>
                      <span className="text-right">Taxa (%)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#e8dcc4]">
                      {Array.from({ length: maxParcelasCredito }, (_, i) => i + 1).map((n) => {
                        const taxa = taxasParcelamento.find((t) => t.parcelas === n) ?? { parcelas: n, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
                        return (
                          <div key={n} className="grid grid-cols-[80px_1fr_110px] gap-2 items-center px-3 py-2">
                            <span className="text-sm font-medium text-[#3d2c1e]">
                              {n === 1 ? "À Vista" : `${n}x`}
                            </span>
                            <select
                              value={taxa.recebimento}
                              onChange={(e) => atualizarTaxaParcela(n, "recebimento", e.target.value)}
                              className="text-xs rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none bg-white"
                            >
                              <option value="CONFORME_PARCELAS">Conforme parcelas</option>
                              <option value="HOJE">Hoje</option>
                              <option value="1D">Amanhã (1 dia)</option>
                              <option value="2D">2 dias</option>
                              <option value="3D">3 dias</option>
                              <option value="14D">14 dias</option>
                              <option value="30D">30 dias</option>
                              <option value="90D">90 dias</option>
                            </select>
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rawTaxasParcelamento[n] ?? (taxa.taxaPct === 0 ? "" : String(taxa.taxaPct))}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setRawTaxasParcelamento((prev) => ({ ...prev, [n]: raw }));
                                  const num = parseFloat(raw.replace(",", "."));
                                  if (!isNaN(num)) atualizarTaxaParcela(n, "taxaPct", num);
                                }}
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                                  const fmt = Number.isInteger(num) ? String(num) : num.toFixed(2);
                                  setRawTaxasParcelamento((prev) => ({ ...prev, [n]: fmt }));
                                  atualizarTaxaParcela(n, "taxaPct", num);
                                }}
                                className="w-16 text-xs text-right rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none"
                              />
                              <span className="text-xs text-[#9a7d50]">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9a7d50]">
                    &quot;Conforme parcelas&quot; = 1ª em 30 dias, 2ª em 60 dias, 3ª em 90 dias...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Configuração de parcelamento — Link de Pagamento */}
          {formas.some((f) => f.nome === "Link de Pagamento" && f.ativa) && (
            <div className="border border-[#e8dcc4] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setParcelamentoLinkAberto((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf5ee] text-sm font-medium text-[#5a4530] hover:bg-[#f0e8d5] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#B89968]" />
                  Configurar parcelamento do Link de Pagamento
                </span>
                <ChevronDown size={14} className={cn("transition-transform text-[#9a7d50]", parcelamentoLinkAberto && "rotate-180")} />
              </button>

              {parcelamentoLinkAberto && (
                <div className="bg-white p-4 space-y-3 border-t border-[#e8dcc4]">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-[#9a7d50] whitespace-nowrap">Máximo de parcelas:</Label>
                    <select
                      value={maxParcelasLink}
                      onChange={(e) => setMaxParcelasLink(Number(e.target.value))}
                      className="border border-[#e8dcc4] rounded-lg px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                    >
                      {[6, 9, 12, 15, 18].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-[#e8dcc4] overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_110px] gap-2 px-3 py-2 bg-[#faf5ee] text-xs font-semibold text-[#5a4530] border-b border-[#e8dcc4]">
                      <span>Parcelas</span>
                      <span>Você recebe em</span>
                      <span className="text-right">Taxa (%)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#e8dcc4]">
                      {Array.from({ length: maxParcelasLink }, (_, i) => i + 1).map((n) => {
                        const taxa = taxasLink.find((t) => t.parcelas === n) ?? { parcelas: n, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
                        return (
                          <div key={n} className="grid grid-cols-[80px_1fr_110px] gap-2 items-center px-3 py-2">
                            <span className="text-sm font-medium text-[#3d2c1e]">
                              {n === 1 ? "À Vista" : `${n}x`}
                            </span>
                            <select
                              value={taxa.recebimento}
                              onChange={(e) => atualizarTaxaLink(n, "recebimento", e.target.value)}
                              className="text-xs rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none bg-white"
                            >
                              <option value="CONFORME_PARCELAS">Conforme parcelas</option>
                              <option value="HOJE">Hoje</option>
                              <option value="1D">Amanhã (1 dia)</option>
                              <option value="2D">2 dias</option>
                              <option value="3D">3 dias</option>
                              <option value="14D">14 dias</option>
                              <option value="30D">30 dias</option>
                              <option value="90D">90 dias</option>
                            </select>
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rawTaxasLink[n] ?? (taxa.taxaPct === 0 ? "" : String(taxa.taxaPct))}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setRawTaxasLink((prev) => ({ ...prev, [n]: raw }));
                                  const num = parseFloat(raw.replace(",", "."));
                                  if (!isNaN(num)) atualizarTaxaLink(n, "taxaPct", num);
                                }}
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                                  const fmt = Number.isInteger(num) ? String(num) : num.toFixed(2);
                                  setRawTaxasLink((prev) => ({ ...prev, [n]: fmt }));
                                  atualizarTaxaLink(n, "taxaPct", num);
                                }}
                                className="w-16 text-xs text-right rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none"
                              />
                              <span className="text-xs text-[#9a7d50]">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9a7d50]">
                    &quot;Conforme parcelas&quot; = 1ª em 30 dias, 2ª em 60 dias, 3ª em 90 dias...
                  </p>
                </div>
              )}
            </div>
          )}

          <button onClick={adicionarForma} className="flex items-center gap-2 text-sm text-[#B89968] hover:text-[#9a7d50] font-medium transition-colors">
            <Plus size={15} />
            Nova forma de pagamento
          </button>

          {erroFormas && <p className="text-sm text-red-500">{erroFormas}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            {salvoFormasOk && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo!</span>}
            <Button onClick={salvarFormas} disabled={salvandoFormas} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
              {salvandoFormas ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Salvar Formas de Pagamento
            </Button>
          </div>
        </div>
      )}

      {/* Formas de Pagamento — profissional não-admin */}
      {secao === "pagamento" && !isAdmin && profissionalId && (
        <div className="space-y-3">
          <p className="text-xs text-[#9a7d50]">Configure taxas diferentes das da clínica para os seus atendimentos. Deixe em branco para usar a taxa padrão.</p>

          {/* Tabela de formas */}
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_100px_auto] gap-2 px-4 py-2 bg-[#faf5ee] border-b border-[#e8dcc4] text-xs text-[#9a7d50] font-medium">
              <span>Nome</span>
              <span className="text-center">Minha Taxa %</span>
              <span className="text-center">Ativa</span>
            </div>
            {formas.filter((f) => f.ativa).map((f) => {
              const isDebito = f.nome === "Cartão de Débito";
              const isLink = f.nome === "Link de Pagamento";
              const isCredito = f.nome === "Cartão de Crédito";
              const isEditavel = isDebito || isLink;
              return (
                <div key={f.id} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center px-4 py-2.5 border-b border-[#e8dcc4] last:border-b-0">
                  <span className="text-sm text-[#5a4530]">{f.nome}</span>
                  <div className="flex items-center gap-1 justify-center">
                    {isCredito ? (
                      <span className="text-xs text-[#9a7d50] italic">por parcela ↓</span>
                    ) : isEditavel ? (
                      <>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={isDebito ? rawProfTaxaDebito : rawProfTaxaLink}
                          placeholder={f.percentualTaxa > 0 ? String(f.percentualTaxa) : "0"}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (isDebito) {
                              setRawProfTaxaDebito(raw);
                              const num = parseFloat(raw.replace(",", "."));
                              if (!isNaN(num)) setProfTaxaDebito(num);
                            } else {
                              setRawProfTaxaLink(raw);
                              const num = parseFloat(raw.replace(",", "."));
                              if (!isNaN(num)) setProfTaxaLink(num);
                            }
                          }}
                          onBlur={(e) => {
                            const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                            const fmt = num === 0 ? "" : (Number.isInteger(num) ? String(num) : num.toFixed(2));
                            if (isDebito) { setProfTaxaDebito(num); setRawProfTaxaDebito(fmt); }
                            else { setProfTaxaLink(num); setRawProfTaxaLink(fmt); }
                          }}
                          className="w-full text-sm text-center text-[#5a4530] border border-[#e8dcc4] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                        />
                        <span className="text-xs text-[#9a7d50]">%</span>
                      </>
                    ) : (
                      <span className="text-sm text-[#9a7d50] text-center w-full">
                        {f.percentualTaxa > 0 ? `${f.percentualTaxa}%` : "—"}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <button
                      disabled
                      className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-not-allowed opacity-60 ${f.ativa ? "bg-[#B89968]" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ${f.ativa ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Parcelamento Cartão de Crédito */}
          {formas.some((f) => f.nome === "Cartão de Crédito" && f.ativa) && (
            <div className="border border-[#e8dcc4] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setProfParcelamentoAberto((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf5ee] text-sm font-medium text-[#5a4530] hover:bg-[#f0e8d5] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#B89968]" />
                  Configurar parcelamento do Cartão de Crédito
                </span>
                <ChevronDown size={14} className={cn("transition-transform text-[#9a7d50]", profParcelamentoAberto && "rotate-180")} />
              </button>
              {profParcelamentoAberto && (
                <div className="bg-white p-4 space-y-3 border-t border-[#e8dcc4]">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-[#9a7d50] whitespace-nowrap">Máximo de parcelas:</Label>
                    <select
                      value={profMaxParcelas}
                      onChange={(e) => setProfMaxParcelas(Number(e.target.value))}
                      className="border border-[#e8dcc4] rounded-lg px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                    >
                      {[6, 9, 12, 15, 18].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-[#e8dcc4] overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_110px] gap-2 px-3 py-2 bg-[#faf5ee] text-xs font-semibold text-[#5a4530] border-b border-[#e8dcc4]">
                      <span>Parcelas</span>
                      <span>Você recebe em</span>
                      <span className="text-right">Taxa (%)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#e8dcc4]">
                      {Array.from({ length: profMaxParcelas }, (_, i) => i + 1).map((n) => {
                        const taxa = profTaxas.find((t) => t.parcelas === n) ?? { parcelas: n, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
                        return (
                          <div key={n} className="grid grid-cols-[80px_1fr_110px] gap-2 items-center px-3 py-2">
                            <span className="text-sm font-medium text-[#3d2c1e]">{n === 1 ? "À Vista" : `${n}x`}</span>
                            <select
                              value={taxa.recebimento}
                              onChange={(e) => atualizarProfTaxaParcela(n, "recebimento", e.target.value)}
                              className="text-xs rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none bg-white"
                            >
                              <option value="CONFORME_PARCELAS">Conforme parcelas</option>
                              <option value="HOJE">Hoje</option>
                              <option value="1D">Amanhã (1 dia)</option>
                              <option value="2D">2 dias</option>
                              <option value="3D">3 dias</option>
                              <option value="14D">14 dias</option>
                              <option value="30D">30 dias</option>
                              <option value="90D">90 dias</option>
                            </select>
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rawTaxasProf[n] ?? (taxa.taxaPct === 0 ? "" : String(taxa.taxaPct))}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setRawTaxasProf((prev) => ({ ...prev, [n]: raw }));
                                  const num = parseFloat(raw.replace(",", "."));
                                  if (!isNaN(num)) atualizarProfTaxaParcela(n, "taxaPct", num);
                                }}
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                                  const fmt = Number.isInteger(num) ? String(num) : num.toFixed(2);
                                  setRawTaxasProf((prev) => ({ ...prev, [n]: fmt }));
                                  atualizarProfTaxaParcela(n, "taxaPct", num);
                                }}
                                className="w-16 text-xs text-right rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none"
                              />
                              <span className="text-xs text-[#9a7d50]">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9a7d50]">&quot;Conforme parcelas&quot; = 1ª em 30 dias, 2ª em 60 dias, 3ª em 90 dias...</p>
                </div>
              )}
            </div>
          )}

          {/* Parcelamento Link de Pagamento */}
          {formas.some((f) => f.nome === "Link de Pagamento" && f.ativa) && (
            <div className="border border-[#e8dcc4] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setProfParcelamentoLinkAberto((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf5ee] text-sm font-medium text-[#5a4530] hover:bg-[#f0e8d5] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={14} className="text-[#B89968]" />
                  Configurar parcelamento do Link de Pagamento
                </span>
                <ChevronDown size={14} className={cn("transition-transform text-[#9a7d50]", profParcelamentoLinkAberto && "rotate-180")} />
              </button>
              {profParcelamentoLinkAberto && (
                <div className="bg-white p-4 space-y-3 border-t border-[#e8dcc4]">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-[#9a7d50] whitespace-nowrap">Máximo de parcelas:</Label>
                    <select
                      value={profMaxParcelasLink}
                      onChange={(e) => setProfMaxParcelasLink(Number(e.target.value))}
                      className="border border-[#e8dcc4] rounded-lg px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                    >
                      {[6, 9, 12, 15, 18].map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-[#e8dcc4] overflow-hidden">
                    <div className="grid grid-cols-[80px_1fr_110px] gap-2 px-3 py-2 bg-[#faf5ee] text-xs font-semibold text-[#5a4530] border-b border-[#e8dcc4]">
                      <span>Parcelas</span>
                      <span>Você recebe em</span>
                      <span className="text-right">Taxa (%)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#e8dcc4]">
                      {Array.from({ length: profMaxParcelasLink }, (_, i) => i + 1).map((n) => {
                        const taxa = profTaxasLink.find((t) => t.parcelas === n) ?? { parcelas: n, taxaPct: 0, recebimento: "CONFORME_PARCELAS" };
                        return (
                          <div key={n} className="grid grid-cols-[80px_1fr_110px] gap-2 items-center px-3 py-2">
                            <span className="text-sm font-medium text-[#3d2c1e]">{n === 1 ? "À Vista" : `${n}x`}</span>
                            <select
                              value={taxa.recebimento}
                              onChange={(e) => atualizarProfTaxaLinkParcela(n, "recebimento", e.target.value)}
                              className="text-xs rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none bg-white"
                            >
                              <option value="CONFORME_PARCELAS">Conforme parcelas</option>
                              <option value="HOJE">Hoje</option>
                              <option value="1D">Amanhã (1 dia)</option>
                              <option value="2D">2 dias</option>
                              <option value="3D">3 dias</option>
                              <option value="14D">14 dias</option>
                              <option value="30D">30 dias</option>
                              <option value="90D">90 dias</option>
                            </select>
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rawProfTaxasLink[n] ?? (taxa.taxaPct === 0 ? "" : String(taxa.taxaPct))}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  setRawProfTaxasLink((prev) => ({ ...prev, [n]: raw }));
                                  const num = parseFloat(raw.replace(",", "."));
                                  if (!isNaN(num)) atualizarProfTaxaLinkParcela(n, "taxaPct", num);
                                }}
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value.replace(",", ".")) || 0;
                                  const fmt = Number.isInteger(num) ? String(num) : num.toFixed(2);
                                  setRawProfTaxasLink((prev) => ({ ...prev, [n]: fmt }));
                                  atualizarProfTaxaLinkParcela(n, "taxaPct", num);
                                }}
                                className="w-16 text-xs text-right rounded-md border border-[#e8dcc4] px-1.5 py-1.5 text-[#3d2c1e] focus:border-[#B89968] focus:outline-none"
                              />
                              <span className="text-xs text-[#9a7d50]">%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9a7d50]">&quot;Conforme parcelas&quot; = 1ª em 30 dias, 2ª em 60 dias, 3ª em 90 dias...</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            {salvoProfConfigOk && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo!</span>}
            <Button onClick={salvarProfConfig} disabled={salvandoProfConfig} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
              {salvandoProfConfig ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Salvar Minhas Taxas
            </Button>
          </div>
        </div>
      )}

      {/* Backup */}
      {secao === "backup" && isAdmin && (
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
          <p className="text-xs text-[#9a7d50] px-1">Recomendamos fazer backup semanalmente.</p>
        </div>
      )}

      {/* Botão salvar (clinica e agenda) */}
      {(secao === "clinica" || secao === "agenda") && (
        <div className="flex items-center justify-end gap-3 mt-5">
          {salvoOk && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={14} />
              Salvo com sucesso!
            </span>
          )}
          <Button onClick={salvarAgendaClinica} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Salvar Configurações
          </Button>
        </div>
      )}
    </div>
  );
}
