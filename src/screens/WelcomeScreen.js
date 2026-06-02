import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { highlights, quickActions } from "../constants/appContent";

const logoHeader = require("../../assets/logo-jardim-botanico-header.png");
const simboloMarca = require("../../assets/simbolo-jardim-botanico.png");

export default function WelcomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Image
          source={logoHeader}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Aplicativo do aluno</Text>
        </View>

        <Text style={styles.title}>Sua jornada na autoescola, agora no celular.</Text>
        <Text style={styles.description}>
          Estamos preparando uma experiência mobile para acompanhar aulas,
          créditos, prova prática e contato com a equipe de forma mais simples.
        </Text>

        <View style={styles.firebasePill}>
          <View style={styles.firebaseDot} />
          <Text style={styles.firebaseText}>Firebase conectado e pronto para login</Text>
        </View>

        <View style={styles.ctaGroup}>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Entrar com CPF</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Conhecer o app</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewEyebrow}>Visão inicial</Text>
            <Text style={styles.previewTitle}>Um app leve, claro e direto.</Text>
          </View>
          <Image source={simboloMarca} style={styles.symbol} resizeMode="contain" />
        </View>

        <View style={styles.highlightsList}>
          {highlights.map((item) => (
            <View key={item} style={styles.highlightRow}>
              <View style={styles.highlightDot} />
              <Text style={styles.highlightText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>Próximas etapas</Text>
        <Text style={styles.sectionTitle}>Base pronta para o desenvolvimento.</Text>
      </View>

      {quickActions.map((item) => (
        <View key={item.title} style={styles.actionCard}>
          <Text style={styles.actionEyebrow}>{item.eyebrow}</Text>
          <Text style={styles.actionTitle}>{item.title}</Text>
          <Text style={styles.actionDescription}>{item.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  heroGlow: {
    position: "absolute",
    top: -64,
    right: -32,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  logo: {
    width: 228,
    height: 72,
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    lineHeight: 25,
    marginBottom: spacing.xl,
  },
  ctaGroup: {
    gap: spacing.sm,
  },
  firebasePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  firebaseDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#7ff08f",
  },
  firebaseText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  previewEyebrow: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    maxWidth: 220,
  },
  symbol: {
    width: 58,
    height: 58,
  },
  highlightsList: {
    gap: spacing.md,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  highlightDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  highlightText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    flex: 1,
  },
  sectionHeader: {
    gap: 6,
    paddingTop: spacing.sm,
  },
  sectionEyebrow: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionEyebrow: {
    color: colors.primarySoft,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
});
