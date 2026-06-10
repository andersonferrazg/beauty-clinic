import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conceitos de Logo — Beauty Clinic",
};

// ─────────────────────────────────────────────────────────
//  1. ENTRELAÇADO — dois arcos 270° cruzando (Chanel CC)
// ─────────────────────────────────────────────────────────
function Entrelacado({ s = 120 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Arco 1: abre para direita, 270° antihorário */}
      {/* Centro (48,50) r=28 — de (68,70) até (68,30) */}
      <path
        d="M 68 70 A 28 28 0 1 0 68 30"
        fill="none"
        stroke="#B89968"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Arco 2: abre para esquerda, 270° horário */}
      {/* Centro (52,50) r=28 — de (32,70) até (32,30) */}
      <path
        d="M 32 70 A 28 28 0 1 1 32 30"
        fill="none"
        stroke="#5a4530"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
//  2. CAMÉLIA — 6 elipses finas cruzadas (Chanel camellia)
// ─────────────────────────────────────────────────────────
function Camelia({ s = 120 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* 6 pétalas elípticas finas sobrepostas */}
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="50"
          rx="10"
          ry="32"
          fill="none"
          stroke="#B89968"
          strokeWidth="1.4"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      {/* Círculo central */}
      <circle cx="50" cy="50" r="5" fill="none" stroke="#B89968" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="2.5" fill="#B89968" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
//  3. FLEUR — estrela de 4 pontas (fleur-de-lis LV)
// ─────────────────────────────────────────────────────────
function Fleur({ s = 120 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fleur-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF7A" />
          <stop offset="100%" stopColor="#9a7d50" />
        </linearGradient>
      </defs>
      {/* 4 pétalas principais */}
      {[0, 90, 180, 270].map((angle) => (
        <path
          key={angle}
          d="M 50 50 C 62 37, 63 13, 50 7 C 37 13, 38 37, 50 50 Z"
          fill="url(#fleur-g)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      {/* 4 pétalas diagonais menores */}
      {[45, 135, 225, 315].map((angle) => (
        <path
          key={angle}
          d="M 50 50 C 56 43, 57 28, 50 23 C 43 28, 44 43, 50 50 Z"
          fill="#9a7d50"
          opacity="0.7"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      {/* Miolo */}
      <circle cx="50" cy="50" r="7" fill="#3d2a1a" />
      <circle cx="50" cy="50" r="4" fill="#D4AF7A" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
//  4. LOSANGO REFINADO — diamante fino com cruz interna
// ─────────────────────────────────────────────────────────
function LosangoRefinado({ s = 120 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Diamante externo — traço fino */}
      <polygon
        points="50,3 97,50 50,97 3,50"
        fill="none"
        stroke="#B89968"
        strokeWidth="1.8"
      />
      {/* Diamante interno — traço ainda mais fino */}
      <polygon
        points="50,14 86,50 50,86 14,50"
        fill="none"
        stroke="#B89968"
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Cruz central elegante */}
      <line x1="50" y1="20" x2="50" y2="80" stroke="#B89968" strokeWidth="0.7" opacity="0.5" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="#B89968" strokeWidth="0.7" opacity="0.5" />
      {/* Ponto central */}
      <circle cx="50" cy="50" r="3.5" fill="#B89968" />
      {/* 4 pontos nos vértices internos */}
      <circle cx="50" cy="14" r="1.5" fill="#B89968" opacity="0.7" />
      <circle cx="86" cy="50" r="1.5" fill="#B89968" opacity="0.7" />
      <circle cx="50" cy="86" r="1.5" fill="#B89968" opacity="0.7" />
      <circle cx="14" cy="50" r="1.5" fill="#B89968" opacity="0.7" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
//  5. MONOGRAMA BC — círculo duplo com iniciais em destaque
// ─────────────────────────────────────────────────────────
function MonogramaBC({ s = 120 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Anel externo */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#B89968" strokeWidth="1.5" />
      {/* Anel interno */}
      <circle cx="50" cy="50" r="41" fill="none" stroke="#B89968" strokeWidth="0.5" opacity="0.5" />
      {/* Linha horizontal decorativa */}
      <line x1="18" y1="58" x2="82" y2="58" stroke="#B89968" strokeWidth="0.7" opacity="0.5" />
      {/* B - ligeiramente à esquerda */}
      <text
        x="36"
        y="56"
        textAnchor="middle"
        fontSize="32"
        fontWeight="300"
        fill="#5a4530"
        fontFamily="Georgia, 'Times New Roman', serif"
      >B</text>
      {/* C - ligeiramente à direita */}
      <text
        x="63"
        y="56"
        textAnchor="middle"
        fontSize="32"
        fontWeight="300"
        fill="#B89968"
        fontFamily="Georgia, 'Times New Roman', serif"
      >C</text>
    </svg>
  );
}

// ── Dados ─────────────────────────────────────────────────

const LOGOS = [
  {
    id: 1,
    name: "Entrelaçado",
    ref: "Inspirado em Chanel CC",
    desc: "Dois arcos de 270° que se cruzam, um dourado e um escuro. A mesma lógica do ícone da Chanel — simples, impossível de esquecer.",
    Icon: Entrelacado,
    bg: "#FAFAF8",
    highlight: "#B89968",
  },
  {
    id: 2,
    name: "Camélia",
    ref: "Flor-assinatura da Chanel",
    desc: "6 elipses finas sobrepostas formando uma camélia geométrica — a flor símbolo da Chanel, versão Beauty Clinic. Elegância pura.",
    Icon: Camelia,
    bg: "#FAFAF8",
    highlight: "#B89968",
  },
  {
    id: 3,
    name: "Fleur",
    ref: "Inspirado em LV fleur-de-lis",
    desc: "Estrela de 8 pontas em dois tamanhos, centro escuro com detalhe dourado. A fleur-de-lis da Louis Vuitton reimaginada para estética.",
    Icon: Fleur,
    bg: "#FAFAF8",
    highlight: "#B89968",
  },
  {
    id: 4,
    name: "Losango",
    ref: "Minimalismo de alta joalheria",
    desc: "Dois diamantes concêntricos em traço finíssimo com detalhes nos vértices. Como uma embalagem de perfume Dior — luxo no silêncio.",
    Icon: LosangoRefinado,
    bg: "#FAFAF8",
    highlight: "#B89968",
  },
  {
    id: 5,
    name: "Monograma BC",
    ref: "Monograma de grife",
    desc: "B e C em tipografia serif leve dentro de um anel duplo. Como as iniciais de Balenciaga ou Burberry — a letra É o símbolo.",
    Icon: MonogramaBC,
    bg: "#FAFAF8",
    highlight: "#B89968",
  },
];

// ── Page ──────────────────────────────────────────────────

export default function LogosPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0EAE0" }}>

      {/* Header */}
      <div className="bg-white border-b border-[#e8dcc4] px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <a
            href="/comercial"
            className="text-xs text-[#9a7d50] hover:text-[#B89968] transition-colors mb-3 inline-block"
          >
            ← Voltar
          </a>
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a]">
            Conceitos de Logo — Beauty Clinic
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">
            Direção: <strong>luxo e premium</strong>, referência LV / Chanel, símbolo sem texto.
            Me diz um número de 1 a 5 — refino o escolhido até ficar perfeito.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOGOS.map((logo) => (
          <div
            key={logo.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e8dcc4] flex flex-col"
          >
            {/* Preview grande */}
            <div
              className="flex items-center justify-center py-12"
              style={{ backgroundColor: logo.bg }}
            >
              <logo.Icon s={130} />
            </div>

            {/* Preview em fundo escuro */}
            <div
              className="flex items-center justify-center py-6"
              style={{ backgroundColor: "#2e1e0f" }}
            >
              <logo.Icon s={60} />
            </div>

            {/* Info */}
            <div className="px-5 py-5 flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: logo.highlight }}
                >
                  #{logo.id}
                </span>
                <h3 className="font-bold text-[#1a1a1a]">{logo.name}</h3>
              </div>
              <div className="text-xs text-[#B89968] italic mb-2">{logo.ref}</div>
              <p className="text-xs text-[#6b7280] leading-relaxed">{logo.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pb-10 text-xs text-[#9a7d50]">
        Nenhum agrada? Me conta o que chegou mais perto e o que mudaria — ajusto na hora.
      </div>
    </div>
  );
}
