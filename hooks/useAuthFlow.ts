import { useState, useRef, useEffect, useCallback } from "react";
import { TextInput, Platform } from "react-native";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRefreshToken } from "@/lib/query-client";
import { useTranslation } from "@/lib/i18n";
import {
  isBiometricHardwareAvailable,
  isBiometricsEnabled,
  enableBiometrics,
  setBiometricSessionSkipped,
} from "@/lib/biometrics";
import { useAuthMutations } from "./useAuthMutations";

export type OtpStep = "phone" | "code" | "identity" | "name";
export type AuthView = "otp" | "password" | "forgot";

const RESEND_COOLDOWN = 30;

export function useAuthFlow() {
  const {
    sendCode,
    verifyCode,
    confirmIdentity,
    disownAccount,
    setUserName,
  } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const [authView, setAuthView] = useState<AuthView>("otp");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");

  const [phone, setPhone] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [challengeToken, setChallengeToken] = useState("");
  const [maskedName, setMaskedName] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [newName, setNewName] = useState("");

  const [passwordMode, setPasswordMode] = useState<"login" | "register">(
    "login",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nameField, setNameField] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  const mutations = useAuthMutations({
    passwordMode,
    username,
    password,
    email,
    nameField,
    confirmPassword,
    gdprAccepted,
    forgotStep,
    forgotEmail,
    resetCode,
    newPassword,
    setErrors,
    setIsLoading,
    setPasswordMode,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    setGdprAccepted,
    setForgotStep,
    setForgotEmail,
    setResetCode,
    setNewPassword,
    setAuthView,
  });

  const offerBiometricOrNavigate = useCallback(async (destination: string) => {
    if (Platform.OS === "web") {
      if (destination === "/(tabs)") router.replace("/(tabs)");
      else router.replace(destination as Href);
      return;
    }
    try {
      const alreadyEnabled = await isBiometricsEnabled();
      if (alreadyEnabled) {
        if (destination === "/(tabs)") router.replace("/(tabs)");
        else router.replace(destination as Href);
        return;
      }
      const available = await isBiometricHardwareAvailable();
      if (!available) {
        if (destination === "/(tabs)") router.replace("/(tabs)");
        else router.replace(destination as Href);
        return;
      }
      setPendingNavigation(destination);
      setShowBiometricModal(true);
    } catch {
      if (destination === "/(tabs)") router.replace("/(tabs)");
      else router.replace(destination as Href);
    }
  }, []);

  const handleBiometricAccept = useCallback(async () => {
    try {
      const token = await getRefreshToken();
      if (token) {
        await enableBiometrics(token);
        setBiometricSessionSkipped(false);
      }
    } catch (e) {
      console.error("enableBiometrics error:", e);
    }
    setShowBiometricModal(false);
    const dest = pendingNavigation || "/(tabs)";
    setPendingNavigation(null);
    router.replace(dest as Href);
  }, [pendingNavigation]);

  const handleBiometricDecline = useCallback(() => {
    setShowBiometricModal(false);
    const dest = pendingNavigation || "/(tabs)";
    setPendingNavigation(null);
    router.replace(dest as Href);
  }, [pendingNavigation]);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    };
  }, []);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (resendIntervalRef.current)
            clearInterval(resendIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatPhone = (raw: string): string => {
    return "+374" + raw.replace(/\D/g, "");
  };

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setErrors({ phone: t("auth.invalidPhoneNumber") });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      await sendCode(formatPhone(phone));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOtpStep("code");
      startResendTimer();
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const code = error?.code || "";
      const status = error?.status;
      if (code === "RATE_LIMIT_EXCEEDED" || status === 429) {
        showAlert(
          t("common.error"),
          t("auth.rateLimitExceeded").replace("{seconds}", "30"),
          undefined,
          "error",
        );
      } else if (code === "PHONE_LOCKED") {
        showAlert(
          t("common.error"),
          t("auth.phoneLocked"),
          undefined,
          "error",
        );
      } else if (code === "SMS_BUDGET_EXCEEDED") {
        showAlert(
          t("common.error"),
          t("auth.smsBudgetExceeded"),
          undefined,
          "error",
        );
      } else if (code === "INVALID_PHONE") {
        showAlert(
          t("common.error"),
          t("auth.invalidPhoneNumber"),
          undefined,
          "error",
        );
      } else {
        showAlert(
          t("common.error"),
          t("auth.sendCodeError"),
          undefined,
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeStr = code || codeDigits.join("");
    if (codeStr.length !== 6) return;

    setIsLoading(true);
    setErrors({});
    try {
      const result = await verifyCode(formatPhone(phone), codeStr);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.requiresIdentityConfirmation) {
        setChallengeToken(result.challengeToken || "");
        setMaskedName(result.maskedName || "");
        setMaskedEmail(result.maskedEmail || "");
        setOtpStep("identity");
      } else if (result.isNewUser || !result.user?.name) {
        setOtpStep("name");
      } else {
        offerBiometricOrNavigate("/(tabs)");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCodeDigits(["", "", "", "", "", ""]);
      codeInputRefs.current[0]?.focus();
      const code = error?.code || "";
      const status = error?.status;
      if (code === "CODE_EXPIRED") {
        showAlert(
          t("common.error"),
          t("auth.codeExpired"),
          undefined,
          "error",
        );
      } else if (code === "RATE_LIMIT_EXCEEDED" || status === 429) {
        showAlert(
          t("common.error"),
          t("auth.rateLimitExceeded").replace("{seconds}", "30"),
          undefined,
          "error",
        );
      } else {
        showAlert(
          t("common.error"),
          t("auth.invalidCode"),
          undefined,
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    const newDigits = [...codeDigits];

    if (digit.length > 1) {
      const allDigits = digit.split("");
      for (let i = 0; i < 6 && i < allDigits.length; i++) {
        newDigits[i] = allDigits[i];
      }
      setCodeDigits(newDigits);
      const lastFilled = Math.min(allDigits.length, 6) - 1;
      if (lastFilled < 5) {
        codeInputRefs.current[lastFilled + 1]?.focus();
      }
      if (allDigits.length >= 6) {
        handleVerifyCode(newDigits.join(""));
      }
      return;
    }

    newDigits[index] = digit;
    setCodeDigits(newDigits);

    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = "";
      setCodeDigits(newDigits);
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmIdentity = async () => {
    setIsLoading(true);
    try {
      await confirmIdentity(formatPhone(phone), challengeToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      offerBiometricOrNavigate("/(tabs)");
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(t("common.error"), t("auth.loginError"), undefined, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisownAccount = async () => {
    setIsLoading(true);
    try {
      await disownAccount(formatPhone(phone), challengeToken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOtpStep("name");
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(t("common.error"), t("auth.loginError"), undefined, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      setErrors({ newName: t("auth.nameMinTwoChars") });
      return;
    }
    setIsLoading(true);
    try {
      await setUserName(newName.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      offerBiometricOrNavigate("/welcome");
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(t("common.error"), t("auth.loginError"), undefined, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await sendCode(formatPhone(phone));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startResendTimer();
      setCodeDigits(["", "", "", "", "", ""]);
      showAlert(t("auth.codeSent"), undefined, undefined, "success");
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert(
        t("common.error"),
        t("auth.sendCodeError"),
        undefined,
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearField = (key: string) => setErrors((e) => ({ ...e, [key]: "" }));

  return {
    authView,
    setAuthView,
    otpStep,
    setOtpStep,
    phone,
    setPhone,
    codeDigits,
    setCodeDigits,
    codeInputRefs,
    resendTimer,
    challengeToken,
    maskedName,
    maskedEmail,
    newName,
    setNewName,
    passwordMode,
    username,
    setUsername,
    password,
    setPassword,
    email,
    setEmail,
    nameField,
    setNameField,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    focusedField,
    setFocusedField,
    gdprAccepted,
    setGdprAccepted,
    errors,
    setErrors,
    clearField,
    forgotStep,
    setForgotStep,
    resetCode,
    setResetCode,
    newPassword,
    setNewPassword,
    forgotEmail,
    setForgotEmail,
    isLoading,
    googleLoading: mutations.googleLoading,
    showBiometricModal,
    handleSendCode,
    handleCodeDigitChange,
    handleCodeKeyPress,
    handleVerifyCode,
    handleConfirmIdentity,
    handleDisownAccount,
    handleSetName,
    handleResendCode,
    handlePasswordSubmit: mutations.handlePasswordSubmit,
    handleForgotSubmit: mutations.handleForgotSubmit,
    handleGoogleSignIn: mutations.handleGoogleSignIn,
    switchPasswordMode: mutations.switchPasswordMode,
    handleBiometricAccept,
    handleBiometricDecline,
  };
}

export type AuthFlowReturn = ReturnType<typeof useAuthFlow>;
