import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";
const SECURE_REFRESH_TOKEN_KEY = "secure_refresh_token";

let biometricSessionSkipped = false;

export function setBiometricSessionSkipped(skipped: boolean): void {
  biometricSessionSkipped = skipped;
}

export function isBiometricSessionSkipped(): boolean {
  return biometricSessionSkipped;
}

let SecureStore: any = null;
let LocalAuthentication: any = null;

function getSecureStore() {
  if (Platform.OS === "web") return null;
  if (SecureStore) return SecureStore;
  try {
    SecureStore = require("expo-secure-store");
    return SecureStore;
  } catch (e) {
    console.warn("Failed to load expo-secure-store:", e);
    return null;
  }
}

function getLocalAuth() {
  if (Platform.OS === "web") return null;
  if (LocalAuthentication) return LocalAuthentication;
  try {
    LocalAuthentication = require("expo-local-authentication");
    return LocalAuthentication;
  } catch (e) {
    console.warn("Failed to load expo-local-authentication:", e);
    return null;
  }
}

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const auth = getLocalAuth();
    if (!auth) return false;
    const hasHardware = await auth.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await auth.isEnrolledAsync();
    return isEnrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(promptMessage?: string, cancelLabel?: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const auth = getLocalAuth();
    if (!auth) return false;
    const result = await auth.authenticateAsync({
      promptMessage: promptMessage || "Confirm your identity",
      disableDeviceFallback: false,
      cancelLabel: cancelLabel || "Cancel",
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const value = await AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  if (enabled) {
    await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, "true");
  } else {
    await AsyncStorage.removeItem(BIOMETRICS_ENABLED_KEY);
  }
}

export async function saveRefreshTokenSecure(token: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const store = getSecureStore();
    if (!store) return;
    await store.setItemAsync(SECURE_REFRESH_TOKEN_KEY, token);
  } catch (e) {
    console.warn("saveRefreshTokenSecure:", e);
  }
}

export async function getRefreshTokenSecure(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const store = getSecureStore();
    if (!store) return null;
    return await store.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn("getRefreshTokenSecure:", e);
    return null;
  }
}

export async function deleteRefreshTokenSecure(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const store = getSecureStore();
    if (!store) return;
    await store.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn("deleteRefreshTokenSecure:", e);
  }
}

export async function enableBiometrics(refreshToken: string): Promise<void> {
  await saveRefreshTokenSecure(refreshToken);
  await AsyncStorage.removeItem("auto_armenia_refresh_token");
  await setBiometricsEnabled(true);
}

export async function disableBiometrics(): Promise<void> {
  const token = await getRefreshTokenSecure();
  if (token) {
    await AsyncStorage.setItem("auto_armenia_refresh_token", token);
  }
  await deleteRefreshTokenSecure();
  await setBiometricsEnabled(false);
}

export async function clearBiometrics(): Promise<void> {
  try {
    await deleteRefreshTokenSecure();
  } catch (e) {
    console.warn("clearBiometrics deleteToken error:", e);
  }
  try {
    await setBiometricsEnabled(false);
  } catch (e) {
    console.warn("clearBiometrics setBiometricsEnabled error:", e);
  }
}
