import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Svg, Path } from "react-native-svg";
import { Platform, StyleSheet, View, Animated, Pressable, GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";

function useUnreadCount(): number {
  const { isAuthenticated } = useAuth();
  const { data: convData } = useQuery<{ count: number }>({
    queryKey: [API.unreadCount],
    enabled: isAuthenticated,
    staleTime: 30000,
  });
  const { data: supportData } = useQuery<{ count: number }>({
    queryKey: [API.support.unreadCount],
    enabled: isAuthenticated,
    staleTime: 30000,
  });
  return (convData?.count ?? 0) + (supportData?.count ?? 0);
}

function SearchIcon({ size = 24, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-3.25 -3.25 104 104" fill="none">
      <Path stroke={color} strokeLinejoin="round" strokeWidth={8.9} d="M6.09375 44.6875a38.59375 38.59375 0 1 0 77.1875 0 38.59375 38.59375 0 1 0 -77.1875 0" />
      <Path stroke={color} strokeLinejoin="round" strokeWidth={8.9} d="M65.92543749999999 76.91734375c0.667265625 0.7995 1.327421875 1.5961562500000002 1.9851406249999999 2.38996875 2.5618125000000003 3.091359375 5.0870625 6.138437499999999 7.857484375 9.146515625000001 3.26990625 3.550421875 8.245453125000001 3.966625 11.7 0.595765625 0.26284375 -0.256546875 0.535640625 -0.5258906250000001 0.8181875 -0.808640625 0.282546875 -0.282546875 0.5516875 -0.5551406249999999 0.808234375 -0.8181875 3.370046875 -3.455359375 2.954046875 -8.432125000000001 -0.5955625 -11.702640625 -3.0074687499999997 -2.77103125 -6.053734375 -5.2966875 -9.144484375 -7.859109375 -0.79665625 -0.6605624999999999 -1.596359375 -1.323359375 -2.39890625 -1.993671875 -2.88721875 4.389734375 -6.646046875 8.1550625 -11.03009375 11.05Z" />
    </Svg>
  );
}

function ServicesIcon({ size = 24, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.75 0.75v5" />
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 3.24988h5" />
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M0.852037 9.27681c0.053214 -0.48002 0.437523 -0.86419 0.917323 -0.91937C2.2492 8.30226 2.74412 8.25 3.25 8.25s1.0008 0.05226 1.48064 0.10744c0.4798 0.05518 0.86411 0.43935 0.91732 0.91937 0.05293 0.47746 0.10204 0.96989 0.10204 1.47319s-0.04911 0.9957 -0.10204 1.4732c-0.05321 0.48 -0.43752 0.8642 -0.91732 0.9194 -0.47984 0.0551 -0.97476 0.1074 -1.48064 0.1074s-1.0008 -0.0523 -1.48064 -0.1074c-0.4798 -0.0552 -0.864109 -0.4394 -0.917323 -0.9194C0.799107 11.7457 0.75 11.2533 0.75 10.75c0 -0.5033 0.049107 -0.99573 0.102037 -1.47319Z" />
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M0.852037 1.77681c0.053214 -0.48002 0.437523 -0.864187 0.917323 -0.919367C2.2492 0.802257 2.74412 0.75 3.25 0.75s1.0008 0.052257 1.48064 0.107443c0.4798 0.05518 0.86411 0.439347 0.91732 0.919367 0.05293 0.47746 0.10204 0.96989 0.10204 1.47319 0 0.50331 -0.04911 0.99573 -0.10204 1.47319 -0.05321 0.48002 -0.43752 0.86419 -0.91732 0.91937C4.2508 5.69774 3.75588 5.75 3.25 5.75s-1.0008 -0.05226 -1.48064 -0.10744c-0.4798 -0.05518 -0.864109 -0.43935 -0.917323 -0.91937C0.799107 4.24573 0.75 3.75331 0.75 3.25c0 -0.5033 0.049107 -0.99573 0.102037 -1.47319Z" />
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.35204 9.27681c0.05321 -0.48002 0.43752 -0.86419 0.91732 -0.91937C9.7492 8.30226 10.2441 8.25 10.75 8.25c0.5059 0 1.0008 0.05226 1.4806 0.10744 0.4798 0.05518 0.8641 0.43935 0.9174 0.91937 0.0529 0.47746 0.102 0.96989 0.102 1.47319s-0.0491 0.9957 -0.102 1.4732c-0.0533 0.48 -0.4376 0.8642 -0.9174 0.9194 -0.4798 0.0551 -0.9747 0.1074 -1.4806 0.1074 -0.5059 0 -1.0008 -0.0523 -1.48064 -0.1074 -0.4798 -0.0552 -0.86411 -0.4394 -0.91732 -0.9194 -0.05293 -0.4775 -0.10204 -0.9699 -0.10204 -1.4732 0 -0.5033 0.04911 -0.99573 0.10204 -1.47319Z" />
    </Svg>
  );
}

function HeartCheckIcon({ size = 24, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-2 -2 64 64" fill="none">
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={5.5} d="M57.5 23.374C57.5 15.356 50.925 7.611 41.635 7.5 34.231 7.5 30 12.41 30 12.41S25.769 7.5 18.365 7.5C8.846 7.5 2.5 15.356 2.5 23.374c0 13.231 12.207 22.84 23.955 29.643 2.193 1.27 4.897 1.27 7.09 0 .764-.442 1.53-.897 2.294-1.363" />
      <Path stroke={color} strokeLinecap="square" strokeLinejoin="round" strokeWidth={5.5} fillRule="evenodd" clipRule="evenodd" d="M57.122 30.689c.76.977.591 2.329-.087 3.364-4.394 6.7-7.522 11.009-9.547 13.638-1.59 2.065-4.459 2.258-6.302.415-1.741-1.742-4.04-4.202-6.611-7.362-.903-1.11-1.09-2.677-.187-3.786.477-.585.992-1.11 1.49-1.564 1.355-1.235 3.388-.881 4.594.5 1.986 2.271 3.56 3.943 3.56 3.943s2.323-3.45 6.791-10.128c.886-1.323 2.537-1.957 3.895-1.128.804.491 1.678 1.177 2.404 2.108Z" />
    </Svg>
  );
}

function AddSquareIcon({ size = 24, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-3.25 -3.25 104 104" fill="none">
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={8.9} d="M90.31140624999999 16.772396875c-0.4216875 -5.1904531249999994 -4.393390625 -9.16215625 -9.583843750000002 -9.5838640625C74.17028125 6.65575625 63.708125 6.09375 48.75 6.09375c-14.958124999999999 0 -25.42028125 0.5619859375 -31.977603125 1.0947625 -5.1904531249999994 0.4217078125 -9.16215625 4.393410937500001 -9.5838640625 9.5838640625C6.65575625 23.32971875 6.09375 33.791875 6.09375 48.75c0 14.958124999999999 0.5619859375 25.42028125 1.0947625 31.9775625 0.421728125 5.1904531249999994 4.393410937500001 9.16215625 9.5838640625 9.583843750000002C23.32971875 90.844203125 33.791875 91.40625 48.75 91.40625c14.958124999999999 0 25.42028125 -0.5620468750000001 31.9775625 -1.0948437500000001 5.1904531249999994 -0.4216875 9.16215625 -4.393390625 9.583843750000002 -9.583843750000002C90.844203125 74.17028125 91.40625 63.708125 91.40625 48.75c0 -14.958124999999999 -0.5620468750000001 -25.42028125 -1.0948437500000001 -31.977603125Z" />
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={8.9} d="M48.75 28.75v40M28.75 48.75h40" />
    </Svg>
  );
}

function ChatBubblesIcon({ size = 24, color = "#000" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-2 -2 64 64" fill="none">
      <Path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={5.5} d="M53.25 23.75C50.934 12.339 40.845 3.75 28.75 3.75 14.943 3.75 3.75 14.943 3.75 28.75c0 4.745 1.322 9.182 3.618 12.961-1.114 2.672-2.248 5.829-2.972 8.731-.407 1.629 1.022 3.002 2.64 2.553 2.804-.779 5.889-1.911 8.547-2.99 2.469 1.533 5.225 2.647 8.168 3.245" />
      <Path stroke={color} strokeLinejoin="round" strokeWidth={5.5} d="M26.25 41.25c0-8.284 6.716-15 15-15s15 6.716 15 15c0 2.878-.811 5.567-2.216 7.851.539 1.139 1.076 2.45 1.499 3.857.484 1.607-.955 2.989-2.551 2.467-1.344-.44-2.615-.966-3.742-1.478A14.939 14.939 0 0141.25 56.25c-8.284 0-15-6.716-15-15Z" />
    </Svg>
  );
}
import React, { useRef, useState, useCallback } from "react";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { API } from "@/lib/api-endpoints";

function AnimatedTabButton({ children, onPress, onLongPress, style, accessibilityState, href, ...rest }: any) {
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const [rippleOrigin, setRippleOrigin] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  }, []);

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    setRippleOrigin({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [rippleAnim]);

  const maxRadius = Math.max(size.w, size.h) * 1.2;
  const scale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const opacity = rippleAnim.interpolate({ inputRange: [0, 0.15, 0.5, 1], outputRange: [0, 0.6, 0.3, 0] });
  const rippleSize = maxRadius * 2;

  return (
    <Pressable
      onPress={(e) => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onLayout={onLayout}
      style={[style, { overflow: "hidden" }]}
      accessibilityState={accessibilityState}
      {...rest}
    >
      <Animated.View
        style={{
          position: "absolute",
          left: rippleOrigin.x - maxRadius,
          top: rippleOrigin.y - maxRadius,
          width: rippleSize,
          height: rippleSize,
          borderRadius: maxRadius,
          backgroundColor: "rgba(128,128,128,0.25)",
          opacity,
          transform: [{ scale }],
        }}
        pointerEvents="none"
      />
      {children}
    </Pressable>
  );
}

function ClassicTabLayout() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const colors = Colors[isDark ? "dark" : "light"];
  const unreadCount = useUnreadCount();

  return (
    <Tabs
      {...({ sceneContainerStyle: { backgroundColor: colors.background } } as { sceneContainerStyle: { backgroundColor: string } })}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 0,
          elevation: 0,
          paddingHorizontal: 8,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {isIOS ? (
              <BlurView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.background },
                ]}
              />
            )}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: "25%",
                right: "25%",
                height: StyleSheet.hairlineWidth,
                backgroundColor: isDark ? colors.border : colors.divider,
              }}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.search"),
          tabBarIcon: ({ color }) => (
            <SearchIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t("tabs.favorites"),
          tabBarIcon: ({ color }) => (
            <HeartCheckIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-listing"
        options={{
          title: t("tabs.addListing"),
          tabBarIcon: ({ color }) => (
            <AddSquareIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t("tabs.messages"),
          tabBarIcon: ({ color }) => (
            <ChatBubblesIcon size={24} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, fontSize: 10, fontWeight: "600" as const, minWidth: 18, height: 18, lineHeight: 14 },
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("tabs.services"),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <ServicesIcon size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="search-results"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}
