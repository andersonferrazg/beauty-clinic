"use client";

import { useEffect, useState, use } from "react";
import { Printer, Loader2 } from "lucide-react";
import { TERMOS } from "@/lib/termos";
import { CARTILHAS } from "@/lib/cartilhas";
import { PrintHeader } from "@/components/print-header";

type Cliente = {
  nome: string;
  cpf: string | null;
  rg: string | null;
  dataNascimento: string | null;
  endereco: string | null;
  telefone1: string | null;
  email: string | null;
  sexo: string | null;
};

type Profissional = { id: string; nome: string; registro: string | null };
type Foto = { id: string; url: string; tag: string; descricao: string | null };

type Procedimento = {
  id: string;
  tipo: string;
  data: string;
  descricao: string | null;
  anamnese: string | null;
  assinaturaPaciente: string | null;
  assinaturaProfissional: string | null;
  profissional: Profissional;
  fotos: Foto[];
};

type Prontuario = { id: string; procedimentos: Procedimento[] };

type AgendamentoHist = {
  id: string;
  inicio: string;
  dataRealizado: string | null;
  valorTotal: number | null;
  formaPagamento: string | null;
  profissional: { nome: string };
  itens: { id: string; servico: { nome: string } | null }[];
};

type OrcamentoHist = {
  id: string;
  status: string;
  valorTotal: number;
  dataValidade: string;
  criadoEm: string;
  agendamentoId: string | null;
  itens: { servico: { nome: string } | null }[];
};

const STATUS_ORC_LABEL: Record<string, string> = {
  EM_ABERTO: "Em Aberto",
  APROVADO: "Aprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function tituloTipo(tipo: string): string {
  if (tipo in TERMOS) return TERMOS[tipo as keyof typeof TERMOS].titulo;
  if (tipo in CARTILHAS) return CARTILHAS[tipo as keyof typeof CARTILHAS].titulo;
  const map: Record<string, string> = {
    anamnese: "Ficha de Anamnese Avançada",
    planejamento: "Planejamento de Procedimentos Faciais",
    controle_sessoes: "Controle de Tratamentos e Sessões",
    documento_escaneado: "Documento Escaneado",
  };
  return map[tipo] ?? tipo;
}

function formatarSexo(s: string | null) {
  if (s === "F") return "Feminino";
  if (s === "M") return "Masculino";
  return null;
}

function CardImpressao({ proc }: { proc: Procedimento }) {
  let dados: Record<string, unknown> | null = null;
  if (proc.anamnese) {
    try { dados = JSON.parse(proc.anamnese); } catch { /* */ }
  }

  return (
    <div className="border-2 border-[#B89968]/30 rounded-lg p-5 mb-4 ficha-page break-inside-avoid">
      <div className="flex items-center justify-between border-b border-[#B89968]/30 pb-2 mb-3">
        <p className="font-semibold text-[#5a4530]">{tituloTipo(proc.tipo)}</p>
        <p className="text-xs text-gray-600">{formatarData(proc.data)} — {proc.profissional.nome}</p>
      </div>

      {proc.descricao && <p className="text-xs text-gray-700 mb-3 italic">{proc.descricao}</p>}

      {/* Anamnese */}
      {proc.tipo === "anamnese" && dados && (
        <div className="grid grid-cols-2 gap-x-4 text-xs">
          {Object.entries((dados.respostas ?? {}) as Record<string, { resposta: string; detalhe?: string }>)
            .filter(([, v]) => v.resposta === "sim")
            .map(([k, v]) => (
              <div key={k} className="py-0.5">
                <span className="text-gray-600">{k}: </span>
                <span className="font-medium">Sim {v.detalhe && `— ${v.detalhe}`}</span>
              </div>
            ))}
          {dados.anotacoes ? <p className="col-span-2 mt-2 text-gray-700"><strong>Anotações:</strong> {String(dados.anotacoes)}</p> : null}
        </div>
      )}

      {/* Planejamento */}
      {proc.tipo === "planejamento" && dados && (
        <div className="space-y-2 text-xs">
          {((dados.botox as { total?: number } | undefined)?.total ?? 0) > 0 && (
            <p>
              <strong className="text-[#B89968]">Botox total:</strong>{" "}
              {String((dados.botox as { total: number }).total)} U
            </p>
          )}
          {Array.isArray(dados.preenchimentos) && (dados.preenchimentos as unknown[]).length > 0 && (
            <div>
              <strong className="text-[#B89968]">Preenchimento:</strong>
              <ul className="ml-3">
                {(dados.preenchimentos as { regiao: string; volume: string; produto: string }[]).map((p, i) => (
                  <li key={i}>• {p.regiao} — {p.volume} — {p.produto}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Controle de sessões */}
      {proc.tipo === "controle_sessoes" && dados && (
        <div className="space-y-2 text-xs">
          {Array.isArray(dados.sessoes) && (dados.sessoes as { procedimento: string; produto: string; observacao: string }[]).map((s, i) => (
            <div key={i} className="border border-gray-100 rounded px-2 py-1">
              <p className="font-medium text-[#9a7d50]">Sessão {i + 1}</p>
              {s.procedimento && <p><strong>Procedimento:</strong> {s.procedimento}</p>}
              {s.produto && <p><strong>Produto/Lote:</strong> {s.produto}</p>}
              {s.observacao && <p><strong>Obs.:</strong> {s.observacao}</p>}
            </div>
          ))}
          {!!dados.observacaoGeral && <p><strong>Obs. gerais:</strong> {String(dados.observacaoGeral)}</p>}
          {!!dados.dataRetorno && <p><strong>Retorno:</strong> {formatarData(String(dados.dataRetorno))}</p>}
        </div>
      )}

      {/* Texto completo dos termos */}
      {proc.tipo in TERMOS && (() => {
        const termo = TERMOS[proc.tipo as keyof typeof TERMOS];
        return (
          <div className="mb-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
            <pre className="text-[10px] text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{termo.texto}</pre>
          </div>
        );
      })()}

      {/* Texto das cartilhas */}
      {proc.tipo in CARTILHAS && (() => {
        const cartilha = CARTILHAS[proc.tipo as keyof typeof CARTILHAS];
        return (
          <div className="mb-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
            <pre className="text-[10px] text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{cartilha.texto}</pre>
          </div>
        );
      })()}

      {/* Fotos */}
      {proc.fotos.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {proc.fotos.slice(0, 4).map((f) => (
            <div key={f.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.tag} className="w-full h-16 object-cover border" />
              <p className="text-[9px] text-gray-500 capitalize text-center">{f.tag}</p>
            </div>
          ))}
        </div>
      )}

      {/* Assinaturas */}
      {(proc.assinaturaPaciente || proc.assinaturaProfissional) && (
        <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
          {proc.assinaturaPaciente && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proc.assinaturaPaciente} alt="Paciente" className="max-h-10 object-contain mx-auto" />
              <p className="text-[9px] text-gray-500 border-t mt-1">Paciente</p>
            </div>
          )}
          {proc.assinaturaProfissional && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proc.assinaturaProfissional} alt="Profissional" className="max-h-10 object-contain mx-auto" />
              <p className="text-[9px] text-gray-500 border-t mt-1">
                {proc.profissional.nome}
                {proc.profissional.registro && <><br />{proc.profissional.registro}</>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImprimirProntuarioPage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = use(params);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [historico, setHistorico] = useState<AgendamentoHist[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoHist[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [inclHistorico, setInclHistorico] = useState(true);
  const [inclOrcamentos, setInclOrcamentos] = useState(true);
  const [inclFichas, setInclFichas] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/prontuarios/${clienteId}`).then((r) => r.json()),
      fetch(`/api/clientes/${clienteId}?historico=completo`).then((r) => r.json()).catch(() => null),
      fetch(`/api/orcamentos?clienteId=${clienteId}`).then((r) => r.json()).catch(() => []),
    ]).then(([prontRes, cliRes, orcRes]) => {
      setCliente(prontRes.cliente);
      setProntuario(prontRes.prontuario);
      setHistorico(Array.isArray(cliRes?.agendamentos) ? cliRes.agendamentos : []);
      setOrcamentos(Array.isArray(orcRes) ? orcRes : []);
      setCarregando(false);
    });
  }, [clienteId]);

  if (carregando) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 size={28} className="animate-spin text-[#B89968]" /></div>;
  }

  if (!cliente) return <div className="p-6">Paciente não encontrada.</div>;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm 1.5cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .ficha-page { page-break-inside: avoid; }
          ${!inclHistorico ? ".secao-historico { display: none !important; }" : ""}
          ${!inclOrcamentos ? ".secao-orcamentos { display: none !important; }" : ""}
          ${!inclFichas ? ".secao-fichas { display: none !important; }" : ""}
        }
        .prontuario-impressao { font-family: Geist, system-ui, sans-serif; color: #1f2937; line-height: 1.5; }
      `}</style>
      <div className="min-h-screen bg-gray-100 prontuario-impressao">
        <div className="no-print bg-white border-b px-6 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-gray-700">Prontuário — {cliente.nome}</h1>
              <p className="text-xs text-gray-500">{prontuario?.procedimentos.length ?? 0} ficha(s)</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#B89968] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#9a7d50]"
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
            <span className="font-medium text-gray-500">Incluir na impressão:</span>
            {[
              { label: "Histórico de Atendimentos", value: inclHistorico, set: setInclHistorico },
              { label: "Orçamentos", value: inclOrcamentos, set: setInclOrcamentos },
              { label: "Fichas Clínicas", value: inclFichas, set: setInclFichas },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="accent-[#B89968] w-3.5 h-3.5"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white p-10 my-6 shadow-sm print:shadow-none print:my-0 print:p-0">
          {/* Cabeçalho */}
          <div className="border-b-2 border-[#B89968] pb-4 mb-5">
            <PrintHeader
              subtitulo={
                <>
                  <p className="text-sm text-gray-600">Prontuário do(a) Paciente</p>
                  <p className="text-xs text-gray-500 mt-0.5">Emitido em: {new Date().toLocaleDateString("pt-BR")}</p>
                </>
              }
            />
          </div>

          {/* Dados pessoais */}
          <div className="mb-6 text-sm">
            <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2 border-b border-gray-200 pb-1">Dados da Paciente</p>
            <table className="w-full">
              <tbody>
                <tr><td className="pr-3 py-0.5 text-gray-600 w-32">Nome:</td><td className="font-medium">{cliente.nome}</td></tr>
                {formatarSexo(cliente.sexo) && <tr><td className="pr-3 py-0.5 text-gray-600">Sexo:</td><td>{formatarSexo(cliente.sexo)}</td></tr>}
                {cliente.dataNascimento && <tr><td className="pr-3 py-0.5 text-gray-600">Data Nasc.:</td><td>{formatarData(cliente.dataNascimento)}</td></tr>}
                {cliente.cpf && <tr><td className="pr-3 py-0.5 text-gray-600">CPF:</td><td>{formatarCPF(cliente.cpf)}</td></tr>}
                {cliente.rg && <tr><td className="pr-3 py-0.5 text-gray-600">RG:</td><td>{cliente.rg}</td></tr>}
                {cliente.endereco && <tr><td className="pr-3 py-0.5 text-gray-600">Endereço:</td><td>{cliente.endereco}</td></tr>}
                {cliente.telefone1 && <tr><td className="pr-3 py-0.5 text-gray-600">Telefone:</td><td>{formatarTelefone(cliente.telefone1)}</td></tr>}
                {cliente.email && <tr><td className="pr-3 py-0.5 text-gray-600">E-mail:</td><td>{cliente.email}</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Histórico de Atendimentos */}
          {(() => {
            const atendimentos = historico.filter((a) => a.dataRealizado);
            const total = atendimentos.reduce((s, a) => s + (a.valorTotal ?? 0), 0);
            if (atendimentos.length === 0) return null;
            return (
              <div className="mb-6 secao-historico">
                <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-1">
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide">
                    Histórico de Atendimentos
                  </p>
                  <p className="text-xs text-[#5a4530] font-semibold">
                    Total gasto: {formatarBRL(total)}
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="py-1 pr-2 font-medium">Data</th>
                      <th className="py-1 pr-2 font-medium">Profissional</th>
                      <th className="py-1 pr-2 font-medium">Serviços</th>
                      <th className="py-1 pr-2 font-medium text-right">Valor</th>
                      <th className="py-1 font-medium">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendimentos.map((a) => {
                      const data = new Date(a.inicio);
                      const servicos = a.itens.map((it) => it.servico?.nome).filter(Boolean).join(", ") || "—";
                      return (
                        <tr key={a.id} className="border-b border-gray-100">
                          <td className="py-1 pr-2">{data.toLocaleDateString("pt-BR")}</td>
                          <td className="py-1 pr-2">{a.profissional.nome.split(" ")[0]}</td>
                          <td className="py-1 pr-2">{servicos}</td>
                          <td className="py-1 pr-2 text-right font-medium">
                            {a.valorTotal != null ? formatarBRL(a.valorTotal) : "—"}
                          </td>
                          <td className="py-1">{a.formaPagamento || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Orçamentos */}
          {orcamentos.length > 0 && (
            <div className="mb-6 secao-orcamentos">
              <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2 border-b border-gray-200 pb-1">
                Orçamentos
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600 border-b border-gray-200">
                    <th className="py-1 pr-2 font-medium">Data</th>
                    <th className="py-1 pr-2 font-medium">Serviços</th>
                    <th className="py-1 pr-2 font-medium text-right">Valor</th>
                    <th className="py-1 pr-2 font-medium">Status</th>
                    <th className="py-1 font-medium">Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((o) => {
                    const servicos = o.itens.map((it) => it.servico?.nome).filter(Boolean).join(", ") || "—";
                    return (
                      <tr key={o.id} className="border-b border-gray-100">
                        <td className="py-1 pr-2">{formatarData(o.criadoEm)}</td>
                        <td className="py-1 pr-2">{servicos}</td>
                        <td className="py-1 pr-2 text-right font-medium">{formatarBRL(o.valorTotal)}</td>
                        <td className="py-1 pr-2">{STATUS_ORC_LABEL[o.status]}</td>
                        <td className="py-1">{formatarData(o.dataValidade)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Fichas */}
          <div className="secao-fichas">
            <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-3 border-b border-gray-200 pb-1">Histórico de Fichas e Procedimentos</p>
            {!prontuario?.procedimentos.length ? (
              <p className="text-sm text-gray-500 italic py-4 text-center">Nenhuma ficha registrada.</p>
            ) : (
              <div>
                {prontuario.procedimentos.map((p) => (
                  <CardImpressao key={p.id} proc={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
