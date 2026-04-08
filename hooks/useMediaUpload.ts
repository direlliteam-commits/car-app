import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import type { FormData } from "@/types/car-form";
import { getApiUrl, getAuthToken, apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import { API } from "@/lib/api-endpoints";

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const IMAGE_BATCH_SIZE = 3;

export function useMediaUpload(
  formData: FormData,
  setFormData: Dispatch<SetStateAction<FormData>>,
) {
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const maxPhotosRef = useRef(10);

  const setMaxPhotos = useCallback((n: number) => { maxPhotosRef.current = n; }, []);

  const handleImagePick = useCallback(async () => {
    const limit = maxPhotosRef.current;
    const remaining = limit - formData.images.length;
    if (remaining <= 0) {
      showAlert(t("addListing.photoLimitTitle"), t("addListing.photoLimitMsg").replace("{limit}", String(limit)));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remaining,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      const combined = [...formData.images, ...newImages].slice(0, limit);
      setFormData(prev => ({ ...prev, images: combined }));
      if (combined.length >= limit && newImages.length > remaining) {
        showAlert(
          t("addListing.photoLimitPartialTitle"),
          t("addListing.photoLimitPartial").replace("{added}", String(remaining)).replace("{total}", String(newImages.length)).replace("{limit}", String(limit)),
        );
      }
    }
  }, [formData.images, setFormData]);

  const removeImage = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }, [setFormData]);

  const handleVideoPick = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 0.5,
      videoMaxDuration: 180,
      videoExportPreset: Platform.OS === "ios" ? ImagePicker.VideoExportPreset.MediumQuality : undefined,
    } as any);

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (Platform.OS !== "web" && asset.uri) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if (info.exists && info.size && info.size > MAX_VIDEO_SIZE_BYTES) {
            const sizeMB = Math.round(info.size / (1024 * 1024));
            showAlert(
              t("addListing.videoTooLargeTitle"),
              t("addListing.videoTooLargeMsg").replace("{size}", String(sizeMB)).replace("{max}", String(MAX_VIDEO_SIZE_MB)),
            );
            return;
          }
        } catch (e) { console.warn('Media operation failed:', e); }
      }
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
        const sizeMB = Math.round(asset.fileSize / (1024 * 1024));
        showAlert(
          t("addListing.videoTooLargeTitle"),
          t("addListing.videoTooLargeMsg").replace("{size}", String(sizeMB)).replace("{max}", String(MAX_VIDEO_SIZE_MB)),
        );
        return;
      }
      setFormData(prev => ({ ...prev, videoUri: asset.uri }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [setFormData]);

  const removeVideo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData(prev => ({ ...prev, videoUri: null }));
  }, [setFormData]);

  const translateServerError = useCallback((errorCode: string): string => {
    const codeMap: Record<string, string> = {
      LIMIT_FILE_SIZE: t("addListing.serverLimitFileSize"),
      INVALID_FILE_TYPE: t("addListing.serverInvalidFileType"),
      VIDEO_TOO_LONG: t("addListing.serverVideoTooLong"),
      VIDEO_PROCESSING_ERROR: t("addListing.serverVideoProcessingError"),
      UPLOAD_ERROR: t("addListing.videoUploadError"),
    };
    return codeMap[errorCode] || errorCode;
  }, [t]);

  const uploadVideo = useCallback(async (
    localUri: string,
    onProgress?: (pct: number) => void,
  ): Promise<string | null> => {
    const baseUrl = getApiUrl();
    const url = new URL(API.uploadVideo, baseUrl);
    const token = await getAuthToken();

    if (Platform.OS === "web") {
      const formPayload = new globalThis.FormData();
      const blob = await fetchLocalBlob(localUri);
      formPayload.append("video", blob, `video-${Date.now()}.mp4`);
      const res = await apiUploadRequest("POST", API.uploadVideo, formPayload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(translateServerError(errorData.errorCode || errorData.error) || t("addListing.videoUploadError"));
      }
      const data = await res.json();
      return (data.url as string) ? `${baseUrl.replace(/\/$/, "")}${data.url}` : null;
    }

    return new Promise<string | null>((resolve, reject) => {
      const formPayload = new globalThis.FormData();
      const ext = localUri.split(".").pop()?.toLowerCase() || "mp4";
      const mimeMap: Record<string, string> = {
        mov: "video/quicktime", webm: "video/webm", avi: "video/x-msvideo",
        mkv: "video/x-matroska", m4v: "video/x-m4v", "3gp": "video/3gpp",
      };
      const mimeType = mimeMap[ext] || "video/mp4";
      formPayload.append("video", { uri: localUri, type: mimeType, name: `video-${Date.now()}.${ext}` } as any);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url.toString());
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }
      xhr.onload = () => {
        onProgress?.(100);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data.url ? `${baseUrl.replace(/\/$/, "")}${data.url}` : null);
          } else {
            reject(new Error(translateServerError(data.errorCode || data.error) || `${t("addListing.videoUploadError")} (${xhr.status})`));
          }
        } catch {
          reject(new Error(`${t("addListing.videoUploadError")} (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error(t("addListing.videoNetworkError")));
      xhr.ontimeout = () => reject(new Error(t("addListing.videoTimeoutError")));
      xhr.timeout = 5 * 60 * 1000;
      xhr.send(formPayload);
    });
  }, [t, translateServerError]);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setFormData(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.images.length) return prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newImages = [...prev.images];
      [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
      return { ...prev, images: newImages };
    });
  }, [setFormData]);

  const uploadImageBatch = useCallback(async (localUris: string[]): Promise<string[]> => {
    if (localUris.length === 0) return [];
    const formPayload = new globalThis.FormData();
    for (const uri of localUris) {
      if (Platform.OS === "web") {
        try {
          const blob = await fetchLocalBlob(uri);
          formPayload.append("images", blob, `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`);
        } catch (blobErr) {
          console.error("[Upload] Failed to fetch blob from URI:", uri, blobErr instanceof Error ? blobErr.message : blobErr);
          throw new Error(`Не удалось подготовить фото для загрузки`);
        }
      } else {
        const file = new File(uri);
        formPayload.append("images", file as any);
      }
    }
    const baseUrl = getApiUrl();
    const resp = await apiUploadRequest("POST", API.upload, formPayload);
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[Upload] Server error:", resp.status, errText);
      throw new Error(`Ошибка загрузки фото (${resp.status})`);
    }
    const data = await resp.json();
    return (data.urls as string[]).map(u => `${baseUrl.replace(/\/$/, "")}${u}`);
  }, []);

  const uploadImages = useCallback(async (
    localUris: string[],
    onProgress?: (uploaded: number, total: number) => void,
  ): Promise<string[]> => {
    if (localUris.length === 0) return [];

    const batches: string[][] = [];
    for (let i = 0; i < localUris.length; i += IMAGE_BATCH_SIZE) {
      batches.push(localUris.slice(i, i + IMAGE_BATCH_SIZE));
    }

    const allUrls: string[] = [];
    let uploaded = 0;
    const total = localUris.length;

    for (const batch of batches) {
      const batchUrls = await uploadImageBatch(batch);
      allUrls.push(...batchUrls);
      uploaded += batch.length;
      onProgress?.(uploaded, total);
    }

    return allUrls;
  }, [uploadImageBatch]);

  const prepareImageUrls = useCallback(async (
    onProgress?: (uploaded: number, total: number) => void,
  ): Promise<string[]> => {
    const isExistingUrl = (uri: string) =>
      uri.startsWith("http://") || uri.startsWith("https://") ||
      uri.startsWith("/uploads/") || uri.startsWith("/cloud/");
    const newLocalUris = formData.images.filter(uri => !isExistingUrl(uri));

    let uploadedMap = new Map<string, string>();
    if (newLocalUris.length > 0) {
      const uploadedUrls = await uploadImages(newLocalUris, onProgress);
      newLocalUris.forEach((localUri, idx) => {
        if (idx < uploadedUrls.length) {
          uploadedMap.set(localUri, uploadedUrls[idx]);
        }
      });
    }

    const allImageUrls = formData.images.map(uri =>
      isExistingUrl(uri) ? uri : (uploadedMap.get(uri) || uri)
    ).filter(uri => isExistingUrl(uri));

    if (uploadedMap.size > 0) {
      const updatedImages = formData.images.map(uri =>
        isExistingUrl(uri) ? uri : (uploadedMap.get(uri) || uri)
      );
      setFormData(prev => ({ ...prev, images: updatedImages }));
    }

    return allImageUrls;
  }, [formData.images, uploadImages, setFormData]);

  return {
    handleImagePick,
    removeImage,
    moveImage,
    handleVideoPick,
    removeVideo,
    uploadVideo,
    uploadImages,
    prepareImageUrls,
    setMaxPhotos,
  };
}
