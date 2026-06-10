import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conceitos de Logo — Beauty Clinic",
};

// ── Ícones SVG ────────────────────────────────────────────

function Petala({ s = 100 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <path
          key={i}
          d="M 50 50 C 64 37, 65 14, 50 7 C 35 14, 36 37, 50 50 Z"
          fill={i % 2 === 0 ? "#C4A06A" : "#9a7d50"}
          transform={`rotate(${angle} 50 50)`}
          opacity={i % 2 === 0 ? "1" : "0.8"}
        />
      ))}
      <circle cx="50" cy="50" r="8" fill="#4a3018" />
      <circle cx="50" cy="50" r="5" fill="#D4AF7A" />
    </svg>
  );
}

function Brasao({ s = 100 }: { s?: number }) {
  const dots = Array.from({ length: 16 }, (_, i) => {
    const rad = ((i * 22.5) - 90) * (Math.PI / 180);
    return { x: +(50 + 43.5 * Math.cos(rad)).toFixed(2), y: +(50 + 43.5 * Math.sin(rad)).toFixed(2) };
  });
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#2e1e0f" />
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="#B89968" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#B89968" strokeWidth="0.4" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="1.1" fill="#B89968" />
      ))}
      <text
        x="50" y="38"
        textAnchor="middle"
        fontSize="9"
        fill="#B89968"
        fontFamily="Georgia, serif"
        letterSpacing="3"
      >BEAUTY</text>
      <text
        x="50" y="58"
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill="#D4AF7A"
        fontFamily="Georgia, serif"
      >BC</text>
      <line x1="28" y1="63" x2="72" y2="63" stroke="#B89968" strokeWidth="0.6" />
      <text
        x="50" y="73"
        textAnchor="middle"
        fontSize="7.5"
        fill="#9a7d50"
        fontFamily="Georgia, serif"
        letterSpacing="2"
      >CLINIC</text>
    </svg>
  );
}

function Diamante({ s = 100 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra / profundidade */}
      <polygon points="50,4 96,50 50,96 4,50" fill="#9a7d50" transform="translate(2,2)" opacity="0.3" />
      {/* Diamante principal */}
      <polygon points="50,4 96,50 50,96 4,50" fill="#B89968" />
      {/* Reflexo no topo */}
      <polygon points="50,4 96,50 50,50" fill="#D4AF7A" opacity="0.4" />
      {/* Abertura interna */}
      <polygon points="50,20 80,50 50,80 20,50" fill="white" />
      {/* Linha decorativa interna */}
      <polygon points="50,23 77,50 50,77 23,50" fill="none" stroke="#e8dcc4" strokeWidth="0.5" />
      {/* Letras */}
      <text
        x="50" y="57"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#5a4530"
        fontFamily="Georgia, serif"
        letterSpacing="-1"
      >BC</text>
    </svg>
  );
}

function Icone({ s = 100 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Fundo arredondado — estilo app icon */}
      <rect x="4" y="4" width="92" height="92" rx="24" fill="#3d2a1a" />
      {/* Faixa dourada inferior */}
      <rect x="4" y="66" width="92" height="30" rx="0" fill="#4a3220" />
      <rect x="4" y="66" width="92" height="30" rx="24" fill="#4a3220" />
      {/* Texto BC grande */}
      <text
        x="50" y="60"
        textAnchor="middle"
        fontSize="40"
        fontWeight="800"
        fill="#D4AF7A"
        fontFamily="Georgia, serif"
      >BC</text>
      {/* Linha divisória dourada */}
      <line x1="20" y1="67" x2="80" y2="67" stroke="#B89968" strokeWidth="1" />
      {/* Tagline interna */}
      <text
        x="50" y="82"
        textAnchor="middle"
        fontSize="8.5"
        fill="#B89968"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="3"
      >BEAUTY</text>
    </svg>
  );
}

function Coroa({ s = 100 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Sombra */}
      <path
        d="M 8 77 L 8 44 L 26 61 L 36 25 L 50 47 L 64 25 L 74 61 L 92 44 L 92 77 Z"
        fill="#7a5c38"
        transform="translate(0,3)"
        opacity="0.3"
      />
      {/* Corpo da coroa */}
      <path
        d="M 8 74 L 8 44 L 26 61 L 36 25 L 50 47 L 64 25 L 74 61 L 92 44 L 92 74 Z"
        fill="#B89968"
      />
      {/* Reflexo topo */}
      <path
        d="M 36 25 L 50 47 L 64 25 L 74 61 L 92 44 L 92 55 L 74 61 L 64 35 L 50 55 L 36 35 L 26 61 L 8 55 L 8 44 L 26 61 Z"
        fill="#D4AF7A"
        opacity="0.45"
      />
      {/* Faixa base */}
      <rect x="8" y="70" width="84" height="8" rx="3" fill="#9a7d50" />
      <rect x="8" y="70" width="84" height="4" rx="3" fill="#B89968" />
      {/* Gemas nas pontas */}
      <circle cx="36" cy="25" r="5" fill="#D4AF7A" />
      <circle cx="36" cy="25" r="3" fill="white" />
      <circle cx="36" cy="25" r="1.5" fill="#B89968" />

      <circle cx="64" cy="25" r="5" fill="#D4AF7A" />
      <circle cx="64" cy="25" r="3" fill="white" />
      <circle cx="64" cy="25" r="1.5" fill="#B89968" />

      {/* Gema central maior */}
      <circle cx="50" cy="47" r="6.5" fill="#D4AF7A" />
      <circle cx="50" cy="47" r="4" fill="white" />
      <circle cx="50" cy="47" r="2" fill="#B89968" />
    </svg>
  );
}

// ── Dados dos logos ───────────────────────────────────────

const LOGOS = [
  {
    id: 1,
    name: "Pétala",
    tagline: "Elegante e feminino",
    desc: "Flor geométrica de 5 pétalas em tons dourados. Visual delicado e sofisticado — padrão de marcas de beleza premium internacionais. Funciona muito bem em tons escuros e claros.",
    Icon: Petala,
    cardBg: "#fff",
    previewBg: "#faf5ee",
    textColor: "#5a4530",
  },
  {
    id: 2,
    name: "Brasão",
    tagline: "Clássico e luxuoso",
    desc: "Brasão circular com anel de pontos dourados, tipografia serif e hierarquia visual interna. Transmite exclusividade e credibilidade — como marcas de alta joalheria.",
    Icon: Brasao,
    cardBg: "#2e1e0f",
    previewBg: "#1e110a",
    textColor: "#D4AF7A",
  },
  {
    id: 3,
    name: "Diamante",
    tagline: "Geométrico e preciso",
    desc: "Losango dourado com abertura interna limpa e reflexo de luz. Sugere precisão, valor e modernidade. Escala perfeitamente de favicon até banner.",
    Icon: Diamante,
    cardBg: "#fff",
    previewBg: "#f5f0e8",
    textColor: "#5a4530",
  },
  {
    id: 4,
    name: "Ícone App",
    tagline: "Moderno e direto",
    desc: "Estilo app icon — fundo escuro arredondado com iniciais em dourado e faixa inferior. Funciona perfeitamente como ícone no iPhone/Android e dá cara de sistema digital sério.",
    Icon: Icone,
    cardBg: "#fff",
    previewBg: "#faf5ee",
    textColor: "#5a4530",
  },
  {
    id: 5,
    name: "Coroa",
    tagline: "Prestígio e exclusividade",
    desc: "Coroa geométrica com gemas douradas em três pontas. Posiciona o sistema como o topo do mercado. Arrojado, marcante, difícil de esquecer.",
    Icon: Coroa,
    cardBg: "#fff",
    previewBg: "#f5f0e8",
    textColor: "#5a4530",
  },
];

// ── Wordmark completo (ícone + texto) ─────────────────────

function FullLogo({
  Icon,
  textColor,
  bg,
}: {
  Icon: React.ComponentType<{ s?: number }>;
  textColor: string;
  bg: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 rounded-xl"
      style={{ backgroundColor: bg }}
    >
      <Icon s={36} />
      <div>
        <div
          className="font-bold text-base leading-tight font-serif"
          style={{ color: textColor }}
        >
          Beauty Clinic
        </div>
        <div className="text-xs mt-0.5" style={{ color: textColor, opacity: 0.6 }}>
          Sistema de gestão
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function LogosPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8dcc4] px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <a
            href="/comercial"
            className="text-xs text-[#9a7d50] hover:text-[#B89968] transition-colors mb-3 inline-block"
          >
            ← Voltar para a landing page
          </a>
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a]">
            Conceitos de Logo — Beauty Clinic
          </h1>
          <p className="text-[#6b7280] text-sm mt-1">
            5 opções. Me diga qual combina mais com o estilo da clínica — refino o escolhido depois.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LOGOS.map((logo) => (
          <div
            key={logo.id}
            className="rounded-2xl overflow-hidden shadow-md border border-[#e8dcc4] flex flex-col"
          >
            {/* Icon preview */}
            <div
              className="flex items-center justify-center py-10"
              style={{ backgroundColor: logo.previewBg }}
            >
              <logo.Icon s={120} />
            </div>

            {/* Full logo preview */}
            <div className="px-4 pt-4 pb-2" style={{ backgroundColor: logo.cardBg }}>
              <FullLogo
                Icon={logo.Icon}
                textColor={logo.textColor}
                bg={logo.previewBg}
              />
            </div>

            {/* Info */}
            <div className="bg-white flex-1 px-5 py-4 border-t border-[#e8dcc4]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#B89968] uppercase tracking-widest">
                  #{logo.id}
                </span>
                <h3 className="font-bold text-[#1a1a1a]">{logo.name}</h3>
                <span className="text-xs text-[#9a7d50] italic ml-auto">
                  {logo.tagline}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">{logo.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-[#9a7d50]">
        Escolha um número (1–5) e eu refino até ficar perfeito.
      </div>
    </div>
  );
}
