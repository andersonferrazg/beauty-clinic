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

// ─── Rosto Feminino — ilustração médica proporcional ────────────────────────
function FaceFeminino() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="520" fill="white" />

      {/* Pescoço */}
      <path d="M 181 398 L 174 468" stroke="rgba(29,29,29,0.22)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 219 398 L 226 468" stroke="rgba(29,29,29,0.22)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 88 470 C 124 465 154 463 174 468" stroke="rgba(29,29,29,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 226 468 C 246 463 276 465 312 470" stroke="rgba(29,29,29,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

      {/* Orelhas */}
      <path d="M 84 213 C 71 222 69 244 73 259 C 77 271 87 275 95 266" stroke="rgba(29,29,29,0.28)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 316 213 C 329 222 331 244 327 259 C 323 271 313 275 305 266" stroke="rgba(29,29,29,0.28)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>

      {/* Contorno do rosto — path com proporções naturais */}
      <path d="M 200 102 C 260 102 312 140 320 200 C 328 260 316 320 296 354 C 276 386 246 400 220 406 C 211 408 205 409 200 409 C 195 409 189 408 180 406 C 154 400 124 386 104 354 C 84 320 72 260 80 200 C 88 140 140 102 200 102 Z"
        fill="rgba(255,255,255,0.55)" stroke="rgba(29,29,29,0.32)" strokeWidth="1.3"/>

      {/* Sobrancelhas femininas — finas e arqueadas */}
      <path d="M 127 184 C 143 174 161 171 182 177" stroke="rgba(29,29,29,0.72)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M 218 177 C 239 171 257 174 273 184" stroke="rgba(29,29,29,0.72)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

      {/* Olho esquerdo */}
      <path d="M 118 205 C 130 195 145 192 161 192 C 177 192 190 195 200 205 C 190 215 177 218 161 218 C 145 218 130 215 118 205 Z"
        fill="rgba(255,255,255,0.96)" stroke="rgba(29,29,29,0.24)" strokeWidth="1"/>
      <path d="M 118 205 C 130 195 145 192 161 192 C 177 192 190 195 200 205"
        stroke="rgba(29,29,29,0.65)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="159" cy="205" r="8" fill="rgba(72,50,26,0.60)" stroke="rgba(29,29,29,0.28)" strokeWidth="0.9"/>
      <circle cx="159" cy="205" r="4.2" fill="rgba(10,5,0,0.92)"/>
      <circle cx="162" cy="201" r="1.9" fill="white"/>

      {/* Olho direito */}
      <path d="M 200 205 C 210 195 223 192 239 192 C 255 192 270 195 282 205 C 270 215 255 218 239 218 C 223 218 210 215 200 205 Z"
        fill="rgba(255,255,255,0.96)" stroke="rgba(29,29,29,0.24)" strokeWidth="1"/>
      <path d="M 200 205 C 210 195 223 192 239 192 C 255 192 270 195 282 205"
        stroke="rgba(29,29,29,0.65)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="241" cy="205" r="8" fill="rgba(72,50,26,0.60)" stroke="rgba(29,29,29,0.28)" strokeWidth="0.9"/>
      <circle cx="241" cy="205" r="4.2" fill="rgba(10,5,0,0.92)"/>
      <circle cx="244" cy="201" r="1.9" fill="white"/>

      {/* Nariz — linhas suaves */}
      <path d="M 190 214 C 187 238 185 262 188 278" stroke="rgba(29,29,29,0.18)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 210 214 C 213 238 215 262 212 278" stroke="rgba(29,29,29,0.18)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 188 278 C 188 290 194 295 200 295 C 206 295 212 290 212 278" stroke="rgba(29,29,29,0.26)" strokeWidth="1.2" fill="none"/>
      <path d="M 188 283 C 182 291 183 301 189 302 C 196 303 198 293 196 283" stroke="rgba(29,29,29,0.22)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 212 283 C 218 291 217 301 211 302 C 204 303 202 293 204 283" stroke="rgba(29,29,29,0.22)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>

      {/* Boca — lábios femininos cheios */}
      <path d="M 163 323 C 178 315 192 313 200 314 C 208 313 222 315 237 323"
        stroke="rgba(29,29,29,0.42)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 186 323 C 193 317 200 315 200 315 C 200 315 207 317 214 323"
        stroke="rgba(29,29,29,0.26)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M 163 323 C 178 336 200 341 237 323"
        stroke="rgba(29,29,29,0.42)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 163 323 C 178 336 200 341 237 323 C 222 315 208 313 200 314 C 192 313 178 315 163 323 Z"
        fill="rgba(200,130,110,0.18)" stroke="none"/>
    </g>
  );
}

// ─── Rosto Masculino — ilustração médica proporcional ───────────────────────
function FaceMasculino() {
  return (
    <g>
      <rect x="0" y="0" width="400" height="520" fill="white" />

      {/* Pescoço — mais largo */}
      <path d="M 176 412 L 168 468" stroke="rgba(29,29,29,0.22)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 224 412 L 232 468" stroke="rgba(29,29,29,0.22)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 82 470 C 118 465 150 463 168 468" stroke="rgba(29,29,29,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 232 468 C 250 463 282 465 318 470" stroke="rgba(29,29,29,0.16)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

      {/* Orelhas — maiores */}
      <path d="M 78 218 C 64 228 62 250 67 266 C 71 279 83 283 92 274" stroke="rgba(29,29,29,0.28)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 322 218 C 336 228 338 250 333 266 C 329 279 317 283 308 274" stroke="rgba(29,29,29,0.28)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>

      {/* Contorno do rosto masculino — mandíbula mais larga e definida */}
      <path d="M 200 100 C 265 100 318 140 326 204 C 334 268 320 330 298 366 C 274 402 240 418 212 422 C 207 423 203 424 200 424 C 197 424 193 423 188 422 C 160 418 126 402 102 366 C 80 330 66 268 74 204 C 82 140 135 100 200 100 Z"
        fill="rgba(255,255,255,0.55)" stroke="rgba(29,29,29,0.32)" strokeWidth="1.3"/>

      {/* Sobrancelhas masculinas — retas e mais grossas */}
      <path d="M 118 188 C 138 182 158 180 180 183" stroke="rgba(29,29,29,0.76)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M 220 183 C 242 180 262 182 282 188" stroke="rgba(29,29,29,0.76)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>

      {/* Olho esquerdo */}
      <path d="M 112 212 C 125 201 141 198 158 198 C 175 198 189 201 200 212 C 189 222 175 226 158 226 C 141 226 125 222 112 212 Z"
        fill="rgba(255,255,255,0.96)" stroke="rgba(29,29,29,0.24)" strokeWidth="1"/>
      <path d="M 112 212 C 125 201 141 198 158 198 C 175 198 189 201 200 212"
        stroke="rgba(29,29,29,0.68)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <circle cx="156" cy="212" r="8" fill="rgba(62,42,20,0.62)" stroke="rgba(29,29,29,0.28)" strokeWidth="0.9"/>
      <circle cx="156" cy="212" r="4.2" fill="rgba(10,5,0,0.92)"/>
      <circle cx="159" cy="208" r="1.9" fill="white"/>

      {/* Olho direito */}
      <path d="M 200 212 C 211 201 225 198 242 198 C 259 198 275 201 288 212 C 275 222 259 226 242 226 C 225 226 211 222 200 212 Z"
        fill="rgba(255,255,255,0.96)" stroke="rgba(29,29,29,0.24)" strokeWidth="1"/>
      <path d="M 200 212 C 211 201 225 198 242 198 C 259 198 275 201 288 212"
        stroke="rgba(29,29,29,0.68)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <circle cx="244" cy="212" r="8" fill="rgba(62,42,20,0.62)" stroke="rgba(29,29,29,0.28)" strokeWidth="0.9"/>
      <circle cx="244" cy="212" r="4.2" fill="rgba(10,5,0,0.92)"/>
      <circle cx="247" cy="208" r="1.9" fill="white"/>

      {/* Nariz — mais largo */}
      <path d="M 189 221 C 185 246 183 270 187 287" stroke="rgba(29,29,29,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 211 221 C 215 246 217 270 213 287" stroke="rgba(29,29,29,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 187 287 C 187 300 193 306 200 306 C 207 306 213 300 213 287" stroke="rgba(29,29,29,0.28)" strokeWidth="1.3" fill="none"/>
      <path d="M 187 293 C 180 302 181 312 188 313 C 196 314 198 303 196 292" stroke="rgba(29,29,29,0.24)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 213 293 C 220 302 219 312 212 313 C 204 314 202 303 204 292" stroke="rgba(29,29,29,0.24)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

      {/* Boca — lábios finos e retos */}
      <path d="M 158 338 C 176 330 193 328 200 329 C 207 328 224 330 242 338"
        stroke="rgba(29,29,29,0.44)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 158 338 C 176 350 200 354 242 338"
        stroke="rgba(29,29,29,0.40)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 158 338 Q 200 340 242 338" stroke="rgba(29,29,29,0.28)" strokeWidth="1" fill="none"/>
      <path d="M 158 338 C 176 350 200 354 242 338 C 224 330 207 328 200 329 C 193 328 176 330 158 338 Z"
        fill="rgba(160,95,75,0.13)" stroke="none"/>

      {/* Barba sugerida — sutil */}
      <g fill="rgba(29,29,29,0.10)">
        <circle cx="160" cy="355" r="1.4"/><circle cx="173" cy="364" r="1.4"/>
        <circle cx="186" cy="372" r="1.4"/><circle cx="200" cy="375" r="1.4"/>
        <circle cx="214" cy="372" r="1.4"/><circle cx="227" cy="364" r="1.4"/>
        <circle cx="240" cy="355" r="1.4"/><circle cx="152" cy="345" r="1.1"/>
        <circle cx="248" cy="345" r="1.1"/>
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
