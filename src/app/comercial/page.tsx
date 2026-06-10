import type { Metadata } from "next";
import {
  Calendar,
  FileText,
  TrendingUp,
  DollarSign,
  BarChart3,
  Smartphone,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Beauty Clinic — Sistema de gestão para clínicas de estética",
  description:
    "Agenda, prontuário digital, financeiro automático e comissões em um só sistema. Feito por quem tem clínica de estética.",
};

const WA_LINK =
  "https://wa.me/5567991859467?text=Ol%C3%A1!%20Vi%20sobre%20o%20Beauty%20Clinic%20e%20quero%20saber%20mais.";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.86L.057 23.5l5.79-1.44A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.377l-.36-.214-3.436.855.9-3.334-.235-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  );
}

function AppMockup() {
  const profs = [
    {
      name: "Dra. Lunna",
      color: "#7c3aed",
      appts: [
        { time: "09:00", label: "Botox" },
        { time: "11:00", label: "Preenchimento" },
        { time: "14:30", label: "Harmonização" },
      ],
    },
    {
      name: "Beatriz",
      color: "#ec4899",
      appts: [
        { time: "09:30", label: "Limpeza de pele" },
        { time: "13:00", label: "Ext. de cílios" },
      ],
    },
    {
      name: "Letícia",
      color: "#f59e0b",
      appts: [
        { time: "10:00", label: "Ext. unhas" },
        { time: "14:00", label: "Manicure" },
      ],
    },
  ];

  return (
    <div className="relative select-none">
      <div className="absolute -inset-6 bg-gradient-to-br from-[#B89968]/25 via-[#9a7d50]/10 to-transparent rounded-[40px] blur-3xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#e8dcc4] overflow-hidden">
        {/* Browser chrome */}
        <div className="bg-[#f5f0e8] px-4 py-2.5 flex items-center gap-3 border-b border-[#e8dcc4]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded px-3 py-0.5 text-[10px] text-[#9a7d50] font-mono">
            beauty-clinic.com.br/agenda
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ height: 260 }}>
          {/* Sidebar */}
          <div className="w-28 bg-[#faf5ee] border-r border-[#e8dcc4] p-2.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-5 h-5 rounded-md bg-[#5a4530] flex items-center justify-center text-white font-bold" style={{ fontSize: 8 }}>
                BC
              </div>
              <span className="font-semibold text-[#5a4530]" style={{ fontSize: 9 }}>Beauty Clinic</span>
            </div>
            {["Agenda", "Clientes", "Financeiro", "Comissões", "Prontuários"].map((item, i) => (
              <div
                key={item}
                className="px-2 py-1 rounded-md mb-0.5 font-medium"
                style={{
                  fontSize: 9,
                  backgroundColor: i === 0 ? "#B89968" + "22" : "transparent",
                  color: i === 0 ? "#9a7d50" : "#b8a080",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#e8dcc4] bg-white flex-shrink-0">
              <span className="font-semibold text-[#5a4530]" style={{ fontSize: 10 }}>Semana · Jun 2026</span>
              <div className="flex items-center gap-1">
                <div className="px-2 py-0.5 rounded text-white font-semibold" style={{ fontSize: 8, backgroundColor: "#B89968" }}>
                  + Novo
                </div>
              </div>
            </div>

            {/* Prof columns */}
            <div className="flex flex-1 overflow-hidden">
              {profs.map((prof) => (
                <div key={prof.name} className="flex-1 border-r border-[#e8dcc4] last:border-r-0 flex flex-col">
                  <div
                    className="text-center py-1 border-b border-[#e8dcc4] font-semibold flex-shrink-0"
                    style={{ fontSize: 9, color: prof.color }}
                  >
                    {prof.name}
                  </div>
                  <div className="p-1 space-y-1 overflow-hidden flex-1">
                    {prof.appts.map((a) => (
                      <div
                        key={a.time}
                        className="rounded px-1 py-1 leading-tight"
                        style={{ backgroundColor: prof.color + "22", borderLeft: `2px solid ${prof.color}` }}
                      >
                        <div style={{ fontSize: 7, color: prof.color, fontWeight: 600 }}>{a.time}</div>
                        <div style={{ fontSize: 8, color: "#5a4530" }}>{a.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-[#e8dcc4] px-3 py-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <span style={{ fontSize: 12 }}>✓</span>
        </div>
        <div>
          <div className="font-semibold text-[#1a1a1a]" style={{ fontSize: 10 }}>Atendimento finalizado</div>
          <div className="text-[#9a7d50]" style={{ fontSize: 9 }}>Receita registrada automaticamente</div>
        </div>
      </div>
    </div>
  );
}

type Feature = { Icon: LucideIcon; title: string; desc: string };

const FEATURES: Feature[] = [
  {
    Icon: Calendar,
    title: "Agenda visual por profissional",
    desc: "Grade de horários com todas as profissionais lado a lado. Clique, arraste e agende em segundos. Funciona no celular.",
  },
  {
    Icon: FileText,
    title: "Prontuário digital completo",
    desc: "Anamnese, termos com assinatura digital, cartilhas pós-procedimento e galeria de fotos antes/depois.",
  },
  {
    Icon: TrendingUp,
    title: "Financeiro automático",
    desc: "Ao finalizar um atendimento, a receita já entra. DRE, fluxo de caixa diário e projeção de receita.",
  },
  {
    Icon: DollarSign,
    title: "Comissões sem planilha",
    desc: "Define o percentual de cada profissional e o sistema calcula tudo. Paga em lote com um clique.",
  },
  {
    Icon: BarChart3,
    title: "Relatórios que você entende",
    desc: "Desempenho por profissional, top serviços, melhores clientes e comparativo mensal.",
  },
  {
    Icon: Smartphone,
    title: "Funciona como app no celular",
    desc: "Instala direto no iPhone ou Android sem App Store. Rápido, sem anúncios, funciona offline.",
  },
];

const DORES = [
  "Agenda no papel ou em grupo de WhatsApp",
  "Prontuário físico que some ou se perde",
  "Não sabe quanto a clínica faturou no mês",
  "Comissão calculada na calculadora ou planilha",
  "Termos de consentimento sem organização",
  "Sistema caro que cobra por profissional",
];

const STEPS = [
  {
    title: "Cadastra sua clínica",
    desc: "Configure profissionais, serviços e horários em menos de 30 minutos.",
  },
  {
    title: "Começa a agendar",
    desc: "Agenda, confirma por WhatsApp e finaliza atendimentos pela tela.",
  },
  {
    title: "Acompanha os resultados",
    desc: "Receita, comissões e relatórios atualizados em tempo real.",
  },
];

const PRICING_FEATURES = [
  "Agenda visual para profissionais ilimitadas",
  "Prontuário digital com assinatura",
  "Financeiro automático e DRE",
  "Controle de comissões",
  "Relatórios detalhados",
  "Controle de estoque",
  "Funciona como app no celular",
  "Suporte via WhatsApp incluído",
];

const FAQS = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Beauty Clinic roda no navegador. Para usar como app no celular, basta abrir o site e tocar em 'Adicionar à tela de início' — funciona no iPhone e Android sem passar pela App Store.",
  },
  {
    q: "Quantas profissionais posso cadastrar?",
    a: "Ilimitadas, sem custo adicional. Diferente de outros sistemas, o Beauty Clinic cobra uma mensalidade fixa independente do tamanho da sua equipe.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Dados em servidores com backup automático. Cada profissional acessa só o que você autorizar — você controla as permissões individualmente.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem contrato mínimo, sem multa. Cancela pelo WhatsApp a qualquer momento.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Atendimento direto pelo WhatsApp. Resposta rápida em horário comercial. Sem chatbot, sem fila.",
  },
];

export default function ComercialPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#1a1a1a]">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e8dcc4]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5a4530] flex items-center justify-center text-white text-xs font-bold font-serif">
              BC
            </div>
            <span className="font-semibold text-[#5a4530] text-sm">Beauty Clinic</span>
          </div>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#B89968] hover:bg-[#9a7d50] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            <WhatsAppIcon />
            <span className="hidden sm:inline">Falar pelo WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#B89968]/12 text-[#9a7d50] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#B89968]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89968] flex-shrink-0" />
              Desenvolvido dentro de uma clínica real
            </div>
            <h1 className="text-4xl lg:text-[52px] font-serif font-bold leading-[1.1] text-[#1a1a1a] mb-5">
              Gestão completa para sua{" "}
              <span className="text-[#B89968]">clínica de estética</span>
            </h1>
            <p className="text-lg text-[#6b7280] leading-relaxed mb-8 max-w-lg">
              Agenda visual, prontuário digital, financeiro automático e
              comissões — tudo em um só sistema. Sem planilha, sem improvisar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#B89968] hover:bg-[#9a7d50] text-white font-semibold px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#B89968]/25 text-sm"
              >
                <WhatsAppIcon />
                Ver demonstração grátis
              </a>
              <a
                href="#funcionalidades"
                className="inline-flex items-center justify-center gap-2 border border-[#e8dcc4] hover:border-[#B89968]/60 text-[#5a4530] hover:text-[#B89968] font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
              >
                Ver funcionalidades ↓
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-[#e8dcc4]">
              <div>
                <div className="text-2xl font-bold text-[#5a4530]">350+</div>
                <div className="text-xs text-[#9a7d50] mt-0.5 leading-snug">clientes gerenciados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#5a4530]">14 meses</div>
                <div className="text-xs text-[#9a7d50] mt-0.5 leading-snug">em operação real</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#5a4530]">R$ 0</div>
                <div className="text-xs text-[#9a7d50] mt-0.5 leading-snug">por profissional extra</div>
              </div>
            </div>
          </div>

          {/* Mockup */}
          <div className="lg:pl-4">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── DORES ── */}
      <section className="bg-[#F9F7F4] border-y border-[#e8dcc4] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
              Reconhece alguma dessas situações?
            </h2>
            <p className="text-[#6b7280] text-sm">
              As dores mais comuns de quem gerencia clínica de estética hoje.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DORES.map((dor) => (
              <div
                key={dor}
                className="flex items-start gap-3 bg-white rounded-xl border border-[#e8dcc4] px-4 py-3.5 shadow-sm"
              >
                <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">✕</span>
                <span className="text-[#5a4530] text-sm leading-snug">{dor}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-[#B89968] font-semibold text-sm">
            O Beauty Clinic resolve tudo isso — em um único sistema.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-[#B89968] text-xs font-bold uppercase tracking-widest mb-3">
              Funcionalidades
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-3">
              Tudo que sua clínica precisa
            </h2>
            <p className="text-[#6b7280] max-w-lg mx-auto text-sm">
              Sem precisar de 4 sistemas diferentes. Sem taxa extra por profissional.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[#e8dcc4] bg-white p-6 hover:border-[#B89968]/50 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#B89968]/10 text-[#B89968] flex items-center justify-center mb-4 group-hover:bg-[#B89968] group-hover:text-white transition-colors duration-200">
                  <f.Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#F9F7F4] border-y border-[#e8dcc4] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-[#B89968] text-xs font-bold uppercase tracking-widest mb-3">
              Como funciona
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">
              Do zero ao funcionando em menos de 1 hora
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-6 left-[22%] right-[22%] h-px bg-[#e8dcc4]" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-[#B89968] text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-[#B89968]/30 relative z-10">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-[#1a1a1a] mb-2 text-sm">{s.title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#faf5ee] to-white rounded-3xl border border-[#e8dcc4] shadow-sm p-8 sm:p-12 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {["★", "★", "★", "★", "★"].map((s, i) => (
                <span key={i} className="text-[#B89968] text-lg">{s}</span>
              ))}
            </div>
            <blockquote className="text-xl sm:text-2xl font-serif text-[#5a4530] leading-relaxed mb-8 italic">
              &ldquo;Antes a agenda era no WhatsApp e comissão em planilha.
              Hoje o sistema faz tudo isso automaticamente. Não consigo mais
              imaginar gerenciar a clínica de outro jeito.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#B89968] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                L
              </div>
              <div className="text-left">
                <div className="font-semibold text-[#1a1a1a] text-sm">Dra. Lunna Bordin</div>
                <div className="text-xs text-[#9a7d50]">Biomédica · LB Beauty Clinic, Dourados/MS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-[#F9F7F4] border-y border-[#e8dcc4] py-20">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-[#B89968] text-xs font-bold uppercase tracking-widest mb-3">
              Preço
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
              Simples e direto
            </h2>
            <p className="text-[#6b7280] text-sm">
              Uma mensalidade. Profissionais ilimitadas. Sem surpresas.
            </p>
          </div>
          <div className="bg-white rounded-3xl border-2 border-[#B89968] shadow-xl shadow-[#B89968]/10 overflow-hidden">
            <div className="bg-[#B89968] text-white text-center py-3">
              <span className="text-xs font-bold uppercase tracking-widest">Plano único</span>
            </div>
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-lg text-[#9a7d50] font-medium">R$</span>
                  <span className="text-6xl font-bold text-[#1a1a1a] leading-none">39</span>
                  <span className="text-2xl text-[#9a7d50] font-medium mb-1">,90</span>
                </div>
                <div className="text-[#9a7d50] text-sm mt-2">por mês · cancela quando quiser</div>
              </div>
              <ul className="space-y-2.5 mb-8">
                {PRICING_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[#5a4530]">
                    <CheckCircle className="w-4 h-4 text-[#B89968] flex-shrink-0" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 bg-[#B89968] hover:bg-[#9a7d50] text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <WhatsAppIcon />
                Quero começar
              </a>
              <p className="text-center text-xs text-[#9a7d50] mt-3">
                Sem contrato mínimo · Suporte via WhatsApp incluído
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAL ── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="inline-block text-[#B89968] text-xs font-bold uppercase tracking-widest mb-3">
            Por que é diferente?
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-5">
            Criado dentro de uma clínica de estética real
          </h2>
          <p className="text-[#6b7280] leading-relaxed mb-4 text-sm max-w-xl mx-auto">
            O Beauty Clinic foi construído a partir da operação diária da{" "}
            <strong className="text-[#5a4530]">LB Beauty Clinic</strong> em Dourados/MS —
            atendendo harmonização facial, estética e unhas com múltiplas profissionais.
            Cada funcionalidade foi testada na prática antes de chegar aqui.
          </p>
          <p className="text-[#9a7d50] text-sm italic">
            Não é um sistema genérico adaptado para estética. É um sistema{" "}
            <em className="not-italic font-semibold text-[#B89968]">de</em> estética desde o primeiro dia.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#F9F7F4] border-y border-[#e8dcc4] py-20">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-serif font-bold text-center mb-10">
            Dúvidas frequentes
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white border border-[#e8dcc4] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none text-[#5a4530] font-medium hover:bg-[#faf8f4] transition-colors text-sm list-none">
                  {faq.q}
                  <span className="text-[#B89968] text-xl font-light flex-shrink-0 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 pt-1 text-xs text-[#6b7280] leading-relaxed border-t border-[#e8dcc4]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-gradient-to-br from-[#3d2a1a] via-[#5a4530] to-[#7a5c3a] text-white py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-4 leading-tight">
            Pronto para modernizar sua clínica?
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Veja o sistema funcionando ao vivo em menos de 15 minutos.
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-[#5a4530] hover:bg-[#faf5ee] font-semibold px-8 py-4 rounded-2xl text-base transition-colors shadow-2xl shadow-black/20"
          >
            <WhatsAppIcon className="text-green-600" />
            Falar pelo WhatsApp
          </a>
          <p className="mt-5 text-white/40 text-xs">Sem compromisso · Resposta rápida</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#e8dcc4] bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#5a4530]">
            <div className="w-6 h-6 rounded-lg bg-[#5a4530] flex items-center justify-center text-white font-bold" style={{ fontSize: 9 }}>
              BC
            </div>
            <span className="text-sm font-semibold">Beauty Clinic</span>
          </div>
          <p className="text-xs text-[#9a7d50] text-center">
            © {new Date().getFullYear()} Beauty Clinic · Sistema de gestão para clínicas de estética
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B89968] hover:text-[#9a7d50] transition-colors font-medium"
          >
            Contato →
          </a>
        </div>
      </footer>

    </div>
  );
}
