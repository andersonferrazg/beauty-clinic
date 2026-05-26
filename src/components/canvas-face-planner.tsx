"use client";

import { useState, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Marcacao = {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoCor: string;
  x: number; // 0-1 normalizado sobre o SVG
  y: number; // 0-1 normalizado
  dosagem: number;
  unidade: string; // "ui" | "ml" | "un" | "unidade"
  regiao?: string;
};

export type ProdutoInjetavel = {
  id: string;
  nome: string;
  precoVenda: number;
  unidadeMedida: string | null;
  corMarcacao: string | null;
};

type Props = {
  marcacoes: Marcacao[];
  onChange?: (m: Marcacao[]) => void;
  produtos: ProdutoInjetavel[];
  readOnly?: boolean;
};

function gerarId() {
  return `ponto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resumirPorProduto(marcacoes: Marcacao[]) {
  const grupos = new Map<string, { nome: string; cor: string; total: number; unidade: string; qtdPontos: number }>();
  for (const m of marcacoes) {
    const g = grupos.get(m.produtoId);
    if (g) { g.total += m.dosagem; g.qtdPontos += 1; }
    else grupos.set(m.produtoId, { nome: m.produtoNome, cor: m.produtoCor, total: m.dosagem, unidade: m.unidade, qtdPontos: 1 });
  }
  return Array.from(grupos.values());
}

// ─── Rosto Feminino — SVG minimal estilo médico ─────────────────────────────
function FaceFeminino() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="520" fill="white" />

      {/* Pescoço */}
      <path d="M 178 388 L 170 478" stroke="rgba(29,29,29,0.28)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 222 388 L 230 478" stroke="rgba(29,29,29,0.28)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 90 480 Q 170 472 170 478" stroke="rgba(29,29,29,0.20)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 230 478 Q 230 472 310 480" stroke="rgba(29,29,29,0.20)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

      {/* Orelhas */}
      <path d="M 100 225 C 88 232 86 250 90 264 C 93 273 100 276 107 268" stroke="rgba(29,29,29,0.30)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 300 225 C 312 232 314 250 310 264 C 307 273 300 276 293 268" stroke="rgba(29,29,29,0.30)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

      {/* Oval do rosto */}
      <ellipse cx="200" cy="245" rx="100" ry="145" fill="rgba(255,255,255,0.55)" stroke="rgba(29,29,29,0.32)" strokeWidth="1.1"/>

      {/* Sobrancelhas — arqueadas (feminino) */}
      <path d="M 134 177 C 148 168 164 165 180 170" stroke="rgba(29,29,29,0.68)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 220 170 C 236 165 252 168 266 177" stroke="rgba(29,29,29,0.68)" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* Olho esquerdo */}
      <path d="M 130 200 C 140 192 152 189 163 189 C 174 189 184 192 192 200 C 184 208 174 211 163 211 C 152 211 140 208 130 200 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(29,29,29,0.30)" strokeWidth="0.9"/>
      <path d="M 130 200 C 140 192 152 189 163 189 C 174 189 184 192 192 200" stroke="rgba(29,29,29,0.65)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="161" cy="200" r="6" fill="rgba(90,65,35,0.55)" stroke="rgba(29,29,29,0.35)" strokeWidth="0.8"/>
      <circle cx="161" cy="200" r="3" fill="rgba(15,8,0,0.85)"/>
      <circle cx="163" cy="197" r="1.4" fill="white"/>

      {/* Olho direito */}
      <path d="M 208 200 C 216 192 228 189 237 189 C 248 189 258 192 270 200 C 258 208 248 211 237 211 C 228 211 216 208 208 200 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(29,29,29,0.30)" strokeWidth="0.9"/>
      <path d="M 208 200 C 216 192 228 189 237 189 C 248 189 258 192 270 200" stroke="rgba(29,29,29,0.65)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <circle cx="239" cy="200" r="6" fill="rgba(90,65,35,0.55)" stroke="rgba(29,29,29,0.35)" strokeWidth="0.8"/>
      <circle cx="239" cy="200" r="3" fill="rgba(15,8,0,0.85)"/>
      <circle cx="241" cy="197" r="1.4" fill="white"/>

      {/* Nariz */}
      <path d="M 190 208 C 187 232 185 254 188 270" stroke="rgba(29,29,29,0.22)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 210 208 C 213 232 215 254 212 270" stroke="rgba(29,29,29,0.22)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 188 270 C 188 279 193 283 200 283 C 207 283 212 279 212 270" stroke="rgba(29,29,29,0.28)" strokeWidth="1.1" fill="none"/>
      <path d="M 188 273 C 183 280 184 288 189 289 C 195 290 196 282 195 275" stroke="rgba(29,29,29,0.25)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 212 273 C 217 280 216 288 211 289 C 205 290 204 282 205 275" stroke="rgba(29,29,29,0.25)" strokeWidth="1" fill="none" strokeLinecap="round"/>

      {/* Boca — lábios femininos */}
      <path d="M 168 318 C 181 311 192 309 200 310 C 208 309 219 311 232 318" stroke="rgba(29,29,29,0.42)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 191 318 C 196 313 200 311 200 311 C 200 311 204 313 209 318" stroke="rgba(29,29,29,0.28)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 168 318 C 181 329 200 333 232 318" stroke="rgba(29,29,29,0.42)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 168 318 C 181 329 200 333 232 318 C 219 311 208 309 200 310 C 192 309 181 311 168 318 Z" fill="rgba(195,130,110,0.16)" stroke="none"/>

      {/* Linhas guia de regiões */}
      <g stroke="#B89968" strokeWidth="0.6" strokeDasharray="3.5 2.5" opacity="0.28" fill="none">
        <line x1="108" y1="163" x2="292" y2="163"/>
        <line x1="108" y1="200" x2="128" y2="200"/>
        <line x1="272" y1="200" x2="292" y2="200"/>
        <line x1="102" y1="238" x2="126" y2="238"/>
        <line x1="274" y1="238" x2="298" y2="238"/>
        <path d="M 183 288 Q 162 312 165 340"/>
        <path d="M 217 288 Q 238 312 235 340"/>
      </g>

      {/* Labels das regiões */}
      <g fill="#a08858" fontSize="7.5" fontFamily="system-ui,sans-serif" stroke="none" opacity="0.85">
        <text x="114" y="159">TESTA</text>
        <text x="178" y="155">GLABELA</text>
        <text x="58" y="196">TEMPORAL</text>
        <text x="298" y="196">TEMPORAL</text>
        <text x="53" y="234">PÉ DE</text>
        <text x="51" y="244">GALINHA</text>
        <text x="302" y="234">PÉ DE</text>
        <text x="300" y="244">GALINHA</text>
        <text x="50" y="322">NASO-</text>
        <text x="46" y="332">GENIANO</text>
        <text x="302" y="322">NASO-</text>
        <text x="298" y="332">GENIANO</text>
        <text x="179" y="358">LÁBIO</text>
        <text x="177" y="390">MENTO</text>
      </g>
    </g>
  );
}

// ─── Rosto Masculino — SVG minimal estilo médico ────────────────────────────
function FaceMasculino() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="520" fill="white" />

      {/* Pescoço — mais largo */}
      <path d="M 172 390 L 162 478" stroke="rgba(29,29,29,0.28)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 228 390 L 238 478" stroke="rgba(29,29,29,0.28)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 80 480 Q 162 472 162 478" stroke="rgba(29,29,29,0.20)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 238 478 Q 238 472 320 480" stroke="rgba(29,29,29,0.20)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

      {/* Orelhas — um pouco maiores */}
      <path d="M 94 225 C 82 234 80 254 84 270 C 87 280 96 284 104 276" stroke="rgba(29,29,29,0.30)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 306 225 C 318 234 320 254 316 270 C 313 280 304 284 296 276" stroke="rgba(29,29,29,0.30)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

      {/* Oval do rosto — mandíbula mais larga/quadrada */}
      <path d="M 200 100 C 268 100 308 138 314 204 C 318 254 312 310 296 352 C 278 396 244 420 200 422 C 156 420 122 396 104 352 C 88 310 82 254 86 204 C 92 138 132 100 200 100 Z"
        fill="rgba(255,255,255,0.55)" stroke="rgba(29,29,29,0.32)" strokeWidth="1.1"/>

      {/* Sobrancelhas — retas/planas (masculino) */}
      <path d="M 124 178 C 140 174 158 172 178 174" stroke="rgba(29,29,29,0.72)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 222 174 C 242 172 260 174 276 178" stroke="rgba(29,29,29,0.72)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Olho esquerdo — ligeiramente mais fechado */}
      <path d="M 118 205 C 128 196 142 192 156 192 C 170 192 182 196 192 205 C 182 213 170 216 156 216 C 142 216 128 213 118 205 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(29,29,29,0.30)" strokeWidth="0.9"/>
      <path d="M 118 205 C 128 196 142 192 156 192 C 170 192 182 196 192 205" stroke="rgba(29,29,29,0.65)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="155" cy="205" r="6.5" fill="rgba(80,55,28,0.55)" stroke="rgba(29,29,29,0.35)" strokeWidth="0.8"/>
      <circle cx="155" cy="205" r="3.5" fill="rgba(15,8,0,0.85)"/>
      <circle cx="157" cy="202" r="1.5" fill="white"/>

      {/* Olho direito */}
      <path d="M 208 205 C 218 196 232 192 244 192 C 258 192 270 196 282 205 C 270 213 258 216 244 216 C 232 216 218 213 208 205 Z" fill="rgba(255,255,255,0.9)" stroke="rgba(29,29,29,0.30)" strokeWidth="0.9"/>
      <path d="M 208 205 C 218 196 232 192 244 192 C 258 192 270 196 282 205" stroke="rgba(29,29,29,0.65)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="245" cy="205" r="6.5" fill="rgba(80,55,28,0.55)" stroke="rgba(29,29,29,0.35)" strokeWidth="0.8"/>
      <circle cx="245" cy="205" r="3.5" fill="rgba(15,8,0,0.85)"/>
      <circle cx="247" cy="202" r="1.5" fill="white"/>

      {/* Nariz — mais largo */}
      <path d="M 188 214 C 184 238 182 260 185 278" stroke="rgba(29,29,29,0.22)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 212 214 C 216 238 218 260 215 278" stroke="rgba(29,29,29,0.22)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 185 278 C 185 290 192 295 200 295 C 208 295 215 290 215 278" stroke="rgba(29,29,29,0.30)" strokeWidth="1.2" fill="none"/>
      <path d="M 185 282 C 179 290 180 299 186 300 C 193 301 195 291 194 282" stroke="rgba(29,29,29,0.26)" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 215 282 C 221 290 220 299 214 300 C 207 301 205 291 206 282" stroke="rgba(29,29,29,0.26)" strokeWidth="1" fill="none" strokeLinecap="round"/>

      {/* Boca — lábios finos e retos (masculino) */}
      <path d="M 162 334 C 178 328 192 326 200 327 C 208 326 222 328 238 334" stroke="rgba(29,29,29,0.42)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 162 334 C 178 344 200 347 238 334" stroke="rgba(29,29,29,0.38)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 162 334 Q 200 336 238 334" stroke="rgba(29,29,29,0.30)" strokeWidth="0.9" fill="none"/>
      <path d="M 162 334 C 178 344 200 347 238 334 C 222 328 208 326 200 327 C 192 326 178 328 162 334 Z" fill="rgba(175,110,90,0.14)" stroke="none"/>

      {/* Barba sugerida — pontos sutis */}
      <g fill="rgba(29,29,29,0.12)">
        <circle cx="165" cy="348" r="1.2"/><circle cx="175" cy="356" r="1.2"/><circle cx="185" cy="362" r="1.2"/>
        <circle cx="195" cy="365" r="1.2"/><circle cx="205" cy="365" r="1.2"/><circle cx="215" cy="362" r="1.2"/>
        <circle cx="225" cy="356" r="1.2"/><circle cx="235" cy="348" r="1.2"/>
        <circle cx="158" cy="338" r="1"/><circle cx="242" cy="338" r="1"/>
      </g>

      {/* Linhas guia de regiões */}
      <g stroke="#B89968" strokeWidth="0.6" strokeDasharray="3.5 2.5" opacity="0.28" fill="none">
        <line x1="100" y1="165" x2="300" y2="165"/>
        <line x1="100" y1="205" x2="116" y2="205"/>
        <line x1="284" y1="205" x2="300" y2="205"/>
        <line x1="96" y1="248" x2="116" y2="248"/>
        <line x1="284" y1="248" x2="304" y2="248"/>
        <path d="M 180 300 Q 158 326 162 356"/>
        <path d="M 220 300 Q 242 326 238 356"/>
      </g>

      {/* Labels das regiões */}
      <g fill="#a08858" fontSize="7.5" fontFamily="system-ui,sans-serif" stroke="none" opacity="0.85">
        <text x="108" y="161">TESTA</text>
        <text x="178" y="157">GLABELA</text>
        <text x="52" y="201">TEMPORAL</text>
        <text x="302" y="201">TEMPORAL</text>
        <text x="46" y="244">PÉ DE</text>
        <text x="44" y="254">GALINHA</text>
        <text x="306" y="244">PÉ DE</text>
        <text x="304" y="254">GALINHA</text>
        <text x="43" y="330">NASO-</text>
        <text x="39" y="340">GENIANO</text>
        <text x="306" y="330">NASO-</text>
        <text x="302" y="340">GENIANO</text>
        <text x="179" y="372">LÁBIO</text>
        <text x="178" y="400">MENTO</text>
      </g>
    </g>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export function CanvasFacePlanner({ marcacoes, onChange, produtos, readOnly = false }: Props) {
  const [tipoRosto, setTipoRosto] = useState<"feminino" | "masculino">("feminino");
  const [produtoAtivoId, setProdutoAtivoId] = useState<string | null>(null);
  const [pontoEditando, setPontoEditando] = useState<Marcacao | null>(null);
  const [dosagemInput, setDosagemInput] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const produtoAtivo = produtos.find((p) => p.id === produtoAtivoId);

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (readOnly || !produtoAtivo || !svgRef.current) return;
    const target = e.target as Element;
    if (target.tagName === "circle" && target.getAttribute("data-ponto")) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const novo: Marcacao = {
      id: gerarId(),
      produtoId: produtoAtivo.id,
      produtoNome: produtoAtivo.nome,
      produtoCor: produtoAtivo.corMarcacao ?? "#A78BFA",
      x,
      y,
      dosagem: 0,
      unidade: produtoAtivo.unidadeMedida ?? "unidade",
    };
    setPontoEditando(novo);
    setDosagemInput("");
  }

  function salvarPonto() {
    if (!pontoEditando) return;
    const dosagem = parseFloat(dosagemInput.replace(",", "."));
    if (isNaN(dosagem) || dosagem <= 0) return;

    const novo = { ...pontoEditando, dosagem };
    const existe = marcacoes.find((m) => m.id === novo.id);
    const novaLista = existe
      ? marcacoes.map((m) => (m.id === novo.id ? novo : m))
      : [...marcacoes, novo];
    onChange?.(novaLista);
    setPontoEditando(null);
    setDosagemInput("");
  }

  function removerPonto(id: string) {
    onChange?.(marcacoes.filter((m) => m.id !== id));
    setPontoEditando(null);
    setDosagemInput("");
  }

  function abrirEdicaoPonto(m: Marcacao) {
    if (readOnly) return;
    setPontoEditando(m);
    setDosagemInput(m.dosagem.toString().replace(".", ","));
  }

  function limparTudo() {
    if (readOnly) return;
    if (!confirm("Apagar todas as marcações?")) return;
    onChange?.([]);
  }

  const resumo = resumirPorProduto(marcacoes);

  return (
    <div className="space-y-3">
      {/* Toggle feminino / masculino */}
      <div className="flex items-center gap-2">
        {!readOnly && (
          <div className="flex rounded-lg border border-[#e8dcc4] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setTipoRosto("feminino")}
              className={cn(
                "px-3 py-1.5 font-medium transition-colors",
                tipoRosto === "feminino"
                  ? "bg-[#B89968] text-white"
                  : "text-[#9a7d50] hover:bg-[#faf5ee]"
              )}
            >
              ♀ Feminino
            </button>
            <button
              type="button"
              onClick={() => setTipoRosto("masculino")}
              className={cn(
                "px-3 py-1.5 font-medium transition-colors border-l border-[#e8dcc4]",
                tipoRosto === "masculino"
                  ? "bg-[#B89968] text-white"
                  : "text-[#9a7d50] hover:bg-[#faf5ee]"
              )}
            >
              ♂ Masculino
            </button>
          </div>
        )}
        {readOnly && marcacoes.length > 0 && (
          <span className="text-xs text-[#9a7d50] capitalize">{tipoRosto}</span>
        )}
      </div>

      {/* Paleta de produtos (oculta em readOnly) */}
      {!readOnly && (
        <div>
          <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">
            Selecione um produto pra marcar
          </p>
          {produtos.length === 0 ? (
            <div className="text-sm text-[#9a7d50] bg-[#faf5ee] border border-[#e8dcc4] rounded-lg p-3">
              Nenhum produto injetável cadastrado. Vá em <strong>Produtos &amp; Estoque</strong> e marque
              &quot;É injetável&quot; nos produtos que aparecem no planejador.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {produtos.map((p) => {
                const ativo = p.id === produtoAtivoId;
                const cor = p.corMarcacao ?? "#A78BFA";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProdutoAtivoId(ativo ? null : p.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all",
                      ativo
                        ? "border-[#5a4530] bg-white shadow-md scale-105"
                        : "border-transparent bg-[#faf5ee] hover:bg-white"
                    )}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                    <span className="text-[#5a4530]">{p.nome}</span>
                    <span className="text-[#9a7d50] text-[10px]">({p.unidadeMedida})</span>
                  </button>
                );
              })}
            </div>
          )}
          {produtoAtivo && (
            <p className="text-xs text-[#B89968] mt-2">
              ✏️ Clique no rosto para marcar um ponto de {produtoAtivo.nome}
            </p>
          )}
        </div>
      )}

      {/* Canvas SVG */}
      <div className="relative bg-gradient-to-br from-[#faf5ee] to-[#f5ede0] rounded-2xl border-2 border-[#e8dcc4] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 400 520"
          className={cn(
            "w-full h-auto block",
            !readOnly && produtoAtivo && "cursor-crosshair"
          )}
          onClick={handleSvgClick}
          style={{ maxHeight: 520 }}
        >
          <defs>
            <style>{`
              @keyframes cp-halo-pulse {
                0%   { opacity: 0.55; transform: scale(1); }
                100% { opacity: 0;    transform: scale(2.8); }
              }
              .cp-halo {
                animation: cp-halo-pulse 1.8s ease-out infinite;
                transform-box: fill-box;
                transform-origin: center;
              }
            `}</style>
          </defs>

          {tipoRosto === "feminino" ? <FaceFeminino /> : <FaceMasculino />}

          {/* Pontos marcados */}
          {marcacoes.map((m, idx) => {
            const cx = m.x * 400;
            const cy = m.y * 520;
            return (
              <g key={m.id}>
                <circle cx={cx} cy={cy} r="14" fill={m.produtoCor} className="cp-halo" style={{ animationDelay: `${(idx % 5) * 0.36}s` }} />
                <circle
                  cx={cx}
                  cy={cy}
                  r="6.5"
                  fill={m.produtoCor}
                  stroke="#fff"
                  strokeWidth="2"
                  data-ponto={m.id}
                  className={cn(!readOnly && "cursor-pointer")}
                  onClick={(e) => { e.stopPropagation(); abrirEdicaoPonto(m); }}
                />
                <g
                  transform={`translate(${cx + 10}, ${cy - 13})`}
                  className={cn(!readOnly && "cursor-pointer")}
                  onClick={(e) => { e.stopPropagation(); abrirEdicaoPonto(m); }}
                >
                  <rect
                    x="0" y="0" rx="3" ry="3"
                    width={`${(m.dosagem.toString().length + m.unidade.length) * 5.5 + 8}`}
                    height="14"
                    fill="#1D1D1D"
                  />
                  <text x="4" y="10" fontSize="9" fontWeight="600" fill="#fff" style={{ fontFamily: "system-ui, sans-serif" }}>
                    {m.dosagem}{m.unidade}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Contagem + limpar */}
        {!readOnly && marcacoes.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <span className="text-xs bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[#5a4530] shadow-sm">
              {marcacoes.length} {marcacoes.length === 1 ? "marcação" : "marcações"}
            </span>
            <button
              type="button"
              onClick={limparTudo}
              className="text-xs bg-white/90 hover:bg-red-50 backdrop-blur px-2 py-1 rounded-full text-red-500 shadow-sm flex items-center gap-1"
            >
              <Trash2 size={11} /> Limpar
            </button>
          </div>
        )}
      </div>

      {/* Resumo */}
      {resumo.length > 0 && (
        <div className="bg-white border border-[#e8dcc4] rounded-xl p-3">
          <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">
            Resumo do planejamento
          </p>
          <ul className="space-y-1.5">
            {resumo.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#5a4530]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.cor }} />
                <span className="font-medium">{r.nome}:</span>
                <span>
                  {r.total.toString().replace(".", ",")}{r.unidade} em {r.qtdPontos}{" "}
                  {r.qtdPontos === 1 ? "ponto" : "pontos"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Popover de edição */}
      {pontoEditando && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPontoEditando(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#5a4530] flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pontoEditando.produtoCor }} />
                {pontoEditando.produtoNome}
              </h3>
              <button onClick={() => setPontoEditando(null)} className="text-[#9a7d50] hover:text-[#5a4530]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">
                  Dosagem ({pontoEditando.unidade})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={dosagemInput}
                  onChange={(e) => setDosagemInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") salvarPonto(); }}
                  placeholder={pontoEditando.unidade === "ml" ? "0,3" : "5"}
                  className="w-full h-10 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                />
              </div>

              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">Região (opcional)</label>
                <input
                  type="text"
                  value={pontoEditando.regiao ?? ""}
                  onChange={(e) => setPontoEditando({ ...pontoEditando, regiao: e.target.value })}
                  placeholder="Ex: testa, glabela, lábio superior..."
                  className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#e8dcc4]">
              {marcacoes.find((m) => m.id === pontoEditando.id) ? (
                <button
                  onClick={() => removerPonto(pontoEditando.id)}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={13} /> Remover ponto
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setPontoEditando(null)}
                  className="px-3 py-1.5 rounded-md text-sm text-[#9a7d50] hover:bg-[#faf5ee]"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarPonto}
                  className="px-4 py-1.5 rounded-md text-sm font-medium bg-[#B89968] hover:bg-[#9a7d50] text-white"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
