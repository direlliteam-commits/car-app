import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/constants/colors";
import { WEB_TOP_INSET } from "@/constants/layout";
import { useTranslation } from "@/lib/i18n";
import { ScrollView } from "react-native";
import { useAuthFlow } from "@/hooks/useAuthFlow";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { AuthOtpVerification } from "@/components/auth/AuthOtpVerification";
import { AuthPasswordForm } from "@/components/auth/AuthPasswordForm";
import { AuthForgotForm } from "@/components/auth/AuthRegisterForm";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const webTopInset = WEB_TOP_INSET;

  const flow = useAuthFlow();

  const renderContent = () => {
    if (flow.authView === "forgot")
      return <AuthForgotForm flow={flow} colors={colors} isDark={isDark} />;
    if (flow.authView === "password")
      return <AuthPasswordForm flow={flow} colors={colors} isDark={isDark} />;
    switch (flow.otpStep) {
      case "phone":
        return <AuthLoginForm flow={flow} colors={colors} isDark={isDark} />;
      case "code":
      case "identity":
      case "name":
        return (
          <AuthOtpVerification flow={flow} colors={colors} isDark={isDark} />
        );
    }
  };

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={st.flex}
      >
        <ScrollView
          contentContainerStyle={[
            st.scroll,
            {
              paddingTop: insets.top + webTopInset + 16,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}

          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)");
            }}
            style={st.guestBtn}
          >
            <Text style={[st.guestText, { color: colors.textSecondary }]}>
              {t("auth.continueAsGuest")}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={flow.showBiometricModal}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <Pressable style={st.bioModalOverlay} onPress={() => {}}>
          <View
            style={[
              st.bioModalContent,
              {
                backgroundColor: isDark
                  ? colors.surface
                  : colors.background,
              },
            ]}
          >
            <Ionicons
              name={I.fingerprint}
              size={48}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text style={[st.bioModalTitle, { color: colors.text }]}>
              {t("biometrics.enableTitle")}
            </Text>
            <Text
              style={[
                st.bioModalMessage,
                { color: colors.textSecondary },
              ]}
            >
              {t("biometrics.enableMessage")}
            </Text>
            <View style={st.bioModalButtons}>
              <Pressable
                onPress={flow.handleBiometricAccept}
                style={[
                  st.bioModalBtn,
                  { backgroundColor: colors.buttonPrimary },
                ]}
              >
                <Text
                  style={[
                    st.bioModalBtnText,
                    { color: colors.buttonPrimaryText },
                  ]}
                >
                  {t("biometrics.enable")}
                </Text>
              </Pressable>
              <Pressable
                onPress={flow.handleBiometricDecline}
                style={st.bioModalSkipBtn}
              >
                <Text
                  style={[
                    st.bioModalSkipText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("biometrics.notNow")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  guestBtn: {
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 12,
  },
  guestText: {
    fontSize: 15,
    fontFamily: "Nunito_500Medium",
  },
  bioModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  bioModalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  bioModalTitle: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  bioModalMessage: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  bioModalButtons: {
    width: "100%",
    gap: 10,
  },
  bioModalBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bioModalBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  bioModalSkipBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bioModalSkipText: {
    fontSize: 15,
    fontFamily: "Nunito_500Medium",
  },
});
