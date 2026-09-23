import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import AuthScreen from "./src/screens/AuthScreen";
import AlunoHomeScreen from "./src/screens/AlunoHomeScreen";
import { colors } from "./src/theme/tokens";
import { auth } from "./src/services/firebase";
import {
  observarAgendamentosAluno,
  observarPerfilAluno,
  sairAluno,
} from "./src/services/alunoAuth";
import {
  confirmarAgendamentoAlunoMobile,
  observarDisponibilidadesInstrutores,
  observarReservasHorarios,
} from "./src/services/agendamentoAluno";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [perfilAluno, setPerfilAluno] = useState(null);
  const [agendamentosAluno, setAgendamentosAluno] = useState([]);
  const [reservasHorarios, setReservasHorarios] = useState([]);
  const [disponibilidadesInstrutores, setDisponibilidadesInstrutores] = useState([]);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false);

  useEffect(() => {
    let unsubscribePerfil = null;
    let unsubscribeAgendamentos = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user) {
        setPerfilAluno(null);
        setAgendamentosAluno([]);
        setCarregandoSessao(false);
        unsubscribePerfil?.();
        unsubscribeAgendamentos?.();
        return;
      }

      setCarregandoPerfil(true);
      unsubscribePerfil?.();
      unsubscribePerfil = observarPerfilAluno(user.uid, (perfil) => {
        setPerfilAluno(perfil);
        setCarregandoPerfil(false);
        setCarregandoSessao(false);

        unsubscribeAgendamentos?.();

        if (!perfil) {
          setAgendamentosAluno([]);
          return;
        }

        setCarregandoAgendamentos(true);
        unsubscribeAgendamentos = observarAgendamentosAluno(
          {
            uid: user.uid,
          },
          (agendamentos) => {
            setAgendamentosAluno(agendamentos);
            setCarregandoAgendamentos(false);
          }
        );
      });
    });

    return () => {
      unsubscribePerfil?.();
      unsubscribeAgendamentos?.();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      setReservasHorarios([]);
      setDisponibilidadesInstrutores([]);
      return undefined;
    }

    const unsubscribeReservas = observarReservasHorarios(setReservasHorarios);
    const unsubscribeDisponibilidades = observarDisponibilidadesInstrutores(
      setDisponibilidadesInstrutores
    );

    return () => {
      unsubscribeReservas();
      unsubscribeDisponibilidades();
    };
  }, [authUser]);

  if (carregandoSessao) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {authUser ? (
          <AlunoHomeScreen
            authUser={authUser}
            perfilAluno={perfilAluno}
            carregandoPerfil={carregandoPerfil}
            agendamentosAluno={agendamentosAluno}
            reservasHorarios={reservasHorarios}
            disponibilidadesInstrutores={disponibilidadesInstrutores}
            carregandoAgendamentos={carregandoAgendamentos}
            onConfirmarAgendamento={confirmarAgendamentoAlunoMobile}
            onLogout={sairAluno}
          />
        ) : (
          <AuthScreen />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
