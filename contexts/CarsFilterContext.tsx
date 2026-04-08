import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { CarFilters, SortOption } from "@/types/car";

const LISTINGS_DEBOUNCE_MS = 300;

interface CarsFilterContextValue {
  filters: CarFilters;
  searchQuery: string;
  sortOption: SortOption;
  debouncedFilters: CarFilters;
  debouncedSearchQuery: string;
  debouncedSortOption: SortOption;
  setFilters: React.Dispatch<React.SetStateAction<CarFilters>>;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

const CarsFilterContext = createContext<CarsFilterContextValue | null>(null);

export function CarsFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<CarFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [debouncedParams, setDebouncedParams] = useState({
    filters: {} as CarFilters,
    searchQuery: "",
    sortOption: "date_desc" as SortOption,
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedParams({ filters, searchQuery, sortOption });
    }, LISTINGS_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters, searchQuery, sortOption]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    const RANGE_KEYS: Array<[keyof CarFilters, keyof CarFilters]> = [
      ["yearFrom", "yearTo"], ["priceFrom", "priceTo"], ["mileageFrom", "mileageTo"],
      ["engineVolumeFrom", "engineVolumeTo"], ["horsepowerFrom", "horsepowerTo"],
      ["accelerationFrom", "accelerationTo"], ["payloadCapacityFrom", "payloadCapacityTo"],
      ["grossWeightFrom", "grossWeightTo"], ["seatingCapacityFrom", "seatingCapacityTo"],
      ["operatingHoursFrom", "operatingHoursTo"], ["operatingWeightFrom", "operatingWeightTo"],
      ["seatHeightFrom", "seatHeightTo"], ["dryWeightFrom", "dryWeightTo"],
      ["fuelTankCapacityFrom", "fuelTankCapacityTo"], ["bucketVolumeFrom", "bucketVolumeTo"],
      ["diggingDepthFrom", "diggingDepthTo"], ["boomLengthFrom", "boomLengthTo"],
      ["bladeWidthFrom", "bladeWidthTo"], ["liftingCapacityFrom", "liftingCapacityTo"],
      ["liftingHeightFrom", "liftingHeightTo"], ["drumVolumeFrom", "drumVolumeTo"],
      ["rollerWidthFrom", "rollerWidthTo"], ["cuttingWidthFrom", "cuttingWidthTo"],
      ["drillingDepthFrom", "drillingDepthTo"], ["pavingWidthFrom", "pavingWidthTo"],
      ["platformCapacityFrom", "platformCapacityTo"],
    ];
    const SINGLE_RANGE_KEYS: Array<keyof CarFilters> = ["fuelConsumptionTo", "groundClearanceFrom", "trunkVolumeFrom", "trunkVolumeTo"];
    const ARRAY_KEYS: Array<keyof CarFilters> = [
      "bodyTypes", "fuelTypes", "transmissions", "driveTypes", "colors", "conditions",
      "sellerTypes", "steeringWheels", "ownersCounts", "equipment", "importCountries",
      "accidentHistories", "availabilities", "characteristics", "axleCounts", "cabinTypes",
      "wheelConfigurations", "coolingTypes", "cylinderCounts", "chassisTypes",
      "suspensionTypes", "euroClasses", "tractionClasses",
    ];
    const BOOL_KEYS: Array<keyof CarFilters> = [
      "hasGasEquipment", "exchangePossible", "installmentPossible",
      "creditAvailable", "noLegalIssues", "customsCleared", "hasPTO",
    ];

    let count = 0;
    if (filters.vehicleType) count++;
    if (filters.vehicleSelections && filters.vehicleSelections.length > 0) count += filters.vehicleSelections.length;
    if (filters.hasPhotos) count++;
    for (const [from, to] of RANGE_KEYS) if (filters[from] || filters[to]) count++;
    for (const k of SINGLE_RANGE_KEYS) if (filters[k]) count++;
    for (const k of ARRAY_KEYS) { const v = filters[k]; if (Array.isArray(v) && v.length > 0) count++; }
    for (const k of BOOL_KEYS) if (filters[k] !== undefined) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  const value = useMemo(
    () => ({
      filters,
      searchQuery,
      sortOption,
      debouncedFilters: debouncedParams.filters,
      debouncedSearchQuery: debouncedParams.searchQuery,
      debouncedSortOption: debouncedParams.sortOption,
      setFilters,
      setSearchQuery,
      setSortOption,
      clearFilters,
      hasActiveFilters,
      activeFiltersCount,
    }),
    [
      filters,
      searchQuery,
      sortOption,
      debouncedParams,
      clearFilters,
      hasActiveFilters,
      activeFiltersCount,
    ],
  );

  return <CarsFilterContext.Provider value={value}>{children}</CarsFilterContext.Provider>;
}

export function useCarsFilter() {
  const context = useContext(CarsFilterContext);
  if (!context) {
    throw new Error("useCarsFilter must be used within a CarsFilterProvider");
  }
  return context;
}
