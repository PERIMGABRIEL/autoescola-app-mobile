export function normalizarCPF(valor = "") {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(valor = "") {
  const cpf = normalizarCPF(valor).slice(0, 11);

  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function emailAutenticacaoAlunoPorCPF(cpf) {
  return `${normalizarCPF(cpf)}@aluno.ajb.local`;
}
