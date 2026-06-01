"use client";
import { dataLocalHoje } from "@/lib/utils";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Upload, Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Profissional = { id: string; nome: string };

type Props = {
  clienteId: string;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

const TAGS = [
  { v: "antes", label: "Antes", cor: "#3b82f6" },
  { v: "durante", label: "Durante", cor: "#f59e0b" },
  { v: "depois", label: "Depois", cor: "#10b981" },
  { v: "evolucao", label: "Evolução", cor: "#8b5cf6" },
];

type ItemFoto = { file: File; url: string; tag: string; descricao: string };

export function ModalFotos({ clienteId, aberto, onFechar, onSalvo }: Props) {
  const [data, setData] = useState(() => dataLocalHoje());
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [fotos, setFotos] = useState<ItemFoto[]>([]);
  const [tagAtual, setTagAtual] = useState("antes");
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    fetch("/api/profissionais").then((r) => r.json()).then((lista) => {
      setProfissionais(lista);
      if (!profissionalId && lista.length) setProfissionalId(lista[0].id);
    });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      setData(dataLocalHoje());
      setFotos([]);
      setTagAtual("antes");
      setErro("");
    }
  }, [aberto]);

  async function aoSelecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (!arquivos.length) return;
    setEnviando(true);
    setErro("");

    const novasFotos: ItemFoto[] = [];
    for (const file of arquivos) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("pasta", "fotos");
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        if (!r.ok) throw new Error("Erro no upload");
        const { url } = await r.json();
        novasFotos.push({ file, url, tag: tagAtual, descricao: "" });
      } catch {
        setErro("Erro ao enviar uma ou mais fotos.");
      }
    }

    setFotos((prev) => [...prev, ...novasFotos]);
    setEnviando(false);
    e.target.value = "";
  }

  function remover(i: number) {
    setFotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function atualizarTag(i: number, tag: string) {
    setFotos((prev) => prev.map((f, idx) => idx === i ? { ...f, tag } : f));
  }

  function atualizarDescricao(i: number, descricao: string) {
    setFotos((prev) => prev.map((f, idx) => idx === i ? { ...f, descricao } : f));
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    if (fotos.length === 0) { setErro("Adicione pelo menos uma foto."); return; }
    setErro("");
    setSalvando(true);

    try {
      // Cria um procedimento "registro_fotos"
      const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId,
          data,
          tipo: "registro_fotos",
          descricao: `Registro fotográfico — ${fotos.length} foto(s)`,
          anamnese: null,
          termoAceito: false,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.erro || `Erro ao criar registro (HTTP ${r.status})`);
      }
      const proc = await r.json();

      // Salva cada foto vinculada ao procedimento
      for (const foto of fotos) {
        await fetch(`/api/prontuarios/${clienteId}/fotos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            procedimentoId: proc.id,
            url: foto.url,
            tag: foto.tag,
            descricao: foto.descricao || null,
          }),
        });
      }

      onSalvo();
      onFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94dvh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Adicionar Fotos</h2>
            <p className="text-xs text-[#9a7d50] mt-0.5">Antes, durante, depois ou evolução do tratamento</p>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Profissional e data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label className="text-[#5a4530] text-xs">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="border-[#B89968]/30 h-9 text-sm" />
            </div>
          </div>

          {/* Tag para novas fotos */}
          <div className="space-y-1.5">
            <Label className="text-[#5a4530] text-xs">Tag para as próximas fotos</Label>
            <div className="flex gap-2 flex-wrap">
              {TAGS.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setTagAtual(t.v)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
                  style={
                    tagAtual === t.v
                      ? { backgroundColor: t.cor, borderColor: t.cor, color: "white" }
                      : { backgroundColor: "transparent", borderColor: t.cor + "60", color: t.cor }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botões de upload */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B89968]/40 text-sm text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1 justify-center"
            >
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              Selecionar da galeria
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={enviando}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#B89968]/40 text-sm text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1 justify-center"
            >
              <Camera size={15} /> Usar câmera
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={aoSelecionarArquivos} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoSelecionarArquivos} />

          {/* Lista de fotos adicionadas */}
          {fotos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[#5a4530] text-xs font-semibold">{fotos.length} foto(s) adicionada(s)</Label>
              <div className="grid grid-cols-2 gap-3">
                {fotos.map((f, i) => {
                  const tagInfo = TAGS.find((t) => t.v === f.tag) ?? TAGS[0];
                  return (
                    <div key={i} className="rounded-xl border border-[#e8dcc4] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.tag} className="w-full h-32 object-cover" />
                      <div className="p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {TAGS.map((t) => (
                              <button
                                key={t.v}
                                type="button"
                                onClick={() => atualizarTag(i, t.v)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all"
                                style={
                                  f.tag === t.v
                                    ? { backgroundColor: t.cor, borderColor: t.cor, color: "white" }
                                    : { backgroundColor: "transparent", borderColor: t.cor + "60", color: t.cor }
                                }
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={() => remover(i)} className="text-red-400 hover:text-red-600 ml-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <Input
                          value={f.descricao}
                          onChange={(e) => atualizarDescricao(i, e.target.value)}
                          placeholder="Descrição (opcional)"
                          className="border-[#B89968]/30 h-7 text-xs"
                        />
                        <div
                          className="text-center text-[10px] font-medium py-0.5 rounded"
                          style={{ backgroundColor: tagInfo.cor + "20", color: tagInfo.cor }}
                        >
                          {tagInfo.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Botão adicionar mais */}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-[#B89968]/30 h-32 flex flex-col items-center justify-center text-[#B89968]/60 hover:text-[#B89968] hover:border-[#B89968]/50 hover:bg-[#faf5ee] transition-all"
                >
                  <Plus size={20} />
                  <span className="text-xs mt-1">Mais fotos</span>
                </button>
              </div>
            </div>
          )}

          {fotos.length === 0 && !enviando && (
            <div className="flex flex-col items-center justify-center py-8 text-[#9a7d50]/40 border border-dashed border-[#e8dcc4] rounded-xl">
              <Camera size={32} strokeWidth={1} />
              <p className="text-xs mt-2">Nenhuma foto adicionada</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#e8dcc4] flex-shrink-0">
          {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onFechar} className="flex-1 border-[#e8dcc4] text-[#9a7d50]">
              FECHAR
            </Button>
            <Button
              type="button"
              onClick={salvar}
              disabled={salvando || enviando || fotos.length === 0}
              className="flex-1 bg-[#B89968] hover:bg-[#9a7d50] text-white"
            >
              {salvando ? <><Loader2 size={14} className="animate-spin mr-1" />Salvando...</> : `SALVAR ${fotos.length > 0 ? `(${fotos.length})` : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
