"use client";
import { dataLocalHoje } from "@/lib/utils";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CanvasAssinatura } from "@/components/canvas-assinatura";

import { TERMOS, type TipoTermo } from "@/lib/termos";

type Profissional = { id: string; nome: string };

type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
};

type Props = {
  clienteId: string;
  cliente: Cliente | null;
  tipo: TipoTermo;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};


export function ModalFichaTermo({ clienteId, cliente, tipo, aberto, onFechar, onSalvo }: Props) {
  const [data, setData] = useState(() => dataLocalHoje());
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [assinaturaPaciente, setAssinaturaPaciente] = useState<string | null>(null);
  const [assinaturaProfissional, setAssinaturaProfissional] = useState<string | null>(null);
  const [aceito, setAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const termo = TERMOS[tipo];

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
      setAssinaturaPaciente(null);
      setAssinaturaProfissional(null);
      setAceito(false);
      setErro("");
    }
  }, [aberto]);

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    if (!aceito) { setErro("É necessário marcar que leu e aceita o termo."); return; }
    if (!assinaturaPaciente) { setErro("Assinatura da paciente é obrigatória."); return; }
    if (!assinaturaProfissional) { setErro("Assinatura da profissional é obrigatória."); return; }

    setErro("");
    setSalvando(true);
    try {
      const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId,
          data,
          tipo,
          descricao: termo.titulo,
          anamnese: null,
          termoAceito: true,
          assinaturaPaciente,
          assinaturaProfissional,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.erro || `Erro ao salvar (HTTP ${r.status})`);
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

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">{termo.titulo}</h2>
            {cliente && (
              <p className="text-xs text-[#9a7d50] mt-0.5">
                {cliente.nome}
                {cliente.cpf && ` — CPF: ${cliente.cpf}`}
                {cliente.rg && ` — RG: ${cliente.rg}`}
              </p>
            )}
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

        {/* Texto do termo */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-lg border border-[#e8dcc4] bg-[#faf5ee]/50 px-4 py-3 mb-4">
            <pre className="text-xs text-[#5a4530] whitespace-pre-wrap font-sans leading-relaxed">
              {termo.texto}
            </pre>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
              className="mt-0.5 accent-[#B89968]"
            />
            <span className="text-sm text-[#5a4530]">
              Declaro ter lido e compreendido os termos acima e assino de livre e espontânea vontade.
            </span>
          </label>

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
