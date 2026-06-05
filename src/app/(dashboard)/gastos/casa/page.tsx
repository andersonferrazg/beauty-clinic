"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PlanilhaGastos from "@/components/planilha-gastos";
import { getSessaoCliente } from "@/lib/sessao-cliente";

export default function GasosCasaPage() {
  const router = useRouter();

  useEffect(() => {
    getSessaoCliente().then((s: unknown) => {
      const sessao = s as { permissoes?: { isAdmin?: boolean; acessarDespesas?: boolean } } | null;
      if (sessao?.permissoes && !sessao.permissoes.isAdmin && !sessao.permissoes.acessarDespesas) {
        router.replace("/dashboard");
      }
    }).catch(() => {});
  }, [router]);

  return <PlanilhaGastos titulo="Gastos Pessoal" categoria="Gastos Casa" corHeader="#3d5a3e" />;
}
