"use client";

import { useEffect, useState, use } from "react";
import { Printer, Loader2 } from "lucide-react";
import { TERMOS } from "@/lib/termos";
import { CARTILHAS } from "@/lib/cartilhas";
import { CanvasFacePlanner, type Marcacao } from "@/components/canvas-face-planner";

type Cliente = {
  nome: string;
  cpf: string | null;
  rg: string | null;
  dataNascimento: string | null;
  endereco: string | null;
  telefone1: string | null;
  sexo: string | null;
};

type Profissional = { id: string; nome: string; registro: string | null };

type Foto = { id: string; url: string; tag: string; descricao: string | null };

type Procedimento = {
  id: string;
  tipo: string;
  data: string;
  descricao: string | null;
  produtosUsados: string | null;
  anamnese: string | null;
  termoAceito: boolean;
  assinaturaPaciente: string | null;
  assinaturaProfissional: string | null;
  profissional: Profissional;
  fotos: Foto[];
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
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

export default function ImprimirFichaPage({
  params,
}: {
  params: Promise<{ clienteId: string; fichaId: string }>;
}) {
  const { clienteId, fichaId } = use(params);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [proc, setProc] = useState<Procedimento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nomeClinica, setNomeClinica] = useState("Beauty Clinic");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/prontuarios/${clienteId}`).then((r) => r.json()),
      fetch(`/api/prontuarios/${clienteId}/procedimentos/${fichaId}`).then((r) => r.json()),
    ]).then(([dadosCliente, dadosProc]) => {
      setCliente(dadosCliente.cliente);
      setProc(dadosProc);
      setCarregando(false);
    });
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((d) => { setNomeClinica(d.nome); setLogoUrl(d.logoUrl ?? null); })
      .catch(() => {});
  }, [clienteId, fichaId]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  if (!cliente || !proc) {
    return <div className="p-6">Não encontrado.</div>;
  }

  let dados: Record<string, unknown> | null = null;
  if (proc.anamnese) {
    try { dados = JSON.parse(proc.anamnese); } catch { /* */ }
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm 1.5cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        .ficha-impressao {
          font-family: Geist, system-ui, sans-serif;
          color: #1f2937;
          line-height: 1.5;
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 ficha-impressao">
        {/* Barra de ações (não imprime) */}
        <div className="no-print bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-sm font-semibold text-gray-700">Pré-visualização de Impressão</h1>
            <p className="text-xs text-gray-500">{tituloTipo(proc.tipo)} — {cliente.nome}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#B89968] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#9a7d50]"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>

        {/* Conteúdo */}
        <div className="max-w-3xl mx-auto bg-white p-10 my-6 shadow-sm print:shadow-none print:my-0 print:p-0">

          {/* Cabeçalho */}
          <div className="flex items-center gap-5 border-b-2 border-[#B89968] pb-4 mb-5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">LB</span>
              </div>
            )}
            <div>
              <p className="text-3xl font-bold text-[#B89968] tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{nomeClinica}</p>
              <p className="text-sm text-gray-600 mt-1">{tituloTipo(proc.tipo)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Data: {formatarData(proc.data)}</p>
            </div>
          </div>

          {/* Dados da paciente */}
          <div className="mb-5 text-sm">
            <table className="w-full">
              <tbody>
                <tr><td className="pr-3 py-0.5 text-gray-600 w-32">Nome:</td><td className="font-medium">{cliente.nome}</td></tr>
                {cliente.dataNascimento && (
                  <tr><td className="pr-3 py-0.5 text-gray-600">Data Nasc.:</td><td>{formatarData(cliente.dataNascimento)}</td></tr>
                )}
                {cliente.cpf && <tr><td className="pr-3 py-0.5 text-gray-600">CPF:</td><td>{cliente.cpf}</td></tr>}
                {cliente.rg && <tr><td className="pr-3 py-0.5 text-gray-600">RG:</td><td>{cliente.rg}</td></tr>}
                {cliente.endereco && <tr><td className="pr-3 py-0.5 text-gray-600">Endereço:</td><td>{cliente.endereco}</td></tr>}
                {cliente.telefone1 && <tr><td className="pr-3 py-0.5 text-gray-600">Telefone:</td><td>{cliente.telefone1}</td></tr>}
              </tbody>
            </table>
          </div>

          {proc.descricao && (
            <p className="text-sm text-gray-700 mb-4 italic">{proc.descricao}</p>
          )}

          {/* Conteúdo específico por tipo */}
          {proc.tipo === "anamnese" && dados && (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide border-b border-gray-200 pb-1">Questionário</p>
              {Object.entries((dados.respostas ?? {}) as Record<string, { resposta: string; detalhe?: string }>).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 py-1">
                  <span className="text-gray-700">{k}:</span>
                  <span className="font-medium">
                    {v.resposta === "sim" ? `Sim${v.detalhe ? ` — ${v.detalhe}` : ""}` : v.resposta === "nao" ? "Não" : "—"}
                  </span>
                </div>
              ))}
              {dados.anotacoes ? (
                <div className="pt-3">
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide">Anotações</p>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{String(dados.anotacoes)}</p>
                </div>
              ) : null}
            </div>
          )}

          {proc.tipo === "planejamento" && dados && (
            <div className="space-y-4 text-sm">
              {/* Planejador visual de injetáveis (se houver marcações) */}
              {Array.isArray(dados.marcacoes) && (dados.marcacoes as Marcacao[]).length > 0 && (
                <div>
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2">Planejamento Visual</p>
                  <CanvasFacePlanner
                    marcacoes={dados.marcacoes as Marcacao[]}
                    produtos={[]}
                    readOnly
                  />
                </div>
              )}

              {Array.isArray(dados.procedimentos) && (dados.procedimentos as string[]).length > 0 && (
                <div>
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide">Procedimentos</p>
                  <p className="text-gray-700">{(dados.procedimentos as string[]).join(", ")}</p>
                </div>
              )}

              {((dados.botox as { total?: number } | undefined)?.total ?? 0) > 0 && (
                <div>
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-1">Toxina Botulínica</p>
                  <table className="w-full text-xs">
                    <tbody>
                      {Object.entries(((dados.botox as { unidades: Record<string, string> }).unidades ?? {})).map(([reg, qtd]) => qtd ? (
                        <tr key={reg}><td className="py-0.5 text-gray-600 w-32">{reg}:</td><td>{qtd} U</td></tr>
                      ) : null)}
                      <tr className="border-t font-semibold"><td className="py-1">Total:</td><td>{String((dados.botox as { total: number }).total)} U</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {Array.isArray(dados.preenchimentos) && (dados.preenchimentos as unknown[]).length > 0 && (
                <div>
                  <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-1">Preenchimento</p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Região</th>
                        <th className="text-left py-1">Volume</th>
                        <th className="text-left py-1">Produto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dados.preenchimentos as { regiao: string; volume: string; produto: string }[]).map((p, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1">{p.regiao}</td>
                          <td className="py-1">{p.volume}</td>
                          <td className="py-1">{p.produto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {dados.anotacoes ? <p className="text-gray-700 text-xs"><strong>Anotações:</strong> {String(dados.anotacoes)}</p> : null}
              {dados.dataRetorno ? <p className="text-gray-700 text-xs"><strong>Retorno:</strong> {formatarData(String(dados.dataRetorno))}</p> : null}
            </div>
          )}

          {proc.tipo === "controle_sessoes" && dados && (
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide border-b border-gray-200 pb-1">Sessões Realizadas</p>
              {Array.isArray(dados.sessoes) && (dados.sessoes as { procedimento: string; produto: string; observacao: string }[]).map((s, i) => (
                <div key={i} className="border border-gray-200 rounded p-3">
                  <p className="font-medium text-xs text-[#9a7d50] mb-1">Sessão {i + 1}</p>
                  {s.procedimento && <p className="text-xs"><strong>Procedimento:</strong> {s.procedimento}</p>}
                  {s.produto && <p className="text-xs"><strong>Produto/Lote:</strong> {s.produto}</p>}
                  {s.observacao && <p className="text-xs"><strong>Observações:</strong> {s.observacao}</p>}
                </div>
              ))}
              {!!dados.observacaoGeral && <p className="text-xs"><strong>Observações gerais:</strong> {String(dados.observacaoGeral)}</p>}
              {!!dados.dataRetorno && <p className="text-xs"><strong>Retorno:</strong> {formatarData(String(dados.dataRetorno))}</p>}
            </div>
          )}

          {proc.tipo in TERMOS && (() => {
            const termo = TERMOS[proc.tipo as keyof typeof TERMOS];
            return (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{termo.texto}</pre>
              </div>
            );
          })()}

          {proc.tipo in CARTILHAS && (() => {
            const cartilha = CARTILHAS[proc.tipo as keyof typeof CARTILHAS];
            return (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{cartilha.texto}</pre>
              </div>
            );
          })()}

          {/* Fotos */}
          {proc.fotos.length > 0 && (
            <div className="mt-5">
              <p className="font-semibold text-[#B89968] uppercase text-xs tracking-wide mb-2">Imagens</p>
              <div className="grid grid-cols-3 gap-2">
                {proc.fotos.map((f) => (
                  <div key={f.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.tag} className="w-full h-28 object-cover border" />
                    <p className="text-xs text-gray-500 capitalize text-center mt-0.5">{f.tag}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assinaturas */}
          <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="h-16 flex items-end justify-center">
                {proc.assinaturaPaciente && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proc.assinaturaPaciente} alt="Paciente" className="max-h-16 object-contain" />
                )}
              </div>
              <div className="border-t border-gray-700 mt-1 pt-1 text-xs text-gray-600">Assinatura do(a) Paciente</div>
            </div>
            <div className="text-center">
              <div className="h-16 flex items-end justify-center">
                {proc.assinaturaProfissional && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proc.assinaturaProfissional} alt="Profissional" className="max-h-16 object-contain" />
                )}
              </div>
              <div className="border-t border-gray-700 mt-1 pt-1 text-xs text-gray-600">
                {proc.profissional.nome}
                {proc.profissional.registro && (
                  <><br /><span className="text-[10px]">{proc.profissional.registro}</span></>
                )}
                <br />Profissional
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
