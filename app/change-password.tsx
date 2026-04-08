import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Icon } from "@/components/Icon";
import { useColors } from "@/constants/colors";
import { useAlert } from "@/contexts/AlertContext";
import { apiRequest } from "@/lib/query-client";
import { useTranslation } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CARD_RADIUS, HEADER_CONTENT_PADDING_H, WEB_TOP_INSET } from "@/constants/layout";
import { API } from "@/lib/api-endpoints";

export default function ChangePasswordScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, authLoading]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.current = t("changePassword.enterCurrent");
    }

    if (!newPassword) {
      newErrors.new = t("changePassword.enterNew");
    } else if (newPassword.length < 6) {
      newErrors.new = t("changePassword.minLength");
    } else if (newPassword === currentPassword) {
      newErrors.new = t("changePassword.mustDiffer");
    }

    if (!confirmPassword) {
      newErrors.confirm = t("changePassword.confirmNew");
    } else if (confirmPassword !== newPassword) {
      newErrors.confirm = t("changePassword.mismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", API.auth.changePassword, {
        currentPassword,
        newPassword,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert(t("changePassword.done"), t("changePassword.success"), [
        { text: "OK", onPress: () => router.back() },
      ], "success");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : t("changePassword.errorGeneric");
      showAlert(t("changePassword.error"), message, undefined, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (val: string) => void,
    show: boolean,
    toggleShow: () => void,
    error?: string,
    placeholder?: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: isDark ? colors.surface : colors.background,
          borderColor: error ? colors.error : colors.border,
        },
      ]}>
        <Icon name="lock-closed" size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={(val) => {
            onChangeText(val);
            if (errors) setErrors({});
          }}
          secureTextEntry={!show}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={toggleShow} hitSlop={8}>
          <Icon name={show ? "eye-off" : "eye"} size={20} color={colors.textTertiary} />
        </Pressable>
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );

  const isFormValid = currentPassword.length > 0 && newPassword.length >= 6 && confirmPassword === newPassword;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScreenHeader title={t("changePassword.title")} backgroundColor={isDark ? colors.surface : colors.background} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.infoCard, { backgroundColor: colors.infoLight }]}>
            <Icon name="shield" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t("changePassword.infoText")}
            </Text>
          </View>

          {renderInput(
            t("changePassword.currentPassword"),
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent(!showCurrent),
            errors.current
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderInput(
            t("changePassword.newPassword"),
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew(!showNew),
            errors.new,
            t("changePassword.minLength")
          )}

          {renderInput(
            t("changePassword.confirmPassword"),
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            () => setShowConfirm(!showConfirm),
            errors.confirm,
            t("changePassword.repeatNew")
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: isFormValid ? colors.primary : colors.disabledBg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[
                styles.submitText,
                { color: isFormValid ? "#FFFFFF" : colors.textTertiary },
              ]}>
                {t("changePassword.changeButton")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 16,
    paddingTop: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: CARD_RADIUS,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  submitButton: {
    borderRadius: CARD_RADIUS,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
