"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CanvasAssinatura } from "@/components/canvas-assinatura";

type Profissional = { id: string; nome: string };
type Sessao = { procedimento: string; produto: string; observacao: string };

type Props = {
  clienteId: string;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

const SESSAO_VAZIA: Sessao = { procedimento: "", produto: "", observacao: "" };

export function ModalFichaControleSessoes({ clienteId, aberto, onFechar, onSalvo }: Props) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([{ ...SESSAO_VAZIA }]);
  const [observacaoGeral, setObservacaoGeral] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [assinaturaPaciente, setAssinaturaPaciente] = useState<string | null>(null);
  const [assinaturaProfissional, setAssinaturaProfissional] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    fetch("/api/profissionais").then((r) => r.json()).then((lista) => {
      setProfissionais(lista);
      if (!profissionalId && lista.length) setProfissionalId(lista[0].id);
    });
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      setData(new Date().toISOString().slice(0, 10));
      setSessoes([{ ...SESSAO_VAZIA }]);
      setObservacaoGeral("");
      setDataRetorno("");
      setAssinaturaPaciente(null);
      setAssinaturaProfissional(null);
      setErro("");
    }
  }, [aberto]);

  function atualizarSessao(i: number, campo: keyof Sessao, valor: string) {
    setSessoes((prev) => prev.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s));
  }

  async function salvar() {
    if (!profissionalId) { setErro("Selecione a profissional."); return; }
    setErro("");
    setSalvando(true);
    try {
      const r = await fetch(`/api/prontuarios/${clienteId}/procedimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissionalId,
          data,
          tipo: "controle_sessoes",
          descricao: "Controle de Tratamentos e Sessões",
          anamnese: { sessoes, observacaoGeral, dataRetorno: dataRetorno || null },
          termoAceito: false,
          assinaturaPaciente: assinaturaPaciente ?? null,
          assinaturaProfissional: assinaturaProfissional ?? null,
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Controle de Tratamentos e Sessões</h2>
            <p className="text-xs text-[#9a7d50] mt-0.5">Registro cronológico de sessões realizadas</p>
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[#5a4530] text-xs font-semibold">Sessões / Procedimentos Realizados</Label>
              <button
                type="button"
                onClick={() => setSessoes((prev) => [...prev, { ...SESSAO_VAZIA }])}
                className="flex items-center gap-1 text-xs text-[#B89968] hover:text-[#9a7d50] font-medium"
              >
                <Plus size={12} /> Adicionar sessão
              </button>
            </div>

            <div className="space-y-3">
              {sessoes.map((s, i) => (
                <div key={i} className="rounded-lg border border-[#e8dcc4] p-3 bg-[#faf5ee]/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-[#9a7d50]">Sessão {i + 1}</p>
                    {sessoes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSessoes((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="space-y-1">
                      <Label className="text-[#5a4530] text-xs">Procedimento</Label>
                      <Input
                        value={s.procedimento}
                        onChange={(e) => atualizarSessao(i, "procedimento", e.target.value)}
                        placeholder="Ex: Toxina Botulínica"
                        className="border-[#B89968]/30 h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#5a4530] text-xs">Produto / Lote</Label>
                      <Input
                        value={s.produto}
                        onChange={(e) => atualizarSessao(i, "produto", e.target.value)}
                        placeholder="Ex: Dysport 300U — Lote XYZ"
                        className="border-[#B89968]/30 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#5a4530] text-xs">Observações</Label>
                    <Input
                      value={s.observacao}
                      onChange={(e) => atualizarSessao(i, "observacao", e.target.value)}
                      placeholder="Observações sobre esta sessão"
                      className="border-[#B89968]/30 h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[#5a4530] text-xs">Observações gerais</Label>
              <Input
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
                placeholder="Anotações adicionais"
                className="border-[#B89968]/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[#5a4530] text-xs">Data de retorno</Label>
              <Input
                type="date"
                value={dataRetorno}
                onChange={(e) => setDataRetorno(e.target.value)}
                className="border-[#B89968]/30 h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <CanvasAssinatura label="Assinatura do(a) Paciente" altura={100} onMudar={setAssinaturaPaciente} />
            <CanvasAssinatura label="Assinatura da Profissional" altura={100} onMudar={setAssinaturaProfissional} />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#e8dcc4] flex-shrink-0">
          {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onFechar} className="flex-1 border-[#e8dcc4] text-[#9a7d50]">
              FECHAR
            </Button>
            <Button type="button" onClick={salvar} disabled={salvando} className="flex-1 bg-[#B89968] hover:bg-[#9a7d50] text-white">
              {salvando ? <><Loader2 size={14} className="animate-spin mr-1" />Salvando...</> : "SALVAR"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
