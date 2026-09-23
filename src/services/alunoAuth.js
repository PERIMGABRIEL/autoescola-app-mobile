import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
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
  email,
  tipoFormacao,
  senha,
}) {
  const cpfNumeros = normalizarCPF(cpf);
  const credenciais = await createUserWithEmailAndPassword(
    auth,
    emailAutenticacaoAlunoPorCPF(cpfNumeros),
    senha
  );

  await setDoc(doc(db, "alunos", credenciais.user.uid), {
    uid: credenciais.user.uid,
    nome,
    cpf: formatarCPF(cpfNumeros),
    cpfNumeros,
    telefone,
    email: email?.trim().toLowerCase() || "",
    tipoFormacao,
    modeloSaldos: "separado",
    saldoCarro: 0,
    saldoMoto: 0,
    totalAulasCarroCompradas: 0,
    totalAulasMotoCompradas: 0,
    aulasCarroUtilizadas: 0,
    aulasMotoUtilizadas: 0,
    saldoAulas: 0,
    totalAulasCompradas: 0,
    aulasUtilizadas: 0,
    aguardaLiberacaoCreditos: true,
    provaPraticaStatus: "nenhuma",
    ativo: true,
    consentiuPoliticaPrivacidade: true,
    politicaPrivacidadeVersao: "2026-09-15",
    politicaPrivacidadeAceitaEm: serverTimestamp(),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
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

export function observarAgendamentosAluno({ uid }, callback) {
  const consulta = query(
    collection(db, "agendamentos"),
    where("alunoId", "==", uid)
  );

  return onSnapshot(consulta, (snapshot) => {
    const agendamentos = snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a, b) => {
        if (a.dia !== b.dia) return a.dia.localeCompare(b.dia);
        return (a.horario || "").localeCompare(b.horario || "");
      });

    callback(agendamentos);
  });
}

export async function sairAluno() {
  return signOut(auth);
}
