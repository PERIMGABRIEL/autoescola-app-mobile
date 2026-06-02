import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { emailAutenticacaoAlunoPorCPF, formatarCPF, normalizarCPF } from "../utils/cpf";

export async function entrarAlunoComCPF(cpf, senha) {
  const cpfNumeros = normalizarCPF(cpf);

  return signInWithEmailAndPassword(
    auth,
    emailAutenticacaoAlunoPorCPF(cpfNumeros),
    senha
  );
}

export async function cadastrarAlunoComCPF({
  nome,
  cpf,
  telefone,
  senha,
}) {
  const cpfNumeros = normalizarCPF(cpf);
  const credenciais = await createUserWithEmailAndPassword(
    auth,
    emailAutenticacaoAlunoPorCPF(cpfNumeros),
    senha
  );

  await setDoc(doc(db, "alunos", credenciais.user.uid), {
    nome,
    cpf: formatarCPF(cpfNumeros),
    cpfNumeros,
    telefone,
    saldoAulas: 0,
    totalAulasCompradas: 0,
    aulasUtilizadas: 0,
    ativo: true,
    criadoEm: serverTimestamp(),
    emailAuth: emailAutenticacaoAlunoPorCPF(cpfNumeros),
  });

  return credenciais;
}

export function observarPerfilAluno(uid, callback) {
  return onSnapshot(doc(db, "alunos", uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    });
  });
}

export function observarAgendamentosAluno({ uid, cpf }, callback) {
  const cpfNumeros = normalizarCPF(cpf || "");

  return onSnapshot(collection(db, "agendamentos"), (snapshot) => {
    const agendamentos = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter((agendamento) => {
        if (agendamento.tipo === "bloqueio") return false;

        if (uid && agendamento.alunoId === uid) return true;

        return (
          cpfNumeros &&
          normalizarCPF(agendamento.cpfAluno || "") === cpfNumeros
        );
      })
      .sort((a, b) => {
        if (a.dia !== b.dia) return a.dia.localeCompare(b.dia);
        return (a.horario || "").localeCompare(b.horario || "");
      });

    callback(agendamentos);
  });
}

export async function solicitarProvaPratica(uid) {
  return updateDoc(doc(db, "alunos", uid), {
    provaPraticaStatus: "solicitada",
    provaPraticaSolicitadaEm: serverTimestamp(),
  });
}

export async function sairAluno() {
  return signOut(auth);
}
