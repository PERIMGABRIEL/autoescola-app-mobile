import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { dataEhFimDeSemana, formatarData } from "../utils/formatters";

const INTERVALO_MINIMO_AGENDAMENTO_MS = 30 * 1000;

function idReservaHorario(instrutor, dia, horario) {
  return `${instrutor}_${dia}_${horario}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function formacaoPermiteCategoria(tipoFormacao, categoria) {
  if (!tipoFormacao || tipoFormacao === "Carro e moto") return true;
  if (tipoFormacao === "Apenas carro") return categoria === "CARRO";
  return categoria === "MOTO";
}

function milissegundosDoTimestamp(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  return 0;
}

function mensagemLimiteAgendamento(tempoRestanteMs) {
  const segundos = Math.max(1, Math.ceil(tempoRestanteMs / 1000));
  return `Por segurança, aguarde ${segundos} segundo(s) antes de marcar outra aula.`;
}

function alunoUsaSaldosSeparados(aluno) {
  return aluno?.modeloSaldos === "separado";
}

function saldoDisponivelDoAluno(aluno, categoria) {
  if (!alunoUsaSaldosSeparados(aluno)) {
    return Number(aluno?.saldoAulas || 0);
  }

  return categoria === "CARRO"
    ? Number(aluno?.saldoCarro || 0)
    : Number(aluno?.saldoMoto || 0);
}

function aulasConsumidasNoAgendamento(aluno, categoria) {
  if (alunoUsaSaldosSeparados(aluno)) return 1;
  return categoria === "CARRO" ? 2 : 1;
}

export function observarReservasHorarios(callback) {
  return onSnapshot(collection(db, "reservas_horarios"), (snapshot) => {
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

  if (dataEhFimDeSemana(dataSelecionada)) {
    throw new Error("As aulas só podem ser marcadas de segunda a sexta.");
  }

  const diaSelecionado = formatarData(dataSelecionada);
  const alunoRef = doc(db, "alunos", authUser.uid);
  const limiteAgendamentoRef = doc(
    db,
    "limites_agendamento",
    authUser.uid
  );
  const agendamentoRef = doc(
    db,
    "agendamentos",
    `${authUser.uid}_${diaSelecionado}`
  );
  const reservaHorarioRef = doc(
    db,
    "reservas_horarios",
    idReservaHorario(
      instrutorSelecionado.nome,
      diaSelecionado,
      horarioSelecionado
    )
  );

  await runTransaction(db, async (transaction) => {
    const [alunoSnapshot, limiteSnapshot, agendamentoNoDiaSnapshot, reservaSnapshot] =
      await Promise.all([
        transaction.get(alunoRef),
        transaction.get(limiteAgendamentoRef),
        transaction.get(agendamentoRef),
        transaction.get(reservaHorarioRef),
      ]);

    if (!alunoSnapshot.exists()) {
      throw new Error("Aluno não encontrado.");
    }

    const dadosAluno = alunoSnapshot.data();
    const modeloSaldos = alunoUsaSaldosSeparados(dadosAluno)
      ? "separado"
      : "legado";
    const custoAtual = aulasConsumidasNoAgendamento(
      dadosAluno,
      instrutorSelecionado.categoria
    );
    const saldoAtual = saldoDisponivelDoAluno(
      dadosAluno,
      instrutorSelecionado.categoria
    );

    if (dadosAluno.ativo === false) {
      throw new Error("Aluno inativo.");
    }

    if (
      !formacaoPermiteCategoria(
        dadosAluno.tipoFormacao,
        instrutorSelecionado.categoria
      )
    ) {
      throw new Error("Esse tipo de aula não faz parte da sua formação.");
    }

    if (
      agendamentoNoDiaSnapshot.exists() &&
      (agendamentoNoDiaSnapshot.data().status ?? "confirmado") === "confirmado"
    ) {
      throw new Error("Você já possui uma aula confirmada nesse dia.");
    }

    if (saldoAtual < custoAtual) {
      throw new Error("Saldo insuficiente.");
    }

    if (reservaSnapshot.exists()) {
      throw new Error("Esse horário acabou de ser reservado. Escolha outro.");
    }

    if (limiteSnapshot.exists()) {
      const ultimaMarcacaoEm = milissegundosDoTimestamp(
        limiteSnapshot.data().ultimaMarcacaoEm
      );
      const tempoRestante =
        INTERVALO_MINIMO_AGENDAMENTO_MS - (Date.now() - ultimaMarcacaoEm);

      if (ultimaMarcacaoEm && tempoRestante > 0) {
        throw new Error(mensagemLimiteAgendamento(tempoRestante));
      }
    }

    transaction.update(
      alunoRef,
      modeloSaldos === "separado"
        ? instrutorSelecionado.categoria === "CARRO"
          ? {
              saldoCarro: saldoAtual - custoAtual,
              aulasCarroUtilizadas:
                Number(dadosAluno.aulasCarroUtilizadas || 0) + custoAtual,
              atualizadoEm: serverTimestamp(),
            }
          : {
              saldoMoto: saldoAtual - custoAtual,
              aulasMotoUtilizadas:
                Number(dadosAluno.aulasMotoUtilizadas || 0) + custoAtual,
              atualizadoEm: serverTimestamp(),
            }
        : {
            saldoAulas: saldoAtual - custoAtual,
            aulasUtilizadas:
              Number(dadosAluno.aulasUtilizadas || 0) + custoAtual,
            atualizadoEm: serverTimestamp(),
          }
    );

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
      aulasConsumidas: custoAtual,
      modeloSaldos,
      status: "confirmado",
      criadoEm: serverTimestamp(),
    });

    transaction.set(reservaHorarioRef, {
      agendamentoId: agendamentoRef.id,
      tipo: "agendamento",
      instrutor: instrutorSelecionado.nome,
      dia: diaSelecionado,
      horario: horarioSelecionado,
      criadoEm: serverTimestamp(),
    });

    transaction.set(limiteAgendamentoRef, {
      alunoId: authUser.uid,
      ultimaMarcacaoEm: serverTimestamp(),
    });
  });
}
