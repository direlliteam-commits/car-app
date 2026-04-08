import { useMemo, useCallback } from "react";
import { CarFilters, WHEEL_CONFIGURATIONS, EURO_CLASSES } from "@/types/car";
import { useTranslation } from "@/lib/i18n";
import { usdToDisplayRounded, getCurrencySymbol, localizeCarText } from "@/lib/formatters";
import { ARMENIAN_REGIONS } from "@/lib/armenian-regions";
import { getBodyTypeLabel, getDriveTypeLabel, getSteeringWheelLabel, getSellerTypeLabel, getTransmissionLabel, getFuelTypeLabel, getAvailabilityLabel, getCabinTypeLabel, getChassisTypeLabel, getSuspensionTypeLabel } from "@/lib/vehicle-labels";
import type { SpecialFieldDef } from "@/lib/special-equipment-fields";

export interface ActivePill {
  key: string;
  label: string;
  value: string;
  onClear: () => void;
}

export function useFilterLabels(
  localFilters: CarFilters,
  updateFilter: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void,
) {
  const { t } = useTranslation();

  const driveLabel = localFilters.driveTypes?.length
    ? localFilters.driveTypes?.map(v => getDriveTypeLabel(v)).join(", ")
    : undefined;

  const steeringLabel = localFilters.steeringWheels?.length
    ? localFilters.steeringWheels.map(v => getSteeringWheelLabel(v)).filter(Boolean).join(", ")
    : undefined;

  const sellerLabel = localFilters.sellerTypes?.length
    ? localFilters.sellerTypes.map(v => getSellerTypeLabel(v)).filter(Boolean).join(", ")
    : undefined;

  const locationLabel = useMemo(() => {
    const loc = localFilters.location;
    if (!loc?.length) return undefined;
    const cityNames: string[] = [];
    for (const region of ARMENIAN_REGIONS) {
      for (const city of region.cities) {
        if (loc.includes(city.id)) cityNames.push(city.name);
      }
    }
    if (cityNames.length === 0) return `${loc.length} ${t("filters.selected")}`;
    if (cityNames.length <= 2) return cityNames.join(", ");
    return `${cityNames.length} ${t("filters.selected")}`;
  }, [localFilters.location, t]);

  const priceLabel = (() => {
    let f = localFilters.priceFrom;
    let to = localFilters.priceTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    const sym = getCurrencySymbol();
    const fD = f ? usdToDisplayRounded(f) : undefined;
    const toD = to ? usdToDisplayRounded(to) : undefined;
    if (fD && toD) return `${sym}${fD.toLocaleString()} — ${sym}${toD.toLocaleString()}`;
    if (fD) return `${t("common.from")} ${sym}${fD.toLocaleString()}`;
    if (toD) return `${t("common.to")} ${sym}${toD.toLocaleString()}`;
    return undefined;
  })();

  const yearLabel = (() => {
    let f = localFilters.yearFrom;
    let to = localFilters.yearTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to}`;
    if (f) return `${t("common.from")} ${f}`;
    if (to) return `${t("common.to")} ${to}`;
    return undefined;
  })();

  const mileageLabel = (() => {
    let f = localFilters.mileageFrom;
    let to = localFilters.mileageTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f.toLocaleString()} — ${to.toLocaleString()} ${t("filters.kmUnit")}`;
    if (f) return `${t("common.from")} ${f.toLocaleString()} ${t("filters.kmUnit")}`;
    if (to) return `${t("common.to")} ${to.toLocaleString()} ${t("filters.kmUnit")}`;
    return undefined;
  })();

  const bodyLabel = localFilters.bodyTypes?.length
    ? localFilters.bodyTypes.length === 1
      ? getBodyTypeLabel(localFilters.bodyTypes![0])
      : `${localFilters.bodyTypes.length} ${t("filters.selected")}`
    : undefined;

  const transmissionLabel = localFilters.transmissions?.length
    ? localFilters.transmissions.length === 1
      ? getTransmissionLabel(localFilters.transmissions![0])
      : `${localFilters.transmissions.length} ${t("filters.selected")}`
    : undefined;

  const fuelLabel = localFilters.fuelTypes?.length
    ? localFilters.fuelTypes.length === 1
      ? getFuelTypeLabel(localFilters.fuelTypes![0])
      : `${localFilters.fuelTypes.length} ${t("filters.selected")}`
    : undefined;

  const availabilityLabel = localFilters.availabilities?.length
    ? localFilters.availabilities.length === 1
      ? getAvailabilityLabel(localFilters.availabilities![0])
      : `${localFilters.availabilities.length} ${t("filters.selected")}`
    : undefined;

  const engineLabel = (() => {
    let f = localFilters.engineVolumeFrom;
    let to = localFilters.engineVolumeTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    const unit = localFilters.vehicleType === "moto" ? t("filters.ccUnit") : t("filters.literUnit");
    if (f && to) return `${f} — ${to} ${unit}`;
    if (f) return `${t("common.from")} ${f} ${unit}`;
    if (to) return `${t("common.to")} ${to} ${unit}`;
    return undefined;
  })();

  const horsepowerLabel = (() => {
    let f = localFilters.horsepowerFrom;
    let to = localFilters.horsepowerTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to} ${t("filters.hpUnit")}`;
    if (f) return `${t("common.from")} ${f} ${t("filters.hpUnit")}`;
    if (to) return `${t("common.to")} ${to} ${t("filters.hpUnit")}`;
    return undefined;
  })();

  const payloadLabel = (() => {
    let f = localFilters.payloadCapacityFrom;
    let to = localFilters.payloadCapacityTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f.toLocaleString()} — ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    if (f) return `${t("common.from")} ${f.toLocaleString()} ${t("filters.kgUnit")}`;
    if (to) return `${t("common.to")} ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    return undefined;
  })();

  const grossWeightLabel = (() => {
    let f = localFilters.grossWeightFrom;
    let to = localFilters.grossWeightTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f.toLocaleString()} — ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    if (f) return `${t("common.from")} ${f.toLocaleString()} ${t("filters.kgUnit")}`;
    if (to) return `${t("common.to")} ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    return undefined;
  })();

  const cabinTypeLabel = localFilters.cabinTypes?.length
    ? localFilters.cabinTypes.length === 1
      ? getCabinTypeLabel(localFilters.cabinTypes![0])
      : `${localFilters.cabinTypes.length} ${t("filters.selected")}`
    : undefined;

  const wheelConfigLabel = localFilters.wheelConfigurations?.length
    ? localFilters.wheelConfigurations.length === 1
      ? WHEEL_CONFIGURATIONS.find(wc => wc.value === localFilters.wheelConfigurations![0])?.label
      : `${localFilters.wheelConfigurations.length} ${t("filters.selected")}`
    : undefined;

  const seatingCapacityLabel = (() => {
    let f = localFilters.seatingCapacityFrom;
    let to = localFilters.seatingCapacityTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to}`;
    if (f) return `${t("common.from")} ${f}`;
    if (to) return `${t("common.to")} ${to}`;
    return undefined;
  })();

  const operatingHoursLabel = (() => {
    let f = localFilters.operatingHoursFrom;
    let to = localFilters.operatingHoursTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f.toLocaleString()} — ${to.toLocaleString()} ${t("filters.hourUnit")}`;
    if (f) return `${t("common.from")} ${f.toLocaleString()} ${t("filters.hourUnit")}`;
    if (to) return `${t("common.to")} ${to.toLocaleString()} ${t("filters.hourUnit")}`;
    return undefined;
  })();

  const operatingWeightLabel = (() => {
    let f = localFilters.operatingWeightFrom;
    let to = localFilters.operatingWeightTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f.toLocaleString()} — ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    if (f) return `${t("common.from")} ${f.toLocaleString()} ${t("filters.kgUnit")}`;
    if (to) return `${t("common.to")} ${to.toLocaleString()} ${t("filters.kgUnit")}`;
    return undefined;
  })();

  const chassisTypeLabel = localFilters.chassisTypes?.length
    ? localFilters.chassisTypes.length === 1
      ? getChassisTypeLabel(localFilters.chassisTypes![0])
      : `${localFilters.chassisTypes.length} ${t("filters.selected")}`
    : undefined;

  const suspensionTypeLabel = localFilters.suspensionTypes?.length
    ? localFilters.suspensionTypes.length === 1
      ? getSuspensionTypeLabel(localFilters.suspensionTypes![0])
      : `${localFilters.suspensionTypes.length} ${t("filters.selected")}`
    : undefined;

  const euroClassLabel = localFilters.euroClasses?.length
    ? localFilters.euroClasses.length === 1
      ? EURO_CLASSES.find(ec => ec.value === localFilters.euroClasses![0])?.label
      : `${localFilters.euroClasses.length} ${t("filters.selected")}`
    : undefined;

  const seatHeightLabel = (() => {
    let f = localFilters.seatHeightFrom;
    let to = localFilters.seatHeightTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to} ${t("filters.mmUnit")}`;
    if (f) return `${t("common.from")} ${f} ${t("filters.mmUnit")}`;
    if (to) return `${t("common.to")} ${to} ${t("filters.mmUnit")}`;
    return undefined;
  })();

  const dryWeightLabel = (() => {
    let f = localFilters.dryWeightFrom;
    let to = localFilters.dryWeightTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to} ${t("filters.kgUnit")}`;
    if (f) return `${t("common.from")} ${f} ${t("filters.kgUnit")}`;
    if (to) return `${t("common.to")} ${to} ${t("filters.kgUnit")}`;
    return undefined;
  })();

  const fuelTankLabel = (() => {
    let f = localFilters.fuelTankCapacityFrom;
    let to = localFilters.fuelTankCapacityTo;
    if (f && to && f > to) { const tmp = f; f = to; to = tmp; }
    if (f && to) return `${f} — ${to} ${t("filters.literUnit")}`;
    if (f) return `${t("common.from")} ${f} ${t("filters.literUnit")}`;
    if (to) return `${t("common.to")} ${to} ${t("filters.literUnit")}`;
    return undefined;
  })();

  const getSpecialFieldLabel = useCallback((field: SpecialFieldDef): string | undefined => {
    const key = field.key;
    if (field.filterType === "range") {
      const fromKey = `${key}From` as keyof CarFilters;
      const toKey = `${key}To` as keyof CarFilters;
      let from = localFilters[fromKey] as number | undefined;
      let to = localFilters[toKey] as number | undefined;
      if (from && to && from > to) { const tmp = from; from = to; to = tmp; }
      const unit = field.unit || "";
      if (from && to) return `${from.toLocaleString()} — ${to.toLocaleString()} ${unit}`.trim();
      if (from) return `${t("common.from")} ${from.toLocaleString()} ${unit}`.trim();
      if (to) return `${t("common.to")} ${to.toLocaleString()} ${unit}`.trim();
      return undefined;
    }
    if (field.filterType === "select") {
      const arrayKey = (field.filterArrayKey || `${key}s`) as keyof CarFilters;
      const arr = localFilters[arrayKey] as string[] | undefined;
      if (arr && arr.length > 0) {
        return arr.map(v => field.options?.find(o => o.value === v)?.label || v).join(", ");
      }
      return undefined;
    }
    if (field.filterType === "boolean") {
      const val = localFilters[key as keyof CarFilters] as boolean | undefined;
      return val ? t("common.yes") : undefined;
    }
    return undefined;
  }, [localFilters]);

  const activePills = useMemo<ActivePill[]>(() => {
    const pills: ActivePill[] = [];

    if (localFilters.conditions?.length) {
      const condLabel = localFilters.conditions.length === 1
        ? localFilters.conditions[0] === "new" ? t("filters.newCondition")
          : localFilters.conditions[0] === "used" ? t("filters.usedCondition")
          : t("filters.damagedCondition")
        : `${localFilters.conditions.length} ${t("filters.selected")}`;
      pills.push({
        key: "conditions",
        label: "",
        value: condLabel,
        onClear: () => updateFilter("conditions", undefined),
      });
    }

    if (localFilters.vehicleSelections?.length) {
      localFilters.vehicleSelections.forEach((sel, idx) => {
        const val = [sel.brand, sel.model, sel.generation ? localizeCarText(sel.generation) : undefined].filter(Boolean).join(" ");
        pills.push({
          key: `vehicle-${idx}`,
          label: "",
          value: val,
          onClear: () => {
            const current = [...(localFilters.vehicleSelections || [])];
            current.splice(idx, 1);
            updateFilter("vehicleSelections", current.length > 0 ? current : undefined);
          },
        });
      });
    }

    if (priceLabel) pills.push({ key: "price", label: t("filters.priceLabel"), value: priceLabel, onClear: () => { updateFilter("priceFrom", undefined); updateFilter("priceTo", undefined); } });
    if (yearLabel) pills.push({ key: "year", label: t("filters.yearLabel"), value: yearLabel, onClear: () => { updateFilter("yearFrom", undefined); updateFilter("yearTo", undefined); } });
    if (mileageLabel) pills.push({ key: "mileage", label: t("filters.mileageLabel"), value: mileageLabel, onClear: () => { updateFilter("mileageFrom", undefined); updateFilter("mileageTo", undefined); } });

    if (bodyLabel) {
      const isNonPassVT = localFilters.vehicleType === "special" || localFilters.vehicleType === "truck" || localFilters.vehicleType === "moto";
      pills.push({ key: "body", label: isNonPassVT ? t("filters.equipmentTypeLabel") : t("filters.bodyLabel"), value: bodyLabel, onClear: () => updateFilter("bodyTypes", undefined) });
    }

    if (transmissionLabel) pills.push({ key: "transmission", label: t("filters.gearboxPill"), value: transmissionLabel, onClear: () => updateFilter("transmissions", undefined) });
    if (fuelLabel) pills.push({ key: "fuel", label: t("filters.engineLabel"), value: fuelLabel, onClear: () => updateFilter("fuelTypes", undefined) });
    if (availabilityLabel) pills.push({ key: "availability", label: t("filters.availabilityLabel"), value: availabilityLabel, onClear: () => updateFilter("availabilities", undefined) });
    if (driveLabel) pills.push({ key: "drive", label: t("filters.driveLabel"), value: driveLabel, onClear: () => updateFilter("driveTypes", undefined) });
    if (steeringLabel) pills.push({ key: "steering", label: t("filters.steeringLabel"), value: steeringLabel, onClear: () => updateFilter("steeringWheels", undefined) });
    if (localFilters.colors?.length) pills.push({ key: "color", label: t("filters.colorLabel"), value: `${localFilters.colors.length} ${t("filters.selected")}`, onClear: () => updateFilter("colors", undefined) });
    if (engineLabel) pills.push({ key: "engine", label: t("filters.volumeLabel"), value: engineLabel, onClear: () => { updateFilter("engineVolumeFrom", undefined); updateFilter("engineVolumeTo", undefined); } });
    if (horsepowerLabel) pills.push({ key: "hp", label: t("filters.powerLabel"), value: horsepowerLabel, onClear: () => { updateFilter("horsepowerFrom", undefined); updateFilter("horsepowerTo", undefined); } });
    if (sellerLabel) pills.push({ key: "seller", label: t("filters.sellerLabel"), value: sellerLabel, onClear: () => updateFilter("sellerTypes", undefined) });
    if (localFilters.hasGasEquipment) pills.push({ key: "gbo", label: "", value: t("filters.gboLabel"), onClear: () => updateFilter("hasGasEquipment", undefined) });
    if (localFilters.exchangePossible) pills.push({ key: "exchange", label: "", value: t("filters.exchangeLabel"), onClear: () => updateFilter("exchangePossible", undefined) });
    if (localFilters.installmentPossible) pills.push({ key: "installment", label: "", value: t("filters.paymentInPartsLabel"), onClear: () => updateFilter("installmentPossible", undefined) });
    if (localFilters.creditAvailable) pills.push({ key: "credit", label: "", value: t("filters.creditLabel"), onClear: () => updateFilter("creditAvailable", undefined) });
    if (payloadLabel) pills.push({ key: "payload", label: t("filters.payloadLabel"), value: payloadLabel, onClear: () => { updateFilter("payloadCapacityFrom", undefined); updateFilter("payloadCapacityTo", undefined); } });
    if (grossWeightLabel) pills.push({ key: "grossWeight", label: t("filters.grossWeightLabel"), value: grossWeightLabel, onClear: () => { updateFilter("grossWeightFrom", undefined); updateFilter("grossWeightTo", undefined); } });
    if (localFilters.axleCounts?.length) pills.push({ key: "axles", label: t("filters.axlesLabel"), value: localFilters.axleCounts.join(", "), onClear: () => updateFilter("axleCounts", undefined) });
    if (cabinTypeLabel) pills.push({ key: "cabinType", label: t("filters.cabinLabel"), value: cabinTypeLabel, onClear: () => updateFilter("cabinTypes", undefined) });
    if (wheelConfigLabel) pills.push({ key: "wheelConfig", label: t("filters.wheelConfigLabel"), value: wheelConfigLabel, onClear: () => updateFilter("wheelConfigurations", undefined) });
    if (seatingCapacityLabel) pills.push({ key: "seatingCapacity", label: t("filters.seatingLabel"), value: seatingCapacityLabel, onClear: () => { updateFilter("seatingCapacityFrom", undefined); updateFilter("seatingCapacityTo", undefined); } });
    if (operatingHoursLabel) pills.push({ key: "operatingHours", label: t("filters.operatingHoursLabel"), value: operatingHoursLabel, onClear: () => { updateFilter("operatingHoursFrom", undefined); updateFilter("operatingHoursTo", undefined); } });
    if (operatingWeightLabel) pills.push({ key: "operatingWeight", label: t("filters.operatingWeightLabel"), value: operatingWeightLabel, onClear: () => { updateFilter("operatingWeightFrom", undefined); updateFilter("operatingWeightTo", undefined); } });
    if (chassisTypeLabel) pills.push({ key: "chassisType", label: t("filters.chassisTypeLabel"), value: chassisTypeLabel, onClear: () => updateFilter("chassisTypes", undefined) });
    if (suspensionTypeLabel) pills.push({ key: "suspensionType", label: t("filters.suspensionLabel"), value: suspensionTypeLabel, onClear: () => updateFilter("suspensionTypes", undefined) });
    if (euroClassLabel) pills.push({ key: "euroClass", label: t("filters.euroClassLabel"), value: euroClassLabel, onClear: () => updateFilter("euroClasses", undefined) });
    if (seatHeightLabel) pills.push({ key: "seatHeight", label: t("filters.seatHeightLabel"), value: seatHeightLabel, onClear: () => { updateFilter("seatHeightFrom", undefined); updateFilter("seatHeightTo", undefined); } });
    if (dryWeightLabel) pills.push({ key: "dryWeight", label: t("filters.dryWeightLabel"), value: dryWeightLabel, onClear: () => { updateFilter("dryWeightFrom", undefined); updateFilter("dryWeightTo", undefined); } });
    if (fuelTankLabel) pills.push({ key: "fuelTank", label: t("filters.fuelTankLabel"), value: fuelTankLabel, onClear: () => { updateFilter("fuelTankCapacityFrom", undefined); updateFilter("fuelTankCapacityTo", undefined); } });

    return pills;
  }, [localFilters, priceLabel, yearLabel, mileageLabel, bodyLabel, transmissionLabel, fuelLabel, availabilityLabel, driveLabel, steeringLabel, engineLabel, horsepowerLabel, sellerLabel, payloadLabel, grossWeightLabel, cabinTypeLabel, wheelConfigLabel, seatingCapacityLabel, operatingHoursLabel, operatingWeightLabel, chassisTypeLabel, suspensionTypeLabel, euroClassLabel, seatHeightLabel, dryWeightLabel, fuelTankLabel]);

  return {
    driveLabel,
    steeringLabel,
    sellerLabel,
    locationLabel,
    priceLabel,
    yearLabel,
    mileageLabel,
    bodyLabel,
    transmissionLabel,
    fuelLabel,
    availabilityLabel,
    engineLabel,
    horsepowerLabel,
    payloadLabel,
    grossWeightLabel,
    cabinTypeLabel,
    wheelConfigLabel,
    seatingCapacityLabel,
    operatingHoursLabel,
    operatingWeightLabel,
    chassisTypeLabel,
    suspensionTypeLabel,
    euroClassLabel,
    seatHeightLabel,
    dryWeightLabel,
    fuelTankLabel,
    getSpecialFieldLabel,
    activePills,
  };
}
