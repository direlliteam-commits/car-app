import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useCars, buildQueryString } from "@/contexts/CarsContext";
import { useSavedSearches } from "@/contexts/SavedSearchContext";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { CarFilters } from "@/types/car";
import { SPECIAL_EQUIPMENT_CATEGORIES, TRUCK_GROUPS, MOTO_CATEGORIES } from "@/types/vehicle";
import { getFilterFieldsForEquipmentType } from "@/lib/special-equipment-fields";
import { getFilterFieldsForTruckType } from "@/lib/truck-fields";
import { getFilterFieldsForMotoType } from "@/lib/moto-fields";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";
import { useTranslation } from "@/lib/i18n";
import { getBodyTypeLabel } from "@/lib/vehicle-labels";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import { useFilterVehicleSelection } from "@/hooks/useFilterVehicleSelection";

export { type ActivePill } from "@/hooks/useFilterLabels";

export function useFilterFormState() {
  const { t } = useTranslation();
  const { filters, setFilters, clearFilters } = useCars();
  const { saveSearch } = useSavedSearches();

  const [localFilters, setLocalFilters] = useState<CarFilters>(filters);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    history: false,
  });
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const additionalSectionY = useRef(0);
  const [searchName, setSearchName] = useState("");
  const [searchNotifications, setSearchNotifications] = useState(true);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const [draftOverrides, setDraftOverrides] = useState<Partial<CarFilters> | null>(null);

  const effectiveFilters = useMemo(() => {
    if (!draftOverrides) return localFilters;
    return { ...localFilters, ...draftOverrides };
  }, [localFilters, draftOverrides]);

  const countQueryString = useMemo(() => {
    return buildQueryString(effectiveFilters, "", "date_desc", 0).replace("limit=50", "limit=0");
  }, [effectiveFilters]);

  const cascadeFilterParams = useMemo(() => {
    const filtersWithoutVehicle = { ...localFilters, vehicleSelections: undefined, brand: undefined, model: undefined };
    const qs = buildQueryString(filtersWithoutVehicle, "", "date_desc", 0);
    return qs.replace(/&?limit=50/, "").replace(/&?offset=0/, "").replace(/&?sort=date_desc/, "").replace(/^&/, "");
  }, [localFilters]);

  const { data: previewCount, isFetching: isCountFetching } = useQuery({
    queryKey: [API.listings.list, "count", countQueryString],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API.listings.list}?${countQueryString}`);
      const data = await res.json();
      return data.total as number;
    },
    staleTime: 5000,
  });

  const displayCount = previewCount ?? 0;

  const updateFilter = <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFilters(localFilters);
    router.replace("/search-results");
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalFilters({});
    clearFilters();
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveSearch(searchName.trim(), localFilters, searchNotifications, displayCount);
    setActivePicker(null);
    setSearchName("");
    if (router.canGoBack()) router.back(); else router.replace("/(tabs)");
  };

  const toggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const vehicleSelection = useFilterVehicleSelection({
    localFilters,
    updateFilter,
    setActivePicker,
  });

  useEffect(() => {
    if (vehicleSelection.brandsLoading || !vehicleSelection.apiBrands.length) return;
    const sels = localFilters.vehicleSelections;
    if (!sels?.length) return;
    const needsResolve = sels.some(s => s.brand && !s.brandId);
    if (!needsResolve) return;
    const resolved = sels.map(s => {
      if (s.brand && !s.brandId) {
        const found = vehicleSelection.apiBrands.find(b => b.name.toLowerCase() === s.brand!.toLowerCase());
        if (found) return { ...s, brandId: found.id };
      }
      return s;
    });
    setLocalFilters(prev => ({ ...prev, vehicleSelections: resolved }));
  }, [vehicleSelection.apiBrands, vehicleSelection.brandsLoading, localFilters.vehicleSelections]);

  const purposeCategories = useMemo(() => {
    if (localFilters.vehicleType === "special") return SPECIAL_EQUIPMENT_CATEGORIES;
    if (localFilters.vehicleType === "truck") return TRUCK_GROUPS;
    if (localFilters.vehicleType === "moto") return MOTO_CATEGORIES;
    return undefined;
  }, [localFilters.vehicleType]);

  const handleSpecialBodyTypeChange = useCallback((value: string | undefined) => {
    const prevBodyType = localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
    if (value) {
      updateFilter("bodyTypes", [value as any]);
    } else {
      updateFilter("bodyTypes", undefined);
    }
    if (prevBodyType !== value) {
      updateFilter("vehicleSelections", undefined);
      updateFilter("operatingHoursFrom", undefined);
      updateFilter("operatingHoursTo", undefined);
      updateFilter("operatingWeightFrom", undefined);
      updateFilter("operatingWeightTo", undefined);
      updateFilter("chassisTypes", undefined);
      updateFilter("bucketVolumeFrom", undefined);
      updateFilter("bucketVolumeTo", undefined);
      updateFilter("diggingDepthFrom", undefined);
      updateFilter("diggingDepthTo", undefined);
      updateFilter("boomLengthFrom", undefined);
      updateFilter("boomLengthTo", undefined);
      updateFilter("bladeWidthFrom", undefined);
      updateFilter("bladeWidthTo", undefined);
      updateFilter("tractionClasses", undefined);
      updateFilter("liftingCapacityFrom", undefined);
      updateFilter("liftingCapacityTo", undefined);
      updateFilter("liftingHeightFrom", undefined);
      updateFilter("liftingHeightTo", undefined);
      updateFilter("drumVolumeFrom", undefined);
      updateFilter("drumVolumeTo", undefined);
      updateFilter("rollerWidthFrom", undefined);
      updateFilter("rollerWidthTo", undefined);
      updateFilter("cuttingWidthFrom", undefined);
      updateFilter("cuttingWidthTo", undefined);
      updateFilter("hasPTO", undefined);
      updateFilter("drillingDepthFrom", undefined);
      updateFilter("drillingDepthTo", undefined);
      updateFilter("pavingWidthFrom", undefined);
      updateFilter("pavingWidthTo", undefined);
      updateFilter("platformCapacityFrom", undefined);
      updateFilter("platformCapacityTo", undefined);
    }
  }, [localFilters.bodyTypes, updateFilter]);

  const clearEquipmentSpecificFilters = useCallback(() => {
    updateFilter("vehicleSelections", undefined);
    updateFilter("operatingHoursFrom", undefined);
    updateFilter("operatingHoursTo", undefined);
    updateFilter("operatingWeightFrom", undefined);
    updateFilter("operatingWeightTo", undefined);
    updateFilter("chassisTypes", undefined);
    updateFilter("bucketVolumeFrom", undefined);
    updateFilter("bucketVolumeTo", undefined);
    updateFilter("diggingDepthFrom", undefined);
    updateFilter("diggingDepthTo", undefined);
    updateFilter("boomLengthFrom", undefined);
    updateFilter("boomLengthTo", undefined);
    updateFilter("bladeWidthFrom", undefined);
    updateFilter("bladeWidthTo", undefined);
    updateFilter("tractionClasses", undefined);
    updateFilter("liftingCapacityFrom", undefined);
    updateFilter("liftingCapacityTo", undefined);
    updateFilter("liftingHeightFrom", undefined);
    updateFilter("liftingHeightTo", undefined);
    updateFilter("drumVolumeFrom", undefined);
    updateFilter("drumVolumeTo", undefined);
    updateFilter("rollerWidthFrom", undefined);
    updateFilter("rollerWidthTo", undefined);
    updateFilter("cuttingWidthFrom", undefined);
    updateFilter("cuttingWidthTo", undefined);
    updateFilter("hasPTO", undefined);
    updateFilter("drillingDepthFrom", undefined);
    updateFilter("drillingDepthTo", undefined);
    updateFilter("pavingWidthFrom", undefined);
    updateFilter("pavingWidthTo", undefined);
    updateFilter("platformCapacityFrom", undefined);
    updateFilter("platformCapacityTo", undefined);
  }, [updateFilter]);

  const categoriesForVehicleType = useMemo(() => {
    if (localFilters.vehicleType === "special") return SPECIAL_EQUIPMENT_CATEGORIES;
    if (localFilters.vehicleType === "moto") return MOTO_CATEGORIES;
    if (localFilters.vehicleType === "truck") return TRUCK_GROUPS;
    return [];
  }, [localFilters.vehicleType]);

  const handleCategorySelect = useCallback((categoryBodyTypes: string[]) => {
    if (categoryBodyTypes.length === 0) {
      updateFilter("bodyTypes", undefined as any);
      vehicleSelection.setSelectedNonPassengerCategory(null);
      return;
    }
    updateFilter("bodyTypes", categoryBodyTypes as any);
    const cat = categoriesForVehicleType.find(c =>
      c.bodyTypes.length === categoryBodyTypes.length &&
      c.bodyTypes.every(bt => categoryBodyTypes.includes(bt))
    );
    if (cat) vehicleSelection.setSelectedNonPassengerCategory(cat.value);
  }, [updateFilter, categoriesForVehicleType, vehicleSelection.setSelectedNonPassengerCategory]);

  const handleBodyTypeToggle = useCallback((bodyType: string) => {
    if (vehicleSelection.isNonPassengerType) {
      const current = (localFilters.bodyTypes || []) as string[];
      const isSelected = current.length === 1 && current[0] === bodyType;
      if (isSelected) {
        updateFilter("bodyTypes", undefined);
      } else {
        updateFilter("bodyTypes", [bodyType] as any);
      }
    } else {
      const current = (localFilters.bodyTypes || []) as string[];
      const isSelected = current.includes(bodyType);
      if (isSelected) {
        const newTypes = current.filter(bt => bt !== bodyType);
        updateFilter("bodyTypes", newTypes.length > 0 ? newTypes as any : undefined);
      } else {
        updateFilter("bodyTypes", [...current, bodyType] as any);
      }
    }
  }, [localFilters.bodyTypes, updateFilter, vehicleSelection.isNonPassengerType]);

  const handleClearPurpose = useCallback(() => {
    updateFilter("bodyTypes", undefined);
    updateFilter("vehicleSelections", undefined);
    vehicleSelection.setSelectedNonPassengerCategory(null);
    clearEquipmentSpecificFilters();
  }, [updateFilter, clearEquipmentSpecificFilters, vehicleSelection.setSelectedNonPassengerCategory]);

  const matchedCategory = useMemo(() => {
    if (!categoriesForVehicleType.length) return undefined;
    if (localFilters.bodyTypes?.length) {
      const bts = localFilters.bodyTypes as string[];
      const cat = categoriesForVehicleType.find(c =>
        bts.every(bt => c.bodyTypes.includes(bt as any))
      );
      if (cat) return cat;
    }
    if (vehicleSelection.selectedNonPassengerCategory) {
      return categoriesForVehicleType.find(c => c.value === vehicleSelection.selectedNonPassengerCategory);
    }
    return undefined;
  }, [localFilters.bodyTypes, categoriesForVehicleType, vehicleSelection.selectedNonPassengerCategory]);

  const handleClearBodyTypeNarrowing = useCallback(() => {
    updateFilter("bodyTypes", undefined);
  }, [updateFilter]);

  const derivedCategoryLabel = useMemo(() => {
    return matchedCategory?.label;
  }, [matchedCategory]);

  const derivedBodyTypeLabels = useMemo(() => {
    if (!localFilters.bodyTypes?.length) return undefined;
    if (!matchedCategory) return undefined;
    const bts = localFilters.bodyTypes as string[];
    const allMatch = matchedCategory.bodyTypes.length === bts.length &&
      matchedCategory.bodyTypes.every(bt => bts.includes(bt));
    if (allMatch) return t("filters.allTypesPlaceholder");
    if (bts.length <= 2) {
      return bts.map(bt => getBodyTypeLabel(bt)).join(", ");
    }
    return `${bts.length} ${t("filters.selected")}`;
  }, [localFilters.bodyTypes, matchedCategory, t]);

  const specialEquipmentFields = useMemo(() => {
    if (localFilters.vehicleType !== "special") return [];
    const bodyType = localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
    if (!bodyType) return [];
    return getFilterFieldsForEquipmentType(bodyType);
  }, [localFilters.vehicleType, localFilters.bodyTypes]);

  const truckFields = useMemo(() => {
    if (localFilters.vehicleType !== "truck") return [];
    const bodyType = localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
    if (!bodyType) return [];
    return getFilterFieldsForTruckType(bodyType);
  }, [localFilters.vehicleType, localFilters.bodyTypes]);

  const motoFields = useMemo(() => {
    if (localFilters.vehicleType !== "moto") return [];
    const bodyType = localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
    if (!bodyType) return [];
    return getFilterFieldsForMotoType(bodyType);
  }, [localFilters.vehicleType, localFilters.bodyTypes]);

  const selectedBodyType = localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
  const vis = useMemo(() => getFieldVisibility(localFilters.vehicleType, selectedBodyType), [localFilters.vehicleType, selectedBodyType]);

  useEffect(() => {
    if (!vis.mileage) { updateFilter("mileageFrom", undefined); updateFilter("mileageTo", undefined); }
    if (!vis.transmission) { updateFilter("transmissions", undefined); }
    if (!vis.fuelType) { updateFilter("fuelTypes", undefined); }
    if (!vis.engineVolume) { updateFilter("engineVolumeFrom", undefined); updateFilter("engineVolumeTo", undefined); }
    if (!vis.driveType) { updateFilter("driveTypes", undefined); }
    if (!vis.steeringWheel) { updateFilter("steeringWheels", undefined); }
    if (!vis.horsepower) { updateFilter("horsepowerFrom", undefined); updateFilter("horsepowerTo", undefined); }
    if (!vis.gasEquipment) { updateFilter("hasGasEquipment", undefined); }
    if (!vis.color) { updateFilter("colors", undefined); }
  }, [vis.mileage, vis.transmission, vis.fuelType, vis.engineVolume, vis.driveType, vis.steeringWheel, vis.horsepower, vis.gasEquipment, vis.color]);

  const labels = useFilterLabels(localFilters, updateFilter);

  return {
    localFilters,
    setLocalFilters,
    expandedSections,
    activePicker,
    setActivePicker,
    additionalExpanded,
    setAdditionalExpanded,
    scrollViewRef,
    additionalSectionY,
    searchName,
    setSearchName,
    searchNotifications,
    setSearchNotifications,
    draftOverrides,
    setDraftOverrides,
    displayCount,
    isCountFetching,
    updateFilter,
    handleApply,
    handleClear,
    handleSaveSearch,
    toggleSection,
    cascadeFilterParams,
    filteredBrands: vehicleSelection.filteredBrands,
    filteredModels: vehicleSelection.filteredModels,
    pickerGenerations: vehicleSelection.pickerGenerations,
    brandSearch: vehicleSelection.brandSearch,
    setBrandSearch: vehicleSelection.setBrandSearch,
    modelSearch: vehicleSelection.modelSearch,
    setModelSearch: vehicleSelection.setModelSearch,
    brandCategory: vehicleSelection.brandCategory,
    setBrandCategory: vehicleSelection.setBrandCategory,
    editingSelectionIndex: vehicleSelection.editingSelectionIndex,
    pickerField: vehicleSelection.pickerField,
    setPickerField: vehicleSelection.setPickerField,
    pickerBrandId: vehicleSelection.pickerBrandId,
    setPickerBrandId: vehicleSelection.setPickerBrandId,
    pickerModelId: vehicleSelection.pickerModelId,
    setPickerModelId: vehicleSelection.setPickerModelId,
    brandsLoading: vehicleSelection.brandsLoading,
    modelsLoading: vehicleSelection.modelsLoading,
    generationsLoading: vehicleSelection.generationsLoading,
    closeFilterCascade: vehicleSelection.closeFilterCascade,
    isNonPassengerType: vehicleSelection.isNonPassengerType,
    purposeCategories,
    cascadeInitialStep: vehicleSelection.cascadeInitialStep,
    selectedNonPassengerCategory: vehicleSelection.selectedNonPassengerCategory,
    addNewVehicleSelection: vehicleSelection.addNewVehicleSelection,
    openFieldPicker: vehicleSelection.openFieldPicker,
    openPurposePicker: vehicleSelection.openPurposePicker,
    openBodyTypePicker: vehicleSelection.openBodyTypePicker,
    updateVehicleField: vehicleSelection.updateVehicleField,
    clearVehicleField: vehicleSelection.clearVehicleField,
    resetPicker: vehicleSelection.resetPicker,
    handleSpecialBodyTypeChange,
    handleCategorySelect,
    handleBodyTypeToggle,
    handleClearPurpose,
    handleClearBodyTypeNarrowing,
    derivedCategoryLabel,
    derivedBodyTypeLabels,
    specialEquipmentFields,
    truckFields,
    motoFields,
    vis,
    ...labels,
  };
}
