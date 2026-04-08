import React, { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LocationPickerSheet } from "@/components/forms/LocationPickerSheet";
import { useColors } from "@/constants/colors";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { fireLocationCallback, clearLocationCallback } from "@/lib/location-callback";

export default function LocationPickerPage() {
  const router = useRouter();
  const scheme = useAppColorScheme();
  const colors = useColors(scheme);
  const isDark = scheme === "dark";
  const params = useLocalSearchParams<{
    address?: string;
    city?: string;
    lat?: string;
    lng?: string;
  }>();

  useEffect(() => {
    return () => {
      clearLocationCallback();
    };
  }, []);

  return (
    <LocationPickerSheet
      colors={colors}
      isDark={isDark}
      initialAddress={params.address}
      initialCity={params.city}
      initialLat={params.lat ? parseFloat(params.lat) : null}
      initialLng={params.lng ? parseFloat(params.lng) : null}
      onClose={() => {
        clearLocationCallback();
        router.back();
      }}
      onConfirm={(result) => {
        fireLocationCallback(result);
        router.back();
      }}
    />
  );
}
