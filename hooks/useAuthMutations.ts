import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { useTranslation } from "@/lib/i18n";
import type { AuthView } from "./useAuthFlow";
import { API } from "@/lib/api-endpoints";

export interface AuthMutationsDeps {
  passwordMode: "login" | "register";
  username: string;
  password: string;
  email: string;
  nameField: string;
  confirmPassword: string;
  gdprAccepted: boolean;
  forgotStep: 1 | 2;
  forgotEmail: string;
  resetCode: string;
  newPassword: string;
  setErrors: (
    v:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  setIsLoading: (v: boolean) => void;
  setPasswordMode: (v: "login" | "register") => void;
  setConfirmPassword: (v: string) => void;
  setShowPassword: (v: boolean) => void;
  setShowConfirmPassword: (v: boolean) => void;
  setGdprAccepted: (v: boolean) => void;
  setForgotStep: (v: 1 | 2) => void;
  setForgotEmail: (v: string) => void;
  setResetCode: (v: string) => void;
  setNewPassword: (v: string) => void;
  setAuthView: (v: AuthView) => void;
}

export function useAuthMutations(deps: AuthMutationsDeps) {
  const { login, register, googleLogin } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!deps.username.trim() || deps.username.length < 3) {
      newErrors.username = t("auth.minThreeChars");
    } else if (
      deps.passwordMode === "register" &&
      !/^[a-zA-Z0-9_]+$/.test(deps.username)
    ) {
      newErrors.username = t("auth.usernameFormat");
    } else if (deps.username.length > 30) {
      newErrors.username = t("auth.maxThirtyChars");
    }
    if (!deps.password.trim() || deps.password.length < 6) {
      newErrors.password = t("auth.minSixChars");
    }
    if (deps.passwordMode === "register") {
      if (!deps.nameField.trim() || deps.nameField.trim().length < 2) {
        newErrors.name = t("auth.nameRequired");
      }
      if (!deps.email.trim()) {
        newErrors.email = t("auth.emailRequiredField");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deps.email)) {
        newErrors.email = t("auth.invalidEmail");
      }
      if (!deps.confirmPassword.trim()) {
        newErrors.confirmPassword = t("auth.passwordRequired");
      } else if (deps.confirmPassword !== deps.password) {
        newErrors.confirmPassword = t("auth.passwordMismatch");
      }
      if (!deps.gdprAccepted) {
        newErrors.gdpr = t("auth.gdprRequired");
      }
    }
    deps.setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validate()) return;
    deps.setIsLoading(true);
    try {
      if (deps.passwordMode === "login") {
        await login(deps.username, deps.password);
      } else {
        await register({
          username: deps.username,
          password: deps.password,
          email: deps.email,
          name: deps.nameField,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(
        deps.passwordMode === "register" ? "/welcome" : "/(tabs)",
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const status = error?.status;
      if (status === 409) {
        showAlert(
          t("common.error"),
          deps.passwordMode === "register"
            ? t("auth.userExists")
            : t("auth.loginError"),
          undefined,
          "error",
        );
      } else if (status === 401) {
        showAlert(
          t("common.error"),
          t("auth.invalidCredentials"),
          undefined,
          "error",
        );
      } else {
        showAlert(
          t("common.error"),
          deps.passwordMode === "login"
            ? t("auth.loginError")
            : t("auth.registerError"),
          undefined,
          "error",
        );
      }
    } finally {
      deps.setIsLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    deps.setIsLoading(true);
    try {
      if (deps.forgotStep === 1) {
        if (
          !deps.forgotEmail.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deps.forgotEmail)
        ) {
          showAlert(
            t("common.error"),
            t("auth.enterValidEmail"),
            undefined,
            "error",
          );
          deps.setIsLoading(false);
          return;
        }
        const res = await apiRequest("POST", API.auth.forgotPassword, {
          email: deps.forgotEmail,
        });
        const data = await res.json();
        if (data.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          deps.setForgotStep(2);
        }
      } else {
        if (!deps.resetCode.trim()) {
          showAlert(
            t("common.error"),
            t("auth.enterRecoveryCode"),
            undefined,
            "error",
          );
          deps.setIsLoading(false);
          return;
        }
        if (!deps.newPassword.trim() || deps.newPassword.length < 6) {
          showAlert(
            t("common.error"),
            t("auth.passwordMinLength"),
            undefined,
            "error",
          );
          deps.setIsLoading(false);
          return;
        }
        const res = await apiRequest("POST", API.auth.resetPassword, {
          email: deps.forgotEmail,
          token: deps.resetCode,
          newPassword: deps.newPassword,
        });
        const data = await res.json();
        if (data.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert(
            t("auth.passwordReset"),
            undefined,
            undefined,
            "success",
          );
          deps.setAuthView("password");
          deps.setForgotStep(1);
          deps.setResetCode("");
          deps.setNewPassword("");
          deps.setForgotEmail("");
        }
      }
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        t("common.error"),
        deps.forgotStep === 1
          ? t("auth.sendCodeError")
          : t("auth.resetPasswordError"),
        undefined,
        "error",
      );
    } finally {
      deps.setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      showAlert("Google Sign-In", t("auth.googleNotConfigured"));
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "armauto" });
      const nonce =
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&nonce=${nonce}`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );
      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const fragment = url.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const idToken = params.get("id_token");
        if (idToken) {
          await googleLogin(idToken);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)");
        }
      }
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(t("common.error"), t("auth.googleError"), undefined, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchPasswordMode = (newMode: "login" | "register") => {
    if (newMode === deps.passwordMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deps.setPasswordMode(newMode);
    deps.setErrors({});
    deps.setConfirmPassword("");
    deps.setShowPassword(false);
    deps.setShowConfirmPassword(false);
    deps.setGdprAccepted(false);
  };

  return {
    googleLoading,
    handlePasswordSubmit,
    handleForgotSubmit,
    handleGoogleSignIn,
    switchPasswordMode,
  };
}
