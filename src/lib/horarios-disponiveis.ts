type Agendamento = { inicio: Date; fim: Date };
type Periodo = { horaInicio: number; horaFim: number };

export function calcularSlotsLivres(params: {
  data: string;
  duracaoMin: number;
  periodos: Periodo[];
  intervaloMin: number;
  agendamentos: Agendamento[];
}): string[] {
  const { data, duracaoMin, periodos, intervaloMin, agendamentos } = params;
  const todos: string[] = [];

  for (const { horaInicio, horaFim } of periodos) {
    let cursor = horaInicio * 60;
    const fimMinutos = horaFim * 60;

    while (cursor + duracaoMin <= fimMinutos) {
      const hh = String(Math.floor(cursor / 60)).padStart(2, "0");
      const mm = String(cursor % 60).padStart(2, "0");
      const slotInicio = new Date(`${data}T${hh}:${mm}:00`);
      const slotFim = new Date(slotInicio.getTime() + duracaoMin * 60_000);

      const conflito = agendamentos.some(
        (ag) => slotInicio < ag.fim && slotFim > ag.inicio
      );

      if (!conflito) todos.push(`${hh}:${mm}`);
      cursor += intervaloMin;
    }
  }

  // Remove duplicatas e ordena
  return [...new Set(todos)].sort();
}
