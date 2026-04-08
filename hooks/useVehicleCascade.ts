import { useState, useMemo, useCallback, useEffect, useRef, type MutableRefObject, type Dispatch, type SetStateAction } from "react";
import * as Haptics from "expo-haptics";
import type { FormData } from "@/types/car-form";
import { useBrands, useModels, useGenerations, useFilteredBrands, useConfigurations, useModifications } from "@/hooks/useCarHierarchy";
import type { ApiModification, ApiConfiguration, BrandCategory } from "@/hooks/useCarHierarchy";
import { mapBodyType, mapFuelType, mapTransmission, mapDriveType, mapEquipment } from "@/lib/carsbase-mapping";
import { useAutoSkipEmptyStep } from "@/hooks/useAutoSkipEmptyStep";
import type { CascadeField } from "@/components/filters/VehicleCascadePicker";
import { YEAR_OPTIONS } from "@/lib/filter-constants";
import type { Condition } from "@/types/car";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";

export function useVehicleCascade(
  formData: FormData,
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void,
  setActivePicker: (picker: string | null) => void,
  setExpandedSections: Dispatch<SetStateAction<Record<string, boolean>>>,
  setFormData: Dispatch<SetStateAction<FormData>>,
  generationYearToRef: MutableRefObject<number | null>,
) {
  const [cascadeField, setCascadeField] = useState<CascadeField>("brand");
  const [cascadeBrandId, setCascadeBrandId] = useState<number | null>(null);
  const [cascadeModelId, setCascadeModelId] = useState<number | null>(null);
  const [cascadeGenerationId, setCascadeGenerationId] = useState<number | null>(null);
  const [cascadeConfigurationId, setCascadeConfigurationId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [brandCategory, setBrandCategory] = useState<BrandCategory>("popular");
  const [autoFilledFromDb, setAutoFilledFromDb] = useState(false);
  const [selectedModification, setSelectedModification] = useState<ApiModification | null>(null);
  const [selectedConfiguration, setSelectedConfiguration] = useState<ApiConfiguration | null>(null);
  const [cascadePrevField, setCascadePrevField] = useState<CascadeField | null>(null);

  const equipmentClass = formData.vehicleType === "special" && formData.bodyType ? formData.bodyType : undefined;

  const {
    brands: apiBrands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    constructionBrands, bulldozerBrands, loaderBrands, craneBrands,
    roadBrands, agricultureBrands, specialVehicleBrands,
    loading: brandsLoading,
  } = useBrands(formData.vehicleType, equipmentClass);
  const selectedApiBrand = apiBrands.find((b) => b.name === formData.brand);
  const { models: apiModels } = useModels(selectedApiBrand?.id ?? null, equipmentClass);
  const selectedApiModel = apiModels.find((m) => m.name === formData.model);
  const { generations: apiGenerations } = useGenerations(selectedApiModel?.id ?? null);
  const selectedGeneration = apiGenerations.find((g) => g.name === formData.generation);
  const generationYearFrom = selectedGeneration?.yearFrom ?? null;
  const generationYearTo = selectedGeneration?.yearTo ?? null;
  generationYearToRef.current = generationYearTo;

  const categoryBrandsMap: Record<BrandCategory, typeof apiBrands> = {
    all: apiBrands,
    popular: popularBrands,
    foreign: foreignBrands,
    chinese: chineseBrands,
    russian: russianBrands,
    construction: constructionBrands,
    bulldozer: bulldozerBrands,
    loader: loaderBrands,
    crane: craneBrands,
    road: roadBrands,
    agriculture: agricultureBrands,
    special_vehicle: specialVehicleBrands,
  };

  const filteredBrands = useFilteredBrands(
    categoryBrandsMap[brandCategory] ?? apiBrands,
    brandSearch
  );

  const { models: cascadeModels, loading: cascadeModelsLoading } = useModels(cascadeBrandId, equipmentClass);
  const { generations: cascadeGenerations, loading: cascadeGenerationsLoading } = useGenerations(cascadeModelId);
  const { configurations: cascadeConfigurations, loading: cascadeConfigurationsLoading } = useConfigurations(cascadeGenerationId);
  const { modifications: cascadeModifications, loading: cascadeModificationsLoading } = useModifications(cascadeConfigurationId);

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return cascadeModels;
    const q = modelSearch.toLowerCase().trim();
    return cascadeModels.filter(m => m.name.toLowerCase().includes(q));
  }, [cascadeModels, modelSearch]);

  const cascadeYears = useMemo(() => {
    if (!generationYearFrom) return YEAR_OPTIONS;
    const maxYear = generationYearTo || new Date().getFullYear() + 1;
    return YEAR_OPTIONS.filter(y => y >= generationYearFrom && y <= maxYear);
  }, [generationYearFrom, generationYearTo]);

  const vis = useMemo(() => getFieldVisibility(formData.vehicleType, formData.bodyType), [formData.vehicleType, formData.bodyType]);

  const navigatingBackRef = useRef(false);
  const steeringAutoSkippedRef = useRef(false);
  const steeringFromModificationRef = useRef(false);

  const closeCascade = useCallback(() => {
    setCascadeField("brand");
    setCascadeBrandId(null);
    setCascadeModelId(null);
    setCascadeGenerationId(null);
    setCascadeConfigurationId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    setCascadePrevField(null);
    steeringAutoSkippedRef.current = false;
    steeringFromModificationRef.current = false;
    setActivePicker(null);
  }, [setActivePicker]);

  const finishCascade = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCascadeField("brand");
    setCascadeBrandId(null);
    setCascadeModelId(null);
    setCascadeGenerationId(null);
    setCascadeConfigurationId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    setCascadePrevField(null);
    steeringAutoSkippedRef.current = false;
    steeringFromModificationRef.current = false;
    setActivePicker(null);
    setFormData((currentForm) => {
      const currentVis = getFieldVisibility(currentForm.vehicleType, currentForm.bodyType);
      const hasUnfilledSpecs =
        (currentVis.fuelType && !currentForm.fuelType) ||
        (currentVis.transmission && !currentForm.transmission) ||
        (currentVis.driveType && !currentForm.driveType) ||
        (currentVis.engineVolume && !currentForm.engineVolume) ||
        (currentVis.horsepower && !currentForm.horsepower);
      if (hasUnfilledSpecs) {
        setExpandedSections((prev) => ({ ...prev, specs: true }));
      } else {
        setExpandedSections((prev) => ({ ...prev, media: true }));
      }
      return currentForm;
    });
  }, [setActivePicker, setExpandedSections, setFormData]);

  const transitionToYear = useCallback((fromField: CascadeField) => {
    setCascadePrevField(fromField);
    setCascadeField("year");
  }, []);

  const isManualModelType = formData.vehicleType === "special" || formData.vehicleType === "truck" || formData.vehicleType === "moto";

  const onModelsEmpty = useCallback(() => {
    if (isManualModelType) {
      setCascadeField("manualModel");
    } else {
      closeCascade();
    }
  }, [isManualModelType, closeCascade]);

  const onGenerationsEmpty = useCallback(() => {
    transitionToYear("generation");
  }, [transitionToYear]);

  const onConfigurationsEmpty = useCallback(() => {
    transitionToYear("configuration");
  }, [transitionToYear]);

  useAutoSkipEmptyStep(
    cascadeModelsLoading, cascadeModels.length,
    cascadeField === "model", cascadeBrandId !== null, onModelsEmpty,
  );
  useAutoSkipEmptyStep(
    cascadeGenerationsLoading, cascadeGenerations.length,
    cascadeField === "generation", cascadeModelId !== null, onGenerationsEmpty,
  );
  useAutoSkipEmptyStep(
    cascadeConfigurationsLoading, cascadeConfigurations.length,
    cascadeField === "configuration", cascadeGenerationId !== null, onConfigurationsEmpty,
  );

  useEffect(() => {
    if (selectedModification?.seats) {
      const seatsNum = parseInt(selectedModification.seats, 10);
      if (!isNaN(seatsNum) && seatsNum > 0) {
        updateField("seatingCapacity", String(seatsNum));
      }
    }
  }, [selectedModification, updateField]);

  useEffect(() => {
    if (cascadeField === "steering" && formData.steeringWheel && steeringFromModificationRef.current && !navigatingBackRef.current && !steeringAutoSkippedRef.current) {
      steeringAutoSkippedRef.current = true;
      setCascadeField(vis.color ? "color" : "vin");
    }
    if (cascadeField !== "steering") {
      navigatingBackRef.current = false;
    }
  }, [cascadeField, formData.steeringWheel, vis.color]);

  const resetCascade = useCallback(() => {
    setCascadeField("brand");
    setCascadeBrandId(null);
    setCascadeModelId(null);
    setCascadeGenerationId(null);
    setCascadeConfigurationId(null);
    setBrandSearch("");
    setModelSearch("");
    setBrandCategory("all");
    setCascadePrevField(null);
    steeringAutoSkippedRef.current = false;
    steeringFromModificationRef.current = false;
  }, []);

  const applyModificationData = useCallback((mod: ApiModification, config: ApiConfiguration | null) => {
    const mappedEquipment = mod.options ? mapEquipment(mod.options) : [];
    steeringFromModificationRef.current = false;
    setFormData((prev) => {
      const next = {
        ...prev,
        modificationId: mod.id,
        configurationId: config?.id,
        bodyType: config ? mapBodyType(config.bodyType) : prev.bodyType,
        fuelType: mapFuelType(mod.engineType),
        transmission: mapTransmission(mod.transmissionCode),
        driveType: mapDriveType(mod.drive),
        engineVolume: mod.engineCapacity ? String(mod.engineCapacity) : prev.engineVolume,
        horsepower: mod.horsePower ? String(mod.horsePower) : prev.horsepower,
        equipment: mappedEquipment.length > 0 ? mappedEquipment : prev.equipment,
        steeringWheel: prev.steeringWheel,
      };
      if (mod.drive) {
        if (!prev.steeringWheel) {
          next.steeringWheel = "left";
          steeringFromModificationRef.current = true;
        }
      }
      return next;
    });
    setSelectedModification(mod);
    setSelectedConfiguration(config);
    setAutoFilledFromDb(true);
    setExpandedSections((prev) => ({
      ...prev,
      specs: true,
      ...(mappedEquipment.length > 0 ? { equipment: true } : {}),
    }));
  }, [setFormData, setExpandedSections]);

  const onSelectBrand = useCallback((brand: { id: number; name: string }) => {
    setBrandSearch("");
    setBrandCategory("all");
    updateField("brand", brand.name);
    updateField("model", "");
    updateField("generation", "");
    setCascadeBrandId(brand.id);
    setCascadeField("model");
  }, [updateField]);

  const onSelectModel = useCallback((model: { id: number; name: string }) => {
    setModelSearch("");
    updateField("model", model.name);
    updateField("generation", "");
    setCascadeModelId(model.id);
    setCascadeField("generation");
  }, [updateField]);

  const onSelectGeneration = useCallback((gen: { id: number; name: string; yearFrom?: number | null; yearTo?: number | null; restyling?: boolean }) => {
    updateField("generation", gen.name);
    setCascadeGenerationId(gen.id);
    if (gen.yearFrom && formData.year != null) {
      const currentYear = formData.year;
      const yearTo = gen.yearTo || new Date().getFullYear() + 1;
      if (currentYear < gen.yearFrom || currentYear > yearTo) {
        updateField("year", undefined);
      }
    }
    if (formData.vehicleType === "truck" || formData.vehicleType === "special" || formData.vehicleType === "moto") {
      updateField("modificationId", undefined);
      updateField("configurationId", undefined);
      setSelectedModification(null);
      setSelectedConfiguration(null);
      transitionToYear("generation");
    } else {
      setCascadeField("configuration");
    }
  }, [formData.year, formData.vehicleType, updateField, transitionToYear]);

  const onSelectConfiguration = useCallback((config: { id: number }) => {
    setCascadeConfigurationId(config.id);
    setCascadeField("modification");
  }, []);

  const onSelectModification = useCallback((mod: ApiModification, config: ApiConfiguration | null) => {
    applyModificationData(mod, config);
    transitionToYear("modification");
  }, [applyModificationData, transitionToYear]);

  const onManualModelSubmit = useCallback((model: string, yearFrom?: number, yearTo?: number) => {
    updateField("model", model);
    updateField("generation", "");
    if (yearFrom) {
      updateField("year", yearFrom);
    }
    updateField("modificationId", undefined);
    updateField("configurationId", undefined);
    setSelectedModification(null);
    setSelectedConfiguration(null);
    transitionToYear("manualModel");
  }, [updateField, transitionToYear]);

  const canBeNew = useCallback((yearOverride?: number) => {
    const currentYear = new Date().getFullYear();
    const year = yearOverride ?? formData.year;
    return year != null && year >= currentYear - 2;
  }, [formData.year]);

  const onSelectYear = useCallback((year: number) => {
    updateField("year", year);
    if (!canBeNew(year) && formData.condition === "new") {
      updateField("condition", undefined as any);
      updateField("warranty", "");
    }
    setCascadeField("condition");
  }, [updateField, canBeNew, formData.condition]);

  const transitionToSteeringStep = useCallback(() => {
    if (vis.steeringWheel) {
      setCascadeField("steering");
    } else {
      if (vis.color) {
        setCascadeField("color");
      } else {
        setCascadeField("vin");
      }
    }
  }, [vis.steeringWheel, vis.color]);

  const onSelectSteering = useCallback((steering: "left" | "right") => {
    updateField("steeringWheel", steering);
    if (vis.color) {
      setCascadeField("color");
    } else {
      setCascadeField("vin");
    }
  }, [updateField, vis.color]);

  const onSelectCondition = useCallback((condition: Condition) => {
    updateField("condition", condition);
    if (condition === "new") {
      updateField("mileage", "");
      setCascadeField("warranty");
    } else if (condition === "used") {
      updateField("warranty", "");
      setCascadeField("mileage");
    } else {
      updateField("warranty", "");
      setCascadeField("accidentHistory");
    }
  }, [updateField]);

  const onSelectWarranty = useCallback((warranty: string) => {
    updateField("warranty", warranty);
    transitionToSteeringStep();
  }, [updateField, transitionToSteeringStep]);

  const onSubmitMileage = useCallback((mileage: string) => {
    updateField("mileage", mileage);
    transitionToSteeringStep();
  }, [updateField, transitionToSteeringStep]);

  const onSelectAccidentHistory = useCallback((history: string) => {
    updateField("accidentHistory", history as any);
    setCascadeField("bodyDiagram");
  }, [updateField]);

  const onBodyDamagesChange = useCallback((damages: Record<string, string>) => {
    updateField("bodyDamages", damages);
  }, [updateField]);

  const onSubmitBodyDiagram = useCallback(() => {
    setCascadeField("mileage");
  }, []);

  const onSelectColor = useCallback((color: string) => {
    updateField("color", color);
    setCascadeField("vin");
  }, [updateField]);

  const onSkipColor = useCallback(() => {
    setCascadeField("vin");
  }, []);

  const onSubmitVin = useCallback((vin: string) => {
    updateField("vin", vin);
    setCascadeField("description");
  }, [updateField]);

  const onSkipVin = useCallback(() => {
    setCascadeField("description");
  }, []);

  const onSubmitDescription = useCallback((desc: string) => {
    updateField("description", desc);
    finishCascade();
  }, [updateField, finishCascade]);

  const onSkipDescription = useCallback(() => {
    finishCascade();
  }, [finishCascade]);

  const onSkipGeneration = useCallback(() => {
    updateField("generation", "");
    updateField("modificationId", undefined);
    updateField("configurationId", undefined);
    setSelectedModification(null);
    setSelectedConfiguration(null);
    transitionToYear("generation");
  }, [updateField, transitionToYear]);

  const onSkipConfiguration = useCallback(() => {
    updateField("modificationId", undefined);
    updateField("configurationId", undefined);
    setSelectedModification(null);
    setSelectedConfiguration(null);
    transitionToYear("configuration");
  }, [updateField, transitionToYear]);

  const onSkipModification = useCallback((configId: number | null, configs: ApiConfiguration[]) => {
    updateField("modificationId", undefined);
    updateField("configurationId", configId ?? undefined);
    setSelectedModification(null);
    const selectedConfig = configs.find(c => c.id === configId) || null;
    if (selectedConfig) {
      updateField("bodyType", mapBodyType(selectedConfig.bodyType));
    }
    transitionToYear("modification");
  }, [updateField, transitionToYear]);

  const onCascadeBack = useCallback(() => {
    if (cascadeField === "description") {
      setCascadeField("vin");
    } else if (cascadeField === "vin") {
      if (vis.color) {
        setCascadeField("color");
      } else if (vis.steeringWheel) {
        navigatingBackRef.current = true;
        setCascadeField("steering");
      } else {
        if (formData.condition === "new") {
          setCascadeField("warranty");
        } else if (formData.condition === "damaged") {
          setCascadeField("mileage");
        } else {
          setCascadeField("mileage");
        }
      }
    } else if (cascadeField === "color") {
      if (vis.steeringWheel) {
        navigatingBackRef.current = true;
        setCascadeField("steering");
      } else {
        if (formData.condition === "new") {
          setCascadeField("warranty");
        } else if (formData.condition === "damaged") {
          setCascadeField("mileage");
        } else {
          setCascadeField("mileage");
        }
      }
    } else if (cascadeField === "steering") {
      navigatingBackRef.current = true;
      if (formData.condition === "new") {
        setCascadeField("warranty");
      } else if (formData.condition === "damaged") {
        setCascadeField("mileage");
      } else {
        setCascadeField("mileage");
      }
    } else if (cascadeField === "mileage") {
      if (formData.condition === "damaged") {
        setCascadeField("bodyDiagram");
      } else {
        setCascadeField("condition");
      }
    } else if (cascadeField === "bodyDiagram") {
      setCascadeField("accidentHistory");
    } else if (cascadeField === "accidentHistory") {
      setCascadeField("condition");
    } else if (cascadeField === "warranty") {
      setCascadeField("condition");
    } else if (cascadeField === "condition") {
      setCascadeField("year");
    } else if (cascadeField === "year") {
      if (cascadePrevField === "modification") {
        setCascadeField("modification");
        setCascadePrevField(null);
      } else if (cascadePrevField === "configuration") {
        setCascadeField(cascadeGenerations.length > 0 ? "generation" : "model");
        setCascadePrevField(null);
      } else if (cascadePrevField === "generation") {
        setCascadeField("model");
        setCascadePrevField(null);
      } else if (cascadePrevField === "manualModel") {
        setCascadeField("manualModel");
        setCascadePrevField(null);
      } else {
        setCascadeField("modification");
      }
    } else if (cascadeField === "modification") {
      setCascadeField("configuration");
    } else if (cascadeField === "configuration") {
      setCascadeGenerationId(null);
      setCascadeField("generation");
    } else if (cascadeField === "generation") {
      setCascadeModelId(null);
      setCascadeField("model");
    } else if (cascadeField === "model" || cascadeField === "manualModel") {
      setCascadeBrandId(null);
      setCascadeField("brand");
      setModelSearch("");
    }
  }, [cascadeField, cascadePrevField, cascadeGenerations.length, formData.condition, vis.steeringWheel, vis.color, canBeNew]);

  const onCascadeClose = useCallback(() => {
    resetCascade();
    setActivePicker(null);
  }, [resetCascade, setActivePicker]);

  const openBrandPicker = useCallback(() => {
    resetCascade();
    setActivePicker("vehicleCascade");
  }, [resetCascade, setActivePicker]);

  const openModelPicker = useCallback(() => {
    if (!formData.brand || !selectedApiBrand) return;
    resetCascade();
    setCascadeBrandId(selectedApiBrand.id);
    setCascadeField("model");
    setActivePicker("vehicleCascade");
  }, [formData.brand, selectedApiBrand, resetCascade, setActivePicker]);

  const openGenerationPicker = useCallback(() => {
    if (!selectedApiModel) return;
    resetCascade();
    setCascadeBrandId(selectedApiBrand?.id ?? null);
    setCascadeModelId(selectedApiModel.id);
    setCascadeField("generation");
    setActivePicker("vehicleCascade");
  }, [selectedApiBrand, selectedApiModel, resetCascade, setActivePicker]);

  return {
    apiBrands,
    selectedApiBrand,
    apiModels,
    selectedApiModel,
    apiGenerations,
    generationYearFrom,
    generationYearTo,
    brandsLoading,
    autoFilledFromDb,
    setAutoFilledFromDb,
    selectedModification,
    selectedConfiguration,

    cascadeField,
    filteredBrands,
    filteredModels,
    cascadeGenerations,
    cascadeConfigurations,
    cascadeModifications,
    cascadeYears,
    brandSearch,
    setBrandSearch,
    modelSearch,
    setModelSearch,
    brandCategory,
    setBrandCategory,
    cascadeConfigurationId,
    cascadeModelsLoading,
    cascadeGenerationsLoading,
    cascadeConfigurationsLoading,
    cascadeModificationsLoading,

    resetCascade,
    openBrandPicker,
    openModelPicker,
    openGenerationPicker,
    onSelectBrand,
    onSelectModel,
    onSelectGeneration,
    onSelectConfiguration,
    onSelectModification,
    onManualModelSubmit,
    onSelectYear,
    onSelectSteering,
    onSelectCondition,
    onSelectWarranty,
    onSubmitMileage,
    onSelectAccidentHistory,
    onSubmitBodyDiagram,
    onBodyDamagesChange,
    onSelectColor,
    onSkipColor,
    onSubmitVin,
    onSkipVin,
    onSubmitDescription,
    onSkipDescription,
    onSkipGeneration,
    onSkipConfiguration,
    onSkipModification,
    onCascadeBack,
    onCascadeClose,
    canBeNew,
  };
}
