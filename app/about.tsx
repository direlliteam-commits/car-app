import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Icon, IconName } from "@/components/Icon";
import { useColors } from "@/constants/colors";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";

export default function AboutScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const features: { icon: IconName; title: string; description: string }[] = [
    { icon: "search", title: t("about.feature1Title"), description: t("about.feature1Desc") },
    { icon: "star", title: t("about.feature2Title"), description: t("about.feature2Desc") },
    { icon: "chatbubble", title: t("about.feature3Title"), description: t("about.feature3Desc") },
    { icon: "notifications", title: t("about.feature4Title"), description: t("about.feature4Desc") },
    { icon: "shield", title: t("about.feature5Title"), description: t("about.feature5Desc") },
    { icon: "market-analytics", title: t("about.feature6Title"), description: t("about.feature6Desc") },
    { icon: "wallet", title: t("about.feature7Title"), description: t("about.feature7Desc") },
    { icon: "person", title: t("about.feature8Title"), description: t("about.feature8Desc") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader title={t("about.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <View style={[styles.logoCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <View style={[styles.logoContainer, { backgroundColor: colors.text }]}>
              <Icon name="pricetag" size={40} color={colors.background} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>armauto.am</Text>
            <Text style={[styles.appVersion, { color: colors.textSecondary }]}>{t("about.versionInfo")}</Text>
            <Text style={[styles.appTagline, { color: colors.textTertiary }]}>
              {t("about.tagline")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={[styles.descriptionCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {t("about.descriptionFull")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("about.featuresLabel")}</Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureRow, index < features.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <View style={styles.iconWrap}>
                  <Icon name={feature.icon} size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textTertiary }]}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("about.contactsLabel")}</Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/support");
              }}
              style={({ pressed }) => [styles.contactRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.iconWrap}>
                <Icon name="support" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={[styles.contactValue, { color: colors.text }]}>{t("about.supportLabel")}</Text>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{t("about.supportDesc")}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL("mailto:support@armauto.am").catch(() => {});
              }}
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.iconWrap}>
                <Icon name="mail" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={[styles.contactValue, { color: colors.text }]}>{t("about.emailSupportLabel")}</Text>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>support@armauto.am</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(560)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t("about.legalLabel")}</Text>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/terms");
              }}
              style={({ pressed }) => [styles.contactRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.iconWrap}>
                <Icon name="document-text" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={[styles.contactValue, { color: colors.text }]}>{t("about.termsLink")}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/privacy");
              }}
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.iconWrap}>
                <Icon name="shield" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={[styles.contactValue, { color: colors.text }]}>{t("about.privacyLink")}</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(620)}>
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : colors.background, padding: 16, gap: 12, marginTop: 8 }]}>
            <Text style={[styles.companyTitle, { color: colors.text }]}>{t("about.companyTitle")}</Text>
            <Text style={[styles.companyText, { color: colors.textSecondary }]}>
              {t("about.companyDesc")}
            </Text>
            <View style={styles.companyDetails}>
              <View style={styles.companyRow}>
                <Text style={[styles.companyLabel, { color: colors.textTertiary }]}>{t("about.locationLabel")}</Text>
                <Text style={[styles.companyValue, { color: colors.textSecondary }]}>{t("about.locationValue")}</Text>
              </View>
              <View style={[styles.companyDivider, { backgroundColor: colors.border }]} />
              <View style={styles.companyRow}>
                <Text style={[styles.companyLabel, { color: colors.textTertiary }]}>{t("about.emailLabel")}</Text>
                <Text style={[styles.companyValue, { color: colors.textSecondary }]}>info@armauto.am</Text>
              </View>
              <View style={[styles.companyDivider, { backgroundColor: colors.border }]} />
              <View style={styles.companyRow}>
                <Text style={[styles.companyLabel, { color: colors.textTertiary }]}>{t("about.websiteLabel")}</Text>
                <Text style={[styles.companyValue, { color: colors.primary }]}>armauto.am</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(680)}>
          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            {t("about.copyright")}{"\n"}
            {t("about.madeWith")}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: HEADER_CONTENT_PADDING_H, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 12 },
  logoCard: { borderRadius: CARD_RADIUS, padding: 28, alignItems: "center", gap: 6, marginTop: 8 },
  logoContainer: { width: 72, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  appName: { fontSize: 24, fontWeight: "800" },
  appVersion: { fontSize: 14, fontWeight: "500" },
  appTagline: { fontSize: 13, marginTop: 2 },
  descriptionCard: { borderRadius: CARD_RADIUS, padding: 16, marginTop: 8 },
  descriptionText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: {
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 24,
    alignItems: "center",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    gap: 12,
  },
  featureContent: {
    flex: 1,
    gap: 2,
  },
  featureTitle: { fontSize: 15, fontWeight: "600" },
  featureDesc: { fontSize: 13, lineHeight: 18 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  contactContent: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 12 },
  contactValue: { fontSize: 14, fontWeight: "600" },
  companyTitle: { fontSize: 16, fontWeight: "700" },
  companyText: { fontSize: 14, lineHeight: 21 },
  companyDetails: { gap: 0, marginTop: 4 },
  companyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  companyLabel: { fontSize: 13 },
  companyValue: { fontSize: 13, fontWeight: "600" },
  companyDivider: { height: StyleSheet.hairlineWidth },
  copyright: { fontSize: 12, textAlign: "center", marginTop: 24, marginBottom: 8, lineHeight: 18 },
});
