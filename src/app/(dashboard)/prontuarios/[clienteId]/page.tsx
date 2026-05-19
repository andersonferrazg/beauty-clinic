"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Calendar, User, Camera, FileText, IdCard,
  ChevronDown, ChevronUp, Loader2, ClipboardList, Syringe, ScrollText,
  Pencil, Printer, Upload, MapPin, Phone, FileSearch, BookOpen, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalCliente } from "@/components/modal-cliente";
import { ModalSeletorFicha, TipoFicha } from "@/components/modal-seletor-ficha";
import { ModalFichaAnamnese } from "@/components/modal-ficha-anamnese";
import { ModalFichaPlanejamento } from "@/components/modal-ficha-planejamento";
import { ModalFichaTermo } from "@/components/modal-ficha-termo";
import { ModalFichaCartilha } from "@/components/modal-ficha-cartilha";
import { ModalFichaControleSessoes } from "@/components/modal-ficha-controle-sessoes";
import { ModalImportarDocumento } from "@/components/modal-importar-documento";
import { ModalFotos } from "@/components/modal-fotos";
import type { TipoTermo } from "@/lib/termos";
import type { TipoCartilha } from "@/lib/cartilhas";
import { cn } from "@/lib/utils";

type Profissional = { id: string; nome: string; cor: string };
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
type Prontuario = { id: string; procedimentos: Procedimento[] };
type Cliente = {
  id: string;
  nome: string;
  telefone1: string | null;
  telefone2: string | null;
  email: string | null;
  cpf: string | null;
  rg: string | null;
  sexo: string | null;
  dataNascimento: string | null;
  endereco: string | null;
};

// ── Visual por tipo de ficha ──────────────────────────────────────────────────
function visualPorTipo(tipo: string) {
  if (tipo.startsWith("cartilha_")) {
    const nomes: Record<string, string> = {
      cartilha_botox: "Cartilha Pós — Toxina Botulínica",
      cartilha_preenchimento: "Cartilha Pós — Preenchimento",
      cartilha_bioestimuladores: "Cartilha Pós — Bioestimuladores",
      cartilha_skinbooster: "Cartilha Pós — Skinbooster",
      cartilha_fios_pdo: "Cartilha Pós — Fios de PDO",
      cartilha_peeling: "Cartilha Pós — Peeling Químico",
      cartilha_microagulhamento: "Cartilha Pós — Microagulhamento",
      cartilha_intradermoterapia: "Cartilha Pós — Intradermoterapia",
      cartilha_peim: "Cartilha Pós — PEIM",
      cartilha_enzimas: "Cartilha Pós — Enzimas",
      cartilha_rinomodelacao: "Cartilha Pós — Rinomodelação",
    };
    return { titulo: nomes[tipo] ?? tipo, cor: "#10b981", Icon: BookOpen };
  }
  const map: Record<string, { titulo: string; cor: string; Icon: React.ComponentType<{ size?: number }> }> = {
    anamnese: { titulo: "Anamnese Avançada", cor: "#3b82f6", Icon: ClipboardList },
    planejamento: { titulo: "Planejamento de Procedimentos", cor: "#B89968", Icon: Syringe },
    controle_sessoes: { titulo: "Controle de Sessões", cor: "#0891b2", Icon: Activity },
    termo_botox: { titulo: "Termo — Toxina Botulínica", cor: "#a855f7", Icon: ScrollText },
    termo_preenchimento: { titulo: "Termo — Preenchimento Facial", cor: "#ec4899", Icon: ScrollText },
    termo_bioestimuladores: { titulo: "Termo — Bioestimuladores", cor: "#8b5cf6", Icon: ScrollText },
    termo_skinbooster: { titulo: "Termo — Skinbooster", cor: "#06b6d4", Icon: ScrollText },
    termo_fios_pdo: { titulo: "Termo — Fios de PDO", cor: "#f59e0b", Icon: ScrollText },
    termo_peeling: { titulo: "Termo — Peeling Químico", cor: "#ef4444", Icon: ScrollText },
    termo_microagulhamento: { titulo: "Termo — Microagulhamento", cor: "#f97316", Icon: ScrollText },
    termo_intradermoterapia: { titulo: "Termo — Intradermoterapia", cor: "#84cc16", Icon: ScrollText },
    termo_peim: { titulo: "Termo — PEIM (Microvasos)", cor: "#14b8a6", Icon: ScrollText },
    termo_enzimas: { titulo: "Termo — Enzimas Lipolíticas", cor: "#f43f5e", Icon: ScrollText },
    termo_rinomodelacao: { titulo: "Termo — Rinomodelação", cor: "#6366f1", Icon: ScrollText },
    contrato_geral: { titulo: "Contrato Geral de Serviços", cor: "#64748b", Icon: FileText },
    autorizacao_imagem: { titulo: "Autorização de Imagem", cor: "#10b981", Icon: Camera },
    documento_escaneado: { titulo: "Documento Escaneado", cor: "#94a3b8", Icon: FileSearch },
    registro_fotos: { titulo: "Registro Fotográfico", cor: "#f43f5e", Icon: Camera },
  };
  return map[tipo] ?? { titulo: tipo, cor: "#B89968", Icon: FileText };
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatarSexo(s: string | null) {
  if (s === "F") return "Feminino";
  if (s === "M") return "Masculino";
  return null;
}

// ── Card de procedimento (timeline) ───────────────────────────────────────────
function CardFicha({ proc, clienteId }: { proc: Procedimento; clienteId: string }) {
  const [expandido, setExpandido] = useState(false);
  const visual = visualPorTipo(proc.tipo);
  const Icon = visual.Icon;

  let dados: Record<string, unknown> | null = null;
  if (proc.anamnese) {
    try { dados = JSON.parse(proc.anamnese); } catch { /* */ }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#faf5ee] transition-colors text-left"
        onClick={() => setExpandido(!expandido)}
      >
        {/* Data badge */}
        <div className="flex-shrink-0 w-12 text-center">
          <p className="text-xl font-bold text-[#B89968] leading-none">
            {new Date(proc.data).getDate().toString().padStart(2, "0")}
          </p>
          <p className="text-xs text-[#9a7d50] capitalize">
            {new Date(proc.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
          </p>
          <p className="text-[10px] text-[#9a7d50]/70">{new Date(proc.data).getFullYear()}</p>
        </div>

        {/* Ícone do tipo */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: visual.cor }}
        >
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#5a4530]">{visual.titulo}</span>
            {proc.assinaturaPaciente && proc.assinaturaProfissional && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                Assinada ✓
              </span>
            )}
          </div>
          <p className="text-xs text-[#9a7d50] mt-0.5">
            {proc.profissional.nome}
            {proc.fotos.length > 0 && (
              <span className="ml-2">
                <Camera size={11} className="inline mr-0.5" />
                {proc.fotos.length}
              </span>
            )}
          </p>
        </div>

        <a
          href={`/prontuarios/${clienteId}/ficha/${proc.id}/imprimir`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#9a7d50] hover:text-[#B89968] flex-shrink-0 p-1"
          title="Imprimir esta ficha"
        >
          <Printer size={15} />
        </a>

        {expandido
          ? <ChevronUp size={16} className="text-[#9a7d50] flex-shrink-0" />
          : <ChevronDown size={16} className="text-[#9a7d50] flex-shrink-0" />}
      </button>

      {expandido && (
        <div className="border-t border-[#e8dcc4] px-4 py-4 space-y-4">
          {proc.descricao && <p className="text-sm text-[#5a4530]">{proc.descricao}</p>}

          {/* Renderização dos dados específicos */}
          {dados && proc.tipo === "anamnese" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide">Respostas</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries((dados.respostas ?? {}) as Record<string, { resposta: string; detalhe?: string }>)
                  .filter(([, v]) => v.resposta === "sim")
                  .map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[#9a7d50]">{k}: </span>
                      <span className="text-[#5a4530] font-medium">Sim {v.detalhe && `— ${v.detalhe}`}</span>
                    </div>
                  ))}
              </div>
              {dados.anotacoes ? (
                <p className="text-sm text-[#5a4530] pt-2"><span className="text-[#9a7d50] text-xs">Anotações: </span>{String(dados.anotacoes)}</p>
              ) : null}
            </div>
          )}

          {dados && proc.tipo === "planejamento" && (
            <div className="space-y-3 text-sm">
              {((dados.botox as { total?: number } | undefined)?.total ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-1">Botox</p>
                  <p className="text-[#5a4530]">Total: <strong>{String((dados.botox as { total: number }).total)}U</strong></p>
                </div>
              )}
              {Array.isArray(dados.preenchimentos) && (dados.preenchimentos as unknown[]).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-1">Preenchimento</p>
                  <ul className="text-[#5a4530] text-xs space-y-0.5">
                    {(dados.preenchimentos as { regiao: string; volume: string; produto: string }[]).map((p, i) => (
                      <li key={i}>• {p.regiao} — {p.volume} — {p.produto}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dados.dataRetorno ? <p className="text-xs text-[#9a7d50]">Retorno: {formatarData(String(dados.dataRetorno))}</p> : null}
            </div>
          )}

          {dados && proc.tipo === "controle_sessoes" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide">Sessões</p>
              {Array.isArray(dados.sessoes) && (dados.sessoes as { procedimento: string; produto: string; observacao: string }[]).map((s, i) => (
                <div key={i} className="text-xs border border-[#e8dcc4] rounded-lg px-3 py-2">
                  <p className="font-medium text-[#9a7d50] mb-1">Sessão {i + 1}</p>
                  {s.procedimento && <p className="text-[#5a4530]"><span className="text-[#9a7d50]">Procedimento: </span>{s.procedimento}</p>}
                  {s.produto && <p className="text-[#5a4530]"><span className="text-[#9a7d50]">Produto/Lote: </span>{s.produto}</p>}
                  {s.observacao && <p className="text-[#5a4530]"><span className="text-[#9a7d50]">Obs.: </span>{s.observacao}</p>}
                </div>
              ))}
              {!!dados.observacaoGeral && <p className="text-xs text-[#5a4530]"><span className="text-[#9a7d50]">Obs. gerais: </span>{String(dados.observacaoGeral)}</p>}
              {!!dados.dataRetorno && <p className="text-xs text-[#9a7d50]">Retorno: {formatarData(String(dados.dataRetorno))}</p>}
            </div>
          )}

          {/* Fotos */}
          {proc.fotos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Fotos</p>
              <div className="grid grid-cols-3 gap-2">
                {proc.fotos.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden border border-[#e8dcc4] block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.tag} className="w-full h-24 object-cover" />
                    <p className="px-1.5 py-0.5 text-[10px] text-[#9a7d50] capitalize bg-[#faf5ee]">{f.tag}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assinaturas */}
          {(proc.assinaturaPaciente || proc.assinaturaProfissional) && (
            <div>
              <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Assinaturas</p>
              <div className="grid grid-cols-2 gap-3">
                {proc.assinaturaPaciente && (
                  <div>
                    <p className="text-xs text-[#9a7d50] mb-1">Paciente</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proc.assinaturaPaciente} alt="Paciente" className="border border-[#e8dcc4] rounded-lg w-full h-16 object-contain bg-white p-1" />
                  </div>
                )}
                {proc.assinaturaProfissional && (
                  <div>
                    <p className="text-xs text-[#9a7d50] mb-1">Profissional</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proc.assinaturaProfissional} alt="Profissional" className="border border-[#e8dcc4] rounded-lg w-full h-16 object-contain bg-white p-1" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProntuarioClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [editarCliente, setEditarCliente] = useState(false);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [modalAnamnese, setModalAnamnese] = useState(false);
  const [modalPlanejamento, setModalPlanejamento] = useState(false);
  const [modalTermo, setModalTermo] = useState<TipoTermo | null>(null);
  const [modalCartilha, setModalCartilha] = useState<TipoCartilha | null>(null);
  const [modalControleSessoes, setModalControleSessoes] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [modalFotos, setModalFotos] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const r = await fetch(`/api/prontuarios/${clienteId}`);
    const dados = await r.json();
    setCliente(dados.cliente);
    setProntuario(dados.prontuario);
    setCarregando(false);
  }, [clienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  function aoSelecionarFicha(tipo: TipoFicha) {
    if (tipo === "anamnese") { setModalAnamnese(true); return; }
    if (tipo === "planejamento") { setModalPlanejamento(true); return; }
    if (tipo === "controle_sessoes") { setModalControleSessoes(true); return; }
    if (tipo.startsWith("cartilha_")) { setModalCartilha(tipo as TipoCartilha); return; }
    if (tipo === "documento_escaneado") { setModalImportar(true); return; }
    setModalTermo(tipo as TipoTermo);
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-[#B89968]" />
      </div>
    );
  }

  if (!cliente) {
    return <div className="p-6"><p className="text-[#9a7d50]">Paciente não encontrada.</p></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Voltar + ações */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#9a7d50] hover:text-[#5a4530] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`/prontuarios/${clienteId}/imprimir`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/40 text-sm text-[#B89968] hover:bg-[#faf5ee] font-medium"
          >
            <Printer size={14} /> Imprimir Prontuário
          </a>
          <button
            onClick={() => setModalFotos(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/40 text-sm text-[#B89968] hover:bg-[#faf5ee] font-medium"
          >
            <Camera size={14} /> Adicionar Fotos
          </button>
          <button
            onClick={() => setModalImportar(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/40 text-sm text-[#B89968] hover:bg-[#faf5ee] font-medium"
          >
            <Upload size={14} /> Importar Documento
          </button>
          <Button
            onClick={() => setSeletorAberto(true)}
            className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5"
          >
            <Plus size={15} /> Nova Ficha
          </Button>
        </div>
      </div>

      {/* Card de dados pessoais */}
      <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#B89968]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[#B89968] font-bold text-xl">
                {cliente.nome.trim().charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold text-[#5a4530]">{cliente.nome}</h1>
              {formatarSexo(cliente.sexo) && (
                <p className="text-xs text-[#9a7d50] mt-0.5">{formatarSexo(cliente.sexo)}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditarCliente(true)}
            className="flex items-center gap-1 text-xs text-[#B89968] hover:text-[#9a7d50] border border-[#B89968]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#faf5ee] font-medium"
          >
            <Pencil size={11} /> Editar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5 text-sm">
          {cliente.dataNascimento && (
            <div className="flex items-start gap-2">
              <Calendar size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">Nascimento</p>
                <p className="text-[#5a4530]">{new Date(cliente.dataNascimento).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          )}
          {cliente.cpf && (
            <div className="flex items-start gap-2">
              <IdCard size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">CPF</p>
                <p className="text-[#5a4530]">{cliente.cpf}</p>
              </div>
            </div>
          )}
          {cliente.rg && (
            <div className="flex items-start gap-2">
              <IdCard size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">RG</p>
                <p className="text-[#5a4530]">{cliente.rg}</p>
              </div>
            </div>
          )}
          {cliente.telefone1 && (
            <div className="flex items-start gap-2">
              <Phone size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">Telefone</p>
                <p className="text-[#5a4530]">{cliente.telefone1}</p>
              </div>
            </div>
          )}
          {cliente.endereco && (
            <div className="flex items-start gap-2 col-span-2 md:col-span-2">
              <MapPin size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">Endereço</p>
                <p className="text-[#5a4530]">{cliente.endereco}</p>
              </div>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-start gap-2">
              <User size={13} className="text-[#9a7d50] mt-0.5" />
              <div>
                <p className="text-xs text-[#9a7d50]">E-mail</p>
                <p className="text-[#5a4530] truncate">{cliente.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Galeria de Fotos */}
      {(() => {
        const todasFotos = (prontuario?.procedimentos ?? []).flatMap((p) =>
          p.fotos.map((f) => ({ ...f, data: p.data, profissional: p.profissional.nome }))
        );
        if (todasFotos.length === 0) return null;

        const porTag: Record<string, typeof todasFotos> = {};
        for (const f of todasFotos) {
          if (!porTag[f.tag]) porTag[f.tag] = [];
          porTag[f.tag].push(f);
        }
        const ordemTags = ["antes", "durante", "depois", "evolucao", "documento"];
        const coresTags: Record<string, string> = {
          antes: "#3b82f6", durante: "#f59e0b", depois: "#10b981",
          evolucao: "#8b5cf6", documento: "#64748b",
        };
        const nomesTags: Record<string, string> = {
          antes: "Antes", durante: "Durante", depois: "Depois",
          evolucao: "Evolução", documento: "Documento",
        };

        return (
          <div className="bg-white rounded-xl border border-[#e8dcc4] p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#5a4530] flex items-center gap-2">
                <Camera size={16} className="text-[#B89968]" />
                Galeria de Fotos
                <span className="text-xs font-normal text-[#9a7d50]">({todasFotos.length})</span>
              </h2>
              <button
                onClick={() => setModalFotos(true)}
                className="flex items-center gap-1 text-xs text-[#B89968] hover:text-[#9a7d50] border border-[#B89968]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#faf5ee] font-medium"
              >
                <Plus size={11} /> Adicionar
              </button>
            </div>
            <div className="space-y-4">
              {ordemTags.filter((t) => porTag[t]?.length).map((tag) => (
                <div key={tag}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2 py-0.5 rounded inline-block"
                    style={{ backgroundColor: coresTags[tag] + "20", color: coresTags[tag] }}
                  >
                    {nomesTags[tag] ?? tag}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {porTag[tag].map((f) => (
                      <a
                        key={f.id}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-[#e8dcc4] hover:border-[#B89968] transition-colors group"
                        title={f.descricao ?? f.tag}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt={f.tag} className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity" />
                        {f.descricao && (
                          <p className="text-[10px] text-[#9a7d50] px-1.5 py-0.5 bg-[#faf5ee] truncate">{f.descricao}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Timeline */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#5a4530] flex items-center gap-2">
          <FileText size={16} className="text-[#B89968]" />
          Fichas e Procedimentos
        </h2>
        <span className="text-xs text-[#9a7d50]">
          {prontuario?.procedimentos.length ?? 0} registro(s)
        </span>
      </div>

      {!prontuario?.procedimentos.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#9a7d50]/50 bg-white rounded-xl border border-[#e8dcc4]">
          <FileText size={36} strokeWidth={1} />
          <p className="mt-2 text-sm">Nenhuma ficha registrada</p>
          <button
            onClick={() => setSeletorAberto(true)}
            className="mt-3 text-sm text-[#B89968] font-medium hover:underline"
          >
            Preencher primeira ficha
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {prontuario.procedimentos.map((proc) => (
            <CardFicha key={proc.id} proc={proc} clienteId={clienteId} />
          ))}
        </div>
      )}

      {/* Modais */}
      <ModalCliente
        aberto={editarCliente}
        clienteId={clienteId}
        onFechar={() => setEditarCliente(false)}
        onSalvo={() => { setEditarCliente(false); carregar(); }}
      />
      <ModalSeletorFicha
        aberto={seletorAberto}
        onFechar={() => setSeletorAberto(false)}
        onSelecionar={aoSelecionarFicha}
      />
      <ModalFichaAnamnese
        clienteId={clienteId}
        cliente={cliente}
        aberto={modalAnamnese}
        onFechar={() => setModalAnamnese(false)}
        onSalvo={() => { setModalAnamnese(false); carregar(); }}
      />
      <ModalFichaPlanejamento
        clienteId={clienteId}
        cliente={cliente}
        aberto={modalPlanejamento}
        onFechar={() => setModalPlanejamento(false)}
        onSalvo={() => { setModalPlanejamento(false); carregar(); }}
      />
      {modalTermo && (
        <ModalFichaTermo
          clienteId={clienteId}
          cliente={cliente}
          tipo={modalTermo}
          aberto={!!modalTermo}
          onFechar={() => setModalTermo(null)}
          onSalvo={() => { setModalTermo(null); carregar(); }}
        />
      )}
      {modalCartilha && (
        <ModalFichaCartilha
          clienteId={clienteId}
          tipo={modalCartilha}
          aberto={!!modalCartilha}
          onFechar={() => setModalCartilha(null)}
          onSalvo={() => { setModalCartilha(null); carregar(); }}
        />
      )}
      <ModalFichaControleSessoes
        clienteId={clienteId}
        aberto={modalControleSessoes}
        onFechar={() => setModalControleSessoes(false)}
        onSalvo={() => { setModalControleSessoes(false); carregar(); }}
      />
      <ModalImportarDocumento
        clienteId={clienteId}
        cliente={cliente}
        aberto={modalImportar}
        onFechar={() => setModalImportar(false)}
        onSalvo={() => { setModalImportar(false); carregar(); }}
      />
      <ModalFotos
        clienteId={clienteId}
        aberto={modalFotos}
        onFechar={() => setModalFotos(false)}
        onSalvo={() => { setModalFotos(false); carregar(); }}
      />
    </div>
  );
}
