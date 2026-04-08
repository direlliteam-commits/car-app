import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useColors } from "@/constants/colors";

export type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

type AlertConfig = {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
};

type AlertContextValue = {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const ALERT_ICON_NAMES: Record<AlertType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  warning: "warning",
  info: "information-circle",
  confirm: "help-circle",
};

function getAlertIconStyle(type: AlertType, colors: ReturnType<typeof useColors>) {
  const map: Record<AlertType, { color: string; bg: string }> = {
    success: { color: colors.success, bg: colors.successLight },
    error: { color: colors.error, bg: colors.errorLight },
    warning: { color: colors.warning, bg: colors.warningLight },
    info: { color: colors.accentBlue, bg: colors.infoLight },
    confirm: { color: colors.accentBlue, bg: colors.infoLight },
  };
  return map[type];
}

function AlertModal({ config, onDismiss }: { config: AlertConfig | null; onDismiss: () => void }) {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useColors(colorScheme);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    if (config) {
      setVisible(true);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.85, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setVisible)(false);
      });
    }
  }, [config]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || !config) return null;

  const type = config.type || "info";
  const iconStyle = getAlertIconStyle(type, colors);
  const iconName = ALERT_ICON_NAMES[type];
  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: "OK", style: "default" as const }];

  const handlePress = (button: AlertButton) => {
    onDismiss();
    setTimeout(() => button.onPress?.(), 150);
  };

  const bgColor = colors.surfaceElevated;
  const textColor = colors.primary;
  const subtextColor = colors.textSecondary;
  const dividerColor = colors.divider;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <View style={s.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          {Platform.OS === "ios" ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
          )}
        </Animated.View>

        <Pressable style={StyleSheet.absoluteFill} onPress={() => {
          const cancelBtn = buttons.find(b => b.style === "cancel");
          if (cancelBtn) handlePress(cancelBtn);
          else if (buttons.length === 1) handlePress(buttons[0]);
        }} />

        <Animated.View style={[s.card, { backgroundColor: bgColor }, cardStyle]}>
          <View style={[s.iconWrap, { backgroundColor: iconStyle.bg }]}>
            <Ionicons name={iconName} size={32} color={iconStyle.color} />
          </View>

          <Text style={[s.title, { color: textColor }]}>{config.title}</Text>

          {config.message ? (
            <Text style={[s.message, { color: subtextColor }]}>{config.message}</Text>
          ) : null}

          <View style={[s.btnRow, buttons.length > 2 && s.btnColumn, { borderTopColor: dividerColor }]}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              const isLast = idx === buttons.length - 1;
              const isPrimary = !isCancel && !isDestructive && (buttons.length <= 2 ? isLast : idx === 0);

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && buttons.length <= 2 && (
                    <View style={[s.btnDividerV, { backgroundColor: dividerColor }]} />
                  )}
                  {idx > 0 && buttons.length > 2 && (
                    <View style={[s.btnDividerH, { backgroundColor: dividerColor }]} />
                  )}
                  <Pressable
                    onPress={() => handlePress(btn)}
                    style={({ pressed }) => [
                      s.btn,
                      buttons.length <= 2 && { flex: 1 },
                      pressed && { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
                    ]}
                  >
                    <Text
                      style={[
                        s.btnText,
                        isCancel && { fontWeight: "400", color: subtextColor },
                        isDestructive && { color: colors.error },
                        isPrimary && { color: colors.accentBlue, fontWeight: "700" },
                        !isPrimary && !isCancel && !isDestructive && { color: colors.primary },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType,
  ) => {
    const detectedType = type || detectType(title, message);
    setConfig({ title, message, type: detectedType, buttons });
  }, []);

  const dismiss = useCallback(() => {
    setConfig(null);
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal config={config} onDismiss={dismiss} />
    </AlertContext.Provider>
  );
}

function detectType(title: string, message?: string): AlertType {
  const t = (title + " " + (message || "")).toLowerCase();
  if (t.includes("успех") || t.includes("готово") || t.includes("успешно") || t.includes("сброшен")) return "success";
  if (t.includes("ошибка") || t.includes("не удалось") || t.includes("запрещ")) return "error";
  if (t.includes("удалить") || t.includes("лимит") || t.includes("ограничен") || t.includes("внимание")) return "warning";
  if (t.includes("?") || t.includes("подтвер") || t.includes("уверены")) return "confirm";
  return "info";
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 48, 320);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    borderRadius: 20,
    alignItems: "center",
    paddingTop: 28,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      web: { boxShadow: "0 12px 24px rgba(0,0,0,0.25)" },
      default: {},
    }),
  } as any,
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 24,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 8,
  },
  btnRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btnColumn: {
    flexDirection: "column",
  },
  btn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  btnDividerV: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  btnDividerH: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
