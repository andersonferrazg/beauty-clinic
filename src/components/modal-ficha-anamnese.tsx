"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CanvasAssinatura } from "@/components/canvas-assinatura";

type Profissional = { id: string; nome: string };

type Cliente = { id: string; nome: string };

type Props = {
  clienteId: string;
  cliente: Cliente | null;
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
};

// Perguntas Sim/Não baseadas no formulário físico da clínica
// Cada pergunta pode ter um "detalhe" (campo Qual?) quando "sim"
type Pergunta = { id: string; texto: string; comDetalhe?: boolean };

const COLUNA_ESQUERDA: Pergunta[] = [
  { id: "tratamentoEstetico", texto: "Já fez algum tipo de tratamento estético?", comDetalhe: true },
  { id: "medicamento", texto: "Faz uso de algum medicamento?", comDetalhe: true },
  { id: "alergia", texto: "Tem alguma alergia (medicamentos, anestesia, etc)?", comDetalhe: true },
  { id: "acidos", texto: "Usa ou já usou ácidos na pele?", comDetalhe: true },
  { id: "cuidadoDiario", texto: "Faz algum tipo de cuidado diário estético facial ou corporal?", comDetalhe: true },
  { id: "tratamentoMedico", texto: "Está sob algum tipo de tratamento médico?", comDetalhe: true },
  { id: "cirurgia", texto: "Já fez alguma cirurgia ou procedimento de harmonização?", comDetalhe: true },
  { id: "patologiaDermatologica", texto: "Alguma patologia dermatológica?", comDetalhe: true },
  { id: "alteracaoVascular", texto: "Tem alguma alteração vascular? (petéquias, cianose, eritema, etc)" },
  { id: "lactante", texto: "É lactante?" },
  { id: "alergiaOvo", texto: "Possui alergia a ovo?" },
  { id: "alergiaAbelha", texto: "Possui alergia a picada de abelha?" },
  { id: "herpes", texto: "Já teve ou tem herpes?" },
  { id: "fumante", texto: "É ou já foi fumante?" },
  { id: "exposicaoSol", texto: "Possui muita exposição ao sol?" },
  { id: "gestante", texto: "É gestante?" },
  { id: "exercicio", texto: "Pratica algum exercício físico?" },
  { id: "alimentacaoBalanceada", texto: "Tem uma alimentação balanceada?" },
  { id: "anticoncepcional", texto: "Método anticoncepcional?" },
  { id: "menstrual", texto: "Ciclo menstrual regular?" },
  { id: "reposicaoHormonal", texto: "Reposição Hormonal?" },
  { id: "protese", texto: "Tem alguma prótese?" },
  { id: "acneHereditaria", texto: "Hereditariedade de acne?" },
  { id: "hematomas", texto: "Tem hematomas com facilidade?" },
];

const COLUNA_DIREITA: Pergunta[] = [
  { id: "varizes", texto: "Tem varizes e/ou varicoses?", comDetalhe: true },
  { id: "manchas", texto: "Possui manchas na pele?", comDetalhe: true },
  { id: "vacina30dias", texto: "Se vacinou nos últimos 30 dias?" },
  { id: "infectocontagiosa", texto: "Tem alguma doença infectocontagiosa?" },
  { id: "orgaosEssenciais", texto: "Tem alguma doença nos órgãos essenciais?" },
  { id: "desmaio", texto: "Já sofreu algum desmaio ou convulsão?" },
  { id: "traumaFace", texto: "Já sofreu algum trauma na face?" },
  { id: "cardiovascular", texto: "Tem alguma doença cardiovascular?" },
  { id: "respiratorio", texto: "Tem ou já teve algum distúrbio respiratório?" },
  { id: "alcool", texto: "Faz uso de bebida alcóolica com frequência?" },
  { id: "peso", texto: "Perdeu ou ganhou peso ultimamente?" },
  { id: "diabetes", texto: "Tem diabetes?" },
  { id: "roacutan", texto: "Faz uso de roacutan?" },
  { id: "queloides", texto: "Possui predisposição para queloides?" },
];

const TODAS = [...COLUNA_ESQUERDA, ...COLUNA_DIREITA];

type RespostasMap = Record<string, { resposta: "sim" | "nao" | ""; detalhe?: string }>;

function inicializarRespostas(): RespostasMap {
  const r: RespostasMap = {};
  TODAS.forEach((p) => { r[p.id] = { resposta: "", detalhe: "" }; });
  return r;
}

export function ModalFichaAnamnese({ clienteId, cliente, aberto, onFechar, onSalvo }: Props) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [profissionalId, setProfissionalId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [respostas, setRespostas] = useState<RespostasMap>(() => inicializarRespostas());
  const [anotacoes, setAnotacoes] = useState("");
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
      setRespostas(inicializarRespostas());
      setAnotacoes("");
      setAssinaturaPaciente(null);
      setAssinaturaProfissional(null);
      setErro("");
    }
  }, [aberto]);

  function atualizar(id: string, campo: "resposta" | "detalhe", valor: string) {
    setRespostas((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
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
          tipo: "anamnese",
          descricao: "Ficha de Anamnese Avançada",
          anamnese: { respostas, anotacoes },
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

  function renderColuna(perguntas: Pergunta[]) {
    return (
      <div className="space-y-2.5">
        {perguntas.map((p) => {
          const r = respostas[p.id];
          return (
            <div key={p.id} className="text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[#5a4530] flex-1 leading-tight">{p.texto}</p>
                <div className="flex gap-2.5 flex-shrink-0">
                  {(["sim", "nao"] as const).map((op) => (
                    <label key={op} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={r.resposta === op}
                        onChange={() => atualizar(p.id, "resposta", op)}
                        className="accent-[#B89968]"
                      />
                      <span className="text-xs text-[#5a4530] capitalize">{op === "sim" ? "Sim" : "Não"}</span>
                    </label>
                  ))}
                </div>
              </div>
              {p.comDetalhe && r.resposta === "sim" && (
                <input
                  type="text"
                  value={r.detalhe ?? ""}
                  onChange={(e) => atualizar(p.id, "detalhe", e.target.value)}
                  placeholder="Qual?"
                  className="w-full mt-1 text-xs border-b border-[#e8dcc4] focus:border-[#B89968] focus:outline-none py-0.5 text-[#5a4530] placeholder:text-[#9a7d50]/60"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8dcc4] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#5a4530]">Ficha de Anamnese Avançada</h2>
            {cliente && <p className="text-xs text-[#9a7d50] mt-0.5">{cliente.nome}</p>}
          </div>
          <button onClick={onFechar} className="text-[#9a7d50] hover:text-[#5a4530]">
            <X size={18} />
          </button>
        </div>

        {/* Profissional + Data */}
        <div className="px-5 pt-4 pb-3 border-b border-[#e8dcc4] flex-shrink-0 grid grid-cols-2 gap-3">
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
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border-[#B89968]/30 h-9 text-sm"
            />
          </div>
        </div>

        {/* Perguntas em 2 colunas */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {renderColuna(COLUNA_ESQUERDA)}
            {renderColuna(COLUNA_DIREITA)}
          </div>

          <div className="mt-6 pt-4 border-t border-[#e8dcc4]">
            <Label className="text-[#5a4530] text-sm">Anotações e Outras Perguntas</Label>
            <textarea
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              rows={3}
              placeholder="Informações adicionais relevantes..."
              className="w-full mt-1.5 rounded-md border border-[#B89968]/30 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B89968] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
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
