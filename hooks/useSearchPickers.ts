import { useState, useMemo, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { VehicleSelection, CarFilters } from "@/types/car";
import { buildQueryString } from "@/contexts/CarsContext";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import { useBrands, useFilteredBrands, useModels, useGenerations } from "@/hooks/useCarHierarchy";
import type { BrandCategory } from "@/hooks/useCarHierarchy";
import { useAutoSkipEmptyStep } from "@/hooks/useAutoSkipEmptyStep";
import { BODY_TYPES, SPECIAL_BODY_TYPES, TRUCK_BODY_TYPES, MOTO_BODY_TYPES } from "@/types/car";
import type { BodyType } from "@/types/car";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";
import { useQuery } from "@tanstack/react-query";

interface UseSearchPickersParams {
  filters: CarFilters;
  setFilters: (fn: ((prev: CarFilters) => CarFilters) | CarFilters) => void;
  searchQuery: string;
  totalCount: number;
  isFetching: boolean;
  t: (key: string) => string;
}

export function useSearchPickers({
  filters,
  setFilters,
  searchQuery,
  totalCount,
  isFetching,
  t,
}: UseSearchPickersParams) {
  const [activePicker, setActivePicker] = useState<"price" | "year" | "mileage" | "location" | "vehicleCascade" | "bodyType" | null>(null);
  const [pillDraftOverrides, setPillDraftOverrides] = useState<Partial<CarFilters> | null>(null);
  const [pickerField, setPickerField] = useState<CascadeField>("brand");
  const [pickerBrandId, setPickerBrandId] = useState<number | null>(null);
  const [pickerModelId, setPickerModelId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("popular");
  const [editingVehicleIndex, setEditingVehicleIndex] = useState(-1);
  const [cascadeInitialStep, setCascadeInitialStep] = useState<string>("purpose");
  const reviewsPickerModeRef = useRef(false);

  const isNonPassengerType = filters.vehicleType === "special" || filters.vehicleType === "truck" || filters.vehicleType === "moto";
  const singleBodyType = filters.bodyTypes?.length === 1 ? filters.bodyTypes[0] : undefined;
  const filterFieldVis = getFieldVisibility(filters.vehicleType as any, singleBodyType);
  const hideMileagePill = !filterFieldVis.mileage;

  const filterEquipmentClass = filters.vehicleType === "special" && filters.bodyTypes?.length === 1 ? filters.bodyTypes[0] : undefined;

  const {
    brands: allBrands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    constructionBrands, bulldozerBrands, loaderBrands, craneBrands,
    roadBrands, agricultureBrands, specialVehicleBrands,
    loading: brandsLoading,
  } = useBrands(filters.vehicleType || undefined, filterEquipmentClass);

  const categoryBrandsMap: Record<BrandCategory, typeof allBrands> = {
    all: allBrands, popular: popularBrands, foreign: foreignBrands,
    chinese: chineseBrands, russian: russianBrands,
    construction: constructionBrands, bulldozer: bulldozerBrands,
    loader: loaderBrands, crane: craneBrands, road: roadBrands,
    agriculture: agricultureBrands, special_vehicle: specialVehicleBrands,
  };

  const filteredBrandsData = useFilteredBrands(categoryBrandsMap[brandCategory] ?? allBrands, brandSearch);
  const { models: pickerModels, loading: modelsLoading } = useModels(pickerBrandId, filterEquipmentClass);
  const { generations: pickerGenerations, loading: generationsLoading } = useGenerations(pickerModelId);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return pickerModels;
    const q = modelSearch.toLowerCase();
    return pickerModels.filter(m => m.name.toLowerCase().includes(q));
  }, [pickerModels, modelSearch]);

  const closeCascade = useCallback(() => {
    setActivePicker(null);
    setEditingVehicleIndex(-1);
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
    reviewsPickerModeRef.current = false;
  }, []);

  const onModelsEmpty = useCallback(() => {
    if (isNonPassengerType) {
      setPickerField("manualModel");
    } else {
      closeCascade();
    }
  }, [isNonPassengerType, closeCascade]);

  useAutoSkipEmptyStep(modelsLoading, pickerModels.length, pickerField === "model", pickerBrandId !== null, onModelsEmpty);
  useAutoSkipEmptyStep(generationsLoading, pickerGenerations.length, pickerField === "generation", pickerModelId !== null, closeCascade);

  const pillPreviewFilters = useMemo(() => {
    if (!pillDraftOverrides) return null;
    return { ...filters, ...pillDraftOverrides };
  }, [filters, pillDraftOverrides]);

  const pillCountQs = useMemo(() => {
    if (!pillPreviewFilters) return null;
    return buildQueryString(pillPreviewFilters, searchQuery, "date_desc", 0).replace("limit=50", "limit=0");
  }, [pillPreviewFilters, searchQuery]);

  const { data: pillPreviewCount, isFetching: isPillCountFetching } = useQuery({
    queryKey: [API.listings.list, "pill-count", pillCountQs],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API.listings.list}?${pillCountQs}`);
      const data = await res.json();
      return data.total as number;
    },
    enabled: !!pillCountQs && !!activePicker,
    staleTime: 3000,
  });

  const pillResultCount = pillDraftOverrides && activePicker ? (pillPreviewCount ?? totalCount) : totalCount;
  const pillIsLoading = pillDraftOverrides && activePicker ? isPillCountFetching : isFetching;

  const cascadeFilterParams = useMemo(() => {
    const filtersWithoutVehicle = { ...filters, vehicleSelections: undefined, brand: undefined, model: undefined };
    const qs = buildQueryString(filtersWithoutVehicle, "", "date_desc", 0);
    return qs.replace(/&?limit=50/, "").replace(/&?offset=0/, "").replace(/&?sort=date_desc/, "").replace(/^&/, "");
  }, [filters]);

  const vehicleSelections = useMemo(() => {
    return (filters.vehicleSelections as Array<{ brand: string; brandId?: number; model?: string; modelId?: number; generation?: string }>) || [];
  }, [filters.vehicleSelections]);

  const openPicker = useCallback((picker: "price" | "year" | "mileage" | "location") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePicker(picker);
  }, []);

  const openModelPickerForReviews = useCallback(() => {
    if (vehicleSelections.length !== 1 || !vehicleSelections[0].brand) return;
    const sel = vehicleSelections[0];
    reviewsPickerModeRef.current = true;
    setEditingVehicleIndex(0);
    setBrandSearch("");
    setModelSearch("");
    let resolvedBrandId = sel.brandId ?? null;
    if (!resolvedBrandId && sel.brand) {
      const found = allBrands.find(b => b.name.toLowerCase() === sel.brand!.toLowerCase());
      if (found) resolvedBrandId = found.id;
    }
    if (isNonPassengerType) {
      setCascadeInitialStep("model");
      setPickerBrandId(resolvedBrandId);
      setActivePicker("bodyType");
    } else {
      setPickerField("model");
      setPickerBrandId(resolvedBrandId);
      setPickerModelId(null);
      setActivePicker("vehicleCascade");
    }
  }, [vehicleSelections, isNonPassengerType, allBrands]);

  const openBrandPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingVehicleIndex(-1);
    setPickerBrandId(null);
    setPickerModelId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    if (isNonPassengerType) {
      if (filters.bodyTypes && filters.bodyTypes.length > 0) {
        setCascadeInitialStep("brand");
      } else {
        setCascadeInitialStep("purpose");
      }
      setActivePicker("bodyType");
    } else {
      setPickerField("brand");
      setActivePicker("vehicleCascade");
    }
  }, [isNonPassengerType, filters.bodyTypes]);

  const openBodyTypePicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCascadeInitialStep("purpose");
    setActivePicker("bodyType");
  }, []);

  const handleRemoveBodyType = useCallback((bt: BodyType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters((prev: CarFilters) => {
      const current = (prev.bodyTypes || []) as BodyType[];
      const updated = current.filter(b => b !== bt);
      return { ...prev, bodyTypes: updated.length > 0 ? updated : undefined };
    });
  }, [setFilters]);

  const bodyTypeOptionsForVehicle = useMemo(() => {
    const vt = filters.vehicleType;
    let allowedValues: BodyType[] = [];
    if (vt === "special") allowedValues = SPECIAL_BODY_TYPES;
    else if (vt === "truck") allowedValues = TRUCK_BODY_TYPES;
    else if (vt === "moto") allowedValues = MOTO_BODY_TYPES;
    return BODY_TYPES.filter(bt => allowedValues.includes(bt.value));
  }, [filters.vehicleType]);

  const handleVehicleCardPress = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sel = (filters.vehicleSelections || [])[idx] as VehicleSelection | undefined;
    if (!sel) return;
    setEditingVehicleIndex(idx);
    setBrandSearch("");
    setModelSearch("");
    let resolvedBrandId = sel.brandId ?? null;
    if (!resolvedBrandId && sel.brand) {
      const found = allBrands.find(b => b.name.toLowerCase() === sel.brand!.toLowerCase());
      if (found) resolvedBrandId = found.id;
    }
    if (isNonPassengerType) {
      if (!sel.brand) {
        setCascadeInitialStep("brand");
        setPickerBrandId(null);
      } else if (!sel.model) {
        setCascadeInitialStep("model");
        setPickerBrandId(resolvedBrandId);
      } else {
        setCascadeInitialStep("brand");
        setPickerBrandId(null);
      }
      setActivePicker("bodyType");
    } else {
      if (!sel.model) {
        setPickerField("model");
        setPickerBrandId(resolvedBrandId);
        setPickerModelId(null);
      } else if (!sel.generation) {
        setPickerField("generation");
        setPickerBrandId(resolvedBrandId);
        setPickerModelId(sel.modelId ?? null);
      } else {
        setPickerField("generation");
        setPickerBrandId(resolvedBrandId);
        setPickerModelId(sel.modelId ?? null);
      }
      setActivePicker("vehicleCascade");
    }
  }, [filters.vehicleSelections, isNonPassengerType, allBrands]);

  const handleRemoveVehicle = useCallback((brand: string, model?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters((prev: CarFilters) => {
      const selections = (prev.vehicleSelections || []) as Array<{ brand: string; brandId?: number; model?: string; modelId?: number; generation?: string }>;
      const updated = selections.filter(s => !(s.brand === brand && (s.model || "") === (model || "")));
      return { ...prev, vehicleSelections: updated.length > 0 ? updated : undefined };
    });
  }, [setFilters]);

  const getApplySubLabel = useCallback((count: number) => {
    const unitWord = filters.vehicleType === "moto"
      ? t("filters.motoUnit")
      : filters.vehicleType === "special"
      ? t("filters.listingsUnit")
      : t("filters.autoUnit");
    return `${count.toLocaleString("ru-RU")} ${unitWord}`;
  }, [filters.vehicleType, t]);

  return {
    activePicker, setActivePicker,
    pillDraftOverrides, setPillDraftOverrides,
    pickerField, setPickerField,
    pickerBrandId, setPickerBrandId,
    pickerModelId, setPickerModelId,
    brandSearch, setBrandSearch,
    modelSearch, setModelSearch,
    expandedRegions, setExpandedRegions,
    brandCategory, setBrandCategory,
    editingVehicleIndex, setEditingVehicleIndex,
    cascadeInitialStep, setCascadeInitialStep,
    reviewsPickerModeRef,
    isNonPassengerType, hideMileagePill, filterEquipmentClass,
    allBrands, filteredBrandsData, filteredModels,
    pickerGenerations, brandsLoading, modelsLoading, generationsLoading,
    closeCascade, cascadeFilterParams,
    pillResultCount, pillIsLoading,
    vehicleSelections,
    openPicker, openModelPickerForReviews, openBrandPicker, openBodyTypePicker,
    handleRemoveBodyType, bodyTypeOptionsForVehicle,
    handleVehicleCardPress, handleRemoveVehicle,
    getApplySubLabel,
  };
}
