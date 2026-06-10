import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beauty Clinic — Sistema de gestão para clínicas de estética",
  description:
    "Agenda, prontuário digital, financeiro automático e comissões em um só sistema. Feito por quem tem clínica de estética.",
};

const WA_LINK =
  "https://wa.me/5567991859467?text=Ol%C3%A1!%20Vi%20sobre%20o%20Beauty%20Clinic%20e%20quero%20saber%20mais.";

const FEATURES = [
  {
    icon: "📅",
    title: "Agenda visual por profissional",
    desc: "Grade de horários com todas as profissionais lado a lado. Arrasta, clica e agenda em segundos. Funciona no celular.",
  },
  {
    icon: "📋",
    title: "Prontuário digital completo",
    desc: "Anamnese, termos de consentimento com assinatura digital, cartilhas pós-procedimento e galeria de fotos antes/depois.",
  },
  {
    icon: "💰",
    title: "Financeiro automático",
    desc: "Ao finalizar um atendimento, a receita já entra no sistema. Relatório DRE, fluxo diário e projeção de receita.",
  },
  {
    icon: "🤝",
    title: "Comissões sem planilha",
    desc: "Define o percentual de cada profissional e o sistema calcula tudo. Paga em lote com um clique.",
  },
  {
    icon: "📊",
    title: "Relatórios que você entende",
    desc: "Desempenho por profissional, top serviços, melhores clientes e comparativo mensal — sem precisar de contador.",
  },
  {
    icon: "📱",
    title: "Funciona como app no celular",
    desc: "Instala direto no iPhone ou Android sem passar pela App Store. Rápido, offline-capable e sem anúncios.",
  },
];

const DORES = [
  "Agenda no papel ou em grupo de WhatsApp",
  "Prontuário físico que some ou se perde",
  "Não sabe quanto a clínica faturou no mês",
  "Comissão calculada na calculadora ou planilha",
  "Termos de consentimento impressos e sem organização",
  "Sistema caro que cobra por profissional ou por atendimento",
];

export default function ComercialPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] font-sans text-[#5a4530]">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5a4530] via-[#7a5c3a] to-[#9a7d50] text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #e8dcc4 0%, transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur mb-6 text-2xl font-serif font-bold tracking-tight">
            BC
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight mb-5">
            Gestão completa para<br className="hidden sm:block" /> sua clínica de estética
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Agenda, prontuário digital, financeiro automático e comissões —
            tudo integrado. <strong className="text-white">Feito por quem tem clínica de estética</strong> e
            sabe a dor de gerenciar no improviso.
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#B89968] hover:bg-[#9a7d50] text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-black/20"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.86L.057 23.5l5.79-1.44A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.377l-.36-.214-3.436.855.9-3.334-.235-.373A9.818 9.818 0 1112 21.818z" />
            </svg>
            Quero conhecer →
          </a>
          <p className="mt-4 text-white/50 text-sm">Resposta rápida via WhatsApp · Sem compromisso</p>
        </div>
      </section>

      {/* ── DORES ────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-3">
          Reconhece alguma dessas situações?
        </h2>
        <p className="text-center text-[#9a7d50] mb-10">
          São as dores mais comuns de quem gerencia clínica de estética hoje.
        </p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {DORES.map((dor) => (
            <li key={dor} className="flex items-start gap-3 bg-white rounded-xl border border-[#e8dcc4] px-4 py-3 shadow-sm">
              <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
              <span className="text-[#5a4530]">{dor}</span>
            </li>
          ))}
        </ul>
        <p className="text-center mt-8 text-[#9a7d50] font-medium">
          O Beauty Clinic resolve tudo isso — em um único sistema.
        </p>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-[#e8dcc4]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-3">
            O que está incluído
          </h2>
          <p className="text-center text-[#9a7d50] mb-12">
            Tudo que sua clínica precisa, sem precisar de 4 sistemas diferentes.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#e8dcc4] bg-[#faf8f4] p-5 hover:border-[#B89968]/60 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-[#5a4530] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#9a7d50] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAL ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="inline-block bg-[#B89968]/10 border border-[#B89968]/30 rounded-2xl px-6 py-1.5 text-sm font-medium text-[#9a7d50] mb-5">
          Por que é diferente?
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold mb-5">
          Criado dentro de uma clínica de estética real
        </h2>
        <p className="text-[#9a7d50] leading-relaxed mb-6">
          O Beauty Clinic foi construído a partir da operação diária da <strong className="text-[#5a4530]">LB Beauty Clinic</strong> em Dourados/MS —
          atendendo harmonização facial, estética e unhas com múltiplas profissionais.
          Cada funcionalidade foi testada na prática antes de chegar aqui.
        </p>
        <p className="text-[#9a7d50] leading-relaxed">
          Não é um sistema genérico adaptado para estética. É um sistema <em>de</em> estética desde o primeiro dia.
        </p>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#5a4530] to-[#9a7d50] text-white">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4">
            Pronto para modernizar sua clínica?
          </h2>
          <p className="text-white/75 mb-8 text-lg">
            Fala com a gente pelo WhatsApp. Mostramos o sistema funcionando em menos de 15 minutos.
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#5a4530] hover:bg-[#faf5ee] font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.122 1.523 5.86L.057 23.5l5.79-1.44A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.377l-.36-.214-3.436.855.9-3.334-.235-.373A9.818 9.818 0 1112 21.818z" />
            </svg>
            Quero conhecer →
          </a>
          <p className="mt-4 text-white/50 text-sm">Sem compromisso · Resposta rápida</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="text-center py-8 text-xs text-[#9a7d50]">
        © {new Date().getFullYear()} Beauty Clinic · Sistema de gestão para clínicas de estética
      </footer>
    </div>
  );
}
