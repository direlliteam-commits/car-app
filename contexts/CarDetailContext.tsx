import React, { createContext, useContext, ReactNode, RefObject } from "react";
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import type { ColorScheme } from "@/constants/colors";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";

export interface CarDetailContextValue {
  id: string | undefined;
  car: any;
  seller: any;
  colors: ColorScheme;
  detailColors: ColorScheme;
  isDark: boolean;
  displayCurrency: string;
  language: string;
  fieldVis: ReturnType<typeof getFieldVisibility> | null;
  equipmentCount: number;
  isOwnListing: boolean;
  isActive: boolean;
  isInactive: boolean;
  listingStatus: string;
  isFavorite: boolean;
  hasAlert: boolean;
  alertTriggered: boolean;
  existingAlert: any;
  marketPriceInfo: any;
  marketPriceQuery: any;
  similarQuery: any;
  specsQuery: any;
  exchangeRates: any;
  effectiveTradeInBonus: number | null;
  effectiveTradeInMaxAge: number | null;
  descriptionTruncated: boolean;
  descriptionNeedsExpand: boolean;
  showAltPrices: boolean;
  expandDescription: boolean;
  expandedDeals: Set<string>;
  activeImageIndex: number;
  selectedModIndex: number;
  showAllMods: boolean;
  galleryMessageLoading: boolean;
  scrollRef: RefObject<ScrollView | null>;
  creditCardY: React.MutableRefObject<number>;
  contentWrapY: React.MutableRefObject<number>;
  setActiveImageIndex: (v: number) => void;
  setSelectedModIndex: (v: number) => void;
  setShowAllMods: (v: boolean) => void;
  setShowAltPrices: (v: React.SetStateAction<boolean>) => void;
  setExpandDescription: (v: React.SetStateAction<boolean>) => void;
  setExpandedDeals: (v: React.SetStateAction<Set<string>>) => void;
  setDescriptionNeedsExpand: (v: boolean) => void;
  setShowPriceAnalysis: (v: boolean) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onFavorite: () => void;
  onMenuPress: () => void;
  onGalleryMessage: () => void;
  onPriceAlertOpen: () => void;
}

const CarDetailCtx = createContext<CarDetailContextValue | null>(null);

export function CarDetailProvider({ value, children }: { value: CarDetailContextValue; children: ReactNode }) {
  return <CarDetailCtx.Provider value={value}>{children}</CarDetailCtx.Provider>;
}

export function useCarDetailContext(): CarDetailContextValue {
  const ctx = useContext(CarDetailCtx);
  if (!ctx) throw new Error("useCarDetailContext must be used within CarDetailProvider");
  return ctx;
}
