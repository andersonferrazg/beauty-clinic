"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, User, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModalCliente } from "@/components/modal-cliente";

type Cliente = {
  id: string;
  nome: string;
  telefone1: string | null;
  dataNascimento: string | null;
};

function inicialNome(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

export default function ProntuariosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  async function carregar(q = "") {
    setCarregando(true);
    const r = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const dados = await r.json();
    setClientes(Array.isArray(dados) ? dados : []);
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Agrupar por letra
  const agrupado = clientes.reduce<Record<string, Cliente[]>>((acc, c) => {
    const letra = inicialNome(c.nome);
    if (!acc[letra]) acc[letra] = [];
    acc[letra].push(c);
    return acc;
  }, {});
  const letras = Object.keys(agrupado).sort();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530] flex items-center gap-2">
            <FileText size={22} className="text-[#B89968]" />
            Prontuários
          </h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${clientes.length} paciente(s)`}
          </p>
        </div>
        <Button
          onClick={() => setModalAberto(true)}
          className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5"
        >
          <Plus size={16} />
          Nova Paciente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar paciente pelo nome..."
          className="pl-9 border-[#B89968]/30 h-11"
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#9a7d50]/60">
          <User size={40} strokeWidth={1} />
          <p className="mt-2 text-sm">Nenhuma paciente encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {letras.map((letra) => (
            <div key={letra}>
              <div className="sticky top-0 bg-[#f5f0e8] px-3 py-1 rounded-md mb-1">
                <span className="text-xs font-bold text-[#B89968] uppercase tracking-widest">{letra}</span>
              </div>
              <div className="space-y-1">
                {agrupado[letra].map((c) => (
                  <Link
                    key={c.id}
                    href={`/prontuarios/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#e8dcc4] hover:border-[#B89968]/50 hover:shadow-sm transition-all group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#B89968]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#B89968] font-semibold text-sm">{inicialNome(c.nome)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#5a4530] text-sm truncate group-hover:text-[#B89968] transition-colors">
                        {c.nome}
                      </p>
                      {c.telefone1 && (
                        <p className="text-xs text-[#9a7d50] mt-0.5">{c.telefone1}</p>
                      )}
                    </div>
                    <FileText size={15} className="text-[#e8dcc4] group-hover:text-[#B89968]/50 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalCliente
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => { setModalAberto(false); carregar(busca); }}
      />
    </div>
  );
}
