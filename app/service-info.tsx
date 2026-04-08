import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { CARD_RADIUS, SCREEN_PADDING_H } from "@/constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API } from "@/lib/api-endpoints";

interface ServiceConfig {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  benefits: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
  color: string;
}

const SERVICE_MAP: Record<string, ServiceConfig> = {
  carReport: {
    icon: "document-text",
    title: "Проверка по VIN",
    description: "Полная проверка истории автомобиля по VIN-номеру. Узнайте реальный пробег, историю ДТП, количество владельцев, наличие залогов и ограничений перед покупкой.",
    benefits: [
      { icon: "shield-checkmark-outline", text: "Проверка на угон и залог" },
      { icon: "speedometer-outline", text: "Реальный пробег авто" },
      { icon: "car-outline", text: "История ДТП и ремонтов" },
      { icon: "people-outline", text: "Количество владельцев" },
      { icon: "globe-outline", text: "История по базам Армении и СНГ" },
    ],
    color: "#3B82F6",
  },
  photo: {
    icon: "camera",
    title: "Профессиональная съёмка",
    description: "Студийная фото- и видеосъёмка вашего автомобиля. Качественные фотографии увеличивают количество просмотров объявления в 3-5 раз и ускоряют продажу.",
    benefits: [
      { icon: "images-outline", text: "До 30 профессиональных фото" },
      { icon: "videocam-outline", text: "Видеообзор 360°" },
      { icon: "color-wand-outline", text: "Профессиональная обработка" },
      { icon: "time-outline", text: "Готовность за 24 часа" },
      { icon: "trending-up-outline", text: "Больше просмотров объявления" },
    ],
    color: "#8B5CF6",
  },
  inspect: {
    icon: "search",
    title: "Осмотр автомобиля",
    description: "Независимый технический осмотр автомобиля перед покупкой. Наши эксперты проверят техническое состояние, кузов, двигатель, ходовую часть и электронику.",
    benefits: [
      { icon: "build-outline", text: "Проверка 150+ узлов и систем" },
      { icon: "body-outline", text: "Толщиномер кузова" },
      { icon: "hardware-chip-outline", text: "Компьютерная диагностика" },
      { icon: "document-text-outline", text: "Подробный отчёт" },
      { icon: "checkmark-circle-outline", text: "Гарантия независимости" },
    ],
    color: "#10B981",
  },
  ads: {
    icon: "megaphone",
    title: "Реклама",
    description: "Продвижение вашего автомобиля или автосалона. Размещение рекламы на платформе, таргетированная реклама в социальных сетях и контекстная реклама.",
    benefits: [
      { icon: "trending-up-outline", text: "Увеличение охвата аудитории" },
      { icon: "people-outline", text: "Таргетинг на целевых покупателей" },
      { icon: "bar-chart-outline", text: "Детальная аналитика" },
      { icon: "flash-outline", text: "Быстрый запуск кампании" },
      { icon: "wallet-outline", text: "Гибкие бюджеты" },
    ],
    color: "#F59E0B",
  },
  sto: {
    icon: "construct",
    title: "СТО — Сервис и ремонт",
    description: "Запись на техническое обслуживание и ремонт в проверенные автосервисы. Выбирайте СТО по рейтингу, специализации и отзывам реальных клиентов.",
    benefits: [
      { icon: "star-outline", text: "Проверенные автосервисы" },
      { icon: "pricetag-outline", text: "Прозрачные цены" },
      { icon: "calendar-outline", text: "Онлайн-запись" },
      { icon: "shield-checkmark-outline", text: "Гарантия на работы" },
      { icon: "chatbubble-outline", text: "Отзывы реальных клиентов" },
    ],
    color: "#EF4444",
  },
  parts: {
    icon: "cog",
    title: "Запчасти",
    description: "Поиск и заказ автозапчастей. Оригинальные и аналоговые запчасти с доставкой по Армении. Сравнение цен от разных поставщиков.",
    benefits: [
      { icon: "search-outline", text: "Поиск по каталогу и VIN" },
      { icon: "swap-horizontal-outline", text: "Оригинал и аналоги" },
      { icon: "car-outline", text: "Доставка по Армении" },
      { icon: "pricetag-outline", text: "Сравнение цен" },
      { icon: "shield-checkmark-outline", text: "Гарантия качества" },
    ],
    color: "#6366F1",
  },
  rental: {
    icon: "key",
    title: "Аренда автомобилей",
    description: "Аренда автомобилей на любой срок — от нескольких часов до нескольких месяцев. Широкий выбор автомобилей от эконом до премиум класса.",
    benefits: [
      { icon: "time-outline", text: "Почасовая и посуточная аренда" },
      { icon: "car-sport-outline", text: "Авто любого класса" },
      { icon: "location-outline", text: "Доставка к вам" },
      { icon: "card-outline", text: "Простое оформление" },
      { icon: "shield-outline", text: "Полная страховка" },
    ],
    color: "#14B8A6",
  },
};

export default function ServiceInfoScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const service = key ? SERVICE_MAP[key] : null;

  const interestsQuery = useQuery<{ keys: string[] }>({
    queryKey: [API.serviceInterests.list],
    enabled: isAuthenticated,
  });

  const isSubscribed = interestsQuery.data?.keys?.includes(key || "") ?? false;

  const subscribeMutation = useMutation({
    mutationFn: async () => apiRequest("POST", API.serviceInterests.list, { serviceKey: key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.serviceInterests.list] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", API.serviceInterests.toggle(key)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.serviceInterests.list] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  }, [isAuthenticated, isSubscribed, subscribeMutation, unsubscribeMutation]);

  if (!service) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface, alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen options={{ title: "Сервис" }} />
        <Text style={{ color: colors.textSecondary }}>Сервис не найден</Text>
      </View>
    );
  }

  const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen options={{ title: service.title, headerBackTitle: "Назад" }} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[styles.heroCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <View style={[styles.iconCircle, { backgroundColor: service.color + "18" }]}>
            <Ionicons name={service.icon} size={44} color={service.color} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{service.title}</Text>
          <View style={[styles.comingSoonBadge, { backgroundColor: isDark ? "rgba(255,159,10,0.15)" : "#FEF3C7" }]}>
            <Ionicons name="time-outline" size={14} color={isDark ? "#FF9F0A" : "#F59E0B"} />
            <Text style={[styles.comingSoonText, { color: isDark ? "#FFD60A" : "#D97706" }]}>Скоро</Text>
          </View>
          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{service.description}</Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>Что вы получите</Text>
          {service.benefits.map((b, i) => (
            <View key={i} style={[styles.benefitRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.benefitIcon, { backgroundColor: service.color + "14" }]}>
                <Ionicons name={b.icon} size={20} color={service.color} />
              </View>
              <Text style={[styles.benefitText, { color: colors.text }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleToggle}
          disabled={isPending}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              backgroundColor: isSubscribed ? colors.surface : service.color,
              borderWidth: isSubscribed ? 1.5 : 0,
              borderColor: isSubscribed ? service.color : "transparent",
              opacity: isPending ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons
            name={isSubscribed ? "checkmark-circle" : "notifications-outline"}
            size={22}
            color={isSubscribed ? service.color : "#fff"}
          />
          <Text style={[styles.ctaText, { color: isSubscribed ? service.color : "#fff" }]}>
            {isSubscribed ? "Вы будете уведомлены" : "Уведомить о запуске"}
          </Text>
        </Pressable>

        {isSubscribed && (
          <Text style={[styles.subscribedHint, { color: colors.textTertiary }]}>
            Мы отправим вам уведомление, когда сервис станет доступен
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SCREEN_PADDING_H,
    gap: 14,
  },
  heroCard: {
    borderRadius: CARD_RADIUS,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    textAlign: "center",
    marginBottom: 8,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#D97706",
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  benefitsCard: {
    borderRadius: CARD_RADIUS,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    marginBottom: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 15,
    fontWeight: "500" as const,
    flex: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  subscribedHint: {
    fontSize: 13,
    textAlign: "center",
    marginTop: -4,
  },
});
