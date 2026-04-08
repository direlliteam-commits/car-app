import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import type { FormData } from "@/types/car-form";
import { getFieldVisibility } from "@/lib/vehicle-field-visibility";

interface UseCarFormValidationOptions {
  formData: FormData;
}

export function useCarFormValidation({ formData }: UseCarFormValidationOptions) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useTranslation();

  const validateForm = useCallback((): boolean => {
    const vt = formData.vehicleType;
    const isFlexible = vt === "special" || vt === "moto" || vt === "truck";
    const vis = getFieldVisibility(vt, formData.bodyType);

    if (!formData.images || formData.images.length === 0) {
      showAlert(t("validation.errorTitle"), t("validation.photoRequired"), undefined, "error");
      return false;
    }

    if (!isFlexible) {
      if (!formData.brand) {
        showAlert(t("validation.errorTitle"), t("validation.selectBrand"), undefined, "error");
        return false;
      }
      if (!formData.model) {
        showAlert(t("validation.errorTitle"), t("validation.selectModel"), undefined, "error");
        return false;
      }
      if (!formData.year) {
        showAlert(t("validation.errorTitle"), t("validation.selectYear"), undefined, "error");
        return false;
      }
    }
    if (!formData.price || parseInt(formData.price) <= 0) {
      showAlert(t("validation.errorTitle"), t("validation.invalidPrice"), undefined, "error");
      return false;
    }
    if (!formData.condition) {
      showAlert(t("validation.errorTitle"), isFlexible ? t("validation.selectConditionVehicle") : t("validation.selectConditionCar"), undefined, "error");
      return false;
    }
    if (vis.mileage && !formData.mileage && formData.condition !== "new") {
      showAlert(t("validation.errorTitle"), t("validation.enterMileage"), undefined, "error");
      return false;
    }
    if (vt === "passenger" && !formData.seatingCapacity) {
      showAlert(t("validation.errorTitle"), t("validation.enterSeatingCapacity"), undefined, "error");
      return false;
    }
    if (!formData.bodyType) {
      showAlert(t("validation.errorTitle"), vt === "special" ? t("validation.selectEquipmentType") : vt === "moto" ? t("validation.selectMotoType") : t("validation.selectBodyType"), undefined, "error");
      return false;
    }
    if (vis.fuelType && !isFlexible && !formData.fuelType) {
      showAlert(t("validation.errorTitle"), t("validation.selectFuelType"), undefined, "error");
      return false;
    }
    if (vis.transmission && !isFlexible && !formData.transmission) {
      showAlert(t("validation.errorTitle"), t("validation.selectTransmission"), undefined, "error");
      return false;
    }
    if (vis.driveType && !isFlexible && !formData.driveType) {
      showAlert(t("validation.errorTitle"), t("validation.selectDriveType"), undefined, "error");
      return false;
    }
    const sellerName = formData.sellerName || user?.name || user?.username || "";
    const sellerPhone = formData.sellerPhone || user?.phone || "";
    if (!sellerName) {
      showAlert(t("validation.errorTitle"), t("validation.enterSellerName"), undefined, "error");
      return false;
    }
    if (!sellerPhone) {
      showAlert(t("validation.errorTitle"), t("validation.enterSellerPhone"), undefined, "error");
      return false;
    }
    if (formData.vin && formData.vin.trim()) {
      const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
      if (!vinRegex.test(formData.vin.trim())) {
        showAlert(t("validation.errorTitle"), t("validation.invalidVin"), undefined, "error");
        return false;
      }
    }
    return true;
  }, [formData, user, t]);

  const buildSubmitPayload = useCallback((imageUrls: string[]) => {
    const isFlexVt = formData.vehicleType === "special" || formData.vehicleType === "moto" || formData.vehicleType === "truck";
    const vis = getFieldVisibility(formData.vehicleType, formData.bodyType);
    return {
      vehicleType: formData.vehicleType,
      brand: formData.brand || (isFlexVt ? "" : formData.brand),
      model: formData.model || (isFlexVt ? "" : formData.model),
      year: formData.year || (isFlexVt ? new Date().getFullYear() : formData.year!),
      price: (() => {
        const entered = parseInt(formData.price);
        if (formData.sellerType !== "dealer") return entered;
        const cd = parseInt(formData.creditDiscount) || 0;
        const ins = parseInt(formData.insuranceDiscount) || 0;
        const totalDiscount = cd + ins;
        return totalDiscount > 0 ? Math.max(0, entered - totalDiscount) : entered;
      })(),
      originalPrice: (() => {
        if (formData.sellerType !== "dealer") return null;
        const cd = parseInt(formData.creditDiscount) || 0;
        const ins = parseInt(formData.insuranceDiscount) || 0;
        const totalDiscount = cd + ins;
        return totalDiscount > 0 ? parseInt(formData.price) : null;
      })(),
      creditDiscount: formData.sellerType === "dealer" && parseInt(formData.creditDiscount) > 0 ? parseInt(formData.creditDiscount) : null,
      tradeInDiscount: null,
      insuranceDiscount: formData.sellerType === "dealer" && parseInt(formData.insuranceDiscount) > 0 ? parseInt(formData.insuranceDiscount) : null,
      currency: formData.currency,
      mileage: !vis.mileage || formData.condition === "new" ? 0 : parseInt(formData.mileage),
      bodyType: formData.bodyType!,
      fuelType: vis.fuelType ? (formData.fuelType || (isFlexVt ? "other" : "diesel")) : "other",
      transmission: vis.transmission ? (formData.transmission || (isFlexVt ? "other" : "automatic")) : "other",
      driveType: vis.driveType ? (formData.driveType || (isFlexVt ? "other" : "all")) : "other",
      engineVolume: vis.engineVolume ? (parseFloat(formData.engineVolume) || 0) : 0,
      horsepower: vis.horsepower ? (parseInt(formData.horsepower) || 0) : 0,
      color: formData.color || "",
      images: imageUrls,
      description: formData.description,
      location: formData.location,
      sellerName: formData.sellerName,
      sellerPhone: formData.sellerPhone,
      sellerType: formData.sellerType,
      condition: formData.condition!,
      steeringWheel: vis.steeringWheel ? (formData.steeringWheel || "left") : "left",
      hasGasEquipment: vis.gasEquipment ? formData.hasGasEquipment : false,
      exchangePossible: formData.exchangePossible,
      exchangeDetails: formData.exchangePossible && formData.exchangeDetails.trim() ? formData.exchangeDetails.trim() : null,
      installmentPossible: formData.installmentPossible,
      installmentDetails: formData.installmentPossible && formData.installmentDetails.trim() ? formData.installmentDetails.trim() : null,
      seatingCapacity: parseInt(formData.seatingCapacity) || undefined,
      creditAvailable: formData.sellerType === "dealer" ? formData.creditAvailable : false,
      tradeInAvailable: formData.sellerType === "dealer" ? formData.tradeInAvailable : false,
      ...(formData.sellerType === "dealer" && formData.tradeInAvailable ? {
        tradeInMaxAge: formData.tradeInMaxAge || null,
        tradeInBonus: formData.tradeInBonus || null,
      } : {
        tradeInMaxAge: null,
        tradeInBonus: null,
      }),
      ...(formData.sellerType === "dealer" && formData.creditAvailable ? {
        creditMinDownPaymentPercent: Math.round(formData.creditMinDownPaymentPercent || 20),
        creditInterestRateFrom: formData.creditInterestRateFrom || 12,
        creditMaxMonths: formData.creditMaxMonths || 60,
        creditPartnerBankIds: formData.creditPartnerBankIds || [],
      } : {
        creditMinDownPaymentPercent: null,
        creditInterestRateFrom: null,
        creditMaxMonths: null,
        creditPartnerBankIds: [],
      }),
      hasPhotos: imageUrls.length > 0,
      ownersCount: formData.ownersCount || 1,
      equipment: formData.equipment,
      importCountry: formData.importCountry,
      accidentHistory: formData.accidentHistory || "unknown",
      bodyDamages: (formData.accidentHistory === "minor" || formData.accidentHistory === "major") && Object.keys(formData.bodyDamages).length > 0
        ? formData.bodyDamages
        : {},
      keysCount: 2 as 1 | 2,
      warranty: formData.condition === "new" ? formData.warranty || undefined : undefined,
      generation: formData.generation || undefined,
      version: formData.version || undefined,
      modificationId: formData.modificationId,
      configurationId: formData.configurationId,
      availability: formData.availability,
      vin: formData.vin || undefined,
      noLegalIssues: formData.noLegalIssues || undefined,
      customsCleared: formData.customsCleared,
      branchId: formData.branchId || undefined,
      videoUrl: undefined as string | undefined,
      ...(formData.vehicleType === "truck" ? {
        payloadCapacity: parseInt(formData.payloadCapacity) || undefined,
        axleCount: formData.axleCount,
        cabinType: formData.cabinType,
        wheelConfiguration: formData.wheelConfiguration,
        grossWeight: parseInt(formData.grossWeight) || undefined,
        seatingCapacity: parseInt(formData.seatingCapacity) || undefined,
        suspensionType: formData.suspensionType,
        euroClass: formData.euroClass,
      } : {}),
      ...(formData.vehicleType === "special" ? {
        operatingHours: parseInt(formData.operatingHours) || undefined,
        chassisType: formData.chassisType || undefined,
        operatingWeight: parseInt(formData.operatingWeight) || undefined,
        payloadCapacity: parseInt(formData.payloadCapacity) || undefined,
        grossWeight: parseInt(formData.grossWeight) || undefined,
        bucketVolume: parseFloat(formData.bucketVolume) || undefined,
        diggingDepth: parseFloat(formData.diggingDepth) || undefined,
        boomLength: parseFloat(formData.boomLength) || undefined,
        bladeWidth: parseFloat(formData.bladeWidth) || undefined,
        tractionClass: formData.tractionClass || undefined,
        liftingCapacity: parseInt(formData.liftingCapacity) || undefined,
        liftingHeight: parseFloat(formData.liftingHeight) || undefined,
        drumVolume: parseFloat(formData.drumVolume) || undefined,
        rollerWidth: parseInt(formData.rollerWidth) || undefined,
        cuttingWidth: parseFloat(formData.cuttingWidth) || undefined,
        hasPTO: formData.hasPTO || undefined,
        drillingDepth: parseFloat(formData.drillingDepth) || undefined,
        pavingWidth: parseFloat(formData.pavingWidth) || undefined,
        platformCapacity: parseInt(formData.platformCapacity) || undefined,
      } : {}),
      ...(formData.vehicleType === "moto" ? {
        coolingType: formData.coolingType,
        cylinderCount: formData.cylinderCount,
        seatHeight: parseInt(formData.seatHeight) || undefined,
        dryWeight: parseInt(formData.dryWeight) || undefined,
        fuelTankCapacity: parseFloat(formData.fuelTankCapacity) || undefined,
        steeringWheel: undefined,
      } : {}),
    };
  }, [formData]);

  return {
    validateForm,
    buildSubmitPayload,
  };
}
