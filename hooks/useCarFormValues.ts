import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { Equipment } from "@/types/car";
import type { FormData } from "@/types/car-form";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";
import { WEB_TOP_INSET } from "@/constants/layout";
import { initialFormData } from "./initialFormData";
import { usePickerState } from "./usePickerState";

export { initialFormData };

interface UseCarFormValuesOptions {
  initialData?: Partial<FormData>;
}

export function useCarFormValues(options?: UseCarFormValuesOptions) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>(() => {
    if (options?.initialData) {
      return { ...initialFormData, ...options.initialData };
    }
    return initialFormData;
  });

  useEffect(() => {
    if (!user) return;
    const isDealer = user.role === "dealer";
    if (!options?.initialData?.sellerType) {
      setFormData(prev => ({ ...prev, sellerType: isDealer ? "dealer" : "private" }));
    }
  }, [user?.id]);

  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    specs: false,
    historyDocs: true,
    equipment: false,
  });
  const { activePicker, setActivePicker } = usePickerState();
  const generationYearToRef = useRef<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);

  const webTopInset = WEB_TOP_INSET;

  const formProgress = useMemo(() => {
    const isFlexible = formData.vehicleType === "special" || formData.vehicleType === "moto" || formData.vehicleType === "truck";
    let filled = 0;
    let total = isFlexible ? 4 : 5;
    if (isFlexible) {
      if (formData.bodyType) filled++;
    } else {
      if (formData.brand) filled++;
      if (formData.model) filled++;
    }
    if (formData.price) filled++;
    if (isFlexible || formData.condition === "new" || formData.mileage) filled++;
    if (formData.images.length > 0) filled++;
    return filled / total;
  }, [formData.brand, formData.model, formData.price, formData.mileage, formData.condition, formData.bodyType, formData.vehicleType, formData.images.length]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "vehicleType") {
        next.bodyType = undefined;
        next.brand = "";
        next.model = "";
        next.generation = "";
        next.version = "";
        next.year = undefined;
        next.modificationId = undefined;
        next.configurationId = undefined;
        next.fuelType = undefined;
        next.transmission = undefined;
        next.driveType = undefined;
        next.engineVolume = "";
        next.horsepower = "";
        next.color = undefined;
        next.condition = undefined;
        next.mileage = "";
        next.payloadCapacity = "";
        next.axleCount = undefined;
        next.cabinType = undefined;
        next.wheelConfiguration = undefined;
        next.grossWeight = "";
        next.seatingCapacity = "";
        next.coolingType = undefined;
        next.cylinderCount = undefined;
        next.operatingHours = "";
        next.chassisType = undefined;
        next.operatingWeight = "";
        next.suspensionType = undefined;
        next.euroClass = undefined;
        next.seatHeight = "";
        next.dryWeight = "";
        next.fuelTankCapacity = "";
        next.bucketVolume = "";
        next.diggingDepth = "";
        next.boomLength = "";
        next.bladeWidth = "";
        next.tractionClass = "";
        next.liftingCapacity = "";
        next.liftingHeight = "";
        next.drumVolume = "";
        next.rollerWidth = "";
        next.cuttingWidth = "";
        next.hasPTO = false;
        next.drillingDepth = "";
        next.pavingWidth = "";
        next.platformCapacity = "";
        if (value === "moto" || value === "special") {
          next.steeringWheel = undefined;
        }
        if (value === "special") {
          next.hasGasEquipment = false;
        }
      }
      if (field === "bodyType" && prev.bodyType !== value) {
        next.brand = "";
        next.model = "";
        next.generation = "";
        next.version = "";
        next.modificationId = undefined;
        next.configurationId = undefined;
        next.payloadCapacity = "";
        next.axleCount = undefined;
        next.cabinType = undefined;
        next.wheelConfiguration = undefined;
        next.grossWeight = "";
        next.seatingCapacity = "";
        next.coolingType = undefined;
        next.cylinderCount = undefined;
        next.operatingHours = "";
        next.chassisType = undefined;
        next.operatingWeight = "";
        next.suspensionType = undefined;
        next.euroClass = undefined;
        next.seatHeight = "";
        next.dryWeight = "";
        next.fuelTankCapacity = "";
        next.bucketVolume = "";
        next.diggingDepth = "";
        next.boomLength = "";
        next.bladeWidth = "";
        next.tractionClass = "";
        next.liftingCapacity = "";
        next.liftingHeight = "";
        next.drumVolume = "";
        next.rollerWidth = "";
        next.cuttingWidth = "";
        next.hasPTO = false;
        next.drillingDepth = "";
        next.pavingWidth = "";
        next.platformCapacity = "";
        const newVis = getFieldVisibility(next.vehicleType, value as string);
        if (!newVis.fuelType) { next.fuelType = undefined; }
        if (!newVis.transmission) { next.transmission = undefined; }
        if (!newVis.driveType) { next.driveType = undefined; }
        if (!newVis.engineVolume) { next.engineVolume = ""; }
        if (!newVis.horsepower) { next.horsepower = ""; }
        if (!newVis.steeringWheel) { next.steeringWheel = undefined; }
        if (!newVis.gasEquipment) { next.hasGasEquipment = false; }
        if (!newVis.mileage) { next.mileage = ""; }
      }
      if (field === "condition") {
        if (value === "new") {
          next.mileage = "";
          next.ownersCount = 1;
          next.accidentHistory = "none";
          next.bodyDamages = {};
        } else if (value === "damaged") {
          if (!next.accidentHistory || next.accidentHistory === "none" || next.accidentHistory === "unknown") {
            next.accidentHistory = "minor";
          }
        }
        if (prev.condition === "new" && value !== "new") {
          next.warranty = "";
        }
      }
      if (field === "accidentHistory") {
        if (value === "none" || value === "unknown") {
          next.bodyDamages = {};
        }
      }
      if (field === "bodyDamages") {
        const damages = value as Record<string, string>;
        if (Object.keys(damages).length > 0 && (!next.accidentHistory || next.accidentHistory === "none" || next.accidentHistory === "unknown")) {
          next.accidentHistory = "minor";
        }
      }
      if (field === "year" && prev.condition === "new") {
        const yr = value as number | undefined;
        const currentYear = new Date().getFullYear();
        if (yr != null) {
          const genYearTo = generationYearToRef.current;
          const canBeNew = genYearTo != null
            ? genYearTo >= currentYear - 1
            : yr >= currentYear - 3;
          if (!canBeNew) {
            next.condition = "used";
            next.warranty = "";
          }
        }
      }
      if (field === "sellerType" && value !== "dealer") {
        next.creditAvailable = false;
        next.tradeInAvailable = false;
        next.tradeInMaxAge = 0;
        next.tradeInBonus = 0;
        next.branchId = null;
      }
      if (field === "availability") {
        if (value === "in_stock") {
          next.importCountry = undefined;
        }
      }
      if (field === "fuelType" && value === "electric") {
        next.engineVolume = "";
      }
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const populateForm = useCallback((data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const toggleEquipment = useCallback((eq: Equipment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData((prev) => {
      const current = prev.equipment;
      if (current.includes(eq)) {
        return { ...prev, equipment: current.filter((e) => e !== eq) };
      } else {
        return { ...prev, equipment: [...current, eq] };
      }
    });
  }, []);

  const toggleSection = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    return formData.brand !== "" || formData.model !== "" || formData.price !== "" ||
      formData.mileage !== "" || formData.images.length > 0 || formData.description !== "" ||
      formData.sellerName !== "" || formData.sellerPhone !== "";
  }, [formData]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, []);

  return {
    formData,
    setFormData,
    isLoading,
    setIsLoading,
    expandedSections,
    setExpandedSections,
    activePicker,
    setActivePicker,
    showPreview,
    setShowPreview,
    fullScreenImageIndex,
    setFullScreenImageIndex,
    webTopInset,
    formProgress,
    isAuthenticated,
    user,
    generationYearToRef,
    updateField,
    resetForm,
    populateForm,
    toggleEquipment,
    toggleSection,
    hasUnsavedChanges,
    goBack,
  };
}
