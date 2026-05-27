"use client";
import { dataLocalHoje } from "@/lib/utils";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Upload, Camera, Trash2, Plus, ImageIcon, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CanvasAssinatura } from "@/components/canvas-assinatura";

type Profissional = { id: string; nome: string };
type Cliente = { id: string; nome: string };

type FotoLocal = { url: string; tag: "etiqueta" | "antes" | "depois" | "durante"; descricao: string };

type Props = {
  clienteId: string;
  cliente: Cliente | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

const PROCEDIMENTOS_OPCOES = [
  "Toxina Botulínica",
  "Preenchimento Facial",
  "Preenchimento Labial",
  "Bioestimuladores",
  "Fios de Sustentação",
  "Rinomodelação",
  "Skinbooster",
  "Microagulhamento",
  "Peeling Químico",
];

const REGIOES_BOTOX = [
  "Frontal",
  "Corrugador",
  "Prócero",
  "Orbicular do olho",
  "Mentual",
  "Levantador do lábio superior",
  "Depressor do septo nasal",
  "Depressor do ângulo da boca",
  "Platisma",
];

type LinhaPreenchimento = { regiao: string; volume: string; produto: string };

export function ModalFichaPlanejamento({ clienteId, cliente, aberto, onFechar, onSalvo }: Props) {
  const router = useRouter();
  const [data, setData] = useState(() => dataLocalHoje());
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [gerandoOrcamento, setGerandoOrcamento] = useState(false);

  const [procedimentosSelecionados, setProcedimentosSelecionados] = useState<string[]>([]);
  const [outroProcedimento, setOutroProcedimento] = useState("");

  // Botox por região
  const [unidades, setUnidades] = useState<Record<string, string>>({});
  const [outrasBotox, setOutrasBotox] = useState("");
  const [outrasBotoxUnidades, setOutrasBotoxUnidades] = useState("");

  // Validade / lote / diluição
  const [validade, setValidade] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [volumeDiluicao, setVolumeDiluicao] = useState("");

  // Preenchimento (linhas dinâmicas)
  const [preenchimentos, setPreenchimentos] = useState<LinhaPreenchimento[]>([
    { regiao: "", volume: "", produto: "" },
  ]);

  // Anotações
  const [anotacoes, setAnotacoes] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");

  // Fotos
  const [fotos, setFotos] = useState<FotoLocal[]>([]);
  const [uploadando, setUploadando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  // Assinaturas
  const [assinaturaPaciente, setAssinaturaPaciente] = useState<string | null>(null);
  const [assinaturaProfissional, setAssinaturaProfissional] = useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    Promise.all([
      fetch("/api/profissionais").then((r) => r.json()),
      fetch("/api/me/sessao").then((r) => r.json()).catch(() => null),
    ]).then(([lista, sessao]) => {
      setProfissionais(lista);
      if (!profissionalId) setProfissionalId(sessao?.profissionalId ?? lista[0]?.id ?? "");
    });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      setData(dataLocalHoje());
      setProcedimentosSelecionados([]);
      setOutroProcedimento("");
      setUnidades({});
      setOutrasBotox("");
      setOutrasBotoxUnidades("");
      setValidade("");
      setNumeroLote("");
      setVolumeDiluicao("");
      setPreenchimentos([{ regiao: "", volume: "", produto: "" }]);
      setAnotacoes("");
      setDataRetorno("");
      setFotos([]);
      setAssinaturaPaciente(null);
      setAssinaturaProfissional(null);
      setErro("");
    }
  }, [aberto]);

  function toggleProcedimento(p: string) {
    setProcedimentosSelecionados((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  const totalUnidades = (() => {
    let t = 0;
    Object.values(unidades).forEach((u) => { const n = parseInt(u); if (!isNaN(n)) t += n; });
    const outras = parseInt(outrasBotoxUnidades);
    if (!isNaN(outras)) t += outras;
    return t;
  })();

  async function uploadarFoto(file: File, tag: FotoLocal["tag"] = "etiqueta") {
    setUploadando(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pasta", "prontuarios");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Erro ao enviar foto");
      const { url } = await r.json();
      setFotos((prev) => [...prev, { url, tag, descricao: "" }]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar foto");
    } finally {
      setUploadando(false);
    }
  }

  function aoSelecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => uploadarFoto(f));
    e.target.value = "";
  }

  function adicionarLinhaPreenchimento() {
    setPreenchimentos((prev) => [...prev, { regiao: "", volume: "", produto: "" }]);
  }

  function atualizarPreenchimento(idx: number, campo: keyof LinhaPreenchimento, valor: string) {
    setPreenchimentos((prev) => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  }

  function removerLinhaPreenchimento(idx: number) {
    setPreenchimentos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    setErro("");
    setSalvando(true);
    try {
      const dadosPlanejamento = {
        procedimentos: procedimentosSelecionados,
        outroProcedimento,
        botox: {
          unidades,
          outras: outrasBotox,
          outrasUnidades: outrasBotoxUnidades,
          total: totalUnidades,
        },
        validade,
        numeroLote,
        volumeDiluicao,
        preenchimentos: preenchimentos.filter((p) => p.regiao || p.volume || p.produto),
        dataRetorno,
        anotacoes,
      };

      const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId,
          data,
          tipo: "planejamento",
          descricao: "Planejamento de Procedimentos Faciais",
          anamnese: dadosPlanejamento,
          termoAceito: true,
          assinaturaPaciente,
          assinaturaProfissional,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.erro || `Erro ao salvar (HTTP ${r.status})`);
      }
      const proc = await r.json();

      // Upload das fotos
      for (const foto of fotos) {
        const rf = await fetch(`/api/prontuarios/${clienteId}/fotos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            procedimentoId: proc.id,
            url: foto.url,
            tag: foto.tag,
            descricao: foto.descricao || null,
          }),
        });
        if (!rf.ok) {
          const e = await rf.json().catch(() => ({}));
          throw new Error(e.erro || "Erro ao salvar foto");
        }
      }

      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setSalvando(false);
    }
  }

  async function gerarOrcamento() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    setErro("");
    setGerandoOrcamento(true);
    try {
      // 1. Salva a ficha no prontuário
      const dadosPlanejamento = {
        procedimentos: procedimentosSelecionados,
        outroProcedimento,
        botox: { unidades, outras: outrasBotox, outrasUnidades: outrasBotoxUnidades, total: totalUnidades },
        validade, numeroLote, volumeDiluicao,
        preenchimentos: preenchimentos.filter((p) => p.regiao || p.volume || p.produto),
        dataRetorno, anotacoes,
      };
      const r1 = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId, data, tipo: "planejamento",
          descricao: "Planejamento de Procedimentos Faciais",
          anamnese: dadosPlanejamento,
          termoAceito: true, assinaturaPaciente, assinaturaProfissional,
        }),
      });
      if (!r1.ok) {
        const e = await r1.json().catch(() => ({}));
        throw new Error(e.erro || "Erro ao salvar a ficha");
      }

      // 2. Busca serviços e tenta casar com os procedimentos marcados
      type ServicoBasic = { id: string; nome: string; preco: number };
      const servicosLista: ServicoBasic[] = await fetch("/api/servicos")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const itensMapped: Array<{ servicoId: string; preco: number; quantidade: number }> = [];
      const semServico: string[] = [];
      for (const proc of procedimentosSelecionados) {
        const match = servicosLista.find(
          (s) =>
            s.nome.toLowerCase().includes(proc.toLowerCase()) ||
            proc.toLowerCase().includes(s.nome.toLowerCase())
        );
        if (match) {
          itensMapped.push({ servicoId: match.id, preco: match.preco, quantidade: 1 });
        } else {
          semServico.push(proc);
        }
      }

      // Monta observação com procedimentos não encontrados + outros
      const partes: string[] = [];
      if (semServico.length > 0) partes.push(semServico.join(", "));
      if (outroProcedimento) partes.push(outroProcedimento);
      if (totalUnidades > 0) partes.push(`Botox total: ${totalUnidades}ui`);
      const observacaoTexto = partes.filter(Boolean).join(" | ");

      // 3. Cria orçamento com os itens encontrados e a cliente pré-preenchida
      const r2 = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          profissionalId,
          itens: itensMapped,
          observacao: observacaoTexto || null,
        }),
      });
      if (!r2.ok) {
        const e = await r2.json().catch(() => ({}));
        throw new Error(e.erro || "Erro ao criar orçamento");
      }
      const orcamento = await r2.json();

      // 3. Abre o orçamento criado direto no modal
      onSalvo();
      onFechar();
      router.push(`/orcamentos?abrir=${orcamento.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar orçamento.");
    } finally {
      setGerandoOrcamento(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Planejamento de Procedimentos Faciais</h2>
            {cliente && <p className="text-xs text-[#9a7d50] mt-0.5">{cliente.nome}</p>}
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        {/* Profissional + Data */}
        <div className="px-5 pt-4 pb-3 border-b border-[#e8dcc4] flex-shrink-0 flex gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-[#5a4530] text-xs">Profissional</Label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
            >
              <option value="">Selecionar...</option>
              {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="space-y-1 w-[148px] flex-shrink-0">
            <Label className="text-[#5a4530] text-xs">Data</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border-[#B89968]/30 h-9 text-sm"
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Procedimentos a serem realizados */}
          <div>
            <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Procedimentos a serem realizados</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PROCEDIMENTOS_OPCOES.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#faf5ee]">
                  <input
                    type="checkbox"
                    checked={procedimentosSelecionados.includes(p)}
                    onChange={() => toggleProcedimento(p)}
                    className="accent-[#B89968]"
                  />
                  <span className="text-sm text-[#5a4530]">{p}</span>
                </label>
              ))}
            </div>
            <Input
              value={outroProcedimento}
              onChange={(e) => setOutroProcedimento(e.target.value)}
              placeholder="Outros procedimentos..."
              className="border-[#B89968]/30 mt-2"
            />
          </div>

          {/* Botox por região */}
          <div>
            <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Toxina Botulínica — Unidades por Região</p>
            <div className="rounded-lg border border-[#e8dcc4] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#faf5ee]">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-[#5a4530] w-20">Unidades</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-[#5a4530]">Região</th>
                  </tr>
                </thead>
                <tbody>
                  {REGIOES_BOTOX.map((regiao) => (
                    <tr key={regiao} className="border-t border-[#e8dcc4]">
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          value={unidades[regiao] ?? ""}
                          onChange={(e) => setUnidades({ ...unidades, [regiao]: e.target.value })}
                          className="w-16 text-center border border-[#e8dcc4] rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                        />
                      </td>
                      <td className="px-3 py-1 text-[#5a4530]">{regiao}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[#e8dcc4]">
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        value={outrasBotoxUnidades}
                        onChange={(e) => setOutrasBotoxUnidades(e.target.value)}
                        className="w-16 text-center border border-[#e8dcc4] rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        type="text"
                        value={outrasBotox}
                        onChange={(e) => setOutrasBotox(e.target.value)}
                        placeholder="Outras..."
                        className="w-full border border-[#e8dcc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                      />
                    </td>
                  </tr>
                  <tr className="border-t border-[#e8dcc4] bg-[#faf5ee]/50">
                    <td className="px-2 py-2 font-bold text-[#B89968] text-center">{totalUnidades}</td>
                    <td className="px-3 py-2 text-[#5a4530] font-semibold">Total de unidades injetadas</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="space-y-1">
                <Label className="text-[#5a4530] text-xs">Validade</Label>
                <Input
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  placeholder="MM/AAAA"
                  className="border-[#B89968]/30 h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#5a4530] text-xs">Número do Lote</Label>
                <Input
                  value={numeroLote}
                  onChange={(e) => setNumeroLote(e.target.value)}
                  className="border-[#B89968]/30 h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#5a4530] text-xs">Volume de Diluição</Label>
                <Input
                  value={volumeDiluicao}
                  onChange={(e) => setVolumeDiluicao(e.target.value)}
                  placeholder="ml"
                  className="border-[#B89968]/30 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preenchimento */}
          <div>
            <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Preenchimento — Região / Volume / Produto</p>
            <div className="space-y-2">
              {preenchimentos.map((linha, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    value={linha.regiao}
                    onChange={(e) => atualizarPreenchimento(idx, "regiao", e.target.value)}
                    placeholder="Região (lábio, mento...)"
                    className="border-[#B89968]/30 h-9 text-sm col-span-5"
                  />
                  <Input
                    value={linha.volume}
                    onChange={(e) => atualizarPreenchimento(idx, "volume", e.target.value)}
                    placeholder="Volume (ml)"
                    className="border-[#B89968]/30 h-9 text-sm col-span-2"
                  />
                  <Input
                    value={linha.produto}
                    onChange={(e) => atualizarPreenchimento(idx, "produto", e.target.value)}
                    placeholder="Produto"
                    className="border-[#B89968]/30 h-9 text-sm col-span-4"
                  />
                  <button
                    type="button"
                    onClick={() => removerLinhaPreenchimento(idx)}
                    className="text-red-400 hover:text-red-600 flex justify-center col-span-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={adicionarLinhaPreenchimento}
                className="flex items-center gap-1.5 text-xs text-[#B89968] hover:text-[#9a7d50] font-medium mt-2"
              >
                <Plus size={12} /> Adicionar região
              </button>
            </div>
          </div>

          {/* Etiquetas de rastreabilidade */}
          <div>
            <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-2">Etiquetas de Rastreabilidade / Fotos</p>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={uploadando}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-xs text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1"
              >
                {uploadando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Enviar Foto
              </button>
              <button
                type="button"
                onClick={() => inputCameraRef.current?.click()}
                disabled={uploadando}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-xs text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1"
              >
                <Camera size={14} /> Usar Câmera
              </button>
            </div>
            <input ref={inputFotoRef} type="file" accept="image/*" multiple className="hidden" onChange={aoSelecionarArquivos} />
            <input ref={inputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoSelecionarArquivos} />

            {fotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-[#9a7d50]/50 border border-dashed border-[#e8dcc4] rounded-lg">
                <ImageIcon size={28} strokeWidth={1} />
                <p className="text-xs mt-1">Nenhuma foto adicionada</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((f, idx) => (
                  <div key={idx} className="rounded-lg border border-[#e8dcc4] overflow-hidden bg-[#faf5ee]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.tag} className="w-full h-24 object-cover" />
                    <div className="p-1.5 space-y-1">
                      <select
                        value={f.tag}
                        onChange={(e) => setFotos((prev) => prev.map((x, i) => i === idx ? { ...x, tag: e.target.value as FotoLocal["tag"] } : x))}
                        className="w-full text-xs border border-[#e8dcc4] rounded px-1 py-0.5"
                      >
                        <option value="etiqueta">Etiqueta</option>
                        <option value="antes">Antes</option>
                        <option value="durante">Durante</option>
                        <option value="depois">Depois</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setFotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="w-full text-xs text-red-400 hover:text-red-600 flex justify-center items-center gap-1"
                      >
                        <Trash2 size={10} /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anotações e Retorno */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <Label className="text-[#5a4530] text-xs">Data de Retorno</Label>
              <Input
                type="date"
                value={dataRetorno}
                onChange={(e) => setDataRetorno(e.target.value)}
                className="border-[#B89968]/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[#5a4530] text-xs">Anotações</Label>
              <Input
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="Observações do procedimento..."
                className="border-[#B89968]/30 h-9 text-sm"
              />
            </div>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-4">
            <CanvasAssinatura
              label="Assinatura do(a) Paciente"
              altura={120}
              onMudar={setAssinaturaPaciente}
            />
            <CanvasAssinatura
              label="Assinatura da Profissional"
              altura={120}
              onMudar={setAssinaturaProfissional}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex-shrink-0">
          {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onFechar}
              className="flex-1 min-w-[100px] border-[#e8dcc4] text-[#9a7d50]"
            >
              FECHAR
            </Button>
            <Button
              type="button"
              onClick={gerarOrcamento}
              disabled={salvando || gerandoOrcamento}
              className="flex-1 min-w-[160px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              title="Salva a ficha e abre a tela de orçamentos"
            >
              {gerandoOrcamento ? (
                <><Loader2 size={14} className="animate-spin" />Salvando...</>
              ) : (
                <><Receipt size={14} />Gerar Orçamento</>
              )}
            </Button>
            <Button
              type="button"
              onClick={salvar}
              disabled={salvando || gerandoOrcamento}
              className="flex-1 min-w-[100px] bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <><Loader2 size={14} className="animate-spin mr-1" />Salvando...</> : "SALVAR"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
