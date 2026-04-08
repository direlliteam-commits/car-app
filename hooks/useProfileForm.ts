import { useState, useRef, useCallback } from "react";
import { ScrollView } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";

interface UseProfileFormOptions {
  extraFields?: Record<string, any>;
  orderedErrorKeys?: string[];
  onValidate?: (errors: Record<string, string>) => void;
}

export function useProfileForm(options?: UseProfileFormOptions) {
  const { showAlert } = useAlert();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();

  const rawName = user?.name || "";
  const [name, setName] = useState(
    rawName && /[\d_]/.test(rawName) && rawName === user?.username ? "" : rawName
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Record<string, number>>({});

  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      if (!prev[key]) return prev;
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  const scrollToFirstError = useCallback((errorKeys: string[]) => {
    const ordered = options?.orderedErrorKeys || ["name", "phone"];
    const first = ordered.find(k => errorKeys.includes(k));
    if (first && fieldOffsets.current[first] !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, fieldOffsets.current[first] - 120), animated: true });
    }
  }, [options?.orderedErrorKeys]);

  const getErrorCountText = useCallback((count: number): string => {
    if (count === 1) return t("editProfile.fixError1");
    if (count >= 2 && count <= 4) return t("editProfile.fixErrorFew").replace("{count}", String(count));
    return t("editProfile.fixErrorMany").replace("{count}", String(count));
  }, [t]);

  const validateBaseProfile = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = t("editProfile.nameRequired");
    } else if (/[\d_]/.test(name)) {
      newErrors.name = t("editProfile.nameNoDigits");
    }
    if (phone.trim() && !/^\+374\d{8}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = t("editProfile.phoneFormat");
    }
    return newErrors;
  }, [name, phone, t]);

  const validateProfile = useCallback((): boolean => {
    const baseErrors = validateBaseProfile();
    const extraErrors = options?.onValidate ? (() => {
      const e: Record<string, string> = {};
      options.onValidate!(e);
      return e;
    })() : {};
    const newErrors = { ...baseErrors, ...extraErrors };
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => scrollToFirstError(Object.keys(newErrors)), 100);
    }
    return Object.keys(newErrors).length === 0;
  }, [validateBaseProfile, options?.onValidate, scrollToFirstError]);

  const handleSave = useCallback(async (body: Record<string, any>) => {
    if (!validateProfile()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    setSaving(true);
    try {
      await apiRequest("PUT", API.auth.profile, body);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setErrors({});
      await refreshUser();
      if (router.canGoBack()) router.back(); else router.replace("/");
      return true;
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const zodIssues = err?.details;
      if (Array.isArray(zodIssues) && zodIssues.length > 0) {
        const parsed: Record<string, string> = {};
        for (const issue of zodIssues) {
          const key = issue.path?.[0];
          if (key && issue.message) parsed[key] = issue.message;
        }
        if (Object.keys(parsed).length > 0) {
          setErrors(parsed);
          setTimeout(() => scrollToFirstError(Object.keys(parsed)), 100);
          return false;
        }
      }
      showAlert(t("common.error"), t("editProfile.saveError"), undefined, "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [validateProfile, refreshUser, showAlert, t, scrollToFirstError]);

  return {
    name, setName,
    phone, setPhone,
    city, setCity,
    saving,
    errors, setErrors,
    scrollRef,
    fieldOffsets,
    clearError,
    hasErrors,
    scrollToFirstError,
    getErrorCountText,
    validateBaseProfile,
    validateProfile,
    handleSave,
    user,
    refreshUser,
  };
}
