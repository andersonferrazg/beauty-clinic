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

// ─── Rosto Feminino — foto real extraída do PDF da clínica ───────────────────
function FaceFeminino() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="520" fill="white" />
      <image
        href="/face-real-feminino.png"
        x={0}
        y={0}
        width={400}
        height={400}
        preserveAspectRatio="xMidYMid meet"
      />
    </g>
  );
}

// ─── SVG Rosto Masculino ───────────────────────────────────────────────────
function FaceMasculino() {
  return (
    <g>
      {/* Cabelo curto — linha capilar */}
      <path
        d="M 200 68 C 252 64 306 82 332 112 C 344 130 338 108 322 82 C 298 44 256 26 200 24 C 144 26 102 44 78 82 C 62 108 56 130 68 112 C 94 82 148 64 200 68 Z"
        fill="#8a6438" fillOpacity="0.48" stroke="#7a5428" strokeWidth="1"
      />
      {/* Contorno do cabelo */}
      <path d="M 68 112 C 62 135 60 162 65 188" stroke="#8a6438" strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round"/>
      <path d="M 332 112 C 338 135 340 162 335 188" stroke="#8a6438" strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round"/>

      {/* Pescoço — mais largo */}
      <path d="M 170 436 L 162 515" stroke="#9a7d50" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M 230 436 L 238 515" stroke="#9a7d50" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="162" y1="515" x2="238" y2="515" stroke="#9a7d50" strokeWidth="1"/>

      {/* Rosto — mandíbula mais quadrada */}
      <path
        d="M 200 72 C 262 72 322 118 334 194 C 344 262 335 338 314 382 C 292 418 246 436 200 438 C 154 436 108 418 86 382 C 65 338 56 262 66 194 C 78 118 138 72 200 72 Z"
        fill="#fff8f0" fillOpacity="0.78" stroke="#9a7d50" strokeWidth="1.8" strokeLinejoin="round"
      />

      {/* Orelha esquerda */}
      <path d="M 66 248 C 52 248 44 264 48 280 C 51 294 64 302 74 294 C 79 290 78 284 74 280" stroke="#9a7d50" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      {/* Orelha direita */}
      <path d="M 334 248 C 348 248 356 264 352 280 C 349 294 336 302 326 294 C 321 290 322 284 326 280" stroke="#9a7d50" strokeWidth="1.3" fill="none" strokeLinecap="round"/>

      {/* Sobrancelhas — retas/planas (masculino) */}
      <path d="M 108 214 C 130 208 155 206 180 210" stroke="#5a3818" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 220 210 C 245 206 270 208 292 214" stroke="#5a3818" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Sulco superciliar mais profundo */}
      <path d="M 108 222 C 130 218 155 217 180 220" stroke="#5a3818" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
      <path d="M 220 220 C 245 217 270 218 292 222" stroke="#5a3818" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* Olho esquerdo */}
      <path
        d="M 107 252 C 120 238 137 232 155 232 C 173 232 188 238 201 252 C 188 265 173 270 155 270 C 137 270 120 265 107 252 Z"
        fill="white" fillOpacity="0.92" stroke="#9a7d50" strokeWidth="1.2"
      />
      {/* Pálpebra superior esquerda — mais reta */}
      <path d="M 107 252 C 120 238 137 232 155 232 C 173 232 188 238 201 252" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Íris esquerda */}
      <circle cx="154" cy="252" r="9.5" fill="#6a5030" fillOpacity="0.65" stroke="#2a1008" strokeWidth="0.8"/>
      <circle cx="154" cy="252" r="5" fill="#150800" stroke="none"/>
      <circle cx="157" cy="247" r="2.2" fill="white" stroke="none"/>

      {/* Olho direito */}
      <path
        d="M 199 252 C 212 238 229 232 245 232 C 263 232 278 238 293 252 C 278 265 263 270 245 270 C 229 270 212 265 199 252 Z"
        fill="white" fillOpacity="0.92" stroke="#9a7d50" strokeWidth="1.2"
      />
      {/* Pálpebra superior direita */}
      <path d="M 199 252 C 212 238 229 232 245 232 C 263 232 278 238 293 252" stroke="#2a1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Íris direita */}
      <circle cx="246" cy="252" r="9.5" fill="#6a5030" fillOpacity="0.65" stroke="#2a1008" strokeWidth="0.8"/>
      <circle cx="246" cy="252" r="5" fill="#150800" stroke="none"/>
      <circle cx="249" cy="247" r="2.2" fill="white" stroke="none"/>

      {/* Nariz — mais largo */}
      <path d="M 172 276 C 168 296 168 316 176 328" stroke="#9a7d50" strokeWidth="1" fill="none" opacity="0.55" strokeLinecap="round"/>
      <path d="M 228 276 C 232 296 232 316 224 328" stroke="#9a7d50" strokeWidth="1" fill="none" opacity="0.55" strokeLinecap="round"/>
      {/* Ponta do nariz — mais larga */}
      <path d="M 176 328 C 176 340 186 348 200 348 C 214 348 224 340 224 328" stroke="#9a7d50" strokeWidth="1.4" fill="none"/>
      {/* Narina esquerda — mais larga */}
      <path d="M 176 332 C 170 341 171 351 178 353 C 187 355 193 345 192 334" stroke="#9a7d50" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Narina direita — mais larga */}
      <path d="M 224 332 C 230 341 229 351 222 353 C 213 355 207 345 208 334" stroke="#9a7d50" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

      {/* Lábios — mais finos e retos (masculino) */}
      <path d="M 161 372 C 178 364 196 361 200 362 C 204 361 222 364 239 372" stroke="#9a5a3a" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      {/* Lábio inferior */}
      <path d="M 161 372 C 178 382 200 385 239 372" stroke="#9a5a3a" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      <path d="M 161 372 C 178 381 200 383 239 372" fill="#e0a882" fillOpacity="0.30" stroke="none"/>
      {/* Linha do meio */}
      <path d="M 161 372 Q 200 374 239 372" stroke="#8a5030" strokeWidth="1" fill="none" opacity="0.75"/>

      {/* Barba sugerida — hachuras sutis */}
      <g stroke="#9a7d50" strokeWidth="0.7" strokeLinecap="round" opacity="0.22">
        <line x1="168" y1="390" x2="168" y2="396"/>
        <line x1="178" y1="395" x2="178" y2="401"/>
        <line x1="188" y1="398" x2="188" y2="404"/>
        <line x1="198" y1="399" x2="198" y2="405"/>
        <line x1="208" y1="398" x2="208" y2="404"/>
        <line x1="218" y1="395" x2="218" y2="401"/>
        <line x1="228" y1="390" x2="228" y2="396"/>
        <line x1="152" y1="375" x2="152" y2="381"/>
        <line x1="244" y1="375" x2="244" y2="381"/>
        <line x1="140" y1="360" x2="140" y2="366"/>
        <line x1="256" y1="360" x2="256" y2="366"/>
      </g>

      {/* Queixo — mais definido/quadrado */}
      <path d="M 175 420 Q 200 434 225 420" stroke="#9a7d50" strokeWidth="1" fill="none" opacity="0.35"/>
      <path d="M 168 405 Q 200 412 232 405" stroke="#9a7d50" strokeWidth="0.7" fill="none" opacity="0.25"/>

      {/* Linhas guia de regiões */}
      <g stroke="#B89968" strokeWidth="0.6" strokeDasharray="4 3" opacity="0.32" fill="none">
        <line x1="80" y1="182" x2="320" y2="182"/>
        <line x1="80" y1="218" x2="108" y2="218"/>
        <line x1="292" y1="218" x2="320" y2="218"/>
        <line x1="75" y1="252" x2="106" y2="252"/>
        <line x1="294" y1="252" x2="325" y2="252"/>
        <path d="M 168 352 Q 144 378 150 406" />
        <path d="M 232 352 Q 256 378 250 406" />
      </g>

      {/* Labels das regiões */}
      <g fill="#a08858" fontSize="7.5" fontFamily="system-ui,sans-serif" stroke="none" opacity="0.85">
        <text x="88" y="178">TESTA</text>
        <text x="180" y="210">GLABELA</text>
        <text x="68" y="214">TEMPORAL</text>
        <text x="295" y="214">TEMPORAL</text>
        <text x="60" y="258">PÉ DE</text>
        <text x="58" y="268">GALINHA</text>
        <text x="297" y="258">PÉ DE</text>
        <text x="295" y="268">GALINHA</text>
        <text x="57" y="342">NASO-</text>
        <text x="53" y="352">GENIANO</text>
        <text x="270" y="342">NASO-</text>
        <text x="266" y="352">GENIANO</text>
        <text x="176" y="404">LÁBIO</text>
        <text x="178" y="432">MENTO</text>
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
          {tipoRosto === "feminino" ? <FaceFeminino /> : <FaceMasculino />}

          {/* Pontos marcados */}
          {marcacoes.map((m) => {
            const cx = m.x * 400;
            const cy = m.y * 520;
            return (
              <g key={m.id}>
                <circle cx={cx} cy={cy} r="12" fill={m.produtoCor} opacity="0.22" />
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
                    fill="#1a1208"
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
