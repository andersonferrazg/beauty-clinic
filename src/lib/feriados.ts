// Cálculo de feriados nacionais brasileiros (fixos + móveis via algoritmo de Gauss)

function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

function addDias(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function feriadosDoAno(ano: number): { nome: string; data: Date }[] {
  const pascoa = calcularPascoa(ano);
  return [
    { nome: "Confraternização Universal", data: new Date(ano, 0, 1) },
    { nome: "Carnaval",                   data: addDias(pascoa, -48) },
    { nome: "Carnaval",                   data: addDias(pascoa, -47) },
    { nome: "Sexta-feira Santa",           data: addDias(pascoa, -2) },
    { nome: "Páscoa",                      data: pascoa },
    { nome: "Tiradentes",                  data: new Date(ano, 3, 21) },
    { nome: "Dia do Trabalho",             data: new Date(ano, 4, 1) },
    { nome: "Corpus Christi",              data: addDias(pascoa, 60) },
    { nome: "Independência do Brasil",     data: new Date(ano, 8, 7) },
    { nome: "Nossa Sra. Aparecida",        data: new Date(ano, 9, 12) },
    { nome: "Finados",                     data: new Date(ano, 10, 2) },
    { nome: "Proclamação da República",    data: new Date(ano, 10, 15) },
    { nome: "Consciência Negra",           data: new Date(ano, 10, 20) },
    { nome: "Natal",                       data: new Date(ano, 11, 25) },
  ];
}

/** Retorna os nomes dos feriados nacionais de uma data. Array vazio = dia normal. */
export function feriadosDoDia(data: Date): string[] {
  const ano = data.getFullYear();
  const mes = data.getMonth();
  const dia = data.getDate();
  return feriadosDoAno(ano)
    .filter((f) => f.data.getMonth() === mes && f.data.getDate() === dia)
    .map((f) => f.nome);
}
