"use client";

import { useEffect, useState, type ReactNode } from "react";

type TenantInfo = {
  nome: string;
  iniciais?: string;
  logoUrl?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  endereco?: string | null;
};

type Props = {
  subtitulo?: ReactNode;
  mostrarDadosClinica?: boolean;
};

export function PrintHeader({ subtitulo, mostrarDadosClinica = false }: Props) {
  const [tenant, setTenant] = useState<TenantInfo>({ nome: "Beauty Clinic", iniciais: "BC" });

  useEffect(() => {
    fetch("/api/tenant-publico")
      .then((r) => r.json())
      .then((d) =>
        setTenant({
          nome: d.nome ?? "Beauty Clinic",
          iniciais: d.iniciais ?? "BC",
          logoUrl: d.logoUrl,
          cnpj: d.cnpj,
          telefone: d.telefone,
          endereco: d.endereco,
        })
      )
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-5">
      {tenant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tenant.logoUrl}
          alt="Logo"
          className="w-28 h-28 rounded-full object-cover flex-shrink-0 shadow-sm"
        />
      ) : (
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#B89968] to-[#9a7d50] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-white font-bold text-3xl" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
            {tenant.iniciais}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-4xl font-bold text-[#B89968] tracking-wide leading-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {tenant.nome}
        </p>
        {mostrarDadosClinica && (
          <div className="mt-1.5 space-y-0.5">
            {tenant.cnpj && <p className="text-xs text-gray-600">CNPJ {tenant.cnpj}</p>}
            {tenant.telefone && <p className="text-xs text-gray-600">{tenant.telefone}</p>}
            {tenant.endereco && <p className="text-xs text-gray-600">{tenant.endereco}</p>}
          </div>
        )}
        {subtitulo && <div className="mt-1.5">{subtitulo}</div>}
      </div>
    </div>
  );
}
