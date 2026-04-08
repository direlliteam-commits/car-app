import React, { createContext, useContext, ReactNode } from "react";
import type { ApiModification, ApiConfiguration, BrandCategory } from "@/hooks/useCarHierarchy";
import type { EquipmentCategory } from "@/types/vehicle";
import type { Condition } from "@/types/car";
import type { CascadeField } from "@/components/filters/cascade/cascadeConstants";
import type { ColorScheme } from "@/constants/colors";

export interface VehicleCascadeContextValue {
  cascadeField: CascadeField;
  filteredBrands: Array<{ id: number; name: string; cyrillicName?: string | null; popular?: boolean; logoUrl?: string | null }>;
  filteredModels: Array<{ id: number; name: string }>;
  cascadeGenerations: Array<{ id: number; name: string; yearFrom?: number | null; yearTo?: number | null; restyling?: boolean; imageUrl?: string | null }>;
  cascadeConfigurations?: ApiConfiguration[];
  cascadeModifications?: ApiModification[];
  brandSearch: string;
  setBrandSearch: (v: string) => void;
  modelSearch: string;
  setModelSearch: (v: string) => void;
  brandCategory: BrandCategory;
  setBrandCategory: (v: BrandCategory) => void;
  vehicleType?: string;
  cascadeConfigurationId?: number | null;
  brandsLoading: boolean;
  modelsLoading: boolean;
  generationsLoading: boolean;
  configurationsLoading: boolean;
  modificationsLoading: boolean;
  purposeCategories?: EquipmentCategory[];
  selectedPurpose?: string | null;
  onSelectPurpose?: (categoryValue: string) => void;
  onSelectEquipmentType?: (bodyType: string) => void;
  onSelectBrand: (brand: { id: number; name: string }) => void;
  onSelectModel: (model: { id: number; name: string }) => void;
  onSelectGeneration: (gen: { id: number; name: string; yearFrom?: number | null; yearTo?: number | null }) => void;
  onSelectConfiguration?: (config: ApiConfiguration) => void;
  onSelectModification?: (mod: ApiModification, config: ApiConfiguration | null) => void;
  onSkipBrand?: () => void;
  onSkipGeneration?: () => void;
  onSkipConfiguration?: () => void;
  onSkipModification?: (configId: number | null, configs: ApiConfiguration[]) => void;
  onManualModelSubmit?: (model: string, yearFrom?: number, yearTo?: number) => void;
  onSelectYear?: (year: number) => void;
  onSelectCondition?: (condition: Condition) => void;
  canBeNew?: boolean;
  onSelectWarranty?: (warranty: string) => void;
  onSubmitMileage?: (mileage: string) => void;
  onSelectSteering?: (steering: "left" | "right") => void;
  onSelectAccidentHistory?: (history: string) => void;
  onSubmitBodyDiagram?: () => void;
  onBodyDamagesChange?: (damages: Record<string, string>) => void;
  onSelectColor?: (color: string) => void;
  onSkipColor?: () => void;
  onSubmitVin?: (vin: string) => void;
  onSkipVin?: () => void;
  onSubmitDescription?: (desc: string) => void;
  onSkipDescription?: () => void;
  cascadeYears?: number[];
  formData?: { condition?: string; warranty?: string; mileage?: string; seatingCapacity?: string; year?: number; steeringWheel?: string; ownersCount?: number; accidentHistory?: string; color?: string; vin?: string; description?: string; bodyDamages?: Record<string, string> };
  onBack: () => void;
  colors: ColorScheme | Record<string, string>;
  isDark: boolean;
  selectedBrandName?: string;
  selectedModelName?: string;
  selectedPurposeName?: string;
  selectedEquipmentTypeName?: string;
  currentFilterParams?: string;
  stepCounter?: string;
}

const VehicleCascadeCtx = createContext<VehicleCascadeContextValue | null>(null);

export function VehicleCascadeProvider({ value, children }: { value: VehicleCascadeContextValue; children: ReactNode }) {
  return <VehicleCascadeCtx.Provider value={value}>{children}</VehicleCascadeCtx.Provider>;
}

export function useVehicleCascadeContext(): VehicleCascadeContextValue {
  const ctx = useContext(VehicleCascadeCtx);
  if (!ctx) throw new Error("useVehicleCascadeContext must be used within VehicleCascadeProvider");
  return ctx;
}
