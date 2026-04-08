import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";

interface PendingImage {
  uri: string;
}

export function useChatMedia() {
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(t("chat.accessDenied"), t("chat.allowPhotosAccess"), undefined, "warning");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (!result.canceled && result.assets?.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newImages = result.assets.map((a) => ({ uri: a.uri }));
        setPendingImages((prev) => [...prev, ...newImages].slice(0, 10));
      }
    } catch (e) {
      console.error("Gallery picker error:", e);
    }
  }, [showAlert, t]);

  const pickFromCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert(t("chat.accessDenied"), t("chat.allowCameraAccess"), undefined, "warning");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPendingImages((prev) => [...prev, { uri: result.assets[0].uri }].slice(0, 10));
      }
    } catch (e) {
      console.error("Camera picker error:", e);
    }
  }, [showAlert, t]);

  const handleAttach = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachPicker((prev) => !prev);
  }, []);

  const handlePickerOption = useCallback((option: "camera" | "gallery") => {
    setShowAttachPicker(false);
    if (option === "camera") pickFromCamera();
    else pickFromGallery();
  }, [pickFromCamera, pickFromGallery]);

  const removePendingImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearPendingImages = useCallback(() => {
    setPendingImages([]);
  }, []);

  return {
    pendingImages,
    setPendingImages,
    showAttachPicker,
    setShowAttachPicker,
    pickFromGallery,
    pickFromCamera,
    handleAttach,
    handlePickerOption,
    removePendingImage,
    clearPendingImages,
  };
}
