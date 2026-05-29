type DadosAgendamento = {
  clienteNome?: string;
  dataStr?: string;      // "YYYY-MM-DD"
  horaInicio?: string;   // "HH:mm"
  horaFim?: string;      // "HH:mm"
  servicos?: string[];
  profissionalNome?: string;
  nomeClinica?: string;
  valorTotal?: number;
};

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DIAS = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatarData(dataStr: string): string {
  const d = new Date(dataStr + "T12:00");
  return `${DIAS[d.getDay()]}, ${pad(d.getDate())} de ${MESES[d.getMonth()]}`;
}

export function substituirVariaveis(texto: string, dados: DadosAgendamento): string {
  const data = dados.dataStr ? formatarData(dados.dataStr) : "";
  const servico = dados.servicos?.join(", ") ?? "";
  const valorFmt = dados.valorTotal !== undefined
    ? `R$ ${dados.valorTotal.toFixed(2).replace(".", ",")}`
    : "";

  return texto
    .replace(/\{nome_cliente\}/g, dados.clienteNome ?? "")
    .replace(/\{data\}/g, data)
    .replace(/\{hora\}/g, dados.horaInicio ?? "")
    .replace(/\{hora_fim\}/g, dados.horaFim ?? "")
    .replace(/\{servico\}/g, servico)
    .replace(/\{profissional\}/g, dados.profissionalNome ?? "")
    .replace(/\{nome_clinica\}/g, dados.nomeClinica ?? "")
    .replace(/\{valor_total\}/g, valorFmt);
}
