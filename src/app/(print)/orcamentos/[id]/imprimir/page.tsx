"use client";

import { useEffect, useState, use } from "react";
import { Printer, Loader2 } from "lucide-react";
import { PrintHeader } from "@/components/print-header";

type Cliente = {
  nome: string;
  cpf: string | null;
  rg: string | null;
  telefone1: string | null;
  email: string | null;
  endereco: string | null;
};

type Profissional = { id: string; nome: string; registro: string | null };

type Item = {
  id: string;
  preco: number;
  quantidade: number;
  descricao: string | null;
  servico: { nome: string } | null;
  produto: { nome: string } | null;
};

type Orcamento = {
  id: string;
  status: string;
  dataValidade: string;
  criadoEm: string;
  valorTotal: number;
  observacao: string | null;
  cliente: Cliente;
  profissional: Profissional | null;
  itens: Item[];
};

const STATUS_LABEL: Record<string, string> = {
  EM_ABERTO: "Em Aberto",
  APROVADO: "Aprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarCPF(cpf: string | null): string {
  if (!cpf) return "";
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return cpf;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function formatarTelefone(tel: string | null): string {
  if (!tel) return "";
  const n = tel.replace(/\D/g, "");
  if (n.length === 13) return `(${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return tel;
}

export default function ImprimirOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tenantNome, setTenantNome] = useState("Responsável");

  useEffect(() => {
    fetch(`/api/orcamentos/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrcamento(d); setCarregando(false); })
      .catch(() => setCarregando(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((d) => { if (d.nome) setTenantNome(d.nome); })
      .catch(() => {});
  }, []);

  // Auto-print depois que carregar (delay pra renderizar imagens)
  useEffect(() => {
    if (!carregando && orcamento) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [carregando, orcamento]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  if (!orcamento) {
    return <div className="p-6">Orçamento não encontrado.</div>;
  }

  const numeroOrc = orcamento.id.slice(-8).toUpperCase();

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm 1.5cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .orcamento-impressao { font-family: Geist, system-ui, sans-serif; color: #1f2937; line-height: 1.5; }
      `}</style>

      <div className="min-h-screen bg-gray-100 orcamento-impressao">
        <div className="no-print bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold text-gray-700">Orçamento — {orcamento.cliente.nome}</h1>
            <p className="text-xs text-gray-500">Nº {numeroOrc} · {STATUS_LABEL[orcamento.status]}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#B89968] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#9a7d50]"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>

        <div className="max-w-3xl mx-auto bg-white p-10 my-6 shadow-sm print:shadow-none print:my-0 print:p-0">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#B89968] pb-4 mb-6">
            <div className="flex-1 min-w-0">
              <PrintHeader mostrarDadosClinica />
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Orçamento</p>
              <p className="text-lg font-bold text-[#5a4530]">Nº {numeroOrc}</p>
              <p className="text-xs text-gray-500 mt-1">
                Emitido em {formatarData(orcamento.criadoEm)}
              </p>
            </div>
          </div>

          {/* Dados do cliente */}
          <div className="mb-5 text-sm">
            <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2 border-b border-gray-200 pb-1">
              Cliente
            </p>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="pr-3 py-0.5 text-gray-600 w-20">Nome:</td>
                  <td className="font-medium">{orcamento.cliente.nome}</td>
                </tr>
                {orcamento.cliente.cpf && (
                  <tr>
                    <td className="pr-3 py-0.5 text-gray-600">CPF:</td>
                    <td>{formatarCPF(orcamento.cliente.cpf)}</td>
                  </tr>
                )}
                {orcamento.cliente.telefone1 && (
                  <tr>
                    <td className="pr-3 py-0.5 text-gray-600">Telefone:</td>
                    <td>{formatarTelefone(orcamento.cliente.telefone1)}</td>
                  </tr>
                )}
                {orcamento.cliente.email && (
                  <tr>
                    <td className="pr-3 py-0.5 text-gray-600">E-mail:</td>
                    <td>{orcamento.cliente.email}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Itens */}
          <div className="mb-5">
            <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2 border-b border-gray-200 pb-1">
              Procedimentos / Serviços
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600 border-b border-gray-200">
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium text-center w-16">Qtd</th>
                  <th className="py-2 font-medium text-right w-28">Valor Unit.</th>
                  <th className="py-2 font-medium text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.map((item) => {
                  const nome = item.servico?.nome || item.produto?.nome || item.descricao || "Item";
                  const subtotal = item.preco * item.quantidade;
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">{nome}</td>
                      <td className="py-2 text-center">{item.quantidade}</td>
                      <td className="py-2 text-right">{formatarBRL(item.preco)}</td>
                      <td className="py-2 text-right font-medium">{formatarBRL(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#B89968]">
                  <td colSpan={3} className="py-3 text-right font-semibold text-[#5a4530] uppercase text-xs tracking-wide">
                    Valor Total
                  </td>
                  <td className="py-3 text-right text-lg font-bold text-[#5a4530]">
                    {formatarBRL(orcamento.valorTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Observação */}
          {orcamento.observacao && (
            <div className="mb-5 text-sm">
              <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-1">
                Observações
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">{orcamento.observacao}</p>
            </div>
          )}

          {/* Validade */}
          <div className="mb-6 rounded-md border border-[#B89968]/30 bg-[#faf5ee] px-4 py-3 text-sm">
            <p>
              <strong className="text-[#5a4530]">Validade:</strong> este orçamento é válido até{" "}
              <strong>{formatarData(orcamento.dataValidade)}</strong>.
            </p>
          </div>

          {/* Assinatura */}
          <div className="grid grid-cols-2 gap-8 mt-12 text-sm">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-1.5">
                <p className="text-xs text-gray-700 font-medium">{orcamento.cliente.nome}</p>
                <p className="text-[10px] text-gray-500">Cliente</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-1.5">
                <p className="text-xs text-gray-700 font-medium">
                  {orcamento.profissional?.nome || tenantNome}
                </p>
                {orcamento.profissional?.registro && (
                  <p className="text-[10px] text-gray-500">{orcamento.profissional.registro}</p>
                )}
                <p className="text-[10px] text-gray-500">Responsável</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
