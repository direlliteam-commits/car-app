import { Platform, ViewStyle } from "react-native";

type ShadowPreset = ViewStyle;

export const SHADOW_NONE: ShadowPreset = {
  shadowColor: "transparent",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const SHADOW_XS: ShadowPreset = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  android: {
    elevation: 1,
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
})!;

export const SHADOW_SM: ShadowPreset = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  android: {
    elevation: 2,
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
})!;

export const SHADOW_MD: ShadowPreset = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
})!;

export const SHADOW_LG: ShadowPreset = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: {
    elevation: 8,
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
})!;
