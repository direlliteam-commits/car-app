import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { BackHandler, Platform, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient, apiRequest, setAuthToken, setRefreshToken } from "@/lib/query-client";
import { CarsProvider } from "@/contexts/CarsContext";
import { RecentlyViewedProvider } from "@/contexts/RecentlyViewedContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { SavedSearchProvider } from "@/contexts/SavedSearchContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider, useAppColorScheme, useTheme } from "@/contexts/ThemeContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { useUserSSE } from "@/hooks/useUserSSE";
import { isBiometricsEnabled, authenticateWithBiometrics, clearBiometrics, getRefreshTokenSecure, setBiometricSessionSkipped } from "@/lib/biometrics";
import { translate } from "@/lib/i18n";
import { setGlobalDisplayCurrency, setGlobalExchangeRates } from "@/lib/formatters";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import Colors from "@/constants/colors";
import { fetch } from "expo/fetch";
import { API } from "@/lib/api-endpoints";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  useEffect(() => {
    if (consumeBiometricRedirect()) {
      router.replace("/auth");
    }
  }, []);

  const isWeb = Platform.OS === "web";
  const webAnim = isWeb ? "fade" as const : "none" as const;
  const animDuration = isWeb ? 150 : undefined;
  const slideOptions = { headerShown: false, animation: webAnim, animationDuration: animDuration, gestureEnabled: true, fullScreenGestureEnabled: true, contentStyle: { backgroundColor: colors.background } };
  const modalOptions = { headerShown: false, animation: webAnim, animationDuration: animDuration, gestureEnabled: true, contentStyle: { backgroundColor: colors.background } };

  return (
    <Stack screenOptions={{ headerShown: false, animation: webAnim, animationDuration: animDuration, gestureEnabled: true, fullScreenGestureEnabled: true, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: webAnim, animationDuration: animDuration }} />
      <Stack.Screen name="car/[id]" options={slideOptions} />
      <Stack.Screen name="filters" options={modalOptions} />
      <Stack.Screen name="auth" options={modalOptions} />
      <Stack.Screen name="chat/[id]" options={slideOptions} />
      <Stack.Screen name="seller/[id]" options={slideOptions} />
      <Stack.Screen name="analytics" options={slideOptions} />
      <Stack.Screen name="settings" options={slideOptions} />
      <Stack.Screen name="saved-searches" options={slideOptions} />
      <Stack.Screen name="my-listings" options={slideOptions} />
      <Stack.Screen name="add" options={modalOptions} />
      <Stack.Screen name="edit/[id]" options={modalOptions} />
      <Stack.Screen name="car/equipment" options={slideOptions} />
      <Stack.Screen name="edit-profile" options={slideOptions} />
      <Stack.Screen name="blocked-users" options={slideOptions} />
      <Stack.Screen name="transactions" options={slideOptions} />
      <Stack.Screen name="credit-requests" options={slideOptions} />
      <Stack.Screen name="callback-requests" options={slideOptions} />
      <Stack.Screen name="journal" options={slideOptions} />
      <Stack.Screen name="journal/[id]" options={slideOptions} />
      <Stack.Screen name="journal/create" options={slideOptions} />
      <Stack.Screen name="service-info" options={slideOptions} />
      <Stack.Screen name="wallet" options={slideOptions} />
      <Stack.Screen name="my-reviews" options={slideOptions} />
      <Stack.Screen name="brand-info" options={slideOptions} />
      <Stack.Screen name="dealer-edit" options={slideOptions} />
      <Stack.Screen name="pro-edit" options={slideOptions} />
      <Stack.Screen name="location-picker" options={slideOptions} />
      <Stack.Screen name="dealer-apply" options={slideOptions} />
      <Stack.Screen name="dealer-plans" options={slideOptions} />
      <Stack.Screen name="admin-dealer-requests" options={slideOptions} />
      <Stack.Screen name="notifications" options={slideOptions} />
      <Stack.Screen name="change-password" options={slideOptions} />
      <Stack.Screen name="notification-settings" options={slideOptions} />
      <Stack.Screen name="terms" options={slideOptions} />
      <Stack.Screen name="privacy" options={slideOptions} />
      <Stack.Screen name="about" options={slideOptions} />
      <Stack.Screen name="bump" options={slideOptions} />
      <Stack.Screen name="promote" options={slideOptions} />
      <Stack.Screen name="support" options={slideOptions} />
      <Stack.Screen name="support-chat/[id]" options={slideOptions} />
      <Stack.Screen name="model-reviews" options={slideOptions} />
      <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade" as const, animationDuration: 300, gestureEnabled: false }} />
    </Stack>
  );
}

function SSEConnector({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useUserSSE(user?.id ?? null);
  return <>{children}</>;
}

type BiometricStatus = "checking" | "prompting" | "unlocked";

let pendingBiometricRedirect = false;

export function consumeBiometricRedirect(): boolean {
  if (pendingBiometricRedirect) {
    pendingBiometricRedirect = false;
    return true;
  }
  return false;
}

function BiometricGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BiometricStatus>("checking");
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const attemptBiometricUnlock = useCallback(async () => {
    if (Platform.OS === "web") {
      setStatus("unlocked");
      return;
    }
    try {
      const enabled = await isBiometricsEnabled();
      if (!enabled) {
        setStatus("unlocked");
        return;
      }
      const { isBiometricHardwareAvailable } = await import("@/lib/biometrics");
      const hwAvailable = await isBiometricHardwareAvailable();
      if (!hwAvailable) {
        await clearBiometrics();
        await setAuthToken(null);
        pendingBiometricRedirect = true;
        setStatus("unlocked");
        return;
      }
      const token = await getRefreshTokenSecure();
      if (!token) {
        await clearBiometrics();
        await setAuthToken(null);
        pendingBiometricRedirect = true;
        setStatus("unlocked");
        return;
      }
      setStatus("prompting");
      const success = await authenticateWithBiometrics(
        translate("biometrics.promptMessage"),
        translate("biometrics.cancelLabel")
      );
      if (!success) {
        setBiometricSessionSkipped(true);
        await setAuthToken(null);
        pendingBiometricRedirect = true;
        setStatus("unlocked");
        return;
      }
      try {
        const res = await apiRequest("POST", API.auth.tokenRefresh, { refreshToken: token });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            await setAuthToken(data.accessToken);
            if (data.refreshToken) {
              await setRefreshToken(data.refreshToken);
            }
          }
        } else {
          await clearBiometrics();
          await setAuthToken(null);
          await setRefreshToken(null);
          pendingBiometricRedirect = true;
        }
      } catch {
        await clearBiometrics();
        await setAuthToken(null);
        await setRefreshToken(null);
        pendingBiometricRedirect = true;
      }
      setStatus("unlocked");
    } catch {
      setStatus("unlocked");
    }
  }, []);

  useEffect(() => {
    attemptBiometricUnlock();
  }, [attemptBiometricUnlock]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        *::-webkit-scrollbar { display: none !important; }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  if (status === "checking" || status === "prompting") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return <>{children}</>;
}

function CurrencySync() {
  const { displayCurrency } = useTheme();
  const { data: rates } = useExchangeRates();

  setGlobalDisplayCurrency(displayCurrency);
  if (rates) {
    setGlobalExchangeRates(rates as any);
  }

  return null;
}

function ThemedApp() {
  const colorScheme = useAppColorScheme();
  const rootBg = Colors[colorScheme === "dark" ? "dark" : "light"].background;

  return (
    <AlertProvider>
    <CurrencySync />
    <BiometricGate>
    <AuthProvider>
      <SSEConnector>
      <NotificationProvider>
      <FavoritesProvider>
        <ComparisonProvider>
          <SavedSearchProvider>
            <CarsProvider>
              <RecentlyViewedProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: rootBg }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
              </RecentlyViewedProvider>
            </CarsProvider>
          </SavedSearchProvider>
        </ComparisonProvider>
      </FavoritesProvider>
      </NotificationProvider>
      </SSEConnector>
    </AuthProvider>
    </BiometricGate>
    </AlertProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!router.canGoBack()) {
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
