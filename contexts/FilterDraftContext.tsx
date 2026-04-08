import React, { createContext, useContext, ReactNode } from "react";
import type {
  CarFilters,
  BodyType,
  FuelType,
  Transmission,
  DriveType,
  Condition,
  SteeringWheel,
  SellerType,
  OwnersCount,
  AccidentHistory,
  ImportCountry,
  Availability,
  CabinType,
  WheelConfiguration,
  CoolingType,
  ChassisType,
  SuspensionType,
  EuroClass,
} from "@/types/car";
import type { BODY_TYPES, DRIVE_TYPES } from "@/types/car";
import type { ColorScheme } from "@/constants/colors";

export interface FilterDraftState {
  activePicker: string | null;
  setActivePicker: (v: string | null) => void;
  updateFilter: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void;
  colors: ColorScheme;
  resultCount?: number;
  isCountLoading?: boolean;
  applySubLabel?: string;
  vehicleType?: string;
  isNonPassenger: boolean;
  filteredBodyTypes: typeof BODY_TYPES;
  filteredDriveTypes: typeof DRIVE_TYPES;
  toggleDraftMulti: <T extends string | number>(current: T[] | undefined, value: T, setter: (v: T[] | undefined) => void) => void;

  draftPrice: { from?: number; to?: number };
  setDraftPrice: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftYear: { from?: number; to?: number };
  setDraftYear: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftMileage: { from?: number; to?: number };
  setDraftMileage: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftEngine: { from?: number; to?: number };
  setDraftEngine: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftHorsepower: { from?: number; to?: number };
  setDraftHorsepower: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftPayload: { from?: number; to?: number };
  setDraftPayload: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftGrossWeight: { from?: number; to?: number };
  setDraftGrossWeight: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftOperatingHours: { from?: number; to?: number };
  setDraftOperatingHours: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftOperatingWeight: { from?: number; to?: number };
  setDraftOperatingWeight: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftSeatHeight: { from?: number; to?: number };
  setDraftSeatHeight: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftDryWeight: { from?: number; to?: number };
  setDraftDryWeight: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftFuelTank: { from?: number; to?: number };
  setDraftFuelTank: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftBucketVolume: { from?: number; to?: number };
  setDraftBucketVolume: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftLiftingCapacity: { from?: number; to?: number };
  setDraftLiftingCapacity: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftLiftingHeight: { from?: number; to?: number };
  setDraftLiftingHeight: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;
  draftSeatingCapacity: { from?: number; to?: number };
  setDraftSeatingCapacity: React.Dispatch<React.SetStateAction<{ from?: number; to?: number }>>;

  draftBodyTypes: BodyType[] | undefined;
  setDraftBodyTypes: (v: BodyType[] | undefined) => void;
  draftTransmissions: Transmission[] | undefined;
  setDraftTransmissions: (v: Transmission[] | undefined) => void;
  draftFuelTypes: FuelType[] | undefined;
  setDraftFuelTypes: (v: FuelType[] | undefined) => void;
  draftDriveTypes: DriveType[] | undefined;
  setDraftDriveTypes: (v: DriveType[] | undefined) => void;
  draftColors: string[] | undefined;
  setDraftColors: (v: string[] | undefined) => void;
  draftConditions: Condition[] | undefined;
  setDraftConditions: (v: Condition[] | undefined) => void;
  draftSellerTypes: SellerType[] | undefined;
  setDraftSellerTypes: (v: SellerType[] | undefined) => void;
  draftSteeringWheels: SteeringWheel[] | undefined;
  setDraftSteeringWheels: (v: SteeringWheel[] | undefined) => void;
  draftAvailabilities: Availability[] | undefined;
  setDraftAvailabilities: (v: Availability[] | undefined) => void;
  draftEquipment: string[] | undefined;
  setDraftEquipment: (v: string[] | undefined) => void;
  draftCabinTypes: CabinType[] | undefined;
  setDraftCabinTypes: (v: CabinType[] | undefined) => void;
  draftWheelConfigs: WheelConfiguration[] | undefined;
  setDraftWheelConfigs: (v: WheelConfiguration[] | undefined) => void;
  draftCoolingTypes: CoolingType[] | undefined;
  setDraftCoolingTypes: (v: CoolingType[] | undefined) => void;
  draftCylinderCounts: number[] | undefined;
  setDraftCylinderCounts: (v: number[] | undefined) => void;
  draftChassisTypes: ChassisType[] | undefined;
  setDraftChassisTypes: (v: ChassisType[] | undefined) => void;
  draftSuspensionTypes: SuspensionType[] | undefined;
  setDraftSuspensionTypes: (v: SuspensionType[] | undefined) => void;
  draftEuroClasses: EuroClass[] | undefined;
  setDraftEuroClasses: (v: EuroClass[] | undefined) => void;
  draftAxleCounts: number[] | undefined;
  setDraftAxleCounts: (v: number[] | undefined) => void;
  draftOwners: OwnersCount[] | undefined;
  setDraftOwners: (v: OwnersCount[] | undefined) => void;
  draftAccident: AccidentHistory[] | undefined;
  setDraftAccident: (v: AccidentHistory[] | undefined) => void;
  draftImportCountry: ImportCountry[] | undefined;
  setDraftImportCountry: (v: ImportCountry[] | undefined) => void;
  draftLocation: string[] | undefined;
  setDraftLocation: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  expandedRegions: Record<string, boolean>;
  setExpandedRegions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const FilterDraftContext = createContext<FilterDraftState | null>(null);

export function FilterDraftProvider({ value, children }: { value: FilterDraftState; children: ReactNode }) {
  return <FilterDraftContext.Provider value={value}>{children}</FilterDraftContext.Provider>;
}

export function useFilterDraft(): FilterDraftState {
  const ctx = useContext(FilterDraftContext);
  if (!ctx) throw new Error("useFilterDraft must be used within FilterDraftProvider");
  return ctx;
}
