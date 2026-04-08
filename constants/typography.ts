import { Platform } from "react-native";

export const FONT_SIZE = {
  xxl: 28,
  xl: 22,
  lg: 18,
  md: 15,
  sm: 13,
  xs: 12,
  xxs: 11,
} as const;

export const FONT_WEIGHT = {
  bold: "700" as const,
  semibold: "600" as const,
  medium: "500" as const,
  regular: "400" as const,
} as const;

export const TYPOGRAPHY = {
  screenTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
  },
  bodyMedium: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  bodySemibold: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  label: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.medium,
  },
  caption: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
  },
  captionMedium: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  small: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  smallMedium: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  tiny: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.medium,
  },
  groupLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  priceSmall: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.2,
  },
  buttonSmall: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  buttonMedium: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  buttonLarge: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.semibold,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: FONT_WEIGHT.medium,
  },
  badge: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.semibold,
  },
} as const;
