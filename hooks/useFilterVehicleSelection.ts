import { useState, useCallback, useMemo } from "react";
import { CarFilters, VehicleSelection } from "@/types/car";
import { useBrands, useFilteredBrands, useModels, useGenerations } from "@/hooks/useCarHierarchy";
import type { BrandCategory } from "@/hooks/useCarHierarchy";
import { useAutoSkipEmptyStep } from "@/hooks/useAutoSkipEmptyStep";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import type { CascadeStep } from "@/components/filters/NonPassengerCascadePicker";

interface UseFilterVehicleSelectionParams {
  localFilters: CarFilters;
  updateFilter: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void;
  setActivePicker: (picker: string | null) => void;
}

export function useFilterVehicleSelection({
  localFilters,
  updateFilter,
  setActivePicker,
}: UseFilterVehicleSelectionParams) {
  const filterEquipmentClass = localFilters.vehicleType === "special" && localFilters.bodyTypes?.length === 1 ? localFilters.bodyTypes[0] : undefined;
  const {
    brands: apiBrands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    constructionBrands, bulldozerBrands, loaderBrands, craneBrands,
    roadBrands, agricultureBrands, specialVehicleBrands,
    loading: brandsLoading,
  } = useBrands(localFilters.vehicleType, filterEquipmentClass);

  const [brandSearch, setBrandSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("all");
  const categoryBrandsMap: Record<BrandCategory, typeof apiBrands> = {
    all: apiBrands, popular: popularBrands, foreign: foreignBrands,
    chinese: chineseBrands, russian: russianBrands,
    construction: constructionBrands, bulldozer: bulldozerBrands,
    loader: loaderBrands, crane: craneBrands, road: roadBrands,
    agriculture: agricultureBrands, special_vehicle: specialVehicleBrands,
  };
  const filteredBrands = useFilteredBrands(
    categoryBrandsMap[brandCategory] ?? apiBrands,
    brandSearch
  );

  const [modelSearch, setModelSearch] = useState("");
  const [editingSelectionIndex, setEditingSelectionIndex] = useState<number>(-1);
  const [pickerField, setPickerField] = useState<CascadeField>("brand");
  const [pickerBrandId, setPickerBrandId] = useState<number | null>(null);
  const [pickerModelId, setPickerModelId] = useState<number | null>(null);
  const { models: pickerModels, loading: modelsLoading } = useModels(pickerBrandId, filterEquipmentClass, localFilters.vehicleType);
  const { generations: pickerGenerations, loading: generationsLoading } = useGenerations(pickerModelId);
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return pickerModels;
    const q = modelSearch.toLowerCase().trim();
    return pickerModels.filter(m => m.name.toLowerCase().includes(q));
  }, [pickerModels, modelSearch]);

  const closeFilterCascade = useCallback(() => {
    setActivePicker(null);
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
  }, [setActivePicker]);

  const isFilterManualModelType = localFilters.vehicleType === "special" || localFilters.vehicleType === "truck" || localFilters.vehicleType === "moto";
  const onFilterModelsEmpty = useCallback(() => {
    if (isFilterManualModelType) {
      setPickerField("manualModel");
    } else {
      closeFilterCascade();
    }
  }, [isFilterManualModelType, closeFilterCascade]);

  useAutoSkipEmptyStep(
    modelsLoading, pickerModels.length,
    pickerField === "model", pickerBrandId !== null, onFilterModelsEmpty,
  );
  useAutoSkipEmptyStep(
    generationsLoading, pickerGenerations.length,
    pickerField === "generation", pickerModelId !== null, closeFilterCascade,
  );

  const isNonPassengerType = localFilters.vehicleType === "special" || localFilters.vehicleType === "truck" || localFilters.vehicleType === "moto";

  const [cascadeInitialStep, setCascadeInitialStep] = useState<CascadeStep>("purpose");
  const [selectedNonPassengerCategory, setSelectedNonPassengerCategory] = useState<string | null>(null);

  const deferPicker = useCallback((pickerName: string) => {
    setTimeout(() => setActivePicker(pickerName), 50);
  }, [setActivePicker]);

  const addNewVehicleSelection = () => {
    setEditingSelectionIndex(-1);
    setPickerBrandId(null);
    setPickerModelId(null);
    setPickerField("brand");
    deferPicker("vehicleCascade");
  };

  const openFieldPicker = (index: number, field: "brand" | "model" | "generation") => {
    const sel = (localFilters.vehicleSelections || [])[index];
    if (!sel) return;
    setEditingSelectionIndex(index);
    setPickerField(field);
    let resolvedBrandId = sel.brandId || null;
    if (!resolvedBrandId && sel.brand) {
      const found = apiBrands.find(b => b.name.toLowerCase() === sel.brand!.toLowerCase());
      if (found) resolvedBrandId = found.id;
    }
    if (field === "brand") {
      setPickerBrandId(null);
      setPickerModelId(null);
    } else if (field === "model") {
      setPickerBrandId(resolvedBrandId);
      setPickerModelId(null);
    } else {
      setPickerBrandId(resolvedBrandId);
      setPickerModelId(sel.modelId || null);
    }
    deferPicker("vehicleCascade");
  };

  const openPurposePicker = () => {
    setEditingSelectionIndex(-1);
    setPickerBrandId(null);
    setPickerModelId(null);
    setCascadeInitialStep("purpose");
    setActivePicker("bodyType");
  };

  const openBodyTypePicker = () => {
    setEditingSelectionIndex(-1);
    setPickerBrandId(null);
    setPickerModelId(null);
    if (localFilters.bodyTypes?.length || selectedNonPassengerCategory) {
      setCascadeInitialStep("bodyType");
    } else {
      setCascadeInitialStep("purpose");
    }
    setActivePicker("bodyType");
  };

  const updateVehicleField = (index: number, field: "brand" | "model" | "generation", value: Partial<VehicleSelection>) => {
    const current = [...(localFilters.vehicleSelections || [])];
    if (index === -1) {
      const newSel: VehicleSelection = { brand: value.brand || "", ...value };
      current.push(newSel);
      updateFilter("vehicleSelections", current);
      const newIndex = current.length - 1;
      setEditingSelectionIndex(newIndex);
      if (value.brandId) {
        setPickerBrandId(value.brandId);
        setPickerField("model");
      }
    } else {
      if (field === "brand") {
        current[index] = { brand: value.brand || "", brandId: value.brandId };
      } else if (field === "model") {
        current[index] = { ...current[index], model: value.model, modelId: value.modelId, generation: undefined };
      } else {
        current[index] = { ...current[index], generation: value.generation };
      }
      updateFilter("vehicleSelections", current);
      if (field === "brand" && value.brandId) {
        setPickerBrandId(value.brandId);
        setPickerField("model");
      } else if (field === "model" && value.modelId && !isNonPassengerType) {
        setPickerModelId(value.modelId);
        setPickerField("generation");
      } else {
        setActivePicker(null);
      }
    }
  };

  const clearVehicleField = (index: number, field: "brand" | "model" | "generation") => {
    const current = [...(localFilters.vehicleSelections || [])];
    if (field === "brand") {
      current.splice(index, 1);
      updateFilter("vehicleSelections", current.length > 0 ? current : undefined);
    } else if (field === "model") {
      current[index] = { brand: current[index].brand, brandId: current[index].brandId };
      updateFilter("vehicleSelections", current);
    } else {
      current[index] = { ...current[index], generation: undefined };
      updateFilter("vehicleSelections", current);
    }
  };

  const resetPicker = () => {
    setEditingSelectionIndex(-1);
    setPickerField("brand");
    setPickerBrandId(null);
    setPickerModelId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
  };

  return {
    apiBrands,
    brandsLoading,
    filteredBrands,
    filteredModels,
    pickerGenerations,
    brandSearch,
    setBrandSearch,
    modelSearch,
    setModelSearch,
    brandCategory,
    setBrandCategory,
    editingSelectionIndex,
    pickerField,
    setPickerField,
    pickerBrandId,
    setPickerBrandId,
    pickerModelId,
    setPickerModelId,
    modelsLoading,
    generationsLoading,
    closeFilterCascade,
    isNonPassengerType,
    cascadeInitialStep,
    selectedNonPassengerCategory,
    setSelectedNonPassengerCategory,
    addNewVehicleSelection,
    openFieldPicker,
    openPurposePicker,
    openBodyTypePicker,
    updateVehicleField,
    clearVehicleField,
    resetPicker,
  };
}
