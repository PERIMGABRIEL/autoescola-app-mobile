export function formatarDataBR(dataString) {
  if (!dataString) return "Data não informada";

  const [ano, mes, dia] = dataString.split("-");

  if (!ano || !mes || !dia) return dataString;

  return `${dia}/${mes}/${ano}`;
}

export function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function criarDataLocal(dataString) {
  if (!dataString) return null;

  const [ano, mes, dia] = String(dataString)
    .split("-")
    .map((parte) => Number(parte));

  if (!ano || !mes || !dia) return null;

  const data = new Date(ano, mes - 1, dia);
  data.setHours(0, 0, 0, 0);
  return data;
}

export function dataEhFimDeSemana(data) {
  const diaSemana = data.getDay();
  return diaSemana === 0 || diaSemana === 6;
}

export function obterInicioDaSemana(data) {
  const base = new Date(data);
  base.setHours(0, 0, 0, 0);

  const diaSemana = base.getDay();
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;

  base.setDate(base.getDate() + deslocamento);
  return base;
}

export function dataNaMesmaSemana(dataA, dataB) {
  const inicioA = obterInicioDaSemana(dataA);
  const inicioB = obterInicioDaSemana(dataB);
  return inicioA.getTime() === inicioB.getTime();
}

export function formatarDataComDiaSemana(data) {
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function normalizarCPF(valor = "") {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function compararHorarios(a, b) {
  return a.localeCompare(b, "pt-BR");
}

export function horarioIndisponivel(data, faixa) {
  const agora = new Date();
  const hoje = data.toDateString() === agora.toDateString();

  if (!hoje) return false;

  const [inicio] = faixa.split(" - ");
  const [h, m] = inicio.split(":").map(Number);

  const dataInicio = new Date(data);
  dataInicio.setHours(h, m, 0, 0);

  return agora >= dataInicio;
}

export function statusLegivel(status) {
  if (status === "realizada") return "Realizada";
  if (status === "cancelado") return "Cancelada";
  if (status === "faltou") return "Faltou";
  return "Confirmada";
}
