import { useCallback, useMemo } from "react";
import { Platform, Share, PanResponder, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { withTiming, runOnJS } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useTranslation } from "@/lib/i18n";
import { apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";
import type { SafeUser } from "@shared/schema";
import type { AlertButton, AlertType } from "@/contexts/AlertContext";
import { API } from "@/lib/api-endpoints";

interface UseProfileActionsParams {
  user: SafeUser | null | undefined;
  refreshUser: () => Promise<void>;
  showAlert: (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => void;
  stickyHeaderOpacity: { value: number };
  stickyHeaderVisible: { value: boolean };
  aboutSheetProgress: { value: number };
  setUploadingAvatar: (v: boolean) => void;
  setAboutSheetVisible: (v: boolean) => void;
  logout: () => Promise<void>;
}

export function useProfileActions({
  user,
  refreshUser,
  showAlert,
  stickyHeaderOpacity,
  stickyHeaderVisible,
  aboutSheetProgress,
  setUploadingAvatar,
  setAboutSheetVisible,
  logout,
}: UseProfileActionsParams) {
  const { t } = useTranslation();

  const handlePickAvatar = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert(t("profile.accessDenied"), t("profile.galleryAccess"), undefined, "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploadingAvatar(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const asset = result.assets[0];
      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetchLocalBlob(asset.uri);
        formData.append("avatar", blob, "avatar.jpg");
      } else {
        const { File } = require("expo-file-system");
        const file = new File(asset.uri);
        formData.append("avatar", file);
      }

      const uploadRes = await apiUploadRequest("POST", API.auth.avatar, formData);

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => null);
        throw new Error(errData?.error || t("profile.uploadError"));
      }

      await refreshUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Avatar upload error:", error);
      showAlert(t("common.error"), t("profile.avatarUploadError"), undefined, "error");
    } finally {
      setUploadingAvatar(false);
    }
  }, [refreshUser, showAlert, t, setUploadingAvatar]);

  const handleLogout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert(
      t("profile.logoutTitle"),
      t("profile.logoutMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logoutButton"),
          style: "destructive",
          onPress: async () => {
            router.replace("/auth");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
          },
        },
      ]
    );
  }, [showAlert, t, logout]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const threshold = 260;
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > threshold;
    if (shouldShow !== stickyHeaderVisible.value) {
      stickyHeaderVisible.value = shouldShow;
      stickyHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    }
  }, []);

  const openAboutSheet = useCallback(() => {
    setAboutSheetVisible(true);
    aboutSheetProgress.value = withTiming(1, { duration: 300 });
  }, []);

  const closeAboutSheet = useCallback(() => {
    aboutSheetProgress.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(setAboutSheetVisible)(false);
    });
  }, []);

  const aboutPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80 || g.vy > 0.5) closeAboutSheet();
    },
  }), []);

  const handleShareProfile = useCallback(async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN || "armauto.am";
      const url = `https://${domain}/seller/${user?.id}`;
      await Share.share({ message: url, url });
    } catch {}
  }, [user?.id]);

  return {
    handlePickAvatar,
    handleLogout,
    handleScroll,
    openAboutSheet,
    closeAboutSheet,
    aboutPanResponder,
    handleShareProfile,
  };
}
