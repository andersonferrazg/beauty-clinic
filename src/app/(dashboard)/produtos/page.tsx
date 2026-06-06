"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, Plus, Loader2, Package, AlertTriangle, X, Trash2,
  History, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, CalendarX, Download,
  ShoppingCart, Truck, Edit2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessaoCliente } from "@/lib/sessao-cliente";

// ─── Types ────────────────────────────────────────────────────────────────────

type Produto = {
  id: string;
  nome: string;
  categoria: string | null;
  precoVenda: number;
  precoCusto: number | null;
  comissaoPercentual: number | null;
  qtdEstoque: number;
  qtdMinima: number;
  patrimonio: boolean;
  dataValidade: string | null;
  ehInjetavel?: boolean;
  unidadeMedida?: string | null;
  corMarcacao?: string | null;
};

type Fornecedor = {
  id: string;
  nome: string;
  contato: string | null;
};

type ItemCompraAPI = {
  id: string;
  produtoId: string;
  quantidade: number;
  custoUnitario: number;
  produto: { id: string; nome: string; unidadeMedida: string | null };
};

type CompraEstoque = {
  id: string;
  descricao: string | null;
  dataCompra: string;
  dataPagamento: string | null;
  formaPagamento: string | null;
  valorTotal: number;
  desconto: number;
  totalLiquido: number;
  criadoEm: string;
  fornecedor: { id: string; nome: string } | null;
  itens: ItemCompraAPI[];
};

type Movimentacao = {
  id: string;
  tipo: string;
  quantidade: number;
  motivo: string | null;
  custoUnitario: number | null;
  criadoEm: string;
  agendamento: { inicio: string; cliente: { nome: string } | null } | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

const FORMAS_COMPRA = [
  "Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito",
  "Link de Pagamento", "Cheque", "Transferência", "Boleto", "A Prazo",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Modal de Produto ─────────────────────────────────────────────────────────

const CAMPOS_VAZIOS = {
  nome: "", categoria: "", precoVenda: "", precoCusto: "", comissaoPercentual: "",
  qtdEstoque: "0", qtdMinima: "0", patrimonio: false, dataValidade: "",
  ehInjetavel: false, unidadeMedida: "unidade", corMarcacao: "#A78BFA",
};

function ModalProduto({
  aberto, onFechar, onSalvo, produtoId, produto, podeVerCusto, podeMovimentar,
}: {
  aberto: boolean; onFechar: () => void; onSalvo: () => void;
  produtoId?: string; produto?: Produto; podeVerCusto: boolean; podeMovimentar: boolean;
}) {
  const ehEdicao = !!produtoId;
  const [aba, setAba] = useState<"dados" | "movs">("dados");
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

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
        comissaoPercentual: produto.comissaoPercentual?.toString() ?? "",
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
      comissaoPercentual: campos.comissaoPercentual ? parseFloat(campos.comissaoPercentual) : null,
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
      const movsNovos = await fetch(`/api/movimentacoes-estoque?produtoId=${produtoId}`).then((r) => r.json());
      setMovs(movsNovos);
      onSalvo();
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
            {ehEdicao ? campos.nome || "Editar Produto" : "Novo Produto"}
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]"><X size={20} /></button>
        </div>

        {ehEdicao && (
          <div className="flex border-b border-[#e8dcc4] px-5">
            {(["dados", ...(podeMovimentar ? ["movs"] : [])] as ("dados" | "movs")[]).map((a) => (
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
            {podeVerCusto && (
              <div>
                <Label className="text-xs text-[#9a7d50] mb-1 block">Comissão por produto (%)</Label>
                <Input
                  type="number" min="0" max="100" step="0.1"
                  value={campos.comissaoPercentual}
                  onChange={(e) => set("comissaoPercentual", e.target.value)}
                  placeholder="Deixe vazio para usar a taxa da profissional"
                  className="border-[#B89968]/30"
                />
                <p className="text-[10px] text-[#9a7d50] mt-1">Quando preenchido, substitui o % de comissão da profissional para este produto.</p>
              </div>
            )}
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

            <div className="pt-3 border-t border-[#e8dcc4]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={campos.ehInjetavel} onChange={(e) => set("ehInjetavel", e.target.checked)} className="accent-[#B89968]" />
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

        {aba === "movs" && (
          <div className="flex-1 overflow-y-auto">
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

// ─── Modal Nova Compra ────────────────────────────────────────────────────────

type LinhaItem = { tempId: string; produtoId: string; quantidade: string; custoUnitario: string };

function novaLinha(): LinhaItem {
  return { tempId: Math.random().toString(36).slice(2), produtoId: "", quantidade: "1", custoUnitario: "" };
}

function ModalNovaCompra({
  aberto, onFechar, onSalva, produtos, fornecedores, onFornecedorCriado,
}: {
  aberto: boolean; onFechar: () => void; onSalva: () => void;
  produtos: Produto[]; fornecedores: Fornecedor[]; onFornecedorCriado: (f: Fornecedor) => void;
}) {
  const [fornecedorId, setFornecedorId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataCompra, setDataCompra] = useState(dataHoje);
  const [dataPagamento, setDataPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>(() => [novaLinha()]);
  const [desconto, setDesconto] = useState("0");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [novoFornNome, setNovoFornNome] = useState("");
  const [novoFornContato, setNovoFornContato] = useState("");
  const [showNovoForn, setShowNovoForn] = useState(false);
  const [criandoForn, setCriandoForn] = useState(false);

  useEffect(() => {
    if (!aberto) {
      setFornecedorId(""); setDescricao(""); setDataPagamento(""); setFormaPagamento("");
      setItens([novaLinha()]); setDesconto("0"); setErro("");
      setShowNovoForn(false); setNovoFornNome(""); setNovoFornContato("");
      setDataCompra(dataHoje());
    }
  }, [aberto]);

  const valorTotal = itens.reduce((s, i) => s + (parseFloat(i.quantidade) || 0) * (parseFloat(i.custoUnitario) || 0), 0);
  const descontoVal = parseFloat(desconto) || 0;
  const totalLiquido = Math.max(0, Math.round((valorTotal - descontoVal) * 100) / 100);

  function setItemField(tempId: string, field: keyof LinhaItem, valor: string) {
    setItens((prev) => prev.map((i) => i.tempId === tempId ? { ...i, [field]: valor } : i));
  }

  async function criarFornecedor() {
    if (!novoFornNome.trim()) return;
    setCriandoForn(true);
    try {
      const r = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoFornNome.trim(), contato: novoFornContato || null }),
      });
      if (r.ok) {
        const f: Fornecedor = await r.json();
        onFornecedorCriado(f);
        setFornecedorId(f.id);
        setShowNovoForn(false); setNovoFornNome(""); setNovoFornContato("");
      }
    } finally { setCriandoForn(false); }
  }

  async function salvar() {
    if (!dataCompra) { setErro("Data da compra é obrigatória."); return; }
    const itensValidos = itens.filter((i) => i.produtoId && parseFloat(i.quantidade) > 0 && parseFloat(i.custoUnitario) >= 0);
    if (itensValidos.length === 0) { setErro("Adicione pelo menos 1 item com produto e quantidade."); return; }
    setSalvando(true); setErro("");
    try {
      const r = await fetch("/api/compras-estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: fornecedorId || null,
          descricao: descricao || null,
          dataCompra,
          dataPagamento: dataPagamento || null,
          formaPagamento: formaPagamento || null,
          itens: itensValidos.map((i) => ({
            produtoId: i.produtoId,
            quantidade: parseFloat(i.quantidade),
            custoUnitario: parseFloat(i.custoUnitario),
          })),
          desconto: descontoVal,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as { erro?: string }).erro ?? "Erro"); }
      onSalva(); onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSalvando(false); }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530] flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#B89968]" /> Nova Compra de Estoque
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Fornecedor</Label>
              <div className="flex gap-2">
                <select
                  value={fornecedorId}
                  onChange={(e) => { setFornecedorId(e.target.value); setShowNovoForn(false); }}
                  className="flex-1 h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89968]"
                >
                  <option value="">— Sem fornecedor —</option>
                  {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNovoForn((v) => !v)}
                  title="Novo fornecedor"
                  className="w-9 h-9 flex items-center justify-center rounded-md border border-[#B89968]/30 text-[#9a7d50] hover:bg-[#faf5ee]"
                >
                  <Plus size={14} />
                </button>
              </div>
              {showNovoForn && (
                <div className="mt-2 p-3 bg-[#faf5ee] rounded-lg border border-[#e8dcc4] space-y-2">
                  <Input
                    value={novoFornNome} onChange={(e) => setNovoFornNome(e.target.value)}
                    placeholder="Nome do fornecedor *" className="border-[#B89968]/30 h-8 text-sm"
                  />
                  <Input
                    value={novoFornContato} onChange={(e) => setNovoFornContato(e.target.value)}
                    placeholder="Contato (telefone / e-mail)" className="border-[#B89968]/30 h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={criarFornecedor} disabled={criandoForn || !novoFornNome.trim()} className="bg-[#B89968] hover:bg-[#9a7d50] text-white h-7 text-xs">
                      {criandoForn ? <Loader2 size={12} className="animate-spin mr-1" /> : null} Criar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNovoForn(false)} className="h-7 text-xs">Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Data da Compra *</Label>
              <input
                type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Data de Pagamento</Label>
              <input
                type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Forma de Pagamento</Label>
              <select
                value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              >
                <option value="">—</option>
                {FORMAS_COMPRA.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Descrição / Nota Fiscal</Label>
            <Input
              value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: NF-e 1234, pedido mensal..." className="border-[#B89968]/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-[#9a7d50] uppercase tracking-wider font-semibold">Itens *</Label>
              <button type="button" onClick={() => setItens((p) => [...p, novaLinha()])} className="flex items-center gap-1 text-xs text-[#B89968] hover:text-[#9a7d50]">
                <Plus size={12} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-[1fr_64px_112px_24px] gap-2 px-1">
                <span className="text-xs text-[#9a7d50]">Produto</span>
                <span className="text-xs text-[#9a7d50] text-center">Qtd</span>
                <span className="text-xs text-[#9a7d50] text-right">Custo unit. (R$)</span>
                <span />
              </div>
              {itens.map((linha) => (
                <div key={linha.tempId} className="flex gap-2 items-center">
                  <select
                    value={linha.produtoId}
                    onChange={(e) => setItemField(linha.tempId, "produtoId", e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] bg-white focus:outline-none focus:ring-1 focus:ring-[#B89968] min-w-0"
                  >
                    <option value="">Selecione o produto…</option>
                    {produtos.filter((p) => !p.patrimonio).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}{p.unidadeMedida && p.unidadeMedida !== "unidade" ? ` (${p.unidadeMedida})` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" min="1" step="1"
                    value={linha.quantidade}
                    onChange={(e) => setItemField(linha.tempId, "quantidade", e.target.value)}
                    placeholder="Qtd"
                    className="w-16 h-8 px-2 rounded-md border border-[#B89968]/30 text-sm text-center text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={linha.custoUnitario}
                    onChange={(e) => setItemField(linha.tempId, "custoUnitario", e.target.value)}
                    placeholder="0,00"
                    className="w-28 h-8 px-2 rounded-md border border-[#B89968]/30 text-sm text-right text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                  />
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItens((p) => p.filter((i) => i.tempId !== linha.tempId))}
                      className="text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e8dcc4] flex flex-wrap items-end justify-between gap-3">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Desconto (R$)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={desconto} onChange={(e) => setDesconto(e.target.value)}
                placeholder="0,00" className="border-[#B89968]/30 w-32"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9a7d50]">Subtotal: {valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              {descontoVal > 0 && (
                <p className="text-xs text-[#9a7d50]">Desconto: −{descontoVal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              )}
              <p className="text-lg font-semibold text-[#5a4530]">
                Total: {totalLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
        </div>

        <div className="px-5 py-4 border-t border-[#e8dcc4] flex justify-end gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onFechar}>Cancelar</Button>
          <Button size="sm" onClick={salvar} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Registrar Compra
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function ProdutosPage() {
  const router = useRouter();

  // Produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | undefined>();
  const [podeVerCusto, setPodeVerCusto] = useState(true);
  const [podeMovimentar, setPodeMovimentar] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Tabs
  const [abaPage, setAbaPage] = useState<"produtos" | "compras">("produtos");

  // Compras
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [compras, setCompras] = useState<CompraEstoque[]>([]);
  const [carregandoCompras, setCarregandoCompras] = useState(false);
  const [mesFiltro, setMesFiltro] = useState(mesAtual);
  const [modalCompraAberto, setModalCompraAberto] = useState(false);
  const [expandida, setExpandida] = useState<Set<string>>(new Set());

  // Fornecedores management
  const [showFornecedoresSection, setShowFornecedoresSection] = useState(false);
  const [editandoForn, setEditandoForn] = useState<string | null>(null);
  const [editFornNome, setEditFornNome] = useState("");
  const [editFornContato, setEditFornContato] = useState("");
  const [salvandoForn, setSalvandoForn] = useState(false);

  useEffect(() => {
    getSessaoCliente().then((s: unknown) => {
      const sessao = s as { permissoes?: { isAdmin?: boolean; acessarProdutos?: boolean; acessarFinanceiro?: boolean; movimentarEstoque?: boolean } } | null;
      if (sessao?.permissoes) {
        if (!sessao.permissoes.isAdmin && !sessao.permissoes.acessarProdutos) {
          router.replace("/dashboard");
          return;
        }
        setIsAdmin(sessao.permissoes.isAdmin === true);
        setPodeVerCusto(sessao.permissoes.isAdmin === true || sessao.permissoes.acessarFinanceiro === true);
        setPodeMovimentar(sessao.permissoes.isAdmin === true || sessao.permissoes.movimentarEstoque === true);
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

  async function carregarFornecedores() {
    const r = await fetch("/api/fornecedores");
    if (r.ok) setFornecedores(await r.json());
  }

  async function carregarCompras() {
    setCarregandoCompras(true);
    const r = await fetch(`/api/compras-estoque?mes=${mesFiltro}`);
    if (r.ok) setCompras(await r.json());
    setCarregandoCompras(false);
  }

  useEffect(() => { carregar(); carregarFornecedores(); }, []);
  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => {
    if (abaPage === "compras") carregarCompras();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaPage, mesFiltro]);

  function exportarCSV() {
    const cabecalho = ["Produto", "Categoria", "Estoque", "Estoque Mínimo", ...(podeVerCusto ? ["Custo (R$)"] : []), "Venda (R$)", "Validade", "Patrimônio"];
    const linhas = [cabecalho];
    for (const p of produtos) {
      linhas.push([
        p.nome, p.categoria || "", p.qtdEstoque.toString(), p.qtdMinima.toString(),
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

  async function salvarFornecedor(id: string) {
    if (!editFornNome.trim()) return;
    setSalvandoForn(true);
    await fetch(`/api/fornecedores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editFornNome.trim(), contato: editFornContato || null }),
    });
    await carregarFornecedores();
    setEditandoForn(null);
    setSalvandoForn(false);
  }

  async function excluirFornecedor(id: string) {
    await fetch(`/api/fornecedores/${id}`, { method: "DELETE" });
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  }

  function toggleExpand(id: string) {
    setExpandida((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

  const totalCompras = compras.reduce((s, c) => s + c.totalLiquido, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Produtos & Estoque</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {abaPage === "produtos"
              ? carregando ? "Carregando..." : `${produtos.length} produto(s) cadastrado(s)`
              : carregandoCompras ? "Carregando..." : `${compras.length} compra(s) no período`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {abaPage === "produtos" && (
            <>
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
            </>
          )}
          {abaPage === "compras" && (podeMovimentar || isAdmin) && (
            <Button onClick={() => setModalCompraAberto(true)} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
              <Plus size={16} /> Nova Compra
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {(podeMovimentar || isAdmin) && (
        <div className="flex border-b border-[#e8dcc4] mb-5">
          {([
            { v: "produtos" as const, label: "Produtos", icon: <Package size={14} /> },
            { v: "compras" as const, label: "Compras de Estoque", icon: <ShoppingCart size={14} /> },
          ]).map((tab) => (
            <button
              key={tab.v}
              onClick={() => setAbaPage(tab.v)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
                abaPage === tab.v
                  ? "border-[#B89968] text-[#B89968]"
                  : "border-transparent text-[#9a7d50] hover:text-[#5a4530]"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Aba Produtos ───────────────────────────────────────────────────── */}
      {abaPage === "produtos" && (
        <>
          {podeVerCusto && !carregando && produtos.length > 0 && (() => {
            const patrimonio = produtos.reduce((s, p) => s + ((p.precoCusto ?? 0) * p.qtdEstoque), 0);
            const comCusto = produtos.filter((p) => p.precoCusto != null).length;
            return (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-[#e8dcc4] px-4 py-3">
                  <p className="text-xs text-[#9a7d50] font-medium">Total de produtos</p>
                  <p className="text-xl font-semibold text-[#5a4530] mt-0.5">{produtos.length}</p>
                  <p className="text-xs text-[#9a7d50]">{comCusto} com custo cadastrado</p>
                </div>
                <div className="bg-white rounded-xl border border-[#e8dcc4] px-4 py-3">
                  <p className="text-xs text-[#9a7d50] font-medium">Patrimônio em estoque</p>
                  <p className="text-xl font-semibold text-[#5a4530] mt-0.5">
                    {patrimonio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-xs text-[#9a7d50]">custo × qtd em estoque</p>
                </div>
              </div>
            );
          })()}

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
        </>
      )}

      {/* ── Aba Compras de Estoque ────────────────────────────────────────── */}
      {abaPage === "compras" && (
        <>
          {/* Filtro de mês + KPI */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div>
              <label className="text-xs text-[#9a7d50] block mb-1">Mês</label>
              <input
                type="month"
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className="h-9 px-3 rounded-md border border-[#B89968]/30 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              />
            </div>
            {!carregandoCompras && compras.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e8dcc4] px-4 py-2 flex items-center gap-3">
                <div>
                  <p className="text-xs text-[#9a7d50]">Total do período</p>
                  <p className="text-base font-semibold text-[#5a4530]">
                    {totalCompras.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#e8dcc4]" />
                <div>
                  <p className="text-xs text-[#9a7d50]">Compras</p>
                  <p className="text-base font-semibold text-[#5a4530]">{compras.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Lista de compras */}
          {carregandoCompras ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#B89968]" /></div>
          ) : compras.length === 0 ? (
            <div className="text-center py-16 text-[#9a7d50]">
              <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-base mb-1">Nenhuma compra registrada neste período.</p>
              <p className="text-sm">Clique em &quot;Nova Compra&quot; para registrar uma entrada de estoque.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                    <th className="text-left px-4 py-2.5 text-[#9a7d50] font-medium">Data</th>
                    <th className="text-left px-4 py-2.5 text-[#9a7d50] font-medium hidden sm:table-cell">Fornecedor</th>
                    <th className="text-left px-4 py-2.5 text-[#9a7d50] font-medium hidden md:table-cell">Descrição</th>
                    <th className="text-center px-4 py-2.5 text-[#9a7d50] font-medium hidden sm:table-cell">Itens</th>
                    <th className="text-right px-4 py-2.5 text-[#9a7d50] font-medium">Total</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c, idx) => (
                    <React.Fragment key={c.id}>
                      <tr
                        onClick={() => toggleExpand(c.id)}
                        className={cn(
                          "border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors",
                          idx === compras.length - 1 && !expandida.has(c.id) ? "border-b-0" : ""
                        )}
                      >
                        <td className="px-4 py-3 text-[#5a4530]">
                          <p className="font-medium">{new Date(c.dataCompra).toLocaleDateString("pt-BR")}</p>
                          {c.formaPagamento && <p className="text-xs text-[#9a7d50]">{c.formaPagamento}</p>}
                        </td>
                        <td className="px-4 py-3 text-[#5a4530] hidden sm:table-cell">
                          {c.fornecedor ? (
                            <span className="flex items-center gap-1"><Truck size={13} className="text-[#B89968]" />{c.fornecedor.nome}</span>
                          ) : (
                            <span className="text-[#9a7d50]/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#9a7d50] hidden md:table-cell text-sm truncate max-w-[180px]">
                          {c.descricao || "—"}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="text-xs bg-[#faf5ee] text-[#9a7d50] border border-[#e8dcc4] px-2 py-0.5 rounded-full">
                            {c.itens.length} {c.itens.length === 1 ? "item" : "itens"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#5a4530]">
                          {c.totalLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          {c.desconto > 0 && (
                            <p className="text-xs text-emerald-600 font-normal">−{c.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} desc.</p>
                          )}
                        </td>
                        <td className="px-2 py-3 text-[#9a7d50]">
                          {expandida.has(c.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>
                      {expandida.has(c.id) && (
                        <tr className={cn("bg-[#faf5ee]/60 border-b border-[#e8dcc4]", idx === compras.length - 1 ? "border-b-0" : "")}>
                          <td colSpan={6} className="px-4 pb-3 pt-1">
                            <div className="space-y-1">
                              {c.itens.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-sm text-[#5a4530]">
                                  <ArrowDownCircle size={12} className="text-emerald-500 flex-shrink-0" />
                                  <span className="font-medium">{item.produto.nome}</span>
                                  {item.produto.unidadeMedida && item.produto.unidadeMedida !== "unidade" && (
                                    <span className="text-xs text-[#9a7d50]">({item.produto.unidadeMedida})</span>
                                  )}
                                  <span className="text-[#9a7d50]">× {item.quantidade}</span>
                                  <span className="text-[#9a7d50]">@ R$ {item.custoUnitario.toFixed(2).replace(".", ",")}/un</span>
                                  <span className="ml-auto font-medium">
                                    {(item.quantidade * item.custoUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Seção de Fornecedores — admin only */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
              <button
                onClick={() => setShowFornecedoresSection((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#faf5ee] transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[#5a4530]">
                  <Truck size={15} className="text-[#B89968]" />
                  Fornecedores ({fornecedores.length} cadastrado{fornecedores.length !== 1 ? "s" : ""})
                </span>
                {showFornecedoresSection ? <ChevronUp size={15} className="text-[#9a7d50]" /> : <ChevronDown size={15} className="text-[#9a7d50]" />}
              </button>

              {showFornecedoresSection && (
                <div className="border-t border-[#e8dcc4] p-4 space-y-2">
                  {fornecedores.length === 0 && (
                    <p className="text-sm text-[#9a7d50] text-center py-2">Nenhum fornecedor cadastrado.</p>
                  )}
                  {fornecedores.map((f) => (
                    <div key={f.id}>
                      {editandoForn === f.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editFornNome} onChange={(e) => setEditFornNome(e.target.value)}
                            className="border-[#B89968]/30 h-8 text-sm flex-1"
                          />
                          <Input
                            value={editFornContato} onChange={(e) => setEditFornContato(e.target.value)}
                            placeholder="Contato" className="border-[#B89968]/30 h-8 text-sm w-40"
                          />
                          <Button size="sm" onClick={() => salvarFornecedor(f.id)} disabled={salvandoForn} className="bg-[#B89968] hover:bg-[#9a7d50] text-white h-8 text-xs">
                            {salvandoForn ? <Loader2 size={12} className="animate-spin" /> : "Salvar"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditandoForn(null)} className="h-8 text-xs">Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1 px-1 rounded hover:bg-[#faf5ee] group">
                          <span className="flex-1 text-sm text-[#5a4530]">{f.nome}</span>
                          {f.contato && <span className="text-xs text-[#9a7d50]">{f.contato}</span>}
                          <button
                            onClick={() => { setEditandoForn(f.id); setEditFornNome(f.nome); setEditFornContato(f.contato ?? ""); }}
                            className="opacity-0 group-hover:opacity-100 text-[#9a7d50] hover:text-[#5a4530] p-1 transition-opacity"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => excluirFornecedor(f.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <ModalProduto
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => carregar(busca)}
        produtoId={produtoSelecionado?.id}
        produto={produtoSelecionado}
        podeVerCusto={podeVerCusto}
        podeMovimentar={podeMovimentar}
      />
      <ModalNovaCompra
        aberto={modalCompraAberto}
        onFechar={() => setModalCompraAberto(false)}
        onSalva={() => { carregarCompras(); carregar(busca); }}
        produtos={produtos}
        fornecedores={fornecedores}
        onFornecedorCriado={(f) => setFornecedores((prev) => [...prev, f])}
      />
    </div>
  );
}
