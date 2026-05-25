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

// Resumo agrupado por produto
function resumirPorProduto(marcacoes: Marcacao[]) {
  const grupos = new Map<string, { nome: string; cor: string; total: number; unidade: string; qtdPontos: number }>();
  for (const m of marcacoes) {
    const g = grupos.get(m.produtoId);
    if (g) {
      g.total += m.dosagem;
      g.qtdPontos += 1;
    } else {
      grupos.set(m.produtoId, {
        nome: m.produtoNome,
        cor: m.produtoCor,
        total: m.dosagem,
        unidade: m.unidade,
        qtdPontos: 1,
      });
    }
  }
  return Array.from(grupos.values());
}

export function CanvasFacePlanner({ marcacoes, onChange, produtos, readOnly = false }: Props) {
  const [produtoAtivoId, setProdutoAtivoId] = useState<string | null>(null);
  const [pontoEditando, setPontoEditando] = useState<Marcacao | null>(null);
  const [dosagemInput, setDosagemInput] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const produtoAtivo = produtos.find((p) => p.id === produtoAtivoId);

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (readOnly || !produtoAtivo || !svgRef.current) return;
    // Não criar ponto se clicou em um ponto existente (deixa o handler do círculo cuidar)
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
      {/* Paleta de produtos (oculta em readOnly) */}
      {!readOnly && (
        <div>
          <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2">
            Selecione um produto pra marcar
          </p>
          {produtos.length === 0 ? (
            <div className="text-sm text-[#9a7d50] bg-[#faf5ee] border border-[#e8dcc4] rounded-lg p-3">
              Nenhum produto injetável cadastrado. Vá em <strong>Produtos & Estoque</strong> e marque
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

      {/* Canvas SVG da face */}
      <div className="relative bg-gradient-to-br from-[#faf5ee] to-[#f5ede0] rounded-2xl border-2 border-[#e8dcc4] overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 400 500"
          className={cn(
            "w-full h-auto block",
            !readOnly && produtoAtivo && "cursor-crosshair"
          )}
          onClick={handleSvgClick}
          style={{ maxHeight: 500 }}
        >
          {/* SVG estilizado de rosto frontal */}
          <g stroke="#9a7d50" strokeWidth="1.5" fill="none" opacity="0.7">
            {/* Contorno do rosto (oval) */}
            <ellipse cx="200" cy="250" rx="120" ry="170" fill="#fff4e3" fillOpacity="0.4" />
            {/* Cabelo (linha superior) */}
            <path d="M 90 180 Q 200 80 310 180" fill="#e8dcc4" fillOpacity="0.6" />
            {/* Sobrancelha esquerda */}
            <path d="M 130 200 Q 155 190 180 200" strokeWidth="2" />
            {/* Sobrancelha direita */}
            <path d="M 220 200 Q 245 190 270 200" strokeWidth="2" />
            {/* Olho esquerdo */}
            <ellipse cx="155" cy="225" rx="18" ry="8" fill="#fff" fillOpacity="0.5" />
            <circle cx="155" cy="225" r="3" fill="#5a4530" stroke="none" />
            {/* Olho direito */}
            <ellipse cx="245" cy="225" rx="18" ry="8" fill="#fff" fillOpacity="0.5" />
            <circle cx="245" cy="225" r="3" fill="#5a4530" stroke="none" />
            {/* Nariz */}
            <path d="M 200 240 L 195 290 Q 200 300 205 290 Z" />
            {/* Boca */}
            <path d="M 165 340 Q 200 360 235 340" strokeWidth="2" />
            <path d="M 165 340 Q 200 330 235 340" strokeWidth="1.5" />
            {/* Linha do queixo sugerida */}
            <path d="M 130 360 Q 200 420 270 360" opacity="0.3" />
          </g>

          {/* Linhas guias suaves de regiões (testa, glabela, pés de galinha, etc) */}
          <g stroke="#B89968" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" fill="none">
            <line x1="80" y1="170" x2="320" y2="170" />
            <text x="85" y="165" fontSize="9" fill="#9a7d50" stroke="none">TESTA</text>
            <line x1="180" y1="195" x2="220" y2="195" />
            <text x="183" y="190" fontSize="8" fill="#9a7d50" stroke="none">GLABELA</text>
          </g>

          {/* Pontos marcados */}
          {marcacoes.map((m) => {
            const cx = m.x * 400;
            const cy = m.y * 500;
            return (
              <g key={m.id}>
                {/* Halo */}
                <circle cx={cx} cy={cy} r="11" fill={m.produtoCor} opacity="0.25" />
                {/* Ponto */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill={m.produtoCor}
                  stroke="#fff"
                  strokeWidth="2"
                  data-ponto={m.id}
                  className={cn(!readOnly && "cursor-pointer")}
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirEdicaoPonto(m);
                  }}
                />
                {/* Label de dosagem */}
                <g
                  transform={`translate(${cx + 10}, ${cy - 12})`}
                  className={cn(!readOnly && "cursor-pointer")}
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirEdicaoPonto(m);
                  }}
                >
                  <rect
                    x="0"
                    y="0"
                    rx="3"
                    ry="3"
                    width={`${(m.dosagem.toString().length + m.unidade.length) * 5.5 + 8}`}
                    height="14"
                    fill="#1a1208"
                  />
                  <text
                    x="4"
                    y="10"
                    fontSize="9"
                    fontWeight="600"
                    fill="#fff"
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
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

      {/* Popover de edição (modal flutuante centrado) */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") salvarPonto();
                  }}
                  placeholder={pontoEditando.unidade === "ml" ? "0,3" : "5"}
                  className="w-full h-10 px-3 rounded-md border border-[#B89968]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                />
              </div>

              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">Região (opcional)</label>
                <input
                  type="text"
                  value={pontoEditando.regiao ?? ""}
                  onChange={(e) =>
                    setPontoEditando({ ...pontoEditando, regiao: e.target.value })
                  }
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
