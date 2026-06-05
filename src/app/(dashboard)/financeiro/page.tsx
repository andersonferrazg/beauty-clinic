"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, TrendingUp, TrendingDown, DollarSign, X, Trash2, Check, LineChart, Wallet, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessaoCliente } from "@/lib/sessao-cliente";

type Lancamento = {
  id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  valor: number;
  pago: boolean;
  pagoEm: string | null;
  vencimento: string | null;
  formaPagamento: string | null;
  criadoEm: string;
};

const CATEGORIAS_RECEITA = ["Atendimento", "Produto vendido", "Pacote", "Outros"];
const CATEGORIAS_DESPESA = ["Aluguel", "Água/Luz/Internet", "Produtos/Insumos", "Salários", "Marketing", "Equipamentos", "Impostos", "Outros"];
const FORMAS_PAG = ["Dinheiro", "Pix/Transferência", "Crédito", "Débito", "Cheque"];

function fmt(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ModalLancamento({
  aberto,
  onFechar,
  onSalvo,
  lancamento,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  lancamento?: Lancamento;
}) {
  const ehEdicao = !!lancamento;
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("RECEITA");
  const [campos, setCampos] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    vencimento: new Date().toISOString().slice(0, 10),
    pago: false,
    formaPagamento: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) {
      setTipo("RECEITA");
      setCampos({ descricao: "", categoria: "", valor: "", vencimento: new Date().toISOString().slice(0, 10), pago: false, formaPagamento: "" });
      setErro("");
      setConfirmarExclusao(false);
      return;
    }
    if (lancamento) {
      setTipo(lancamento.tipo as "RECEITA" | "DESPESA");
      setCampos({
        descricao: lancamento.descricao,
        categoria: lancamento.categoria ?? "",
        valor: lancamento.valor.toString(),
        vencimento: lancamento.vencimento ? lancamento.vencimento.slice(0, 10) : "",
        pago: lancamento.pago,
        formaPagamento: lancamento.formaPagamento ?? "",
      });
    }
  }, [aberto, lancamento]);

  function set(campo: string, valor: string | boolean) {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar() {
    if (!campos.descricao.trim()) { setErro("Descrição é obrigatória."); return; }
    if (!campos.valor || parseFloat(campos.valor) <= 0) { setErro("Valor inválido."); return; }
    setSalvando(true);
    setErro("");

    const payload = {
      tipo,
      descricao: campos.descricao.trim(),
      categoria: campos.categoria || null,
      valor: parseFloat(campos.valor),
      vencimento: campos.vencimento || null,
      pago: campos.pago,
      pagoEm: campos.pago ? new Date().toISOString() : null,
      formaPagamento: campos.formaPagamento || null,
    };

    const url = ehEdicao ? `/api/lancamentos/${lancamento!.id}` : "/api/lancamentos";
    const method = ehEdicao ? "PATCH" : "POST";

    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSalvando(false);
    if (!r.ok) { setErro("Erro ao salvar."); return; }
    onSalvo();
    onFechar();
  }

  async function excluir() {
    if (!lancamento) return;
    await fetch(`/api/lancamentos/${lancamento.id}`, { method: "DELETE" });
    onSalvo();
    onFechar();
  }

  if (!aberto) return null;

  const categorias = tipo === "RECEITA" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4]">
          <h2 className="text-lg font-serif font-semibold text-[#5a4530]">
            {ehEdicao ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[65dvh] overflow-y-auto">
          {!ehEdicao && (
            <div className="flex gap-2">
              {(["RECEITA", "DESPESA"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                    tipo === t
                      ? t === "RECEITA" ? "bg-green-600 text-white border-green-600" : "bg-red-500 text-white border-red-500"
                      : "bg-white text-[#9a7d50] border-[#e8dcc4] hover:border-[#B89968]/50"
                  )}
                >
                  {t === "RECEITA" ? "📥 Receita" : "📤 Despesa"}
                </button>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs text-[#9a7d50] mb-1 block">Descrição *</Label>
            <Input value={campos.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Ex: Pagamento Beatriz - maio" className="border-[#B89968]/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Categoria</Label>
              <select
                value={campos.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                className="w-full rounded-md border border-[#B89968]/30 px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              >
                <option value="">Selecionar</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Valor (R$) *</Label>
              <Input type="number" value={campos.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0,00" className="border-[#B89968]/30" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Vencimento</Label>
              <Input type="date" value={campos.vencimento} onChange={(e) => set("vencimento", e.target.value)} className="border-[#B89968]/30" />
            </div>
            <div>
              <Label className="text-xs text-[#9a7d50] mb-1 block">Forma de pagamento</Label>
              <select
                value={campos.formaPagamento}
                onChange={(e) => set("formaPagamento", e.target.value)}
                className="w-full rounded-md border border-[#B89968]/30 px-3 py-2 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
              >
                <option value="">Selecionar</option>
                {FORMAS_PAG.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={campos.pago} onChange={(e) => set("pago", e.target.checked)} className="accent-[#B89968]" />
            <span className="text-sm text-[#5a4530]">
              {tipo === "RECEITA" ? "Já recebido" : "Já pago"}
            </span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-[#e8dcc4] flex items-center gap-2">
          {ehEdicao && !confirmarExclusao && (
            <button onClick={() => setConfirmarExclusao(true)} className="text-red-400 hover:text-red-600 mr-auto"><Trash2 size={16} /></button>
          )}
          {confirmarExclusao && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-red-600">Excluir lançamento?</span>
              <button onClick={excluir} className="text-xs text-red-600 font-semibold hover:underline">Sim</button>
              <button onClick={() => setConfirmarExclusao(false)} className="text-xs text-[#9a7d50] hover:underline">Não</button>
            </div>
          )}
          {erro && <p className="text-xs text-red-500 mr-auto">{erro}</p>}
          <Button variant="ghost" size="sm" onClick={onFechar} className="ml-auto">Cancelar</Button>
          <Button size="sm" onClick={salvar} disabled={salvando} className="bg-[#B89968] hover:bg-[#9a7d50] text-white">
            {salvando ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

type FluxoDia = {
  data: string;
  receita: number;
  despesa: number;
  saldo: number;
  itens: { id: string; tipo: string; descricao: string; valor: number; categoria: string | null; pago: boolean }[];
};

type FluxoCaixa = {
  saldoAtual: number;
  saldoFinal: number;
  totalReceita: number;
  totalDespesa: number;
  dias: FluxoDia[];
};

export default function FinanceiroPage() {
  const router = useRouter();
  const [aba, setAba] = useState<"lancamentos" | "clinica" | "casa" | "fluxo">("lancamentos");
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mes, setMes] = useState(mesAtual());
  const [filtro, setFiltro] = useState<"TODOS" | "RECEITA" | "DESPESA">("TODOS");
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<Lancamento | undefined>();
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(null);
  const [diasFluxo, setDiasFluxo] = useState<30 | 60 | 90>(30);
  const [carregandoFluxo, setCarregandoFluxo] = useState(false);

  useEffect(() => {
    getSessaoCliente().then((s: unknown) => {
      const sessao = s as { permissoes?: { isAdmin?: boolean; acessarFinanceiro?: boolean } } | null;
      if (sessao?.permissoes && !sessao.permissoes.isAdmin && !sessao.permissoes.acessarFinanceiro) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  async function carregar() {
    setCarregando(true);
    const r = await fetch(`/api/lancamentos?mes=${mes}`);
    const dados = await r.json();
    setLancamentos(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [mes]);

  async function carregarFluxo() {
    setCarregandoFluxo(true);
    const r = await fetch(`/api/fluxo-caixa?dias=${diasFluxo}`);
    setFluxo(await r.json());
    setCarregandoFluxo(false);
  }

  useEffect(() => {
    if (aba === "fluxo") carregarFluxo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, diasFluxo]);

  function abrirNovo() {
    setLancamentoSelecionado(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(l: Lancamento) {
    setLancamentoSelecionado(l);
    setModalAberto(true);
  }

  async function marcarPago(id: string, pago: boolean, tipo: string) {
    const lancamento = lancamentos.find((l) => l.id === id);
    if (!lancamento) return;
    await fetch(`/api/lancamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lancamento, pago, pagoEm: pago ? new Date().toISOString() : null }),
    });
    carregar();
  }

  const CATEGORIAS_GASTOS = ["Gastos Clínica", "Gastos Casa"];
  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA" && !CATEGORIAS_GASTOS.includes(l.categoria ?? ""));
  const totalReceitas = receitas.reduce((s, l) => s + (l.pago ? l.valor : 0), 0);
  const totalDespesas = despesas.reduce((s, l) => s + (l.pago ? l.valor : 0), 0);
  const lucro = totalReceitas - totalDespesas;

  const filtrados = lancamentos.filter((l) => filtro === "TODOS" || l.tipo === filtro);

  const [anoMes, mesNum] = mes.split("-");
  const nomeMes = new Date(parseInt(anoMes), parseInt(mesNum) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Cobranças & Financeiro</h1>
          <p className="text-sm text-[#9a7d50] mt-1 capitalize">
            {aba === "fluxo" ? "Projeção dos próximos " + diasFluxo + " dias" : nomeMes}
          </p>
        </div>
        {aba !== "fluxo" && (
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="border border-[#B89968]/30 rounded-lg px-3 py-1.5 text-sm text-[#5a4530] focus:outline-none focus:ring-1 focus:ring-[#B89968]"
            />
            {aba === "lancamentos" && (
              <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
                <Plus size={16} />
                Novo Lançamento
              </Button>
            )}
          </div>
        )}
        {aba === "fluxo" && (
          <div className="flex items-center gap-1">
            {([30, 60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDiasFluxo(d)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  diasFluxo === d
                    ? "bg-[#B89968] text-white border-[#B89968]"
                    : "bg-white text-[#9a7d50] border-[#e8dcc4]",
                )}
              >
                {d} dias
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-[#e8dcc4] mb-6 gap-1">
        <button
          onClick={() => setAba("lancamentos")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
            aba === "lancamentos"
              ? "border-[#B89968] text-[#B89968]"
              : "border-transparent text-[#9a7d50] hover:text-[#5a4530]",
          )}
        >
          <Wallet size={15} /> Lançamentos
        </button>
        <button
          onClick={() => setAba("clinica")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
            aba === "clinica"
              ? "border-[#B89968] text-[#B89968]"
              : "border-transparent text-[#9a7d50] hover:text-[#5a4530]",
          )}
        >
          <Building2 size={15} /> Gastos Clínica
        </button>
        <button
          onClick={() => setAba("casa")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
            aba === "casa"
              ? "border-[#B89968] text-[#B89968]"
              : "border-transparent text-[#9a7d50] hover:text-[#5a4530]",
          )}
        >
          <Home size={15} /> Gastos Pessoal
        </button>
        <button
          onClick={() => setAba("fluxo")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
            aba === "fluxo"
              ? "border-[#B89968] text-[#B89968]"
              : "border-transparent text-[#9a7d50] hover:text-[#5a4530]",
          )}
        >
          <LineChart size={15} /> Fluxo de Caixa
        </button>
      </div>

      {aba === "fluxo" ? (
        <FluxoCaixaView fluxo={fluxo} carregando={carregandoFluxo} />
      ) : aba === "clinica" ? (
        <PlanilhaGastosView
          titulo="GASTOS CLÍNICA"
          lancamentos={lancamentos.filter((l) => l.categoria === "Gastos Clínica")}
          carregando={carregando}
          onTogglePago={(id, pago) => marcarPago(id, pago, "DESPESA")}
          onEditar={abrirEdicao}
        />
      ) : aba === "casa" ? (
        <PlanilhaGastosView
          titulo="GASTOS PESSOAL"
          lancamentos={lancamentos.filter((l) => l.categoria === "Gastos Casa")}
          carregando={carregando}
          onTogglePago={(id, pago) => marcarPago(id, pago, "DESPESA")}
          onEditar={abrirEdicao}
        />
      ) : (
        <>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { titulo: "Receitas recebidas", valor: totalReceitas, icon: TrendingUp, cor: "text-green-600", bg: "bg-green-50" },
          { titulo: "Despesas pagas", valor: totalDespesas, icon: TrendingDown, cor: "text-red-500", bg: "bg-red-50" },
          { titulo: "Lucro líquido", valor: lucro, icon: DollarSign, cor: lucro >= 0 ? "text-[#B89968]" : "text-red-500", bg: "bg-[#B89968]/10" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.titulo} className="bg-white rounded-xl border border-[#e8dcc4] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[#9a7d50]">{card.titulo}</p>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon size={16} className={card.cor} />
                </div>
              </div>
              <p className={`text-xl font-semibold ${card.cor}`}>{fmt(card.valor)}</p>
            </div>
          );
        })}
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4">
        {(["TODOS", "RECEITA", "DESPESA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filtro === f ? "bg-[#B89968] text-white border-[#B89968]" : "bg-white text-[#9a7d50] border-[#e8dcc4]"
            )}
          >
            {f === "TODOS" ? "Todos" : f === "RECEITA" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-[#9a7d50]">
          <p className="text-base">Nenhum lançamento neste mês.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Vencimento</th>
                <th className="text-right px-4 py-3 text-[#9a7d50] font-medium">Valor</th>
                <th className="text-center px-4 py-3 text-[#9a7d50] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l, i) => (
                <tr
                  key={l.id}
                  className={cn(
                    "border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors",
                    i === filtrados.length - 1 ? "border-b-0" : ""
                  )}
                  onClick={() => abrirEdicao(l)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        l.tipo === "RECEITA" ? "bg-green-500" : "bg-red-400"
                      )} />
                      <span className="font-medium text-[#5a4530]">{l.descricao}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#9a7d50]">{l.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-[#9a7d50]">
                    {l.vencimento ? new Date(l.vencimento).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-right font-semibold",
                    l.tipo === "RECEITA" ? "text-green-600" : "text-red-500"
                  )}>
                    {l.tipo === "DESPESA" ? "−" : "+"}{fmt(l.valor)}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => { e.stopPropagation(); marcarPago(l.id, !l.pago, l.tipo); }}>
                    <button className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      l.pago
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}>
                      {l.pago ? <Check size={12} className="inline mr-0.5" /> : null}
                      {l.pago ? (l.tipo === "RECEITA" ? "Recebido" : "Pago") : "Pendente"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        </>
      )}

      <ModalLancamento
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={carregar}
        lancamento={lancamentoSelecionado}
      />
    </div>
  );
}

function PlanilhaGastosView({
  titulo,
  lancamentos,
  carregando,
  onTogglePago,
  onEditar,
}: {
  titulo: string;
  lancamentos: Lancamento[];
  carregando: boolean;
  onTogglePago: (id: string, pago: boolean) => void;
  onEditar: (l: Lancamento) => void;
}) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  const total = lancamentos.reduce((s, l) => s + l.valor, 0);
  const totalPago = lancamentos.filter((l) => l.pago).reduce((s, l) => s + l.valor, 0);
  const pendente = total - totalPago;

  return (
    <div>
      {/* Resumo rápido */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4 text-center">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Total previsto</p>
          <p className="text-lg font-semibold text-[#5a4530]">{fmt(total)}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-xs text-green-700 uppercase tracking-wider mb-1">Pago</p>
          <p className="text-lg font-semibold text-green-700">{fmt(totalPago)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
          <p className="text-xs text-amber-700 uppercase tracking-wider mb-1">A pagar</p>
          <p className="text-lg font-semibold text-amber-700">{fmt(pendente)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
        {/* Header estilo planilha */}
        <div className="bg-[#5a4530] px-4 py-3 text-center">
          <h3 className="text-white font-bold uppercase tracking-widest text-sm">{titulo}</h3>
        </div>

        {lancamentos.length === 0 ? (
          <p className="text-center text-sm text-[#9a7d50] py-10">
            Nenhum gasto neste mês. Os lançamentos aparecem automaticamente ao selecionar o mês correto.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Produto</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Gasto</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Vencimento</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Data-PG</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#9a7d50] uppercase tracking-wide">Pago</th>
              </tr>
            </thead>
            <tbody>
              {[...lancamentos]
                .sort((a, b) => {
                  const da = a.vencimento ? new Date(a.vencimento).getTime() : 0;
                  const db = b.vencimento ? new Date(b.vencimento).getTime() : 0;
                  return da - db;
                })
                .map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onEditar(l)}
                    className={cn(
                      "border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors",
                      l.pago ? "opacity-70" : ""
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className={cn("font-medium", l.pago ? "line-through text-[#9a7d50]" : "text-[#5a4530]")}>
                        {l.descricao}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#5a4530]">
                      {l.valor > 0 ? fmt(l.valor) : <span className="text-[#9a7d50] font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center text-[#9a7d50]">
                      {l.vencimento
                        ? new Date(l.vencimento + (l.vencimento.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center text-[#9a7d50]">
                      {l.pagoEm
                        ? new Date(l.pagoEm).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center" onClick={(e) => { e.stopPropagation(); onTogglePago(l.id, !l.pago); }}>
                      <button
                        className={cn(
                          "px-3 py-1 rounded text-xs font-bold transition-colors",
                          l.pago
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        )}
                      >
                        {l.pago ? "PAGO" : "—"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#faf5ee] border-t-2 border-[#5a4530]">
                <td className="px-4 py-3 font-bold text-[#5a4530] uppercase text-xs tracking-wide">Total</td>
                <td className="px-4 py-3 text-right font-bold text-[#B89968] text-base">{fmt(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

function FluxoCaixaView({ fluxo, carregando }: { fluxo: FluxoCaixa | null; carregando: boolean }) {
  if (carregando || !fluxo) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  const maxAbs = Math.max(1, ...fluxo.dias.map((d) => Math.max(d.receita, d.despesa)));
  const diasComMovimento = fluxo.dias.filter((d) => d.receita + d.despesa > 0);

  return (
    <>
      {/* Cards de resumo do fluxo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Saldo atual</p>
          <p className={cn("text-xl font-semibold", fluxo.saldoAtual >= 0 ? "text-[#5a4530]" : "text-red-500")}>
            {fmt(fluxo.saldoAtual)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Entradas previstas</p>
          <p className="text-xl font-semibold text-green-600">+{fmt(fluxo.totalReceita)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e8dcc4] p-4">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Saídas previstas</p>
          <p className="text-xl font-semibold text-red-500">−{fmt(fluxo.totalDespesa)}</p>
        </div>
        <div className="bg-[#B89968]/10 rounded-xl border border-[#B89968]/30 p-4">
          <p className="text-xs text-[#9a7d50] uppercase tracking-wider mb-1">Saldo projetado</p>
          <p className={cn("text-xl font-semibold", fluxo.saldoFinal >= 0 ? "text-[#B89968]" : "text-red-500")}>
            {fmt(fluxo.saldoFinal)}
          </p>
        </div>
      </div>

      {/* Tabela dia a dia */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e8dcc4] bg-[#faf5ee]/50">
          <p className="text-sm font-semibold text-[#5a4530]">Projeção diária</p>
          <p className="text-xs text-[#9a7d50]">Apenas dias com movimento são exibidos</p>
        </div>
        <div className="divide-y divide-[#e8dcc4] max-h-[600px] overflow-y-auto">
          {diasComMovimento.length === 0 ? (
            <p className="text-center text-sm text-[#9a7d50] py-12">Sem movimentos previstos no período.</p>
          ) : (
            diasComMovimento.map((d) => (
              <div key={d.data} className="px-4 py-3 hover:bg-[#faf5ee]/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-[#5a4530] w-28">
                      {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
                    </p>
                    <div className="flex gap-3 text-xs">
                      {d.receita > 0 && <span className="text-green-600">+{fmt(d.receita)}</span>}
                      {d.despesa > 0 && <span className="text-red-500">−{fmt(d.despesa)}</span>}
                    </div>
                  </div>
                  <span className={cn("text-sm font-semibold", d.saldo >= 0 ? "text-[#5a4530]" : "text-red-500")}>
                    Saldo: {fmt(d.saldo)}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 mb-2">
                  {d.receita > 0 && (
                    <div className="bg-green-400 rounded-full" style={{ width: `${(d.receita / maxAbs) * 50}%` }} />
                  )}
                  {d.despesa > 0 && (
                    <div className="bg-red-300 rounded-full" style={{ width: `${(d.despesa / maxAbs) * 50}%` }} />
                  )}
                </div>
                <div className="space-y-0.5 pl-1">
                  {d.itens.map((i) => (
                    <p key={i.id} className="text-xs text-[#9a7d50]">
                      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-2", i.tipo === "RECEITA" ? "bg-green-500" : "bg-red-400")}></span>
                      {i.descricao} {i.categoria && <span className="text-[#9a7d50]/60">— {i.categoria}</span>}
                      <span className="ml-2 font-medium">{i.tipo === "DESPESA" ? "−" : "+"}{fmt(i.valor)}</span>
                      {!i.pago && <span className="ml-2 text-amber-600">(a pagar)</span>}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
