import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Dimensions,
  Animated,
  LayoutChangeEvent,
  GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as Haptics from "expo-haptics";
import { Icon, type IconName } from "@/components/Icon";
import { useAppColorScheme, useTheme, type ThemeMode, type DisplayCurrency } from "@/contexts/ThemeContext";
import { useColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { getAvatarUri } from "@/lib/media";
import { SCREEN_PADDING_H, CARD_RADIUS } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FilterPicker } from "@/components/filters/FilterPicker";

type IoniconsName = keyof typeof Ionicons.glyphMap;

const SCREEN_W = Dimensions.get("window").width;
const GAP = 10;
const COL3 = (SCREEN_W - SCREEN_PADDING_H * 2 - GAP * 2) / 3;
const COL2 = COL3 * 2 + GAP;
const SVC_IMG = {
  journal: require("@/assets/images/svc-journal-3d.png"),
  dealer: require("@/assets/images/svc-dealer-3d.png"),
  pro: require("@/assets/images/svc-pro-3d.png"),
  photo: require("@/assets/images/svc-photo-3d.png"),
  inspect: require("@/assets/images/svc-inspect-3d.png"),
  ads: require("@/assets/images/svc-ads-3d.png"),
  parts: require("@/assets/images/svc-parts-3d.png"),
  sto: require("@/assets/images/svc-sto-3d.png"),
  carReport: require("@/assets/images/svc-report-3d.png"),
  rental: require("@/assets/images/svc-rental-3d.png"),
};

export default function ServicesScreen() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const defaultAvatarSource = useMemo(() => require("@/assets/images/default-avatar.png"), []);
  const tileBg = colors.surface;
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const { themeMode, setThemeMode, language, setLanguage, displayCurrency, setDisplayCurrency } = useTheme();

  const handlePress = useCallback((route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated && ["/pro-seller", "/dealer-apply"].includes(route)) {
      router.push("/auth");
      return;
    }
    (router.push as (href: string) => void)(route);
  }, [isAuthenticated]);

  const avatarUri = user?.role === "dealer" && user?.companyLogoUrl
    ? getAvatarUri(user.companyLogoUrl)
    : user?.avatarUrl ? getAvatarUri(user.avatarUrl) : null;
  const isDealer = user?.role === "dealer";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader
        hideBack
        titleElement={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              (router.push as (href: string) => void)(isAuthenticated ? "/profile" : "/auth");
            }}
            style={({ pressed }) => [
              styles.headerUserCard,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Image source={avatarUri ? { uri: avatarUri } : defaultAvatarSource} style={styles.headerAvatar} />
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {isAuthenticated && user ? (isDealer && user.companyName ? user.companyName : (user.name || user.phone)) : t("profile.guest")}
            </Text>
          </Pressable>
        }
        rightElement={isAuthenticated ? (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePress("/notification-settings"); }}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBell, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name={I.notifications} size={24} color={colors.text} />
          </Pressable>
        ) : undefined}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t("servicesPage.title")}</Text>

        {/* Row 1: Дилер (tall left) + 2×2 small right */}
        <View style={styles.row}>
          <TallTile img={SVC_IMG.dealer} title={t("servicesPage.dealer")} sub={t("servicesPage.dealerSub")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/dealer-apply")} />
          <View style={styles.gridSide}>
            <View style={styles.gridSideRow}>
              <SmallTile img={SVC_IMG.journal} label={t("servicesPage.journal")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/journal")} />
              <SmallTile img={SVC_IMG.carReport} label={t("servicesPage.carReport")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=carReport")} />
            </View>
            <View style={styles.gridSideRow}>
              <SmallTile img={SVC_IMG.photo} label={t("servicesPage.photoshoot")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=photo")} />
              <SmallTile img={SVC_IMG.inspect} label={t("servicesPage.inspection")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=inspect")} />
            </View>
          </View>
        </View>

        {/* Row 2: 2×2 small left + PRO (tall right) */}
        <View style={styles.row}>
          <View style={styles.gridSide}>
            <View style={styles.gridSideRow}>
              <SmallTile img={SVC_IMG.ads} label={t("servicesPage.ads")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=ads")} />
              <SmallTile img={SVC_IMG.sto} label={t("servicesPage.sto")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=sto")} />
            </View>
            <View style={styles.gridSideRow}>
              <SmallTile img={SVC_IMG.parts} label={t("servicesPage.parts")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=parts")} />
              <SmallTile img={SVC_IMG.rental} label={t("servicesPage.rental")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/service-info?key=rental")} />
            </View>
          </View>
          <TallTile img={SVC_IMG.pro} title={t("servicesPage.proSeller")} sub={t("servicesPage.proSellerSub")} colors={colors} tileBg={tileBg} onPress={() => handlePress("/pro-seller")} />
        </View>

        <View style={[styles.menuGroupBlock, { backgroundColor: colors.surface, marginTop: 24 }]}>
          {isAuthenticated && (
            <>
              <MenuRow ionIcon="notifications-outline" label={t("servicesPage.notificationSettings")} colors={colors} onPress={() => handlePress("/notification-settings")} grouped />
              <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
              <MenuRow ionIcon="wallet-outline" label={t("wallet.title")} colors={colors} onPress={() => handlePress("/wallet")} grouped />
              <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
              {(user?.role === "dealer" || user?.role === "pro_seller") && (
                <>
                  <MenuRow ionIcon="call-outline" label="Обратные звонки" colors={colors} onPress={() => handlePress("/callback-requests")} grouped />
                  <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
                </>
              )}
            </>
          )}
          <MenuRow ionIcon="color-palette-outline" label={t("servicesPage.themeSettings")} colors={colors} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setThemePickerVisible(true); }} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow ionIcon="cash-outline" label={t("servicesPage.currencySettings")} colors={colors} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrencyPickerVisible(true); }} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow ionIcon="language-outline" label={t("servicesPage.languageSettings")} colors={colors} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLangPickerVisible(true); }} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow ionIcon="help-circle-outline" label={t("servicesPage.faq")} colors={colors} onPress={() => handlePress("/support")} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow label={t("servicesPage.aboutApp")} colors={colors} onPress={() => handlePress("/about")} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow label={t("servicesPage.terms")} colors={colors} onPress={() => handlePress("/terms")} grouped />
          <View style={[styles.menuDivider, { backgroundColor: colors.background }]} />
          <MenuRow label={t("servicesPage.privacy")} colors={colors} onPress={() => handlePress("/privacy")} grouped />
        </View>
      </ScrollView>

      <FilterPicker visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} title={t("servicesPage.themePickerTitle")}>
        <View style={styles.themeOptions}>
          {([
            { mode: "system" as ThemeMode, label: t("servicesPage.themeSystem"), lightBg: "#F2F2F2", darkBg: "#1A1A1C", blockColor: "", barColor: "" },
            { mode: "dark" as ThemeMode, label: t("servicesPage.themeDark"), lightBg: "#2C2C2E", darkBg: "#1A1A1C", blockColor: "#38383A", barColor: "#48484A" },
            { mode: "light" as ThemeMode, label: t("servicesPage.themeLight"), lightBg: "#F2F2F2", darkBg: "#F2F2F2", blockColor: "#E0E0E0", barColor: "#D0D0D0" },
          ]).map((opt) => {
            const selected = themeMode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                style={styles.themeOptionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setThemeMode(opt.mode);
                  setTimeout(() => setThemePickerVisible(false), 300);
                }}
              >
                {opt.mode === "system" ? (
                  <View style={[styles.themePreview, selected && { borderColor: colors.text, borderWidth: 2 }]}>
                    <View style={{ flex: 1, flexDirection: "row", borderRadius: 10, overflow: "hidden" }}>
                      <View style={{ flex: 1, backgroundColor: "#F2F2F2", padding: 6, gap: 4 }}>
                        <View style={{ flexDirection: "row", gap: 3 }}>
                          <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: "#E0E0E0" }} />
                          <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: "#E0E0E0" }} />
                        </View>
                        <View style={{ height: 20, borderRadius: 3, backgroundColor: "#D0D0D0" }} />
                      </View>
                      <View style={{ flex: 1, backgroundColor: "#1A1A1C", padding: 6, gap: 4 }}>
                        <View style={{ flexDirection: "row", gap: 3 }}>
                          <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: "#38383A" }} />
                          <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: "#38383A" }} />
                        </View>
                        <View style={{ height: 20, borderRadius: 3, backgroundColor: "#48484A" }} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.themePreview, { backgroundColor: opt.lightBg }, selected && { borderColor: colors.text, borderWidth: 2 }]}>
                    <View style={{ flex: 1, padding: 6, gap: 4 }}>
                      <View style={{ flexDirection: "row", gap: 3 }}>
                        <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: opt.blockColor }} />
                        <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: opt.blockColor }} />
                      </View>
                      <View style={{ flexDirection: "row", gap: 3 }}>
                        <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: opt.blockColor }} />
                        <View style={{ flex: 1, height: 14, borderRadius: 3, backgroundColor: opt.blockColor }} />
                      </View>
                      <View style={{ height: 20, borderRadius: 3, backgroundColor: opt.barColor }} />
                    </View>
                  </View>
                )}
                <Text style={[styles.themeOptionLabel, { color: colors.text }]}>{opt.label}</Text>
                <View style={[styles.themeRadio, { borderColor: selected ? colors.text : colors.border }]}>
                  {selected && <View style={[styles.themeRadioDot, { backgroundColor: colors.text }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </FilterPicker>

      <FilterPicker visible={langPickerVisible} onClose={() => setLangPickerVisible(false)} title={t("servicesPage.langPickerTitle")}>
        <View style={styles.langOptions}>
          {([
            { code: "hy" as const, label: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576", flag: "\u{1F1E6}\u{1F1F2}" },
            { code: "ru" as const, label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", flag: "\u{1F1F7}\u{1F1FA}" },
            { code: "en" as const, label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
          ]).map((opt) => {
            const selected = language === opt.code;
            return (
              <Pressable
                key={opt.code}
                style={[styles.langOptionItem, { backgroundColor: colors.background, borderColor: selected ? colors.text : colors.border, borderWidth: selected ? 2 : 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage(opt.code);
                  setTimeout(() => setLangPickerVisible(false), 300);
                }}
              >
                <Text style={styles.langFlag}>{opt.flag}</Text>
                <Text style={[styles.langLabel, { color: colors.text }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </FilterPicker>

      <FilterPicker visible={currencyPickerVisible} onClose={() => setCurrencyPickerVisible(false)} title={t("servicesPage.currencyPickerTitle")}>
        <View style={styles.langOptions}>
          {([
            { code: "USD" as DisplayCurrency, symbol: "$" },
            { code: "AMD" as DisplayCurrency, symbol: "֏" },
            { code: "EUR" as DisplayCurrency, symbol: "€" },
            { code: "RUB" as DisplayCurrency, symbol: "₽" },
          ]).map((opt) => {
            const selected = displayCurrency === opt.code;
            return (
              <Pressable
                key={opt.code}
                style={[styles.currencyOptionItem, { backgroundColor: colors.background, borderColor: selected ? colors.text : colors.border, borderWidth: selected ? 2 : 1 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDisplayCurrency(opt.code);
                  setTimeout(() => setCurrencyPickerVisible(false), 300);
                }}
              >
                <Text style={[styles.currencySymbol, { color: colors.text }]}>{opt.symbol}</Text>
                <Text style={[styles.currencyCode, { color: colors.textSecondary }]}>{opt.code}</Text>
              </Pressable>
            );
          })}
        </View>
      </FilterPicker>
    </View>
  );
}

function TallTile({ img, title, sub, colors, tileBg, onPress }: { img: any; title: string; sub?: string; colors: any; tileBg: string; onPress: () => void }) {
  return (
    <View style={styles.tallTileWrap}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.tallTile, { backgroundColor: tileBg, opacity: pressed ? 0.7 : 1 }]}>
        {sub ? <Text style={[styles.tallTileSub, { color: colors.text }]} numberOfLines={2}>{sub}</Text> : null}
        <View style={styles.tallTileImgWrap}>
          <Image source={img} style={styles.tallTileImg} resizeMode="contain" />
        </View>
      </Pressable>
      <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={1}>{title}</Text>
    </View>
  );
}

function SmallTile({ img, label, colors, tileBg, onPress }: { img: any; label: string; colors: any; tileBg: string; onPress: () => void }) {
  return (
    <View style={styles.smallTileWrap}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { backgroundColor: tileBg, opacity: pressed ? 0.7 : 1 }]}>
        <Image source={img} style={styles.tileImg} resizeMode="contain" />
      </Pressable>
      <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, ionIcon, label, colors, secondary, onPress, grouped }: { icon?: IconName; ionIcon?: IoniconsName; label: string; colors: any; secondary?: boolean; onPress: () => void; grouped?: boolean }) {
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const [rippleOrigin, setRippleOrigin] = useState(0);
  const [rowWidth, setRowWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    setRippleOrigin(e.nativeEvent.locationX);
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [rippleAnim]);

  const maxRadius = rowWidth > 0 ? rowWidth * 1.5 : 500;
  const scale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const opacity = rippleAnim.interpolate({ inputRange: [0, 0.2, 0.6, 1], outputRange: [0, 0.7, 0.35, 0] });
  const rippleSize = maxRadius * 2;

  const inner = (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      onPressIn={handlePressIn}
      onLayout={onLayout}
      style={[styles.menuRow, { overflow: "hidden" as const }]}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: rippleOrigin - maxRadius,
          top: -maxRadius + 24,
          width: rippleSize,
          height: rippleSize,
          borderRadius: maxRadius,
          backgroundColor: colors.surfacePressed || "rgba(0,0,0,0.15)",
          opacity,
          transform: [{ scale }],
        }}
        pointerEvents="none"
      />
      {icon && <Icon name={icon} size={22} color={secondary ? colors.textSecondary : colors.text} />}
      {ionIcon && <Ionicons name={ionIcon} size={22} color={secondary ? colors.textSecondary : colors.text} style={{ fontWeight: "900" as any }} />}
      <Text style={[styles.menuLabel, { color: secondary ? colors.textSecondary : colors.text }]}>{label}</Text>
      {(icon || ionIcon) && <Icon name="chevron-forward" size={16} color={colors.textTertiary} />}
    </Pressable>
  );

  if (grouped) return inner;

  return (
    <View style={[styles.menuRowWrap, { backgroundColor: colors.surface }]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerUserCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: { width: 42, height: 42, borderRadius: 10 },
  headerName: { fontSize: 15, fontWeight: "600" as const, maxWidth: 160 },
  headerBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SCREEN_PADDING_H },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 10,
    marginBottom: 34,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: GAP,
    marginBottom: 24,
  },
  gridSide: {
    flex: 1,
    gap: 12,
  },
  gridSideRow: {
    flexDirection: "row" as const,
    gap: GAP,
  },
  tallTileWrap: {
    width: COL3,
    alignItems: "center" as const,
  },
  tallTile: {
    width: COL3,
    height: COL3 * 0.50 * 2 + 37,
    borderRadius: CARD_RADIUS,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const,
  },
  tallTileSub: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 3,
    lineHeight: 15,
  },
  tallTileImgWrap: {
    width: "100%" as any,
    alignItems: "center" as const,
    marginTop: 6,
  },
  tallTileImg: {
    width: COL3 * 0.88,
    height: COL3 * 0.88,
  },
  smallTileWrap: {
    flex: 1,
    alignItems: "center" as const,
    marginBottom: 2,
  },
  tile: {
    width: COL3 * 0.50,
    height: COL3 * 0.50,
    borderRadius: COL3 * 0.16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  tileImg: {
    width: COL3 * 0.65,
    height: COL3 * 0.65,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    textAlign: "center" as const,
    marginTop: 5,
    marginBottom: 4,
  },
  menuGroupBlock: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  menuList: {
    gap: 8,
  },
  menuRowWrap: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  menuDivider: {
    height: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  themeOptions: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  themeOptionItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 10,
  },
  themePreview: {
    width: "100%" as any,
    aspectRatio: 0.7,
    borderRadius: 12,
    overflow: "hidden" as const,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  themeOptionLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  themeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  themeRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  langOptions: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  langOptionItem: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  langFlag: {
    fontSize: 40,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  currencyOptionItem: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
});
