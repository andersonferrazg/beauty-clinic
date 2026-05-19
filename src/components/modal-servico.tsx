"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  servicoId?: string;
};

const CORES = [
  "#B89968", "#9a7d50", "#c084fc", "#34d399", "#60a5fa",
  "#f87171", "#fb923c", "#facc15", "#a3e635", "#22d3ee",
];

const CATEGORIAS_SUGERIDAS = [
  "Cílios — Aplicação", "Cílios — Manutenção", "Cílios — Retirada",
  "Sobrancelha", "Massagem", "Limpeza de Pele",
  "Unhas", "Procedimentos Estéticos",
  "Botox & Toxina", "Bioestimuladores", "Microagulhamento",
  "Harmonização Facial", "Consulta & Avaliação",
];

const DURACOES = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1h", value: 60 },
  { label: "1h15", value: 75 },
  { label: "1h30", value: 90 },
  { label: "2h", value: 120 },
  { label: "2h30", value: 150 },
  { label: "3h", value: 180 },
  { label: "4h", value: 240 },
];

const CAMPOS_VAZIOS = {
  nome: "",
  categoria: "",
  duracaoMin: 60,
  preco: "",
  precoVariavel: false,
  cor: "#B89968",
  descricao: "",
};

export function ModalServico({ aberto, onFechar, onSalvo, servicoId }: Props) {
  const ehEdicao = !!servicoId;
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");
  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  useEffect(() => {
    if (!aberto) {
      setCampos(CAMPOS_VAZIOS);
      setErro("");
      setConfirmarExclusao(false);
      return;
    }
    if (!servicoId) return;

    setCarregando(true);
    fetch(`/api/servicos/${servicoId}`)
      .then((r) => r.json())
      .then((s) => {
        setCampos({
          nome: s.nome ?? "",
          categoria: s.categoria ?? "",
          duracaoMin: s.duracaoMin ?? 60,
          preco: s.preco?.toString() ?? "",
          precoVariavel: s.precoVariavel ?? false,
          cor: s.cor ?? "#B89968",
          descricao: s.descricao ?? "",
        });
      })
      .finally(() => setCarregando(false));
  }, [aberto, servicoId]);

  function set<K extends keyof typeof CAMPOS_VAZIOS>(campo: K, valor: typeof CAMPOS_VAZIOS[K]) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    if (!campos.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true);
    setErro("");

    const payload = {
      nome: campos.nome.trim(),
      categoria: campos.categoria || null,
      duracaoMin: campos.duracaoMin,
      preco: campos.precoVariavel ? 0 : parseFloat(campos.preco) || 0,
      precoVariavel: campos.precoVariavel,
      cor: campos.cor,
      descricao: campos.descricao || null,
    };

    const url = ehEdicao ? `/api/servicos/${servicoId}` : "/api/servicos";
    const method = ehEdicao ? "PATCH" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);
    if (!r.ok) { setErro("Erro ao salvar."); return; }
    onSalvo();
    onFechar();
  }

  async function excluir() {
    if (!servicoId) return;
    await fetch(`/api/servicos/${servicoId}`, { method: "DELETE" });
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
            {ehEdicao ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#B89968]" />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Nome do Serviço *</Label>
                <Input
                  value={campos.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex: Volume Brasileiro"
                  className="border-[#B89968]/30"
                />
              </div>

              {/* Categoria */}
              <div className="relative">
                <Label className="text-xs text-[#9a7d50] mb-1 block">Categoria</Label>
                <Input
                  value={campos.categoria}
                  onChange={(e) => { set("categoria", e.target.value); setMostrarCategorias(true); }}
                  onFocus={() => setMostrarCategorias(true)}
                  onBlur={() => setTimeout(() => setMostrarCategorias(false), 150)}
                  placeholder="Ex: Cílios — Aplicação"
                  className="border-[#B89968]/30"
                />
                {mostrarCategorias && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-[#e8dcc4] shadow-lg max-h-48 overflow-y-auto">
                    {CATEGORIAS_SUGERIDAS.filter((c) =>
                      c.toLowerCase().includes(campos.categoria.toLowerCase())
                    ).map((cat) => (
                      <button
                        key={cat}
                        onMouseDown={() => { set("categoria", cat); setMostrarCategorias(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-[#5a4530] hover:bg-[#faf5ee]"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duração */}
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Duração</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DURACOES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => set("duracaoMin", d.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        campos.duracaoMin === d.value
                          ? "bg-[#B89968] text-white border-[#B89968]"
                          : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preço */}
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Preço (R$)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={campos.preco}
                    onChange={(e) => set("preco", e.target.value)}
                    placeholder="0,00"
                    disabled={campos.precoVariavel}
                    className="border-[#B89968]/30 flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-[#9a7d50] cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={campos.precoVariavel}
                      onChange={(e) => set("precoVariavel", e.target.checked)}
                      className="accent-[#B89968]"
                    />
                    Variável
                  </label>
                </div>
              </div>

              {/* Cor */}
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Cor na agenda</Label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => set("cor", cor)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform",
                        campos.cor === cor ? "border-[#5a4530] scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Descrição (opcional)</Label>
                <textarea
                  value={campos.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Detalhes do serviço..."
                  rows={2}
                  className="w-full rounded-md border border-[#B89968]/30 px-3 py-2 text-sm text-[#5a4530] placeholder:text-[#9a7d50]/60 focus:outline-none focus:ring-1 focus:ring-[#B89968] resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex items-center gap-2">
          {ehEdicao && !confirmarExclusao && (
            <button onClick={() => setConfirmarExclusao(true)} className="text-red-400 hover:text-red-600 mr-auto">
              <Trash2 size={16} />
            </button>
          )}
          {confirmarExclusao && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-red-600">Excluir serviço?</span>
              <button onClick={excluir} className="text-xs text-red-600 font-semibold hover:underline">Sim</button>
              <button onClick={() => setConfirmarExclusao(false)} className="text-xs text-[#9a7d50] hover:underline">Não</button>
            </div>
          )}
          {erro && <p className="text-xs text-red-500 mr-auto">{erro}</p>}
          <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">Cancelar</Button>
          <Button size="sm" onClick={salvar} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {ehEdicao ? "Salvar" : "Criar Serviço"}
          </Button>
        </div>
      </div>
    </div>
  );
}
