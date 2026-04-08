import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
} from "react-native-reanimated";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/lib/i18n";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "armauto_onboarding_completed";

interface OnboardingStep {
  icon?: keyof typeof Ionicons.glyphMap;
  image?: any;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle: string;
}

export default function WelcomeScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const webTopInset = WEB_TOP_INSET;
  const displayName = user?.name || user?.username || user?.phone || "";

  const STEPS: OnboardingStep[] = [
    {
      image: require("@/assets/images/onboarding-search-car.png"),
      iconColor: "#007AFF",
      iconBg: "#007AFF15",
      title: t("welcome.step1Title"),
      subtitle: t("welcome.step1Subtitle"),
    },
    {
      image: require("@/assets/images/onboarding-find-car.png"),
      iconColor: "#34C759",
      iconBg: "#34C75915",
      title: t("welcome.step2Title"),
      subtitle: t("welcome.step2Subtitle"),
    },
    {
      image: require("@/assets/images/onboarding-chat.png"),
      iconColor: "#FF9500",
      iconBg: "#FF950015",
      title: t("welcome.step3Title"),
      subtitle: t("welcome.step3Subtitle"),
    },
  ];

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.stepContainer, { width: SCREEN_WIDTH }]}>
      {item.image ? (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={item.image}
            style={styles.stepImage}
            contentFit="contain"
          />
        </View>
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon!} size={48} color={item.iconColor} />
        </View>
      )}
      <Text style={[styles.stepTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 20 }]} />

      <Animated.View entering={FadeIn.duration(500)} style={styles.greetingSection}>
        <ExpoImage
          source={isDark ? require("@/assets/images/armcars-logo-dark.png") : require("@/assets/images/armcars-logo.png")}
          style={styles.welcomeLogo}
          contentFit="contain"
        />
        <Text style={[styles.greetingTitle, { color: colors.text }]}>
          {displayName ? `${displayName}, ${t("welcome.greeting")}` : t("welcome.greeting")}
        </Text>
        <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
          {t("welcome.greetingSubtitle")}
        </Text>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderStep}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.carousel}
        scrollEventThrottle={16}
      />

      <View style={styles.dotsContainer}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? colors.primary : colors.border,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={[styles.nextButtonText, { color: colors.textInverse }]}>
            {currentIndex === STEPS.length - 1 ? t("welcome.getStarted") : t("welcome.next")}
          </Text>
          <Ionicons
            name={currentIndex === STEPS.length - 1 ? "checkmark" : "arrow-forward"}
            size={20}
            color={colors.textInverse}
          />
        </Pressable>

        {currentIndex === STEPS.length - 1 ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                AsyncStorage.setItem(ONBOARDING_KEY, "true");
                router.replace("/edit-profile");
              }}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name={I.person} size={18} color={colors.text} />
              <Text style={[styles.profileButtonText, { color: colors.text }]}>
                {t("welcome.fillProfile")}
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipBtnBottom, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t("welcome.skip")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    minHeight: 44,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Nunito_500Medium",
  },
  skipBtnBottom: {
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  greetingSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  welcomeLogo: {
    width: SCREEN_WIDTH * 0.55,
    height: (SCREEN_WIDTH * 0.55) * (104 / 631),
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 28,
    fontFamily: "Nunito_700Bold",
    lineHeight: 34,
    marginBottom: 8,
    textAlign: "center",
  },
  greetingSubtitle: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    lineHeight: 22,
    textAlign: "center",
  },
  carousel: {
    flexGrow: 0,
    marginTop: 8,
  },
  stepContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepImage: {
    width: 200,
    height: 200,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Nunito_700Bold",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: "auto",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: CARD_RADIUS,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    gap: 8,
  },
  profileButtonText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
  },
});
