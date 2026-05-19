"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalCliente } from "@/components/modal-cliente";
import { Search, Plus, Phone, Calendar, Loader2, Download } from "lucide-react";

type Cliente = {
  id: string;
  nome: string;
  telefone1: string | null;
  dataNascimento: string | null;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | undefined>();

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

  function exportarCSV() {
    const linhas = [["Nome", "Telefone", "Aniversário"]];
    for (const c of clientes) {
      linhas.push([
        c.nome,
        c.telefone1 || "",
        c.dataNascimento ? new Date(c.dataNascimento).toLocaleDateString("pt-BR") : "",
      ]);
    }
    const csv = "﻿" + linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "clientes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function abrirNovo() {
    setClienteSelecionado(undefined);
    setModalAberto(true);
  }

  function abrirEdicao(id: string) {
    setClienteSelecionado(id);
    setModalAberto(true);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5a4530]">Clientes</h1>
          <p className="text-sm text-[#9a7d50] mt-1">
            {carregando ? "Carregando..." : `${clientes.length} cliente(s) encontrado(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!carregando && clientes.length > 0 && (
            <button
              onClick={exportarCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#B89968]/30 text-sm text-[#5a4530] hover:bg-[#faf5ee] transition-colors"
            >
              <Download size={14} /> Exportar
            </button>
          )}
          <Button onClick={abrirNovo} className="bg-[#B89968] hover:bg-[#9a7d50] text-white gap-1.5">
            <Plus size={16} />
            Nova Cliente
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7d50]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-9 border-[#B89968]/30"
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#B89968]" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-20 text-[#9a7d50]">
          <p className="text-base mb-1">{busca ? "Nenhuma cliente encontrada." : "Nenhuma cliente cadastrada ainda."}</p>
          <p className="text-sm">Clique em &quot;Nova Cliente&quot; para adicionar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8dcc4] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf5ee] border-b border-[#e8dcc4]">
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-[#9a7d50] font-medium">Aniversário</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => abrirEdicao(c.id)}
                  className={`border-b border-[#e8dcc4] hover:bg-[#faf5ee] cursor-pointer transition-colors ${
                    i === clientes.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {c.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#5a4530]">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.telefone1 ? (
                      <span className="flex items-center gap-1.5 text-[#5a4530]">
                        <Phone size={12} className="text-[#B89968]" />
                        {c.telefone1}
                      </span>
                    ) : (
                      <span className="text-[#9a7d50] italic text-xs">Não informado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.dataNascimento ? (
                      <span className="flex items-center gap-1.5 text-[#5a4530]">
                        <Calendar size={12} className="text-[#B89968]" />
                        {new Date(c.dataNascimento).toLocaleDateString("pt-BR")}
                      </span>
                    ) : (
                      <span className="text-[#9a7d50] italic text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalCliente
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvo={() => carregar(busca)}
        clienteId={clienteSelecionado}
      />
    </div>
  );
}
