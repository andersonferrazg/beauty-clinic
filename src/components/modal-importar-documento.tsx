"use client";
import { dataLocalHoje } from "@/lib/utils";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Camera, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Profissional = { id: string; nome: string };
type Cliente = { id: string; nome: string };

type Props = {
  clienteId: string;
  cliente: Cliente | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

const TIPOS_DOCUMENTO = [
  { v: "anamnese_escaneada", label: "Anamnese escaneada" },
  { v: "termo_escaneado", label: "Termo assinado em papel" },
  { v: "planejamento_escaneado", label: "Planejamento em papel" },
  { v: "autorizacao_escaneada", label: "Autorização de imagem em papel" },
  { v: "exame", label: "Exame / Laudo" },
  { v: "outro", label: "Outro documento" },
];

export function ModalImportarDocumento({ clienteId, cliente, aberto, onFechar, onSalvo }: Props) {
  const [data, setData] = useState(() => dataLocalHoje());
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [tipoDoc, setTipoDoc] = useState("anamnese_escaneada");
  const [descricao, setDescricao] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState<string | null>(null);
  const [uploadando, setUploadando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

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
      setTipoDoc("anamnese_escaneada");
      setDescricao("");
      setArquivoUrl(null);
      setErro("");
    }
  }, [aberto]);

  async function uploadar(file: File) {
    setUploadando(true);
    setErro("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("pasta", "documentos");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Erro ao enviar arquivo");
      const { url } = await r.json();
      setArquivoUrl(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar arquivo");
    } finally {
      setUploadando(false);
    }
  }

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadar(file);
    e.target.value = "";
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    if (!arquivoUrl) { setErro("Envie um arquivo antes de salvar."); return; }
    setErro("");
    setSalvando(true);
    try {
      const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId,
          data,
          tipo: "documento_escaneado",
          descricao: descricao || TIPOS_DOCUMENTO.find((t) => t.v === tipoDoc)?.label || "Documento escaneado",
          anamnese: { tipoDocumento: tipoDoc, url: arquivoUrl },
          termoAceito: false,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.erro || `Erro ao salvar (HTTP ${r.status})`);
      }
      const proc = await r.json();
      // Também registra como Foto para aparecer na galeria
      await fetch(`/api/prontuarios/${clienteId}/fotos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          procedimentoId: proc.id,
          url: arquivoUrl,
          tag: "documento",
          descricao: descricao || null,
        }),
      });
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[94vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Importar Documento Escaneado</h2>
            {cliente && <p className="text-xs text-[#9a7d50] mt-0.5">{cliente.nome}</p>}
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1">
            <Label className="text-[#5a4530] text-xs">Tipo do Documento</Label>
            <select
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
            >
              {TIPOS_DOCUMENTO.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                className="flex h-9 w-full rounded-md border border-[#B89968]/30 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968]"
              >
                <option value="">Selecionar...</option>
                {profissionais.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[#5a4530] text-xs">Descrição (opcional)</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Termo de Botox assinado em 16/09"
              className="border-[#B89968]/30 h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-[#5a4530] text-xs mb-1.5 block">Arquivo</Label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                disabled={uploadando}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-xs text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1"
              >
                {uploadando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Selecionar Arquivo
              </button>
              <button
                type="button"
                onClick={() => inputCameraRef.current?.click()}
                disabled={uploadando}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-[#B89968]/40 text-xs text-[#B89968] font-medium hover:bg-[#faf5ee] flex-1"
              >
                <Camera size={14} /> Fotografar
              </button>
            </div>
            <input ref={inputArquivoRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={aoSelecionar} />
            <input ref={inputCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoSelecionar} />

            {arquivoUrl ? (
              <div className="rounded-lg border border-[#e8dcc4] p-3 flex items-center gap-3 bg-[#faf5ee]">
                {arquivoUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={arquivoUrl} alt="Pré-visualização" className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 rounded bg-white flex items-center justify-center border border-[#e8dcc4]">
                    <FileText size={24} className="text-[#B89968]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#5a4530]">Arquivo enviado ✓</p>
                  <p className="text-xs text-[#9a7d50] truncate">{arquivoUrl.split("/").pop()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setArquivoUrl(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[#9a7d50]/50 border border-dashed border-[#e8dcc4] rounded-lg">
                <FileText size={28} strokeWidth={1} />
                <p className="text-xs mt-1">Nenhum arquivo enviado</p>
              </div>
            )}
          </div>
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
              disabled={salvando || !arquivoUrl}
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
