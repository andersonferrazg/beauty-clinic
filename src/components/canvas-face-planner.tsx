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

// ─── Rosto Feminino — ilustração médica com tom de pele ─────────────────────
function FaceFeminino() {
  return (
    <g>
      <defs>
        <radialGradient id="sfF" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef4ec"/>
          <stop offset="65%" stopColor="#f0d8c0"/>
          <stop offset="100%" stopColor="#e0c0a0"/>
        </radialGradient>
        <radialGradient id="blushF" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8a090" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#e8a090" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="irisF" cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#7090b0"/>
          <stop offset="100%" stopColor="#3a5870"/>
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="520" fill="white"/>

      {/* Pescoço — preenchimento pele */}
      <path d="M 184 398 C 184 428 178 452 176 468 L 224 468 C 222 452 216 428 216 398 Z" fill="url(#sfF)" opacity="0.75"/>
      <path d="M 184 398 L 176 468" stroke="#c8a080" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 216 398 L 224 468" stroke="#c8a080" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 85 470 C 120 464 152 462 176 468" stroke="#c8a080" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 224 468 C 248 462 280 464 315 470" stroke="#c8a080" strokeWidth="1" fill="none" strokeLinecap="round"/>

      {/* Orelhas */}
      <path d="M 84 218 C 70 228 68 250 72 265 C 76 278 87 282 95 273" stroke="#c8a080" strokeWidth="1.4" fill="#f0d4b4" strokeLinecap="round"/>
      <path d="M 316 218 C 330 228 332 250 328 265 C 324 278 313 282 305 273" stroke="#c8a080" strokeWidth="1.4" fill="#f0d4b4" strokeLinecap="round"/>

      {/* Rosto — preenchimento pele */}
      <path d="M 200 88 C 252 88 306 120 320 182 C 332 230 326 288 308 324 C 288 364 260 386 238 394 C 224 400 212 402 200 402 C 188 402 176 400 162 394 C 140 386 112 364 92 324 C 74 288 68 230 80 182 C 94 120 148 88 200 88 Z"
        fill="url(#sfF)" stroke="#c8a080" strokeWidth="1.3"/>

      {/* Blush bochechas */}
      <ellipse cx="115" cy="272" rx="36" ry="22" fill="url(#blushF)"/>
      <ellipse cx="285" cy="272" rx="36" ry="22" fill="url(#blushF)"/>

      {/* Cabelo escuro — preenchimento */}
      <path d="M 80 182 C 80 155 96 124 122 104 C 150 82 174 78 200 77 C 226 78 250 82 278 104 C 304 124 320 155 320 182 C 308 160 290 138 268 124 C 248 112 226 106 200 105 C 174 106 152 112 132 124 C 110 138 92 160 80 182 Z"
        fill="#1e1008" opacity="0.9"/>

      {/* Sobrancelhas — finas arqueadas */}
      <path d="M 125 190 C 142 180 161 177 184 183" stroke="#1e1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 216 183 C 239 177 258 180 275 190" stroke="#1e1008" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Olho esquerdo — globo branco */}
      <path d="M 115 205 C 128 193 144 190 161 190 C 178 190 192 193 202 205 C 192 217 178 220 161 220 C 144 220 128 217 115 205 Z" fill="white" stroke="none"/>
      {/* Íris */}
      <circle cx="159" cy="206" r="9.5" fill="url(#irisF)"/>
      <circle cx="159" cy="206" r="5.8" fill="#080606"/>
      <circle cx="163" cy="201" r="2.6" fill="white"/>
      <circle cx="156" cy="209" r="0.9" fill="rgba(255,255,255,0.55)"/>
      {/* Pálpebra superior — delineador */}
      <path d="M 115 205 C 128 193 144 190 161 190 C 178 190 192 193 202 205" stroke="#100808" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      {/* Pálpebra inferior */}
      <path d="M 115 205 C 128 217 144 220 161 220 C 178 220 192 217 202 205" stroke="#a07868" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      {/* Cílios superiores */}
      <path d="M 117 204 C 114 199 113 196 112 194 M 124 200 C 122 195 121 192 120 190 M 132 197 C 130 192 130 189 130 187 M 141 195 C 140 190 140 187 141 185 M 150 194 C 150 189 151 186 152 184 M 160 194 C 161 189 162 186 164 184 M 169 195 C 171 190 173 188 175 186 M 178 198 C 181 193 183 191 185 190 M 186 202 C 190 198 192 196 194 195"
        stroke="#100808" strokeWidth="1.3" fill="none" strokeLinecap="round"/>

      {/* Olho direito — espelho */}
      <path d="M 198 205 C 208 193 222 190 241 190 C 258 190 274 193 285 205 C 274 217 258 220 241 220 C 222 220 208 217 198 205 Z" fill="white" stroke="none"/>
      <circle cx="243" cy="206" r="9.5" fill="url(#irisF)"/>
      <circle cx="243" cy="206" r="5.8" fill="#080606"/>
      <circle cx="247" cy="201" r="2.6" fill="white"/>
      <circle cx="240" cy="209" r="0.9" fill="rgba(255,255,255,0.55)"/>
      <path d="M 198 205 C 208 193 222 190 241 190 C 258 190 274 193 285 205" stroke="#100808" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <path d="M 198 205 C 208 217 222 220 241 220 C 258 220 274 217 285 205" stroke="#a07868" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M 283 204 C 286 199 287 196 288 194 M 276 200 C 278 195 279 192 280 190 M 268 197 C 270 192 270 189 270 187 M 259 195 C 260 190 260 187 259 185 M 250 194 C 249 189 249 186 248 184 M 240 194 C 239 189 238 186 236 184 M 231 195 C 229 190 227 188 225 186 M 222 198 C 219 193 217 191 215 190 M 214 202 C 210 198 208 196 206 195"
        stroke="#100808" strokeWidth="1.3" fill="none" strokeLinecap="round"/>

      {/* Nariz */}
      <path d="M 191 213 C 188 237 186 260 189 276" stroke="#c09070" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 209 213 C 212 237 214 260 211 276" stroke="#c09070" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 189 276 C 189 288 194 293 200 293 C 206 293 211 288 211 276" stroke="#c09070" strokeWidth="1.4" fill="none"/>
      <path d="M 189 281 C 183 289 184 299 190 300 C 197 301 199 291 197 281" stroke="#c09070" strokeWidth="1.2" fill="#e8c0a0" fillOpacity="0.15" strokeLinecap="round"/>
      <path d="M 211 281 C 217 289 216 299 210 300 C 203 301 201 291 203 281" stroke="#c09070" strokeWidth="1.2" fill="#e8c0a0" fillOpacity="0.15" strokeLinecap="round"/>

      {/* Boca — lábios femininos */}
      <path d="M 163 320 C 179 312 193 310 200 311 C 207 310 221 312 237 320" stroke="#c06858" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M 184 320 C 192 314 200 312 200 312 C 200 312 208 314 216 320" stroke="#c06858" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 163 320 C 179 333 200 337 237 320" stroke="#c06858" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M 163 320 C 179 333 200 337 237 320 C 221 312 207 310 200 311 C 193 310 179 312 163 320 Z" fill="#d07868" fillOpacity="0.40"/>
      <path d="M 163 320 Q 200 322 237 320" stroke="#a04838" strokeWidth="1" fill="none" opacity="0.6"/>
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
