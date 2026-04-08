import React, { createContext, useContext, useMemo, useCallback, useEffect, useRef, ReactNode } from "react";
import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useAuth } from "@/contexts/AuthContext";
import Constants from "expo-constants";

const isExpoGo = Constants.executionEnvironment === "storeClient";

let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    Notifications = null;
  }
}

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications handler setup skipped:", e);
    Notifications = null;
  }
}

interface NotificationContextValue {
  unreadCount: number;
  markAllRead: () => Promise<void>;
  registerForPush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const registeredRef = useRef(false);

  const { data } = useQuery<{ count: number }>({
    queryKey: [API.notifications.unreadCount],
    enabled: isAuthenticated,
    refetchInterval: 60000,
    staleTime: 15000,
  });

  const unreadCount = data?.count ?? 0;

  const registerForPush = useCallback(async () => {
    if (Platform.OS === "web" || !Notifications) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: undefined,
      });
      const token = tokenData.data;

      await apiRequest("POST", API.pushTokens, {
        token,
        platform: Platform.OS,
      });
    } catch (err) {
      console.warn("[Notifications] Push registration failed:", err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;

    const timer = setTimeout(() => {
      registerForPush();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, registerForPush]);

  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !Notifications) return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const notifData = response.notification.request.content.data;
      const { router } = require("expo-router");
      if (notifData?.type === "NEW_MESSAGE" && notifData?.chatId) {
        router.push(`/chat/${notifData.chatId}`);
      } else if ((notifData?.type === "LISTING_FAVORITED" || notifData?.type === "FAVORITE_PRICE_DROP") && notifData?.listingId) {
        router.push(`/car/${notifData.listingId}`);
      } else {
        router.push("/notifications");
      }
      queryClient.invalidateQueries({ queryKey: [API.notifications.unreadCount] });
    });

    return () => sub.remove();
  }, [isAuthenticated]);

  const markAllRead = useCallback(async () => {
    await apiRequest("PUT", API.notifications.readAll);
    queryClient.invalidateQueries({ queryKey: [API.notifications.unreadCount] });
    queryClient.invalidateQueries({ queryKey: [API.notifications.list] });
  }, []);

  const value = useMemo(() => ({
    unreadCount,
    markAllRead,
    registerForPush,
  }), [unreadCount, markAllRead, registerForPush]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
