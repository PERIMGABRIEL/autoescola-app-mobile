import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  criarDataLocal,
  dataNaMesmaSemana,
  formatarData,
  normalizarCPF,
} from "../utils/formatters";

export function observarAgendamentosSistema(callback) {
  return onSnapshot(collection(db, "agendamentos"), (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    );
  });
}

export function observarDisponibilidadesInstrutores(callback) {
  return onSnapshot(collection(db, "disponibilidades_instrutores"), (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    );
  });
}

export async function confirmarAgendamentoAlunoMobile({
  perfilAluno,
  dataSelecionada,
  horarioSelecionado,
  instrutorSelecionado,
}) {
  const authUser = auth.currentUser;

  if (!authUser || !perfilAluno) {
    throw new Error("Sessão do aluno não encontrada.");
  }

  const diaSelecionado = formatarData(dataSelecionada);
  const custoAulas = instrutorSelecionado.categoria === "CARRO" ? 2 : 1;
  const alunoRef = doc(db, "alunos", authUser.uid);
  const agendamentoRef = doc(db, "agendamentos", `${authUser.uid}_${diaSelecionado}`);
  const cpfAluno = normalizarCPF(perfilAluno.cpfNumeros || perfilAluno.cpf || "");
  const snapshotAgendamentos = await getDocs(collection(db, "agendamentos"));
  const totalNaSemana = snapshotAgendamentos.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .filter((agendamento) => {
      if (agendamento.tipo === "bloqueio") return false;
      if ((agendamento.status ?? "confirmado") !== "confirmado") return false;

      const pertenceAoAluno =
        agendamento.alunoId === authUser.uid ||
        (cpfAluno && normalizarCPF(agendamento.cpfAluno || "") === cpfAluno);

      if (!pertenceAoAluno) return false;

      const dataAgendada = criarDataLocal(agendamento.dia);
      if (!dataAgendada) return false;

      return dataNaMesmaSemana(dataAgendada, dataSelecionada);
    }).length;

  if (totalNaSemana >= 3) {
    throw new Error("Limite semanal excedido.");
  }

  await runTransaction(db, async (transaction) => {
    const alunoSnapshot = await transaction.get(alunoRef);
    const agendamentoNoDiaSnapshot = await transaction.get(agendamentoRef);

    if (!alunoSnapshot.exists()) {
      throw new Error("Aluno não encontrado.");
    }

    const dadosAluno = alunoSnapshot.data();
    const saldoAtual = Number(dadosAluno.saldoAulas || 0);
    const aulasUtilizadas = Number(dadosAluno.aulasUtilizadas || 0);

    if (dadosAluno.ativo === false) {
      throw new Error("Aluno inativo.");
    }

    if (
      agendamentoNoDiaSnapshot.exists() &&
      (agendamentoNoDiaSnapshot.data().status ?? "confirmado") === "confirmado"
    ) {
      throw new Error("Você já possui uma aula confirmada nesse dia.");
    }

    if (saldoAtual < custoAulas) {
      throw new Error("Saldo insuficiente.");
    }

    transaction.update(alunoRef, {
      saldoAulas: saldoAtual - custoAulas,
      aulasUtilizadas: aulasUtilizadas + custoAulas,
      atualizadoEm: serverTimestamp(),
    });

    transaction.set(agendamentoRef, {
      alunoId: authUser.uid,
      nomeAluno: dadosAluno.nome,
      cpfAluno: dadosAluno.cpf || "",
      telefone: dadosAluno.telefone || "",
      emailAluno: dadosAluno.email || authUser.email || "",
      observacao: "",
      dia: diaSelecionado,
      horario: horarioSelecionado,
      instrutor: instrutorSelecionado.nome,
      categoria: instrutorSelecionado.categoria,
      veiculo: instrutorSelecionado.veiculo,
      aulasConsumidas: custoAulas,
      status: "confirmado",
      criadoEm: serverTimestamp(),
    });
  });
}

export async function cancelarAgendamentoAlunoMobile({ agendamentoId, perfilAluno }) {
  const authUser = auth.currentUser;

  if (!authUser || !perfilAluno) {
    throw new Error("Sessão do aluno não encontrada.");
  }

  const agendamentoRef = doc(db, "agendamentos", agendamentoId);
  const alunoRef = doc(db, "alunos", authUser.uid);

  await runTransaction(db, async (transaction) => {
    const agendamentoSnapshot = await transaction.get(agendamentoRef);
    const alunoSnapshot = await transaction.get(alunoRef);

    if (!agendamentoSnapshot.exists()) {
      throw new Error("Agendamento não encontrado.");
    }

    if (!alunoSnapshot.exists()) {
      throw new Error("Aluno não encontrado.");
    }

    const dadosAgendamento = agendamentoSnapshot.data();
    const cpfAlunoSessao = normalizarCPF(perfilAluno.cpfNumeros || perfilAluno.cpf || "");
    const cpfAgendamento = normalizarCPF(dadosAgendamento.cpfAluno || "");

    if (
      dadosAgendamento.alunoId !== authUser.uid &&
      (!cpfAlunoSessao || cpfAgendamento !== cpfAlunoSessao)
    ) {
      throw new Error("Você não pode cancelar este agendamento.");
    }

    const aulasConsumidas = Number(dadosAgendamento.aulasConsumidas || 0);
    const dadosAluno = alunoSnapshot.data();
    const saldoAtual = Number(dadosAluno.saldoAulas || 0);
    const aulasUtilizadas = Number(dadosAluno.aulasUtilizadas || 0);

    transaction.update(alunoRef, {
      saldoAulas: saldoAtual + aulasConsumidas,
      aulasUtilizadas: Math.max(0, aulasUtilizadas - aulasConsumidas),
      atualizadoEm: serverTimestamp(),
    });

    transaction.delete(agendamentoRef);
  });
}

export function agendamentoPertenceAoAluno(agendamento, { uid, cpf }) {
  if (!agendamento) return false;

  if (uid && agendamento.alunoId === uid) return true;

  const cpfAluno = normalizarCPF(cpf || "");
  return Boolean(cpfAluno && normalizarCPF(agendamento.cpfAluno || "") === cpfAluno);
}
