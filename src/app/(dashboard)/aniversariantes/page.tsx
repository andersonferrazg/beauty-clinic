"use client";

import { useEffect, useState } from "react";
import { Gift, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Aniversariante = {
  id: string;
  nome: string;
  telefone1: string | null;
  dataNascimento: string;
  dia: number;
  diasAte: number;
  ehHoje: boolean;
};

type Dados = {
  aniversariantes: Aniversariante[];
  mes: number;
  diaAtual: number;
  tenantNome: string;
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TEMPLATE_PADRAO =
  "Olá, {primeiro_nome}! 🎂 Feliz Aniversário! Toda a equipe da {tenant_nome} deseja um dia maravilhoso para você! ✨";

function limparTelefone(tel: string) {
  return tel.replace(/\D/g, "");
}

function labelDias(diasAte: number, ehHoje: boolean): string {
  if (ehHoje) return "🎂 Hoje!";
  if (diasAte === 1) return "amanhã";
  if (diasAte > 1) return `em ${diasAte} dias`;
  if (diasAte === -1) return "ontem";
  return `${Math.abs(diasAte)} dias atrás`;
}

export default function AniversariantesPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [template, setTemplate] = useState(TEMPLATE_PADRAO);

  useEffect(() => {
    fetch("/api/aniversariantes")
      .then((r) => r.json())
      .then((d) => { setDados(d); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, []);

  useEffect(() => {
    fetch("/api/configuracoes")
      .then((r) => r.json())
      .then((d) => {
        if (d?.config?.mensagemAniversarioWpp) setTemplate(d.config.mensagemAniversarioWpp);
      })
      .catch(() => {});
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#B89968]" size={28} />
      </div>
    );
  }

  if (!dados) return null;

  const { aniversariantes, mes, tenantNome } = dados;
  const hoje = aniversariantes.filter((a) => a.ehHoje);
  const futuros = aniversariantes.filter((a) => !a.ehHoje && a.diasAte > 0);
  const passados = aniversariantes.filter((a) => !a.ehHoje && a.diasAte <= 0);

  function linkWhatsApp(a: Aniversariante) {
    if (!a.telefone1) return null;
    const tel = limparTelefone(a.telefone1);
    const numero = tel.startsWith("55") ? tel : `55${tel}`;
    const primeiroNome = a.nome.split(" ")[0];
    const mensagem = template
      .replace(/\{primeiro_nome\}/g, primeiroNome)
      .replace(/\{tenant_nome\}/g, tenantNome);
    const texto = encodeURIComponent(mensagem);
    return `https://web.whatsapp.com/send?phone=${numero}&text=${texto}`;
  }

  function renderCard(a: Aniversariante) {
    const link = linkWhatsApp(a);
    return (
      <div
        key={a.id}
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-[#f0e8d8] last:border-0",
          a.ehHoje && "bg-amber-50"
        )}
      >
        <div>
          <p className="font-medium text-[#5a4530] text-sm">{a.nome}</p>
          <p className="text-xs text-[#9a7d50]">
            Dia {a.dia} · {labelDias(a.diasAte, a.ehHoje)}
            {a.telefone1 && ` · ${a.telefone1}`}
          </p>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shrink-0 ml-3"
          >
            <MessageCircle size={13} />
            Parabenizar
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Gift className="text-[#B89968]" size={24} />
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#5a4530]">Aniversariantes</h1>
          <p className="text-sm text-[#9a7d50]">
            {MESES[mes - 1]} · {aniversariantes.length} paciente{aniversariantes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Hoje */}
      {hoje.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#B89968] uppercase tracking-wider mb-2">
            🎂 Aniversariantes Hoje
          </h2>
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
            {hoje.map(renderCard)}
          </div>
        </section>
      )}

      {/* Próximos */}
      {futuros.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">
            Próximos do Mês
          </h2>
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
            {futuros.map(renderCard)}
          </div>
        </section>
      )}

      {/* Já passaram */}
      {passados.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">
            Já Passaram Este Mês
          </h2>
          <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden opacity-60">
            {passados.map(renderCard)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {aniversariantes.length === 0 && (
        <div className="text-center py-20 text-[#9a7d50]">
          <Gift size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma paciente faz aniversário em {MESES[mes - 1]}.</p>
        </div>
      )}
    </div>
  );
}
