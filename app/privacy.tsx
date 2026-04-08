import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useColors } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "@/lib/i18n";
import { CARD_RADIUS, WEB_TOP_INSET } from "@/constants/layout";

export default function PrivacyScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const sections = [
    { title: t("privacy.section1Title"), content: t("privacy.section1Content") },
    { title: t("privacy.section2Title"), content: t("privacy.section2Content") },
    { title: t("privacy.section3Title"), content: t("privacy.section3Content") },
    { title: t("privacy.section4Title"), content: t("privacy.section4Content") },
    { title: t("privacy.section5Title"), content: t("privacy.section5Content") },
    { title: t("privacy.section6Title"), content: t("privacy.section6Content") },
    { title: t("privacy.section7Title"), content: t("privacy.section7Content") },
    { title: t("privacy.section8Title"), content: t("privacy.section8Content") },
    { title: t("privacy.section9Title"), content: t("privacy.section9Content") },
    { title: t("privacy.section10Title"), content: t("privacy.section10Content") },
    { title: t("privacy.section11Title"), content: t("privacy.section11Content") },
    { title: t("privacy.section12Title"), content: t("privacy.section12Content") },
    { title: t("privacy.section13Title"), content: t("privacy.section13Content") },
    { title: t("privacy.section14Title"), content: t("privacy.section14Content") },
    { title: t("privacy.section15Title"), content: t("privacy.section15Content") },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader title={t("privacy.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
            {t("privacy.effectiveDate")}{"\n"}{t("privacy.lastUpdated")}
          </Text>
        </Animated.View>

        {sections.map((section, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.duration(400).delay(80 + index * 30)}
          >
            <View style={[styles.sectionCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {section.content}
              </Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, gap: 10 },
  lastUpdated: { fontSize: 12, textAlign: "center", marginVertical: 8, lineHeight: 18 },
  sectionCard: { borderRadius: CARD_RADIUS, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionContent: { fontSize: 14, lineHeight: 21 },
});
