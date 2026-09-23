import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { cadastrarAlunoComCPF, entrarAlunoComCPF } from "../services/alunoAuth";
import { formatarCPF, normalizarCPF } from "../utils/cpf";
import { colors, radius, spacing } from "../theme/tokens";

const logoHeader = require("../../assets/logo-jardim-botanico-mobile.png");

export default function AuthScreen() {
  const [modo, setModo] = useState("login");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoFormacao, setTipoFormacao] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const titulo = useMemo(
    () =>
      modo === "login"
        ? "Entre com seu CPF"
        : "Crie seu acesso ao aplicativo",
    [modo]
  );

  const descricao = useMemo(
    () =>
      modo === "login"
        ? "Acompanhe aulas, créditos e solicitações em um ambiente simples e seguro."
        : "Seu cadastro será vinculado ao mesmo sistema da autoescola para acompanhar sua jornada.",
    [modo]
  );

  function validarCampos() {
    if (modo === "cadastro" && !nome.trim()) {
      Alert.alert("Nome obrigatório", "Preencha seu nome para continuar.");
      return false;
    }

    if (normalizarCPF(cpf).length !== 11) {
      Alert.alert("CPF inválido", "Digite um CPF válido para continuar.");
      return false;
    }

    if (modo === "cadastro" && !telefone.trim()) {
      Alert.alert("Telefone obrigatório", "Informe seu telefone para continuar.");
      return false;
    }

    if (modo === "cadastro" && !tipoFormacao) {
      Alert.alert("Formação obrigatória", "Escolha o tipo de formação.");
      return false;
    }

    if (senha.trim().length < 6) {
      Alert.alert(
        "Senha muito curta",
        "Use uma senha com pelo menos 6 caracteres."
      );
      return false;
    }

    if (modo === "cadastro" && senha !== confirmacaoSenha) {
      Alert.alert("Senhas diferentes", "Confira a confirmação de senha.");
      return false;
    }

    if (modo === "cadastro" && !aceitouPrivacidade) {
      Alert.alert(
        "Política de Privacidade",
        "É necessário aceitar a Política de Privacidade para criar a conta."
      );
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validarCampos()) return;

    try {
      setCarregando(true);

      if (modo === "login") {
        await entrarAlunoComCPF(cpf, senha);
      } else {
        await cadastrarAlunoComCPF({
          nome: nome.trim(),
          cpf,
          telefone: telefone.trim(),
          email,
          tipoFormacao,
          senha,
        });
      }
    } catch (error) {
      Alert.alert(
        "Não foi possível continuar",
        traduzirErroAuth(error?.code, modo)
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoShell}>
            <Image source={logoHeader} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Portal do aluno</Text>
          </View>
          <View style={styles.locationPill}>
            <Text style={styles.locationPillText}>
              Jardim Botânico Shopping • Brasília
            </Text>
          </View>
          <Text style={styles.title}>{titulo}</Text>
          <Text style={styles.description}>{descricao}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, modo === "login" && styles.tabActive]}
              onPress={() => setModo("login")}
            >
              <Text
                style={[
                  styles.tabText,
                  modo === "login" && styles.tabTextActive,
                ]}
              >
                Entrar
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, modo === "cadastro" && styles.tabActive]}
              onPress={() => setModo("cadastro")}
            >
              <Text
                style={[
                  styles.tabText,
                  modo === "cadastro" && styles.tabTextActive,
                ]}
              >
                Cadastrar
              </Text>
            </Pressable>
          </View>

          {modo === "cadastro" ? (
            <Field
              label="Nome completo"
              value={nome}
              onChangeText={setNome}
              placeholder="Digite seu nome"
            />
          ) : null}

          <Field
            label="CPF"
            value={cpf}
            onChangeText={(value) => setCpf(formatarCPF(value))}
            placeholder="000.000.000-00"
            keyboardType="numeric"
          />

          {modo === "cadastro" ? (
            <Field
              label="Telefone"
              value={telefone}
              onChangeText={setTelefone}
              placeholder="(61) 99999-9999"
              keyboardType="phone-pad"
            />
          ) : null}

          {modo === "cadastro" ? (
            <Field
              label="E-mail para contato (opcional)"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
            />
          ) : null}

          {modo === "cadastro" ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tipo de formação</Text>
              <View style={styles.trainingOptions}>
                {["Carro e moto", "Apenas carro", "Apenas moto"].map(
                  (opcao) => (
                    <Pressable
                      key={opcao}
                      style={[
                        styles.trainingOption,
                        tipoFormacao === opcao && styles.trainingOptionActive,
                      ]}
                      onPress={() => setTipoFormacao(opcao)}
                    >
                      <Text
                        style={[
                          styles.trainingOptionText,
                          tipoFormacao === opcao &&
                            styles.trainingOptionTextActive,
                        ]}
                      >
                        {opcao}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          ) : null}

          <Field
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            secureTextEntry
          />

          {modo === "cadastro" ? (
            <Field
              label="Confirmar senha"
              value={confirmacaoSenha}
              onChangeText={setConfirmacaoSenha}
              placeholder="Digite a senha novamente"
              secureTextEntry
            />
          ) : null}

          {modo === "cadastro" ? (
            <View style={styles.privacyRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aceitouPrivacidade }}
                style={[
                  styles.checkbox,
                  aceitouPrivacidade && styles.checkboxChecked,
                ]}
                onPress={() => setAceitouPrivacidade((atual) => !atual)}
              >
                {aceitouPrivacidade ? (
                  <Text style={styles.checkboxIcon}>✓</Text>
                ) : null}
              </Pressable>
              <Text style={styles.privacyText}>
                Li e concordo com a{" "}
                <Text
                  style={styles.privacyLink}
                  onPress={() =>
                    Linking.openURL(
                      "https://www.autoescolajardimbotanico.com.br/privacidade"
                    )
                  }
                >
                  Política de Privacidade
                </Text>
                .
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, carregando && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>
                {modo === "login" ? "Entrar no app" : "Criar conta"}
              </Text>
            )}
          </Pressable>

          <Text style={styles.helper}>
            No primeiro acesso, os créditos continuam sendo liberados pela autoescola.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function traduzirErroAuth(codigo, modo) {
  if (codigo === "auth/invalid-credential") {
    return "CPF ou senha inválidos.";
  }

  if (codigo === "auth/email-already-in-use") {
    return "Esse CPF já possui cadastro no aplicativo.";
  }

  if (codigo === "auth/network-request-failed") {
    return "Verifique sua internet e tente novamente.";
  }

  if (codigo === "auth/weak-password") {
    return "Use uma senha mais forte, com pelo menos 6 caracteres.";
  }

  return modo === "login"
    ? "Não foi possível entrar agora."
    : "Não foi possível concluir o cadastro agora.";
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  logo: {
    width: "100%",
    height: 70,
  },
  logoShell: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.white,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16,
  },
  trainingOptions: {
    gap: spacing.sm,
  },
  trainingOption: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  trainingOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trainingOptionText: {
    color: colors.text,
    fontWeight: "700",
  },
  trainingOptionTextActive: {
    color: colors.white,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxIcon: {
    color: colors.white,
    fontWeight: "800",
  },
  privacyText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  privacyLink: {
    color: colors.primary,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
