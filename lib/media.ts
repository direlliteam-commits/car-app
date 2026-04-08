import { Platform } from "react-native";
import { getApiUrl, apiUploadRequest, fetchLocalBlob } from "@/lib/query-client";

const PLACEHOLDER_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==";

export function safeUri(uri: string | undefined | null): string {
  return uri && uri.length > 0 ? uri : PLACEHOLDER_URI;
}

export function resolveMediaUri(uri: string): string;
export function resolveMediaUri(uri: string | null | undefined): string | undefined;
export function resolveMediaUri(uri: string | null | undefined): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith("file://") || uri.startsWith("blob:") || uri.startsWith("data:")) return uri;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    try {
      const u = new URL(uri);
      const path = u.pathname;
      if (path.startsWith("/cloud/") || path.startsWith("/uploads/")) {
        return `${getApiUrl().replace(/\/$/, "")}${path}`;
      }
    } catch {}
    return uri;
  }
  return `${getApiUrl().replace(/\/$/, "")}${uri.startsWith("/") ? uri : `/${uri}`}`;
}

export function getAvatarUri(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  return resolveMediaUri(avatarUrl);
}

export async function uploadImage(
  uri: string,
  endpoint: string,
  fieldName: string,
  fileName: string
): Promise<Response> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const blob = await fetchLocalBlob(uri);
    formData.append(fieldName, blob, fileName);
  } else {
    const { File } = require("expo-file-system");
    const file = new File(uri);
    formData.append(fieldName, file);
  }

  return apiUploadRequest("POST", endpoint, formData);
}
