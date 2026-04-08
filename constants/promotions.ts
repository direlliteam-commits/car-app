export interface PromotionTheme {
  code: string;
  shortName: string;
  icon: string;
  accent: string;
  accentDark: string;
  gradient: readonly [string, string, string];
  gradientDark: readonly [string, string, string];
  badgeBg: string;
  badgeBgDark: string;
  badgeGradient: readonly [string, string];
  badgeGradientDark: readonly [string, string];
  cardGradient: readonly [string, string, string];
  cardGradientDark: readonly [string, string, string];
  cardBg: string;
  cardBgDark: string;
  pickerBg: string;
  pickerBgDark: string;
  sortRank: number;
}

export const PROMOTION_THEMES: Record<string, PromotionTheme> = {
  boost: {
    code: "boost",
    shortName: "Boost",
    icon: "trending-up",
    accent: "#636366",
    accentDark: "#98989D",
    gradient: ["rgba(142,142,147,0.10)", "rgba(142,142,147,0.04)", "rgba(142,142,147,0.10)"],
    gradientDark: ["rgba(152,152,157,0.14)", "rgba(152,152,157,0.06)", "rgba(152,152,157,0.14)"],
    badgeBg: "#636366",
    badgeBgDark: "#98989D",
    badgeGradient: ["#636366", "#48484A"],
    badgeGradientDark: ["#98989D", "#636366"],
    cardGradient: ["rgba(142,142,147,0.08)", "rgba(142,142,147,0.02)", "rgba(142,142,147,0.06)"],
    cardGradientDark: ["rgba(152,152,157,0.12)", "rgba(152,152,157,0.04)", "rgba(152,152,157,0.10)"],
    cardBg: "rgba(120,120,128,0.06)",
    cardBgDark: "rgba(174,174,178,0.08)",
    pickerBg: "#F2F2F4",
    pickerBgDark: "#151517",
    sortRank: 1,
  },
  top: {
    code: "top",
    shortName: "TOP",
    icon: "flash",
    accent: "#1C1C1E",
    accentDark: "#FFFFFF",
    gradient: ["rgba(28,28,30,0.12)", "rgba(28,28,30,0.05)", "rgba(28,28,30,0.12)"],
    gradientDark: ["rgba(255,255,255,0.20)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0.20)"],
    badgeBg: "#1C1C1E",
    badgeBgDark: "#FFFFFF",
    badgeGradient: ["#1C1C1E", "#000000"],
    badgeGradientDark: ["#FFFFFF", "#E5E5EA"],
    cardGradient: ["rgba(28,28,30,0.10)", "rgba(28,28,30,0.03)", "rgba(28,28,30,0.08)"],
    cardGradientDark: ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.14)"],
    cardBg: "rgba(28,28,30,0.06)",
    cardBgDark: "rgba(255,255,255,0.08)",
    pickerBg: "#F2F2F4",
    pickerBgDark: "#151517",
    sortRank: 2,
  },
};

export function getPromotionTheme(code: string): PromotionTheme {
  if (code === "top" || code === "turbo_pack" || code === "turbo") return PROMOTION_THEMES.top;
  return PROMOTION_THEMES.boost;
}

export function hasPromoFeature(features: string[] | undefined | null, feature: string): boolean {
  return !!features && features.includes(feature);
}

export function hasAnyPromoFeature(features: string[] | undefined | null, checks: string[]): boolean {
  return !!features && checks.some(f => features.includes(f));
}

export function getHighestPromoTheme(
  features: string[] | undefined | null,
): PromotionTheme | null {
  if (!features || features.length === 0) return null;
  if (features.includes("top_card_style") || features.includes("turbo_card_style") || features.includes("top_badge")) return PROMOTION_THEMES.top;
  if (features.length > 0) return PROMOTION_THEMES.boost;
  return null;
}

export function getHighlightBg(features: string[] | undefined | null, isDark: boolean): string | null {
  return null;
}

export const PROMOTION_SORT_RANKS: Record<string, number> = {
  boost: 1,
  top: 2,
};

export interface PackageDisplayInfo {
  label: string;
  color: string;
  colorDark: string;
  gradient: readonly [string, string];
  gradientDark: readonly [string, string];
  barGradient: readonly [string, string, string];
  barGradientDark: readonly [string, string, string];
  icon: string;
  rank: number;
}

const BOOST_DISPLAY: PackageDisplayInfo = { label: "Boost", color: "#636366", colorDark: "#98989D", gradient: ["#636366", "#48484A"], gradientDark: ["#98989D", "#636366"], barGradient: ["rgba(142,142,147,0.12)", "rgba(142,142,147,0.04)", "rgba(142,142,147,0.12)"], barGradientDark: ["rgba(152,152,157,0.16)", "rgba(152,152,157,0.06)", "rgba(152,152,157,0.16)"], icon: "trending-up", rank: 1 };
const TOP_DISPLAY: PackageDisplayInfo = { label: "TOP", color: "#1C1C1E", colorDark: "#FFFFFF", gradient: ["#1C1C1E", "#000000"], gradientDark: ["#FFFFFF", "#E5E5EA"], barGradient: ["rgba(28,28,30,0.14)", "rgba(28,28,30,0.05)", "rgba(28,28,30,0.14)"], barGradientDark: ["rgba(255,255,255,0.20)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.20)"], icon: "flash", rank: 2 };

export const PACKAGE_DISPLAY: Record<string, PackageDisplayInfo> = {
  boost: BOOST_DISPLAY,
  top: TOP_DISPLAY,
};

export function getPackageDisplay(packageCode: string): PackageDisplayInfo {
  return PACKAGE_DISPLAY[packageCode] || { label: packageCode.toUpperCase(), color: "#8E8E93", colorDark: "#98989D", gradient: ["#8E8E93", "#636366"], gradientDark: ["#98989D", "#8E8E93"], barGradient: ["rgba(142,142,147,0.12)", "rgba(142,142,147,0.04)", "rgba(142,142,147,0.12)"], barGradientDark: ["rgba(152,152,157,0.16)", "rgba(152,152,157,0.06)", "rgba(152,152,157,0.16)"], icon: "help-circle", rank: 0 };
}

export function getHighestPackageDisplay(
  activePromotions: Array<{ packageCode: string }> | undefined | null,
): PackageDisplayInfo | null {
  if (!activePromotions || activePromotions.length === 0) return null;
  let highest: PackageDisplayInfo | null = null;
  for (const p of activePromotions) {
    const info = PACKAGE_DISPLAY[p.packageCode];
    if (info && (!highest || info.rank > highest.rank)) {
      highest = info;
    }
  }
  return highest || getPackageDisplay(activePromotions[0].packageCode);
}
