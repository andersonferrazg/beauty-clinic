export type RecebimentoTipo =
  | "CONFORME_PARCELAS"
  | "HOJE"
  | "1D"
  | "2D"
  | "3D"
  | "14D"
  | "30D"
  | "90D";

export type TaxaParcela = {
  parcelas: number;
  taxaPct: number;
  recebimento: RecebimentoTipo;
};

export type ConfigCartaoCredito = {
  maxParcelas: number;
  taxas: TaxaParcela[];
};

export const RECEBIMENTO_OPCOES: { value: RecebimentoTipo; label: string }[] = [
  { value: "CONFORME_PARCELAS", label: "Conforme parcelas" },
  { value: "HOJE", label: "Hoje" },
  { value: "1D", label: "Amanhã (1 dia)" },
  { value: "2D", label: "2 dias" },
  { value: "3D", label: "3 dias" },
  { value: "14D", label: "14 dias" },
  { value: "30D", label: "30 dias" },
  { value: "90D", label: "90 dias" },
];

export function parsearConfigCartao(configJson: string | null | undefined): ConfigCartaoCredito {
  if (!configJson) return { maxParcelas: 12, taxas: [] };
  try {
    return JSON.parse(configJson) as ConfigCartaoCredito;
  } catch {
    return { maxParcelas: 12, taxas: [] };
  }
}

export function taxaParaParcelas(config: ConfigCartaoCredito, parcelas: number): number {
  return config.taxas.find((t) => t.parcelas === parcelas)?.taxaPct ?? 0;
}

export function calcularParcelamento(valorTotal: number, parcelas: number, config: ConfigCartaoCredito) {
  const taxaPct = taxaParaParcelas(config, parcelas);
  const taxaValor = Math.round(valorTotal * (taxaPct / 100) * 100) / 100;
  const valorLiquido = Math.round((valorTotal - taxaValor) * 100) / 100;
  const valorPorParcela = Math.round((valorTotal / Math.max(parcelas, 1)) * 100) / 100;
  return { taxaPct, taxaValor, valorLiquido, valorPorParcela };
}
