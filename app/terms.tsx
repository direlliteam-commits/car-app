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

export default function TermsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

const sections = [
  {
    title: t("terms.section1Title"),
    content: t("terms.section1Content"),
  },
  {
    title: t("terms.section2Title"),
    content: t("terms.section2Content"),
  },
  {
    title: t("terms.section3Title"),
    content: t("terms.section3Content"),
  },
  {
    title: t("terms.section4Title"),
    content: t("terms.section4Content"),
  },
  {
    title: t("terms.section5Title"),
    content: t("terms.section5Content"),
  },
  {
    title: t("terms.section6Title"),
    content: t("terms.section6Content"),
  },
  {
    title: t("terms.section7Title"),
    content: t("terms.section7Content"),
  },
  {
    title: t("terms.section8Title"),
    content: t("terms.section8Content"),
  },
  {
    title: t("terms.section9Title"),
    content: t("terms.section9Content"),
  },
  {
    title: t("terms.section10Title"),
    content: t("terms.section10Content"),
  },
  {
    title: t("terms.section11Title"),
    content: t("terms.section11Content"),
  },
  {
    title: t("terms.section12Title"),
    content: t("terms.section12Content"),
  },
  {
    title: t("terms.section13Title"),
    content: t("terms.section13Content"),
  },
  {
    title: t("terms.section14Title"),
    content: t("terms.section14Content"),
  },
  {
    title: t("terms.section15Title"),
    content: t("terms.section15Content"),
  },
  {
    title: t("terms.section16Title"),
    content: t("terms.section16Content"),
  },
  {
    title: t("terms.section17Title"),
    content: t("terms.section17Content"),
  },
];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScreenHeader title={t("terms.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
            {t("terms.effectiveDate")}{"\n"}{t("terms.lastUpdated")}
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
