"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Camera, Trash2, Loader2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, dataLocalHoje } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CanvasAssinatura } from "@/components/canvas-assinatura";

type Profissional = { id: string; nome: string };

type FotoLocal = {
  id?: string;
  url: string;
  tag: "antes" | "durante" | "depois";
  descricao: string;
  novo?: boolean;
};

type AnamneseData = {
  expectativas: string;
  procedimentoAnterior: string;
  procedimentoAnteriorDetalhe: string;
  medicamentos: string;
  medicamentosDetalhe: string;
  alergias: string;
  alergiasDetalhe: string;
  herpes: string;
  queloide: string;
  diabetes: string;
  hipertensao: string;
  anticoagulantes: string;
  gestanteAmamentando: string;
  observacoes: string;
};

const ANAMNESE_VAZIA: AnamneseData = {
  expectativas: "",
  procedimentoAnterior: "",
  procedimentoAnteriorDetalhe: "",
  medicamentos: "",
  medicamentosDetalhe: "",
  alergias: "",
  alergiasDetalhe: "",
  herpes: "",
  queloide: "",
  diabetes: "",
  hipertensao: "",
  anticoagulantes: "",
  gestanteAmamentando: "",
  observacoes: "",
};

const TIPOS_COM_ANAMNESE = [
  "Botox",
  "Preenchimento Labial",
  "Preenchimento Facial",
  "Rinomodelação",
  "Harmonização Facial",
  "Bioestimulador",
  "Fio de PDO",
];

const TODOS_TIPOS = [
  "Botox",
  "Preenchimento Labial",
  "Preenchimento Facial",
  "Rinomodelação",
  "Harmonização Facial",
  "Bioestimulador",
  "Fio de PDO",
  "Limpeza de Pele",
  "Peeling",
  "Microagulhamento",
  "Extensão de Cílios",
  "Henna de Sobrancelhas",
  "Design de Sobrancelha",
  "Extensão de Unhas",
  "Nail Art",
  "Massagem",
  "Outro",
];

const TERMO_CONSENTIMENTO = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

Eu, paciente identificado(a) abaixo, declaro que fui devidamente informado(a) sobre o procedimento estético a ser realizado, seus benefícios, riscos, possíveis complicações e alternativas de tratamento.

Declaro estar ciente de que:
1. Os resultados podem variar de acordo com as características individuais de cada organismo;
2. Possíveis efeitos temporários como edema, hematomas e assimetrias podem ocorrer e tendem a se resolver espontaneamente;
3. Me comprometo a seguir todas as orientações pós-procedimento fornecidas pela profissional responsável;
4. Em caso de reações adversas, devo entrar em contato imediatamente com a clínica;
5. As informações prestadas na anamnese são verdadeiras e de minha inteira responsabilidade.

Autorizo o registro fotográfico para fins de documentação clínica e acompanhamento do resultado, sendo garantida a confidencialidade das imagens conforme a LGPD (Lei 13.709/2018).

Declaro ter lido e compreendido as informações acima e assino este termo de livre e espontânea vontade.`;

type Props = {
  clienteId: string;
  clienteNome: string;
  procedimentoId?: string;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

type AbaAtiva = "anamnese" | "fotos" | "assinaturas";

function SimNao({
  label,
  value,
  onChange,
  detalhe,
  detalheValue,
  onDetalheChange,
  detalhePlaceholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  detalhe?: boolean;
  detalheValue?: string;
  onDetalheChange?: (v: string) => void;
  detalhePlaceholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-[#5a4530]">{label}</p>
      <div className="flex gap-4">
        {["sim", "nao"].map((op) => (
          <label key={op} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={value === op}
              onChange={() => onChange(op)}
              className="accent-[#B89968]"
            />
            <span className="text-sm text-[#5a4530]">{op === "sim" ? "Sim" : "Não"}</span>
          </label>
        ))}
      </div>
      {detalhe && value === "sim" && (
        <Input
          value={detalheValue ?? ""}
          onChange={(e) => onDetalheChange?.(e.target.value)}
          placeholder={detalhePlaceholder ?? "Especifique..."}
          className="border-[#B89968]/30 text-sm"
        />
      )}
    </div>
  );
}

export function ModalProcedimento({ clienteId, clienteNome, procedimentoId, aberto, onFechar, onSalvo }: Props) {
  const ehEdicao = !!procedimentoId;
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("anamnese");

  const [tipo, setTipo] = useState("Botox");
  const [data, setData] = useState(() => dataLocalHoje());
  const [profissionalId, setProfissionalId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [produtosUsados, setProdutosUsados] = useState("");
  const [anamnese, setAnamnese] = useState<AnamneseData>(ANAMNESE_VAZIA);
  const [termoAceito, setTermoAceito] = useState(false);
  const [assinaturaPaciente, setAssinaturaPaciente] = useState<string | null>(null);
  const [assinaturaProfissional, setAssinaturaProfissional] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoLocal[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [erro, setErro] = useState("");
  const [termoExpandido, setTermoExpandido] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  const temAnamnese = TIPOS_COM_ANAMNESE.includes(tipo);

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
    if (!aberto || !procedimentoId) return;
    fetch(`/api/prontuarios/${clienteId}/procedimentos/${procedimentoId}`)
      .then((r) => r.json())
      .then((p) => {
        setTipo(p.tipo);
        setData(p.data.slice(0, 10));
        setProfissionalId(p.profissionalId);
        setDescricao(p.descricao ?? "");
        setProdutosUsados(p.produtosUsados ?? "");
        setTermoAceito(p.termoAceito);
        setAssinaturaPaciente(p.assinaturaPaciente ?? null);
        setAssinaturaProfissional(p.assinaturaProfissional ?? null);
        if (p.anamnese) {
          try { setAnamnese({ ...ANAMNESE_VAZIA, ...JSON.parse(p.anamnese) }); } catch { /* */ }
        }
        setFotos(
          (p.fotos ?? []).map((f: { id: string; url: string; tag: string; descricao: string | null }) => ({
            id: f.id,
            url: f.url,
            tag: f.tag as "antes" | "durante" | "depois",
            descricao: f.descricao ?? "",
          }))
        );
      });
  }, [aberto, procedimentoId, clienteId]);

  useEffect(() => {
    if (!aberto) {
      setAbaAtiva("anamnese");
      setTipo("Botox");
      setData(dataLocalHoje());
      setDescricao("");
      setProdutosUsados("");
      setAnamnese(ANAMNESE_VAZIA);
      setTermoAceito(false);
      setAssinaturaPaciente(null);
      setAssinaturaProfissional(null);
      setFotos([]);
      setErro("");
    }
  }, [aberto]);

  function atualizarAnamnese(campo: keyof AnamneseData, valor: string) {
    setAnamnese((prev) => ({ ...prev, [campo]: valor }));
  }

  async function uploadarFoto(file: File) {
    setUploadandoFoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pasta", "prontuarios");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const { url } = await r.json();
      setFotos((prev) => [...prev, { url, tag: "antes", descricao: "", novo: true }]);
    } finally {
      setUploadandoFoto(false);
    }
  }

  function aoSelecionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadarFoto);
    e.target.value = "";
  }

  function removerFoto(idx: number) {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function atualizarFoto(idx: number, campo: "tag" | "descricao", valor: string) {
    setFotos((prev) => {
      const nova = [...prev];
      nova[idx] = { ...nova[idx], [campo]: valor };
      return nova;
    });
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    setErro("");
    setSalvando(true);
    try {
      const body = {
        profissionalId,
        data,
        tipo,
        descricao: descricao || null,
        produtosUsados: produtosUsados || null,
        anamnese: temAnamnese ? anamnese : null,
        termoAceito,
        assinaturaPaciente: assinaturaPaciente || null,
        assinaturaProfissional: assinaturaProfissional || null,
      };

      let procId = procedimentoId;
      if (ehEdicao) {
        const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos/${procedimentoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.erro || `Erro ao atualizar (HTTP ${r.status})`);
        }
      } else {
        const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.erro || `Erro ao criar procedimento (HTTP ${r.status})`);
        }
        const proc = await r.json();
        if (!proc?.id) throw new Error("Resposta inválida do servidor (sem ID).");
        procId = proc.id;
      }

      // Salvar fotos novas
      const fotosNovas = fotos.filter((f) => f.novo);
      for (const foto of fotosNovas) {
        const rf = await fetch(`/api/prontuarios/${clienteId}/fotos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            procedimentoId: procId,
            url: foto.url,
            tag: foto.tag,
            descricao: foto.descricao || null,
          }),
        });
        if (!rf.ok) {
          const e = await rf.json().catch(() => ({}));
          throw new Error(e.erro || `Erro ao salvar foto (HTTP ${rf.status})`);
        }
      }

      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  const abas: { id: AbaAtiva; label: string }[] = [
    { id: "anamnese", label: temAnamnese ? "Anamnese" : "Informações" },
    { id: "fotos", label: `Fotos${fotos.length ? ` (${fotos.length})` : ""}` },
    { id: "assinaturas", label: "Assinaturas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">
              {ehEdicao ? "Editando Procedimento" : "Novo Procedimento"}
            </h2>
            <p className="text-xs text-[#9a7d50] mt-0.5">{clienteNome}</p>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        {/* Info básica */}
        <div className="px-5 pt-4 pb-3 border-b border-[#e8dcc4] flex-shrink-0 grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[#5a4530] text-xs">Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
            >
              {TODOS_TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[#5a4530] text-xs">Data</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border-[#B89968]/30 h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[#5a4530] text-xs">Profissional</Label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-2 py-1 text-sm text-[#5a4530] focus:outline-none focus:ring-2 focus:ring-[#B89968]"
            >
              <option value="">Selecionar...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e8dcc4] flex-shrink-0">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors",
                abaAtiva === aba.id
                  ? "text-[#B89968] border-b-2 border-[#B89968]"
                  : "text-[#9a7d50] hover:text-[#5a4530]"
              )}
            >
              {aba.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── ABA ANAMNESE ── */}
          {abaAtiva === "anamnese" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#5a4530]">Descrição do procedimento</Label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que foi realizado..."
                  rows={2}
                  className="flex w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#5a4530]">Produtos utilizados</Label>
                <Input
                  value={produtosUsados}
                  onChange={(e) => setProdutosUsados(e.target.value)}
                  placeholder="Ex: Botox 20U, Juvederm 1ml..."
                  className="border-[#B89968]/30"
                />
              </div>

              {temAnamnese && (
                <>
                  <div className="border-t border-[#e8dcc4] pt-4">
                    <p className="text-xs font-semibold text-[#B89968] uppercase tracking-wide mb-3">
                      Questionário de Anamnese
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#5a4530]">Expectativas do tratamento</Label>
                        <textarea
                          value={anamnese.expectativas}
                          onChange={(e) => atualizarAnamnese("expectativas", e.target.value)}
                          placeholder="Descreva o que a paciente espera do procedimento..."
                          rows={2}
                          className="flex w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
                        />
                      </div>

                      <SimNao
                        label="Já realizou esse procedimento anteriormente?"
                        value={anamnese.procedimentoAnterior}
                        onChange={(v) => atualizarAnamnese("procedimentoAnterior", v)}
                        detalhe
                        detalheValue={anamnese.procedimentoAnteriorDetalhe}
                        onDetalheChange={(v) => atualizarAnamnese("procedimentoAnteriorDetalhe", v)}
                        detalhePlaceholder="Quando e onde realizou?"
                      />

                      <SimNao
                        label="Está em uso de algum medicamento?"
                        value={anamnese.medicamentos}
                        onChange={(v) => atualizarAnamnese("medicamentos", v)}
                        detalhe
                        detalheValue={anamnese.medicamentosDetalhe}
                        onDetalheChange={(v) => atualizarAnamnese("medicamentosDetalhe", v)}
                        detalhePlaceholder="Quais medicamentos?"
                      />

                      <SimNao
                        label="Possui alergia a anestésicos ou outros medicamentos?"
                        value={anamnese.alergias}
                        onChange={(v) => atualizarAnamnese("alergias", v)}
                        detalhe
                        detalheValue={anamnese.alergiasDetalhe}
                        onDetalheChange={(v) => atualizarAnamnese("alergiasDetalhe", v)}
                        detalhePlaceholder="Quais alergias?"
                      />

                      <SimNao
                        label="Possui histórico de herpes labial?"
                        value={anamnese.herpes}
                        onChange={(v) => atualizarAnamnese("herpes", v)}
                      />

                      <SimNao
                        label="Possui tendência a queloides?"
                        value={anamnese.queloide}
                        onChange={(v) => atualizarAnamnese("queloide", v)}
                      />

                      <SimNao
                        label="É diabético(a)?"
                        value={anamnese.diabetes}
                        onChange={(v) => atualizarAnamnese("diabetes", v)}
                      />

                      <SimNao
                        label="Possui hipertensão arterial?"
                        value={anamnese.hipertensao}
                        onChange={(v) => atualizarAnamnese("hipertensao", v)}
                      />

                      <SimNao
                        label="Faz uso de anticoagulantes?"
                        value={anamnese.anticoagulantes}
                        onChange={(v) => atualizarAnamnese("anticoagulantes", v)}
                      />

                      <SimNao
                        label="Está grávida ou amamentando?"
                        value={anamnese.gestanteAmamentando}
                        onChange={(v) => atualizarAnamnese("gestanteAmamentando", v)}
                      />

                      <div className="space-y-1.5">
                        <Label className="text-[#5a4530]">Observações adicionais</Label>
                        <textarea
                          value={anamnese.observacoes}
                          onChange={(e) => atualizarAnamnese("observacoes", e.target.value)}
                          placeholder="Informações adicionais relevantes..."
                          rows={2}
                          className="flex w-full rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ABA FOTOS ── */}
          {abaAtiva === "fotos" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={uploadandoFoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-sm text-[#B89968] font-medium hover:bg-[#faf5ee] transition-colors flex-1"
                >
                  {uploadandoFoto ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Enviar Foto
                </button>
                <button
                  type="button"
                  onClick={() => inputCameraRef.current?.click()}
                  disabled={uploadandoFoto}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-sm text-[#B89968] font-medium hover:bg-[#faf5ee] transition-colors flex-1"
                >
                  <Camera size={15} />
                  Usar Câmera
                </button>
              </div>

              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={aoSelecionarFotos}
              />
              <input
                ref={inputCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={aoSelecionarFotos}
              />

              {fotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#9a7d50]/50">
                  <ImageIcon size={40} strokeWidth={1} />
                  <p className="text-sm mt-2">Nenhuma foto adicionada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {fotos.map((foto, idx) => (
                    <div key={idx} className="rounded-lg border border-[#e8dcc4] overflow-hidden bg-[#faf5ee]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-2 space-y-1.5">
                        <div className="flex gap-1">
                          {(["antes", "durante", "depois"] as const).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => atualizarFoto(idx, "tag", tag)}
                              className={cn(
                                "flex-1 py-0.5 rounded text-xs font-medium transition-colors capitalize",
                                foto.tag === tag
                                  ? tag === "antes" ? "bg-blue-100 text-blue-700"
                                    : tag === "depois" ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                  : "bg-white border border-[#e8dcc4] text-[#9a7d50] hover:border-[#B89968]/50"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={foto.descricao}
                          onChange={(e) => atualizarFoto(idx, "descricao", e.target.value)}
                          placeholder="Descrição..."
                          className="w-full text-xs border border-[#e8dcc4] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#B89968]"
                        />
                        <button
                          type="button"
                          onClick={() => removerFoto(idx)}
                          className="w-full flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={11} /> Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ABA ASSINATURAS ── */}
          {abaAtiva === "assinaturas" && (
            <div className="space-y-5">
              {/* Termo */}
              <div className="rounded-lg border border-[#e8dcc4] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTermoExpandido(!termoExpandido)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#faf5ee] text-sm font-medium text-[#5a4530]"
                >
                  <span>Termo de Consentimento</span>
                  {termoExpandido ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>
                {termoExpandido && (
                  <div className="px-4 py-3">
                    <pre className="text-xs text-[#5a4530]/80 whitespace-pre-wrap font-sans leading-relaxed">
                      {TERMO_CONSENTIMENTO}
                    </pre>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termoAceito}
                  onChange={(e) => setTermoAceito(e.target.checked)}
                  className="mt-0.5 accent-[#B89968]"
                />
                <span className="text-sm text-[#5a4530]">
                  Li e aceito o Termo de Consentimento Livre e Esclarecido
                </span>
              </label>

              <div className="border-t border-[#e8dcc4] pt-4 space-y-5">
                <CanvasAssinatura
                  label="Assinatura do(a) Paciente"
                  altura={130}
                  valorInicial={assinaturaPaciente}
                  onMudar={setAssinaturaPaciente}
                />
                <CanvasAssinatura
                  label="Assinatura da Profissional"
                  altura={130}
                  valorInicial={assinaturaProfissional}
                  onMudar={setAssinaturaProfissional}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8dcc4] flex-shrink-0">
          {erro && (
            <p className="text-xs text-red-600 mb-3">{erro}</p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onFechar}
              className="flex-1 border-[#e8dcc4] text-[#9a7d50]"
            >
              FECHAR
            </Button>
            <Button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="flex-1 bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <><Loader2 size={14} className="animate-spin mr-1" />Salvando...</> : "SALVAR"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
