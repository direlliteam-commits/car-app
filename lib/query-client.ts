import { fetch } from "expo/fetch";
import { Platform } from "react-native";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translateError } from "./error-utils";
import { isBiometricsEnabled, getRefreshTokenSecure, saveRefreshTokenSecure, deleteRefreshTokenSecure, isBiometricSessionSkipped } from "./biometrics";
import { API } from "./api-endpoints";

const AUTH_TOKEN_KEY = "auto_armenia_auth_token";
export const REFRESH_TOKEN_KEY = "auto_armenia_refresh_token";

let cachedToken: string | null = null;
let cachedRefreshToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return cachedToken;
  } catch (e) {
    console.error("getAuthToken:", e);
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const bioEnabled = await isBiometricsEnabled();
    if (bioEnabled && isBiometricSessionSkipped()) {
      return null;
    }
    if (cachedRefreshToken) return cachedRefreshToken;
    if (bioEnabled) {
      cachedRefreshToken = await getRefreshTokenSecure();
      return cachedRefreshToken;
    }
    cachedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return cachedRefreshToken;
  } catch (e) {
    console.error("getRefreshToken:", e);
    return null;
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  cachedRefreshToken = token;
  try {
    const bioEnabled = await isBiometricsEnabled();
    if (bioEnabled) {
      if (token) {
        await saveRefreshTokenSecure(token);
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await deleteRefreshTokenSecure();
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      return;
    }
  } catch {}
  if (token) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    if (message.startsWith("<!DOCTYPE") || message.startsWith("<html")) {
      throw new Error(`Server returned HTML instead of JSON (status ${res.status}). Check EXPO_PUBLIC_DOMAIN configuration.`);
    }
    let details: any = undefined;
    let code: string | undefined;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) {
        code = parsed.error;
        message = translateError(parsed.error);
      } else if (parsed.message) message = parsed.message;
      if (parsed.details) details = parsed.details;
    } catch {}
    const err: any = new Error(message);
    if (code) err.code = code;
    if (details) err.details = details;
    err.status = res.status;
    throw err;
  }
}

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const rToken = await getRefreshToken();
      if (!rToken) return false;

      const baseUrl = getApiUrl();
      const url = new URL(API.auth.tokenRefresh, baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rToken }),
        credentials: "include",
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.accessToken) {
        await setAuthToken(data.accessToken);
        if (data.refreshToken) {
          await setRefreshToken(data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const authHeaders = await getAuthHeaders();

  const headers: Record<string, string> = {
    ...authHeaders,
  };
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const retryHeaders = await getAuthHeaders();
      const retryH: Record<string, string> = { ...retryHeaders };
      if (data) retryH["Content-Type"] = "application/json";

      const retryRes = await fetch(url.toString(), {
        method,
        headers: retryH,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      await throwIfResNotOk(retryRes);
      return retryRes;
    } else {
      if (logoutCallback) logoutCallback();
    }
  }

  await throwIfResNotOk(res);
  return res;
}

async function platformFetch(url: string, options: RequestInit): Promise<Response> {
  if (Platform.OS === "web") {
    return globalThis.fetch(url, options);
  }
  const { fetch: expoFetch } = require("expo/fetch");
  return expoFetch(url, options);
}

export async function apiUploadRequest(
  method: string,
  route: string,
  formData: FormData,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl).toString();
  const authHeaders = await getAuthHeaders();

  const res = await platformFetch(url, {
    method,
    headers: authHeaders,
    body: formData,
  });

  if (res.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const retryHeaders = await getAuthHeaders();
      const retryRes = await platformFetch(url, {
        method,
        headers: retryHeaders,
        body: formData,
      });
      await throwIfResNotOk(retryRes);
      return retryRes;
    } else {
      if (logoutCallback) logoutCallback();
    }
  }

  await throwIfResNotOk(res);
  return res;
}

export async function fetchLocalBlob(uri: string): Promise<Blob> {
  const response = await globalThis.fetch(uri);
  return response.blob();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const authHeaders = await getAuthHeaders();

    const res = await fetch(url.toString(), {
      headers: authHeaders,
      credentials: "include",
    });

    if (res.status === 401) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const retryHeaders = await getAuthHeaders();
        const retryRes = await fetch(url.toString(), {
          headers: retryHeaders,
          credentials: "include",
        });

        if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
          return null;
        }
        await throwIfResNotOk(retryRes);
        return await retryRes.json();
      }

      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      if (logoutCallback) logoutCallback();
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
