import { useMemo, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { instrutores } from "../constants/instrutores";
import {
  compararHorarios,
  criarDataLocal,
  dataEhFimDeSemana,
  dataNaMesmaSemana,
  formatarData,
  formatarDataComDiaSemana,
  formatarDataBR,
  horarioIndisponivel,
  statusLegivel,
} from "../utils/formatters";

const logoHeader = require("../../assets/logo-jardim-botanico-mobile.png");
const WHATSAPP_AUTOESCOLA = "5561982094121";
const TAB_ITEMS = [
  {
    id: "inicio",
    label: "Início",
    icon: "home-variant-outline",
    title: "Visão geral",
    description: "Resumo rápido da sua jornada e dos próximos passos.",
  },
  {
    id: "agendar",
    label: "Agendar",
    icon: "calendar-check-outline",
    title: "Nova aula prática",
    description: "Escolha a melhor data, instrutor e horário disponível.",
  },
  {
    id: "aulas",
    label: "Aulas",
    icon: "car-clock",
    title: "Sua agenda",
    description: "Confira próximas aulas, histórico e status de cada horário.",
  },
  {
    id: "perfil",
    label: "Perfil",
    icon: "account-outline",
    title: "Seus dados",
    description: "Informações principais da conta e status da sua prova.",
  },
];

function obterPrimeiraDataUtil() {
  const data = new Date();
  data.setHours(0, 0, 0, 0);

  while (dataEhFimDeSemana(data)) {
    data.setDate(data.getDate() + 1);
  }

  return data;
}

function formacaoPermiteCategoria(tipoFormacao, categoria) {
  if (!tipoFormacao || tipoFormacao === "Carro e moto") return true;
  if (tipoFormacao === "Apenas carro") return categoria === "CARRO";
  return categoria === "MOTO";
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

function nomeExibicaoInstrutor(nome) {
  return instrutores.find((instrutor) => instrutor.nome === nome)
    ?.rotuloExibicao || nome || "Instrutor";
}

export default function AlunoHomeScreen({
  authUser,
  perfilAluno,
  carregandoPerfil,
  agendamentosAluno,
  reservasHorarios,
  disponibilidadesInstrutores,
  carregandoAgendamentos,
  onConfirmarAgendamento,
  onLogout,
}) {
  const [abaAtiva, setAbaAtiva] = useState("inicio");
  const [dataSelecionada, setDataSelecionada] = useState(obterPrimeiraDataUtil);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [instrutorSelecionadoNome, setInstrutorSelecionadoNome] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);
  const diaSelecionado = formatarData(dataSelecionada);
  const abaAtual = TAB_ITEMS.find((item) => item.id === abaAtiva) || TAB_ITEMS[0];
  const hoje = useMemo(() => {
    const atual = new Date();
    atual.setHours(0, 0, 0, 0);
    return atual;
  }, []);
  const usaSaldosSeparados = perfilAluno?.modeloSaldos === "separado";
  const permiteCarro = formacaoPermiteCategoria(
    perfilAluno?.tipoFormacao,
    "CARRO"
  );
  const permiteMoto = formacaoPermiteCategoria(
    perfilAluno?.tipoFormacao,
    "MOTO"
  );
  const saldoCarro = Number(perfilAluno?.saldoCarro || 0);
  const saldoMoto = Number(perfilAluno?.saldoMoto || 0);
  const aguardaLiberacaoCreditos =
    perfilAluno?.aguardaLiberacaoCreditos === true ||
    (usaSaldosSeparados &&
      (!permiteCarro || saldoCarro === 0) &&
      (!permiteMoto || saldoMoto === 0));

  const { proximasAulas, historicoAulas } = useMemo(() => {
    const futuras = [];
    const historico = [];

    agendamentosAluno.forEach((agendamento) => {
      const [ano, mes, dia] = String(agendamento.dia || "")
        .split("-")
        .map((parte) => Number(parte));

      const dataAula = new Date(ano, (mes || 1) - 1, dia || 1);
      dataAula.setHours(0, 0, 0, 0);

      const status = agendamento.status ?? "confirmado";
      const ehFuturaOuHoje = !Number.isNaN(dataAula.getTime()) && dataAula >= hoje;

      if (ehFuturaOuHoje && status === "confirmado") {
        futuras.push(agendamento);
        return;
      }

      historico.push(agendamento);
    });

    return {
      proximasAulas: futuras,
      historicoAulas: historico,
    };
  }, [agendamentosAluno, hoje]);

  const aulasCarroNaSemanaSelecionada = useMemo(
    () =>
      agendamentosAluno.filter((agendamento) => {
        if ((agendamento.status ?? "confirmado") !== "confirmado") return false;
        if (agendamento.categoria !== "CARRO") return false;

        const dataAgendada = criarDataLocal(agendamento.dia);
        if (!dataAgendada) return false;

        return dataNaMesmaSemana(dataAgendada, dataSelecionada);
      }).length,
    [agendamentosAluno, dataSelecionada]
  );

  const proximaAula = proximasAulas[0] || null;

  const instrutoresDisponiveis = instrutores.filter((instrutor) =>
    formacaoPermiteCategoria(perfilAluno?.tipoFormacao, instrutor.categoria)
  );
  const instrutorSelecionado =
    instrutoresDisponiveis.find(
      (item) => item.nome === instrutorSelecionadoNome
    ) || null;

  const horariosBase = useMemo(
    () =>
      obterHorariosInstrutorPorData(
        instrutorSelecionado,
        diaSelecionado,
        disponibilidadesInstrutores
      ),
    [instrutorSelecionado, diaSelecionado, disponibilidadesInstrutores]
  );

  const horariosDisponiveis = useMemo(() => {
    if (!instrutorSelecionado) return [];

    return horariosBase.filter((horario) => {
      const horarioReservado = reservasHorarios.some(
        (reserva) =>
          reserva.dia === diaSelecionado &&
          reserva.horario === horario &&
          reserva.instrutor === instrutorSelecionado.nome
      );

      return (
        !horarioReservado &&
        !horarioIndisponivel(dataSelecionada, horario)
      );
    });
  }, [
    reservasHorarios,
    dataSelecionada,
    diaSelecionado,
    horariosBase,
    instrutorSelecionado,
  ]);

  function handleSelecionarData(_, data) {
    if (Platform.OS === "android") {
      setMostrarDatePicker(false);
    }

    if (!data) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataEscolhida = new Date(data);
    dataEscolhida.setHours(0, 0, 0, 0);

    if (dataEscolhida < hoje) {
      setDataSelecionada(hoje);
      return;
    }

    if (dataEhFimDeSemana(dataEscolhida)) {
      Alert.alert(
        "Data indisponível",
        "As aulas práticas pelo aplicativo só podem ser marcadas de segunda a sexta."
      );
      return;
    }

    setDataSelecionada(dataEscolhida);
    setHorarioSelecionado(null);
  }

  async function abrirWhatsApp(tipo) {
    const mensagemBase =
      tipo === "remarcacao"
        ? `Olá! Sou ${perfilAluno?.nome || "aluno(a)"} e gostaria de solicitar remarcação.${proximaAula ? ` Minha próxima aula é em ${formatarDataBR(proximaAula.dia)} às ${proximaAula.horario}.` : ""}`
        : `Olá! Sou ${perfilAluno?.nome || "aluno(a)"} e gostaria de confirmar minhas informações de aula no aplicativo.`;

    const url = `https://wa.me/${WHATSAPP_AUTOESCOLA}?text=${encodeURIComponent(
      mensagemBase
    )}`;

    await Linking.openURL(url);
  }

  async function solicitarCancelamentoAula(agendamento) {
    const mensagem = `Olá! Sou ${perfilAluno?.nome || "aluno(a)"} e gostaria de solicitar o cancelamento da minha aula do dia ${formatarDataBR(agendamento.dia)} às ${agendamento.horario}, em ${nomeExibicaoInstrutor(agendamento.instrutor)}. CPF: ${perfilAluno?.cpf || "não informado"}.`;
    const url = `https://wa.me/${WHATSAPP_AUTOESCOLA}?text=${encodeURIComponent(
      mensagem
    )}`;

    await Linking.openURL(url);
  }

  async function solicitarLiberacaoDeCreditos() {
    const mensagem = `Olá! Sou ${perfilAluno?.nome || "aluno(a)"} e finalizei meu cadastro no aplicativo. Poderiam liberar os créditos do meu pacote?\n\nCPF: ${perfilAluno?.cpf || "não informado"}\nFormação: ${perfilAluno?.tipoFormacao || "não informada"}`;
    const url = `https://wa.me/${WHATSAPP_AUTOESCOLA}?text=${encodeURIComponent(
      mensagem
    )}`;

    await Linking.openURL(url);
  }

  async function handleSolicitarProva() {
    if (!authUser || !perfilAluno) return;

    if (perfilAluno.provaPraticaStatus === "marcada") {
      Alert.alert(
        "Prova já marcada",
        "Sua prova prática já está marcada no sistema."
      );
      return;
    }

    Alert.alert(
      "Solicitar prova prática",
      "Vamos abrir o WhatsApp da autoescola com a mensagem pronta para solicitar sua prova prática. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Abrir WhatsApp",
          onPress: async () => {
            try {
              const mensagem = `Olá! Sou ${perfilAluno?.nome || "aluno(a)"} e gostaria de solicitar a marcação da minha prova prática. CPF: ${perfilAluno?.cpf || "não informado"}.`;
              const url = `https://wa.me/${WHATSAPP_AUTOESCOLA}?text=${encodeURIComponent(
                mensagem
              )}`;
              await Linking.openURL(url);
            } catch {
              Alert.alert("Não foi possível abrir", "Tente novamente em instantes.");
            }
          },
        },
      ]
    );
  }

  async function handleMarcarAula() {
    if (!instrutorSelecionado || !horarioSelecionado) {
      Alert.alert(
        "Faltam informações",
        "Escolha o instrutor e o horário para continuar."
      );
      return;
    }

    const custoAulas = aulasConsumidasNoAgendamento(
      perfilAluno,
      instrutorSelecionado.categoria
    );
    const saldoDisponivel = saldoDisponivelDoAluno(
      perfilAluno,
      instrutorSelecionado.categoria
    );

    if (saldoDisponivel < custoAulas) {
      Alert.alert(
        "Saldo insuficiente",
        "Seu saldo atual não cobre esse tipo de aula."
      );
      return;
    }

    if (dataEhFimDeSemana(dataSelecionada)) {
      Alert.alert(
        "Fim de semana indisponível",
        "Escolha uma data entre segunda e sexta para continuar."
      );
      return;
    }

    if (
      instrutorSelecionado.categoria === "CARRO" &&
      aulasCarroNaSemanaSelecionada >= 3
    ) {
      Alert.alert(
        "Limite semanal atingido",
        "Você já possui 3 dias confirmados nessa semana. Escolha outra semana para continuar."
      );
      return;
    }

    const jaTemAulaNoDia = agendamentosAluno.some(
      (agendamento) =>
        agendamento.dia === diaSelecionado &&
        (agendamento.status ?? "confirmado") === "confirmado"
    );

    if (jaTemAulaNoDia) {
      Alert.alert(
        "Você já tem aula nesse dia",
        "Cada aluno pode manter apenas um horário por dia."
      );
      return;
    }

    try {
      setSalvandoAgendamento(true);
      await onConfirmarAgendamento({
        perfilAluno,
        dataSelecionada,
        horarioSelecionado,
        instrutorSelecionado,
      });
      setHorarioSelecionado(null);
      Alert.alert(
        "Aula confirmada",
        "Seu agendamento foi salvo com sucesso."
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível agendar",
        traduzirErroAgendamento(error?.message)
      );
    } finally {
      setSalvandoAgendamento(false);
    }
  }

  function handleCancelarAula(agendamento) {
    Alert.alert(
      "Solicitar cancelamento",
      "Vamos abrir o WhatsApp da autoescola com a mensagem pronta para solicitar o cancelamento dessa aula. Deseja continuar?",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Abrir WhatsApp",
          onPress: async () => {
            try {
              await solicitarCancelamentoAula(agendamento);
            } catch {
              Alert.alert("Não foi possível abrir", "Tente novamente em instantes.");
            }
          },
        },
      ]
    );
  }

  function renderHero() {
    return (
      <View style={styles.hero}>
        <View style={styles.heroGlowLarge} />
        <View style={styles.heroGlowSmall} />
        <View style={styles.logoShell}>
          <Image source={logoHeader} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.eyebrow}>Área do aluno</Text>
        <View style={styles.locationPill}>
          <Text style={styles.locationPillText}>
            Jardim Botânico Shopping • Brasília
          </Text>
        </View>
        <Text style={styles.title}>
          {perfilAluno?.nome ? `Olá, ${perfilAluno.nome.split(" ")[0]}` : "Olá"}
        </Text>
        <Text style={styles.description}>
          Sua conta já está conectada ao sistema da autoescola. Agora você já
          consegue acompanhar saldo, aulas e solicitações direto pelo celular.
        </Text>
      </View>
    );
  }

  function renderSectionIntro() {
    if (abaAtiva === "inicio") return null;

    return (
      <View style={styles.sectionIntro}>
        <View style={styles.sectionIntroIcon}>
          <MaterialCommunityIcons
            name={abaAtual.icon}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.sectionIntroContent}>
          <Text style={styles.sectionIntroEyebrow}>Portal Jardim Botânico</Text>
          <Text style={styles.sectionIntroTitle}>{abaAtual.title}</Text>
          <Text style={styles.sectionIntroDescription}>{abaAtual.description}</Text>
        </View>
      </View>
    );
  }

  function renderSaldoCards() {
    return (
      <View style={styles.grid}>
        <InfoCard label="CPF" value={perfilAluno?.cpf || "Não informado"} />
        {usaSaldosSeparados ? (
          <>
            {permiteCarro ? (
              <InfoCard label="Saldo carro" value={String(saldoCarro)} />
            ) : null}
            {permiteMoto ? (
              <InfoCard label="Saldo moto" value={String(saldoMoto)} />
            ) : null}
            <InfoCard
              label="Aulas utilizadas"
              value={String(
                (permiteCarro ? Number(perfilAluno?.aulasCarroUtilizadas || 0) : 0) +
                  (permiteMoto ? Number(perfilAluno?.aulasMotoUtilizadas || 0) : 0)
              )}
            />
          </>
        ) : (
          <>
            <InfoCard
              label="Saldo de aulas"
              value={String(perfilAluno?.saldoAulas ?? 0)}
            />
            <InfoCard
              label="Aulas utilizadas"
              value={String(perfilAluno?.aulasUtilizadas ?? 0)}
            />
          </>
        )}
      </View>
    );
  }

  function renderAgendarPanel() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Marcar aula prática</Text>
          <Text style={styles.panelText}>
            Escolha a data, o instrutor e o horário disponível para confirmar sua
            próxima aula.
          </Text>
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.warningBannerText}>
              O aplicativo libera agendamentos somente de segunda a sexta, com até 3 dias confirmados por semana.
            </Text>
          </View>
          <Text style={styles.weekRuleText}>
            Semana selecionada: {aulasCarroNaSemanaSelecionada}/3 dias de carro já confirmados.
          </Text>

        <Text style={styles.subsectionTitle}>Data</Text>
        <Pressable
          style={styles.datePickerButton}
          onPress={() => setMostrarDatePicker(true)}
        >
          <Text style={styles.datePickerLabel}>Data escolhida</Text>
          <Text style={styles.datePickerValue}>
            {formatarDataComDiaSemana(dataSelecionada)}
          </Text>
          <Text style={styles.datePickerSubvalue}>
            {formatarDataBR(diaSelecionado)}
          </Text>
          <Text style={styles.datePickerHint}>
            Toque para escolher qualquer data futura
          </Text>
        </Pressable>

        {mostrarDatePicker ? (
          <View style={styles.datePickerShell}>
            <DateTimePicker
              value={dataSelecionada}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={handleSelecionarData}
              textColor={colors.text}
              accentColor={colors.primary}
            />
            {Platform.OS === "ios" ? (
              <Pressable
                style={styles.datePickerDone}
                onPress={() => setMostrarDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Confirmar data</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.subsectionTitle}>Tipo de aula</Text>
        <View style={styles.optionList}>
          {instrutoresDisponiveis.map((instrutor) => (
            <Pressable
              key={instrutor.nome}
              style={[
                styles.optionCard,
                instrutorSelecionadoNome === instrutor.nome &&
                  styles.optionCardActive,
              ]}
              onPress={() => {
                setInstrutorSelecionadoNome(instrutor.nome);
                setHorarioSelecionado(null);
              }}
            >
              <Text
                style={[
                  styles.optionTitle,
                  instrutorSelecionadoNome === instrutor.nome &&
                    styles.optionTitleActive,
                ]}
              >
                {instrutor.rotuloExibicao || instrutor.nome}
              </Text>
              <Text
                style={[
                  styles.optionMeta,
                  instrutorSelecionadoNome === instrutor.nome &&
                    styles.optionMetaActive,
                ]}
              >
                {instrutor.categoria} • {instrutor.veiculo}
              </Text>
            </Pressable>
          ))}
        </View>

        {instrutorSelecionado ? (
          <>
            <View style={styles.bookingStats}>
              <MiniInfoCard
                label="Categoria"
                value={instrutorSelecionado.categoria}
              />
              <MiniInfoCard
                label="Consumo"
                value={`${aulasConsumidasNoAgendamento(
                  perfilAluno,
                  instrutorSelecionado.categoria
                )} crédito(s)`}
              />
            </View>

            <Text style={styles.subsectionTitle}>Horários disponíveis</Text>
            {horariosDisponiveis.length === 0 ? (
              <Text style={styles.panelText}>
                Não há horários disponíveis para essa combinação no momento.
              </Text>
            ) : (
              <View style={styles.slotGrid}>
                {horariosDisponiveis.map((horario) => (
                  <Pressable
                    key={horario}
                    style={[
                      styles.slotCard,
                      horarioSelecionado === horario && styles.slotCardActive,
                    ]}
                    onPress={() => setHorarioSelecionado(horario)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        horarioSelecionado === horario && styles.slotTextActive,
                      ]}
                    >
                      {horario}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.bookingHint}>
              {usaSaldosSeparados
                ? "Cada aula consome 1 crédito da modalidade escolhida."
                : instrutorSelecionado.categoria === "CARRO"
                  ? "Aula de carro consome 2 créditos."
                  : "Aula de moto consome 1 crédito."}
            </Text>

            {horarioSelecionado ? (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumo da marcação</Text>
                <Text style={styles.summaryLine}>
                  {formatarDataComDiaSemana(dataSelecionada)}
                </Text>
                <Text style={styles.summaryLine}>
                  {horarioSelecionado} • {instrutorSelecionado.rotuloExibicao || instrutorSelecionado.nome}
                </Text>
                <Text style={styles.summaryLine}>
                  {instrutorSelecionado.categoria} • {instrutorSelecionado.veiculo}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[
                styles.primaryButton,
                (!horarioSelecionado || salvandoAgendamento) &&
                  styles.primaryButtonDisabled,
              ]}
              onPress={handleMarcarAula}
              disabled={!horarioSelecionado || salvandoAgendamento}
            >
              {salvandoAgendamento ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Confirmar aula prática
                </Text>
              )}
            </Pressable>
          </>
        ) : null}
      </View>
    );
  }

  function renderAulasPanel() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Minhas aulas</Text>
        {carregandoAgendamentos ? (
          <View style={styles.loadingRowInline}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Carregando aulas...</Text>
          </View>
        ) : agendamentosAluno.length === 0 ? (
          <Text style={styles.panelText}>
            Ainda não há aulas vinculadas a esta conta.
          </Text>
        ) : (
          <View style={styles.lessonSections}>
            <View style={styles.lessonSection}>
              <View style={styles.lessonSectionHeader}>
                <Text style={styles.lessonSectionTitle}>Próximas</Text>
                <View style={styles.lessonSectionCount}>
                  <Text style={styles.lessonSectionCountText}>
                    {proximasAulas.length}
                  </Text>
                </View>
              </View>

              {proximasAulas.length === 0 ? (
                <View style={styles.emptyLessonState}>
                  <Text style={styles.emptyLessonTitle}>Nada marcado por agora</Text>
                  <Text style={styles.emptyLessonText}>
                    Assim que uma nova aula for confirmada, ela aparece aqui no topo.
                  </Text>
                </View>
              ) : (
                <View style={styles.lessonList}>
                  {proximasAulas.map((agendamento, index) => (
                    <View
                      key={agendamento.id}
                      style={[
                        styles.lessonCard,
                        index === 0 && styles.lessonCardHighlight,
                      ]}
                    >
                      <View style={styles.lessonHeader}>
                        <Text style={styles.lessonDate}>
                          {formatarDataBR(agendamento.dia)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            index === 0 && styles.statusBadgeHighlight,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              index === 0 && styles.statusBadgeTextHighlight,
                            ]}
                          >
                            {index === 0
                              ? "Próxima aula"
                              : statusLegivel(agendamento.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lessonMeta}>
                        {agendamento.horario} |{" "}
                        {nomeExibicaoInstrutor(agendamento.instrutor)}
                      </Text>
                      <Text style={styles.lessonMeta}>
                        {agendamento.categoria || "Categoria"} |{" "}
                        {agendamento.veiculo || "Veículo"}
                      </Text>
                      <Pressable
                        style={styles.cancelLessonButton}
                        onPress={() => handleCancelarAula(agendamento)}
                      >
                        <Text style={styles.cancelLessonButtonText}>
                          Solicitar cancelamento
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.lessonSection}>
              <View style={styles.lessonSectionHeader}>
                <Text style={styles.lessonSectionTitle}>Histórico</Text>
                <View style={styles.lessonSectionCountMuted}>
                  <Text style={styles.lessonSectionCountMutedText}>
                    {historicoAulas.length}
                  </Text>
                </View>
              </View>

              {historicoAulas.length === 0 ? (
                <Text style={styles.panelText}>
                  Seu histórico de aulas ainda vai aparecer aqui conforme o uso do
                  aplicativo.
                </Text>
              ) : (
                <View style={styles.lessonList}>
                  {historicoAulas.map((agendamento) => (
                    <View key={agendamento.id} style={styles.lessonCard}>
                      <View style={styles.lessonHeader}>
                        <Text style={styles.lessonDate}>
                          {formatarDataBR(agendamento.dia)}
                        </Text>
                        <View style={styles.statusBadgeMuted}>
                          <Text style={styles.statusBadgeMutedText}>
                            {statusLegivel(agendamento.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lessonMeta}>
                        {agendamento.horario} |{" "}
                        {nomeExibicaoInstrutor(agendamento.instrutor)}
                      </Text>
                      <Text style={styles.lessonMeta}>
                        {agendamento.categoria || "Categoria"} |{" "}
                        {agendamento.veiculo || "Veículo"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  function renderInicio() {
    return (
      <>
        {renderHero()}
        {renderSaldoCards()}
        {aguardaLiberacaoCreditos ? (
          <View style={styles.creditRequestCard}>
            <Text style={styles.creditRequestTitle}>Aguardando créditos</Text>
            <Text style={styles.creditRequestText}>
              A autoescola ainda precisa liberar as aulas do seu pacote para você começar a agendar.
            </Text>
            <Pressable
              style={styles.creditRequestButton}
              onPress={() => {
                solicitarLiberacaoDeCreditos().catch(() => {
                  Alert.alert("Não foi possível abrir", "Tente novamente em instantes.");
                });
              }}
            >
              <Text style={styles.creditRequestButtonText}>
                Solicitar liberação no WhatsApp
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Próxima aula</Text>
          {proximaAula ? (
            <>
              <Text style={styles.panelText}>
                {formatarDataBR(proximaAula.dia)} às {proximaAula.horario}
              </Text>
              <View style={styles.list}>
                <Bullet
                  text={`Tipo de aula: ${nomeExibicaoInstrutor(
                    proximaAula.instrutor
                  )}`}
                />
                <Bullet
                  text={`Categoria: ${proximaAula.categoria || "Não informada"}`}
                />
                <Bullet text={`Status: ${statusLegivel(proximaAula.status)}`} />
              </View>
            </>
          ) : (
            <Text style={styles.panelText}>
              Você ainda não possui aula confirmada no sistema.
            </Text>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Prova prática</Text>
          <Text style={styles.panelText}>
            Status atual: {statusProvaPraticaLegivel(perfilAluno?.provaPraticaStatus)}
          </Text>
          <View style={styles.list}>
            <Bullet text="A solicitação é feita direto no WhatsApp da autoescola." />
            <Bullet text="Use o botão apenas quando estiver pronto para a prova." />
          </View>
          <Pressable style={styles.primaryButton} onPress={handleSolicitarProva}>
            <Text style={styles.primaryButtonText}>Solicitar prova prática</Text>
          </Pressable>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => abrirWhatsApp("lembrete")}
          >
            <Text style={styles.primaryButtonText}>Falar no WhatsApp</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => abrirWhatsApp("remarcacao")}
          >
            <Text style={styles.secondaryButtonText}>Pedir remarcação</Text>
          </Pressable>
        </View>
      </>
    );
  }

  function renderPerfil() {
    return (
      <>
        {renderHero()}
        {renderSaldoCards()}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Perfil do aluno</Text>
          <View style={styles.list}>
            <Bullet text={`Nome completo: ${perfilAluno?.nome || "Não informado"}`} />
            <Bullet text={`CPF: ${perfilAluno?.cpf || "Não informado"}`} />
            <Bullet
              text={`Telefone: ${perfilAluno?.telefone || "Não informado"}`}
            />
            <Bullet
              text={`Formação: ${perfilAluno?.tipoFormacao || "Não informada"}`}
            />
            <Bullet
              text={`Prova prática: ${statusProvaPraticaLegivel(
                perfilAluno?.provaPraticaStatus
              )}`}
            />
          </View>
        </View>
        <Pressable style={styles.ghostButton} onPress={onLogout}>
          <Text style={styles.ghostButtonText}>Sair da conta</Text>
        </Pressable>
      </>
    );
  }

  function renderConteudo() {
    if (abaAtiva === "agendar") return renderAgendarPanel();
    if (abaAtiva === "aulas") return renderAulasPanel();
    if (abaAtiva === "perfil") return renderPerfil();
    return renderInicio();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionIntro()}
        {renderConteudo()}

        {carregandoPerfil ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Atualizando perfil...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.tabBar}>
        {TAB_ITEMS.map((aba) => (
          <Pressable
            key={aba.id}
            style={[
              styles.tabBarItem,
              abaAtiva === aba.id && styles.tabBarItemActive,
            ]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <View
              style={[
                styles.tabIconShell,
                abaAtiva === aba.id && styles.tabIconShellActive,
              ]}
            >
              <MaterialCommunityIcons
                name={aba.icon}
                size={20}
                color={abaAtiva === aba.id ? colors.white : colors.primary}
              />
            </View>
            <Text
              style={[
                styles.tabBarLabel,
                abaAtiva === aba.id && styles.tabBarLabelActive,
              ]}
            >
              {aba.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          label === "CPF" && { fontSize: 18, lineHeight: 24 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Bullet({ text }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <View style={styles.miniInfoCard}>
      <Text style={styles.miniInfoLabel}>{label}</Text>
      <Text style={styles.miniInfoValue}>{value}</Text>
    </View>
  );
}

function obterHorariosInstrutorPorData(instrutor, dia, disponibilidadesInstrutores) {
  if (!instrutor || !dia) return [];

  if (instrutor.categoria !== "MOTO") {
    return [...instrutor.horarios].sort(compararHorarios);
  }

  const disponibilidade = disponibilidadesInstrutores.find(
    (item) => item.instrutor === instrutor.nome && item.dia === dia
  );

  return [...(disponibilidade?.horarios || [])].sort(compararHorarios);
}

function traduzirErroAgendamento(mensagem = "") {
  if (mensagem.includes("Por segurança, aguarde")) {
    return mensagem;
  }

  if (mensagem.includes("acabou de ser reservado")) {
    return "Esse horário acabou de ser reservado. Escolha outro.";
  }

  if (mensagem.includes("não faz parte da sua formação")) {
    return "Esse tipo de aula não faz parte da sua formação.";
  }

  if (mensagem.includes("segunda a sexta")) {
    return mensagem;
  }

  if (mensagem.includes("uma aula confirmada nesse dia")) {
    return "Você já possui uma aula confirmada nesse dia.";
  }

  if (mensagem.includes("Saldo insuficiente")) {
    return "Seu saldo atual não cobre esse tipo de aula.";
  }

  if (mensagem.includes("Aluno inativo")) {
    return "Seu cadastro está inativo. Fale com a autoescola.";
  }

  if (mensagem.includes("Limite semanal excedido")) {
    return "Você já possui 3 dias confirmados nessa semana. Escolha outra semana.";
  }

  return "Tente novamente em instantes.";
}

function statusProvaPraticaLegivel(status) {
  if (status === "marcada") return "Marcada";
  if (status === "solicitada") return "Solicitada";
  return "Não solicitada";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 124,
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  heroGlowLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -70,
    right: -40,
  },
  heroGlowSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -20,
  },
  logoShell: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  logo: {
    width: "100%",
    height: 68,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  locationPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  locationPillText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 24,
  },
  sectionIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,253,247,0.88)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  sectionIntroIcon: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  sectionIntroContent: {
    flex: 1,
  },
  sectionIntroEyebrow: {
    color: colors.primarySoft,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionIntroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionIntroDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  grid: {
    gap: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  creditRequestCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  creditRequestTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  creditRequestText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 14,
    lineHeight: 21,
  },
  creditRequestButton: {
    marginTop: spacing.xs,
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  creditRequestButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  panelText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  datePickerButton: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(51,71,29,0.08)",
    marginBottom: spacing.md,
  },
  warningBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  weekRuleText: {
    color: colors.primarySoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  datePickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  datePickerValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  datePickerSubvalue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  datePickerHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  datePickerShell: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  datePickerDone: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  datePickerDoneText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  optionList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bookingStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  miniInfoCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  miniInfoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  miniInfoValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  optionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  optionCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  optionTitleActive: {
    color: colors.white,
  },
  optionMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  optionMetaActive: {
    color: "rgba(255,255,255,0.82)",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  slotCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  slotCardActive: {
    backgroundColor: colors.primary,
  },
  slotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  slotTextActive: {
    color: colors.white,
  },
  bookingHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(51,71,29,0.08)",
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  summaryLine: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  list: {
    gap: spacing.sm,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bulletDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  bulletText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(51,71,29,0.08)",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  ghostButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  ghostButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
  },
  lessonList: {
    gap: spacing.md,
  },
  lessonSections: {
    gap: spacing.xl,
  },
  lessonSection: {
    gap: spacing.md,
  },
  lessonSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lessonSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  lessonSectionCount: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  lessonSectionCountText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  lessonSectionCountMuted: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  lessonSectionCountMutedText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyLessonState: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(51,71,29,0.08)",
    gap: spacing.xs,
  },
  emptyLessonTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  emptyLessonText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  lessonCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lessonCardHighlight: {
    borderColor: "rgba(51,71,29,0.18)",
    backgroundColor: "#fbfcf6",
  },
  cancelLessonButton: {
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(51,71,29,0.14)",
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelLessonButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  lessonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  lessonDate: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  lessonMeta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadgeHighlight: {
    backgroundColor: colors.primary,
  },
  statusBadgeTextHighlight: {
    color: colors.white,
  },
  statusBadgeMuted: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusBadgeMutedText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  loadingRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  tabBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    backgroundColor: "rgba(255,253,247,0.96)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  tabBarItemActive: {
    backgroundColor: "rgba(219,227,198,0.58)",
  },
  tabIconShell: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(51,71,29,0.08)",
  },
  tabIconShellActive: {
    backgroundColor: colors.primary,
  },
  tabBarLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabBarLabelActive: {
    color: colors.primary,
  },
});
