"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, Plus, Loader2, Package, AlertTriangle, X, Trash2,
  History, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, CalendarX, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessaoCliente } from "@/lib/sessao-cliente";

type Produto = {
  id: string;
  nome: string;
  categoria: string | null;
  precoVenda: number;
  precoCusto: number | null;
  qtdEstoque: number;
  qtdMinima: number;
  patrimonio: boolean;
  dataValidade: string | null;
  ehInjetavel?: boolean;
  unidadeMedida?: string | null;
  corMarcacao?: string | null;
};

const CORES_MARCACAO = [
  { hex: "#A78BFA", nome: "Roxo" },
  { hex: "#F472B6", nome: "Rosa" },
  { hex: "#60A5FA", nome: "Azul" },
  { hex: "#34D399", nome: "Verde" },
  { hex: "#FB923C", nome: "Laranja" },
  { hex: "#FBBF24", nome: "Amarelo" },
];

const UNIDADES = [
  { v: "unidade", label: "Unidade" },
  { v: "ml", label: "ml (mililitro)" },
  { v: "ui", label: "ui (unidade injetável)" },
  { v: "un", label: "un (unidade contável)" },
];

type Movimentacao = {
  id: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  custoUnitario: number | null;
  criadoEm: string;
  agendamento: { inicio: string; cliente: { nome: string } | null } | null;
};

function toInputDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusValidade(dataValidade: string | null): "vencido" | "alerta" | "ok" | null {
  if (!dataValidade) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const val = new Date(dataValidade); val.setHours(0, 0, 0, 0);
  const diff = Math.ceil((val.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "vencido";
  if (diff <= 30) return "alerta";
  return "ok";
}

// ─── Modal de Produto (Dados + Movimentações) ────────────────────────────────

const CAMPOS_VAZIOS = {
  nome: "", categoria: "", precoVenda: "", precoCusto: "",
  qtdEstoque: "0", qtdMinima: "0", patrimonio: false, dataValidade: "",
  ehInjetavel: false, unidadeMedida: "unidade", corMarcacao: "#A78BFA",
};

function ModalProduto({
  aberto, onFechar, onSalvo, produtoId, produto, podeVerCusto,
}: {
  aberto: boolean; onFechar: () => void; onSalvo: () => void;
  produtoId?: string; produto?: Produto; podeVerCusto: boolean;
}) {
  const ehEdicao = !!produtoId;
  const [aba, setAba] = useState<"dados" | "movs">("dados");
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

  // Movimentações
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [carregandoMovs, setCarregandoMovs] = useState(false);
  const [tipoEntrada, setTipoEntrada] = useState<"ENTRADA" | "AJUSTE">("ENTRADA");
  const [qtdEntrada, setQtdEntrada] = useState("");
  const [motivoEntrada, setMotivoEntrada] = useState("");
  const [custoEntrada, setCustoEntrada] = useState("");
  const [salvandoMov, setSalvandoMov] = useState(false);
  const [erroMov, setErroMov] = useState("");

  useEffect(() => {
    if (!aberto) {
      setCampos(CAMPOS_VAZIOS); setErro(""); setConfirmarExclusao(false);
      setAba("dados"); setMovs([]); setQtdEntrada(""); setMotivoEntrada(""); setCustoEntrada(""); setErroMov("");
      return;
    }
    if (produto) {
      setCampos({
        nome: produto.nome, categoria: produto.categoria ?? "",
        precoVenda: produto.precoVenda.toString(), precoCusto: produto.precoCusto?.toString() ?? "",
        qtdEstoque: produto.qtdEstoque.toString(), qtdMinima: produto.qtdMinima.toString(),
        patrimonio: produto.patrimonio, dataValidade: toInputDate(produto.dataValidade),
        ehInjetavel: produto.ehInjetavel ?? false,
        unidadeMedida: produto.unidadeMedida ?? "unidade",
        corMarcacao: produto.corMarcacao ?? "#A78BFA",
      });
    }
  }, [aberto, produto]);

  useEffect(() => {
    if (aba === "movs" && produtoId) {
      setCarregandoMovs(true);
      fetch(`/api/movimentacoes-estoque?produtoId=${produtoId}`)
        .then((r) => r.json()).then(setMovs).finally(() => setCarregandoMovs(false));
    }
  }, [aba, produtoId]);

  function set<K extends keyof typeof CAMPOS_VAZIOS>(campo: K, valor: typeof CAMPOS_VAZIOS[K]) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    if (!campos.nome.trim()) { setErro("Nome é obrigatório."); return; }
    setSalvando(true); setErro("");
    const payload = {
      nome: campos.nome.trim(), categoria: campos.categoria || null,
      precoVenda: parseFloat(campos.precoVenda) || 0,
      precoCusto: campos.precoCusto ? parseFloat(campos.precoCusto) : null,
      qtdEstoque: parseInt(campos.qtdEstoque) || 0,
      qtdMinima: parseInt(campos.qtdMinima) || 0,
      patrimonio: campos.patrimonio,
      dataValidade: campos.dataValidade || null,
      ehInjetavel: campos.ehInjetavel,
      unidadeMedida: campos.ehInjetavel ? campos.unidadeMedida : "unidade",
      corMarcacao: campos.ehInjetavel ? campos.corMarcacao : "#A78BFA",
    };
    const url = ehEdicao ? `/api/produtos/${produtoId}` : "/api/produtos";
    const r = await fetch(url, { method: ehEdicao ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSalvando(false);
    if (!r.ok) { setErro("Erro ao salvar."); return; }
    onSalvo(); onFechar();
  }

  async function excluir() {
    if (!produtoId) return;
    await fetch(`/api/produtos/${produtoId}`, { method: "DELETE" });
    onSalvo(); onFechar();
  }

  async function registrarMovimentacao() {
    if (!qtdEntrada || isNaN(Number(qtdEntrada)) || Number(qtdEntrada) <= 0) {
      setErroMov("Quantidade inválida"); return;
    }
    setSalvandoMov(true); setErroMov("");
    try {
      const r = await fetch("/api/movimentacoes-estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId, tipo: tipoEntrada,
          quantidade: Number(qtdEntrada),
          motivo: motivoEntrada || null,
          custoUnitario: custoEntrada ? Number(custoEntrada) : null,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.erro ?? "Erro"); }
      setQtdEntrada(""); setMotivoEntrada(""); setCustoEntrada("");
      // Recarrega movimentações e produto
      const [movsNovos] = await Promise.all([
        fetch(`/api/movimentacoes-estoque?produtoId=${produtoId}`).then((r) => r.json()),
      ]);
      setMovs(movsNovos);
      onSalvo(); // atualiza estoque na lista
    } catch (e) {
      setErroMov(e instanceof Error ? e.message : "Erro ao registrar");
    } finally {
      setSalvandoMov(false);
    }
  }

  if (!aberto) return null;

  const iconesTipo: Record<string, React.ReactNode> = {
    ENTRADA: <ArrowDownCircle size={14} className="text-emerald-500" />,
    SAIDA: <ArrowUpCircle size={14} className="text-red-400" />,
    AJUSTE: <SlidersHorizontal size={14} className="text-blue-400" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
            {ehEdicao ? campos.nome || "Editar Produto" : "Novo Produto"}
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]"><X size={20} /></button>
        </div>

        {/* Abas — só em edição */}
        {ehEdicao && (
          <div className="flex border-b border-[#e8dcc4] px-5">
            {(["dados", "movs"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={cn(
                  "px-3 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5",
                  aba === a ? "border-[#B89968] text-[#B89968]" : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
                )}
              >
                {a === "dados" ? <><Package size={14} /> Dados</> : <><History size={14} /> Movimentações</>}
              </button>
            ))}
          </div>
        )}

        {/* Aba Dados */}
        {aba === "dados" && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Nome *</Label>
              <Input value={campos.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Toxina Botulínica" className="border-[#B89968]/30" />
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Categoria</Label>
              <Input value={campos.categoria} onChange={(e) => set("categoria", e.target.value)} placeholder="Ex: Insumos, Equipamentos..." className="border-[#B89968]/30" />
            </div>
            <div className={cn("grid gap-3", podeVerCusto ? "grid-cols-2" : "grid-cols-1")}>
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Preço de venda (R$)</Label>
                <Input type="number" value={campos.precoVenda} onChange={(e) => set("precoVenda", e.target.value)} placeholder="0,00" className="border-[#B89968]/30" />
              </div>
              {podeVerCusto && (
                <div>
                  <Label className="text-xs text-[#9a7d50] mb-1 block">Custo (R$)</Label>
                  <Input type="number" value={campos.precoCusto} onChange={(e) => set("precoCusto", e.target.value)} placeholder="0,00" className="border-[#B89968]/30" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Estoque atual</Label>
                <Input type="number" value={campos.qtdEstoque} onChange={(e) => set("qtdEstoque", e.target.value)} placeholder="0" className="border-[#B89968]/30" />
              </div>
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Estoque mínimo</Label>
                <Input type="number" value={campos.qtdMinima} onChange={(e) => set("qtdMinima", e.target.value)} placeholder="0" className="border-[#B89968]/30" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Data de validade</Label>
              <input
                type="date"
                value={campos.dataValidade}
                onChange={(e) => set("dataValidade", e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={campos.patrimonio} onChange={(e) => set("patrimonio", e.target.checked)} className="accent-[#B89968]" />
              <span className="text-sm text-[#5a4530]">É patrimônio (equipamento/bem durável)</span>
            </label>

            {/* ─── Planejador de Injetáveis ─────────────────────────────── */}
            <div className="pt-3 border-t border-[#e8dcc4]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campos.ehInjetavel}
                  onChange={(e) => set("ehInjetavel", e.target.checked)}
                  className="accent-[#B89968]"
                />
                <span className="text-sm text-[#5a4530]">
                  É injetável <span className="text-xs text-[#9a7d50]">(aparece no planejador visual da ficha de planejamento)</span>
                </span>
              </label>

              {campos.ehInjetavel && (
                <div className="mt-3 pl-6 space-y-3 border-l-2 border-[#B89968]/30">
                  <div>
                    <Label className="text-xs text-[#9a7d50] mb-1 block">Unidade de medida</Label>
                    <select
                      value={campos.unidadeMedida}
                      onChange={(e) => set("unidadeMedida", e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968] bg-white"
                    >
                      {UNIDADES.map((u) => (
                        <option key={u.v} value={u.v}>{u.label}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#9a7d50] mt-1">
                      O preço de venda (R$ {parseFloat(campos.precoVenda || "0").toFixed(2).replace(".", ",")}) será cobrado <strong>por {campos.unidadeMedida}</strong> no orçamento gerado.
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-[#9a7d50] mb-1 block">Cor do ponto no canvas</Label>
                    <div className="flex flex-wrap gap-2">
                      {CORES_MARCACAO.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => set("corMarcacao", c.hex)}
                          className={cn(
                            "w-9 h-9 rounded-full border-2 transition-all relative",
                            campos.corMarcacao === c.hex ? "border-[#5a4530] scale-110" : "border-white"
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.nome}
                        >
                          {campos.corMarcacao === c.hex && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba Movimentações */}
        {aba === "movs" && (
          <div className="flex-1 overflow-y-auto">
            {/* Formulário de entrada */}
            <div className="p-4 border-b border-[#e8dcc4] bg-[#faf5ee]/50 space-y-3">
              <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider">Registrar movimentação</p>
              <div className="flex gap-2">
                {([
                  { v: "ENTRADA", label: "Entrada" },
                  { v: "AJUSTE", label: "Ajuste de saldo" },
                ] as const).map((op) => (
                  <button
                    key={op.v}
                    onClick={() => setTipoEntrada(op.v)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      tipoEntrada === op.v ? "bg-[#B89968] text-white border-[#B89968]" : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                    )}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#9a7d50] block mb-1">
                    {tipoEntrada === "AJUSTE" ? "Novo saldo total" : "Quantidade"}
                  </label>
                  <Input type="number" min="1" value={qtdEntrada} onChange={(e) => setQtdEntrada(e.target.value)} placeholder="0" className="border-[#B89968]/30 h-8 text-sm" />
                </div>
                {tipoEntrada === "ENTRADA" && (
                  <div>
                    <label className="text-xs text-[#9a7d50] block mb-1">Custo unitário (R$)</label>
                    <Input type="number" value={custoEntrada} onChange={(e) => setCustoEntrada(e.target.value)} placeholder="0,00" className="border-[#B89968]/30 h-8 text-sm" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-[#9a7d50] block mb-1">Motivo / Observação</label>
                <Input value={motivoEntrada} onChange={(e) => setMotivoEntrada(e.target.value)} placeholder="Ex: Compra de estoque, Inventário..." className="border-[#B89968]/30 h-8 text-sm" />
              </div>
              {erroMov && <p className="text-xs text-red-500">{erroMov}</p>}
              <Button size="sm" onClick={registrarMovimentacao} disabled={salvandoMov} className="bg-[#B89968] hover:bg-[#9a7d50] text-white w-full">
                {salvandoMov ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                Confirmar
              </Button>
            </div>

            {/* Histórico */}
            <div className="p-4">
              <p className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-3">Histórico</p>
              {carregandoMovs ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#B89968]" /></div>
              ) : movs.length === 0 ? (
                <p className="text-center text-sm text-[#9a7d50] py-6">Nenhuma movimentação registrada.</p>
              ) : (
                <div className="space-y-2">
                  {movs.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[#e8dcc4]/60 last:border-0">
                      <div className="flex-shrink-0">{iconesTipo[m.tipo] ?? <Package size={14} />}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#5a4530] font-medium truncate">
                          {m.tipo === "ENTRADA" ? `+${m.quantidade}` : m.tipo === "SAIDA" ? `−${m.quantidade}` : `= ${m.quantidade}`} unid.
                          {m.motivo && <span className="text-[#9a7d50] font-normal"> · {m.motivo}</span>}
                        </p>
                        {m.agendamento && (
                          <p className="text-xs text-[#9a7d50] truncate">
                            Atendimento · {m.agendamento.cliente?.nome ?? "—"} · {new Date(m.agendamento.inicio).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {m.custoUnitario != null && (
                          <p className="text-xs text-[#9a7d50]">Custo unit.: R$ {m.custoUnitario.toFixed(2).replace(".", ",")}</p>
                        )}
                      </div>
                      <span className="text-xs text-[#9a7d50] flex-shrink-0">
                        {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex items-center gap-2">
          {ehEdicao && aba === "dados" && !confirmarExclusao && (
            <button onClick={() => setConfirmarExclusao(true)} className="text-red-400 hover:text-red-600 mr-auto"><Trash2 size={16} /></button>
          )}
          {confirmarExclusao && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-red-600">Excluir produto?</span>
              <button onClick={excluir} className="text-xs text-red-600 font-semibold hover:underline">Sim</button>
              <button onClick={() => setConfirmarExclusao(false)} className="text-xs text-[#9a7d50] hover:underline">Não</button>
            </div>
          )}
          {aba === "dados" && erro && <p className="text-xs text-red-500 mr-auto">{erro}</p>}
          <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">Fechar</Button>
          {aba === "dados" && (
            <Button size="sm" onClick={salvar} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
              {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {ehEdicao ? "Salvar" : "Criar Produto"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | undefined>();
  const [podeVerCusto, setPodeVerCusto] = useState(true);

  useEffect(() => {
    getSessaoCliente().then((s: unknown) => {
      const sessao = s as { permissoes?: { isAdmin?: boolean; acessarProdutos?: boolean; acessarFinanceiro?: boolean } } | null;
      if (sessao?.permissoes) {
        if (!sessao.permissoes.isAdmin && !sessao.permissoes.acessarProdutos) {
          router.replace("/dashboard");
          return;
        }
        setPodeVerCusto(sessao.permissoes.isAdmin === true || sessao.permissoes.acessarFinanceiro === true);
      }
    }).catch(() => {});
  }, [router]);

  async function carregar(q = "") {
    setCarregando(true);
    const r = await fetch(`/api/produtos${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const dados = await r.json();
    setProdutos(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);
  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  function exportarCSV() {
    const cabecalho = ["Produto", "Categoria", "Estoque", "Estoque Mínimo", ...(podeVerCusto ? ["Custo (R$)"] : []), "Venda (R$)", "Validade", "Patrimônio"];
    const linhas = [cabecalho];
    for (const p of produtos) {
      linhas.push([
        p.nome,
        p.categoria || "",
        p.qtdEstoque.toString(),
        p.qtdMinima.toString(),
        ...(podeVerCusto ? [p.precoCusto?.toFixed(2) || ""] : []),
        p.precoVenda.toFixed(2),
        p.dataValidade ? new Date(p.dataValidade).toLocaleDateString("pt-BR") : "",
        p.patrimonio ? "Sim" : "Não",
      ]);
    }
    const csv = "﻿" + linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "produtos-estoque.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function abrirNovo() { setProdutoSelecionado(undefined); setModalAberto(true); }
  function abrirEdicao(p: Produto) { setProdutoSelecionado(p); setModalAberto(true); }

  const grupos = produtos.reduce<Record<string, Produto[]>>((acc, p) => {
    const cat = p.categoria || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const semEstoque = produtos.filter((p) => !p.patrimonio && p.qtdEstoque <= p.qtdMinima);
  const vencidos = produtos.filter((p) => statusValidade(p.dataValidade) === "vencido");
  const vencendo = produtos.filter((p) => statusValidade(p.dataValidade) === "alerta");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Produtos & Estoque</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${produtos.length} produto(s) cadastrado(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!carregando && produtos.length > 0 && (
            <button
              onClick={exportarCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
            >
              <Download size={14} /> Exportar
            </button>
          )}
          <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
            <Plus size={16} /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Alerta: estoque baixo */}
      {semEstoque.length > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Estoque baixo ou esgotado ({semEstoque.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {semEstoque.map((p) => (
              <button key={p.id} onClick={() => abrirEdicao(p)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full hover:bg-amber-200">
                {p.nome}: {p.qtdEstoque} unid.
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerta: vencidos */}
      {vencidos.length > 0 && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarX size={16} className="text-red-600" />
            <p className="text-sm font-medium text-red-800">Produtos vencidos ({vencidos.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {vencidos.map((p) => (
              <button key={p.id} onClick={() => abrirEdicao(p)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200">
                {p.nome} · venceu {new Date(p.dataValidade!).toLocaleDateString("pt-BR")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerta: vencendo em 30 dias */}
      {vencendo.length > 0 && (
        <div className="mb-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <p className="text-sm font-medium text-orange-800">Vencendo em até 30 dias ({vencendo.length})</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {vencendo.map((p) => (
              <button key={p.id} onClick={() => abrirEdicao(p)} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full hover:bg-orange-200">
                {p.nome} · {new Date(p.dataValidade!).toLocaleDateString("pt-BR")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="pl-9 border-[#B89968]/30" />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : produtos.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-base mb-1">Nenhum produto cadastrado.</p>
          <p className="text-sm">Clique em &quot;Novo Produto&quot; para adicionar ao estoque.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grupos).map(([categoria, itens]) => (
            <div key={categoria}>
              <h2 className="text-xs font-semibold text-[#9a7d50] uppercase tracking-wider mb-2 px-1">{categoria}</h2>
              <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                      <th className="text-left px-4 py-2.5 text-[#9a7d50] font-medium">Produto</th>
                      <th className="text-right px-4 py-2.5 text-[#9a7d50] font-medium">Estoque</th>
                      <th className="text-right px-4 py-2.5 text-[#9a7d50] font-medium hidden sm:table-cell">Validade</th>
                      {podeVerCusto && <th className="text-right px-4 py-2.5 text-[#9a7d50] font-medium hidden md:table-cell">Custo</th>}
                      <th className="text-right px-4 py-2.5 text-[#9a7d50] font-medium hidden md:table-cell">Venda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((p, i) => {
                      const estoqueAlerta = !p.patrimonio && p.qtdEstoque <= p.qtdMinima;
                      const sv = statusValidade(p.dataValidade);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => abrirEdicao(p)}
                          className={cn(
                            "border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors",
                            i === itens.length - 1 ? "border-b-0" : ""
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#5a4530]">{p.nome}</span>
                            {p.patrimonio && <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">patrimônio</span>}
                            {p.ehInjetavel && (
                              <span
                                className="ml-2 text-xs px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                                style={{ backgroundColor: `${p.corMarcacao}20`, color: p.corMarcacao ?? "#A78BFA" }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.corMarcacao ?? "#A78BFA" }} />
                                injetável · {p.unidadeMedida}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn("text-sm font-medium", estoqueAlerta ? "text-red-500" : "text-[#5a4530]")}>
                              {p.qtdEstoque}
                              {estoqueAlerta && <AlertTriangle size={12} className="inline ml-1 text-red-400" />}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            {p.dataValidade ? (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                sv === "vencido" ? "bg-red-100 text-red-700" :
                                sv === "alerta" ? "bg-orange-100 text-orange-700" :
                                "bg-emerald-50 text-emerald-700"
                              )}>
                                {new Date(p.dataValidade).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-xs text-[#9a7d50]/50">—</span>
                            )}
                          </td>
                          {podeVerCusto && (
                            <td className="px-4 py-3 text-right text-[#9a7d50] text-sm hidden md:table-cell">
                              {p.precoCusto ? `R$ ${p.precoCusto.toFixed(2).replace(".", ",")}` : "—"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right text-[#5a4530] font-semibold text-sm hidden md:table-cell">
                            {p.precoVenda > 0 ? `R$ ${p.precoVenda.toFixed(2).replace(".", ",")}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalProduto
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => carregar(busca)}
        produtoId={produtoSelecionado?.id}
        produto={produtoSelecionado}
        podeVerCusto={podeVerCusto}
      />
    </div>
  );
}
