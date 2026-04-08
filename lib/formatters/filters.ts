import {
  COOLING_TYPES,
  VehicleSelection,
} from "@/types/car";
import { translate } from "@/lib/i18n";
import {
  getBodyTypeLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getDriveTypeLabel,
  getConditionLabel,
  getSteeringWheelLabel,
  getColorLabel,
  getOwnersCountLabel,
  getAccidentHistoryLabel,
  getImportCountryLabel,
  getAvailabilityLabel,
  getSellerTypeLabel,
} from "@/lib/vehicle-labels";
import { formatLocationPill } from "@/lib/location-labels";
import { getCurrencySymbol, usdToDisplayRounded } from "./price";

export interface ActiveFilterPill {
  key: string;
  label: string;
}

export function getActiveFilterPills(filters: Record<string, any>): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  if (filters.vehicleSelections?.length > 0) {
    for (const s of filters.vehicleSelections) {
      let label = s.brand || translate("filterPills.noBrand");
      if (s.model) label += ` ${s.model}`;
      if (s.generation) label += ` ${s.generation}`;
      pills.push({ key: `vehicle_${s.brand || "any"}_${s.model || ""}`, label });
    }
  }

  if (Array.isArray(filters.location) && filters.location.length > 0) {
    const label = formatLocationPill(filters.location);
    if (label) pills.push({ key: "location", label });
  }

  if (filters.yearFrom || filters.yearTo) {
    const from = filters.yearFrom || "";
    const to = filters.yearTo || "";
    const ys = translate("filterPills.yearSuffix");
    const suffix = ys ? ` ${ys}` : "";
    pills.push({ key: "year", label: from && to ? `${from}–${to}${suffix}` : from ? `${translate("filterPills.from")} ${from}${suffix}` : `${translate("filterPills.to")} ${to}${suffix}` });
  }

  if (filters.priceFrom || filters.priceTo) {
    const sym = getCurrencySymbol();
    const from = filters.priceFrom ? `${sym}${usdToDisplayRounded(Number(filters.priceFrom)).toLocaleString("en-US")}` : "";
    const to = filters.priceTo ? `${sym}${usdToDisplayRounded(Number(filters.priceTo)).toLocaleString("en-US")}` : "";
    pills.push({ key: "price", label: from && to ? `${from}–${to}` : from ? `${translate("filterPills.from")} ${from}` : `${translate("filterPills.to")} ${to}` });
  }

  if (filters.mileageFrom || filters.mileageTo) {
    const from = filters.mileageFrom ? `${Number(filters.mileageFrom).toLocaleString("en-US")}` : "";
    const to = filters.mileageTo ? `${Number(filters.mileageTo).toLocaleString("en-US")}` : "";
    pills.push({ key: "mileage", label: from && to ? `${from}–${to} ${translate("units.km")}` : from ? `${translate("filterPills.from")} ${from} ${translate("units.km")}` : `${translate("filterPills.to")} ${to} ${translate("units.km")}` });
  }

  if (filters.bodyTypes?.length > 0) {
    pills.push({ key: "bodyTypes", label: filters.bodyTypes.map(getBodyTypeLabel).join(", ") });
  }

  if (filters.fuelTypes?.length > 0) {
    pills.push({ key: "fuelTypes", label: filters.fuelTypes.map(getFuelTypeLabel).join(", ") });
  }

  if (filters.transmissions?.length > 0) {
    pills.push({ key: "transmissions", label: filters.transmissions.map(getTransmissionLabel).join(", ") });
  }

  if (filters.driveTypes?.length > 0) {
    pills.push({ key: "driveTypes", label: filters.driveTypes.map(getDriveTypeLabel).join(", ") });
  }

  if (filters.colors?.length > 0) {
    pills.push({ key: "colors", label: filters.colors.map(getColorLabel).join(", ") });
  }

  if (filters.engineVolumeFrom || filters.engineVolumeTo) {
    const from = filters.engineVolumeFrom ? `${filters.engineVolumeFrom} ${translate("units.liter")}` : "";
    const to = filters.engineVolumeTo ? `${filters.engineVolumeTo} ${translate("units.liter")}` : "";
    pills.push({ key: "engineVolume", label: from && to ? `${from}–${to}` : from ? `${translate("filterPills.from")} ${from}` : `${translate("filterPills.to")} ${to}` });
  }

  if (filters.horsepowerFrom || filters.horsepowerTo) {
    const from = filters.horsepowerFrom || "";
    const to = filters.horsepowerTo || "";
    pills.push({ key: "horsepower", label: from && to ? `${from}–${to} ${translate("units.hp")}` : from ? `${translate("filterPills.from")} ${from} ${translate("units.hp")}` : `${translate("filterPills.to")} ${to} ${translate("units.hp")}` });
  }

  if (filters.conditions?.length > 0) {
    pills.push({ key: "conditions", label: filters.conditions.map(getConditionLabel).join(", ") });
  }

  if (filters.sellerTypes?.length > 0) {
    pills.push({ key: "sellerTypes", label: filters.sellerTypes.map(getSellerTypeLabel).join(", ") });
  }

  if (filters.steeringWheels?.length > 0) {
    pills.push({ key: "steeringWheels", label: filters.steeringWheels.map(getSteeringWheelLabel).join(", ") });
  }

  if (filters.coolingTypes?.length > 0) {
    const getCoolingLabel = (v: string) => COOLING_TYPES.find(ct => ct.value === v)?.label || v;
    pills.push({ key: "coolingTypes", label: filters.coolingTypes.map(getCoolingLabel).join(", ") });
  }

  if (filters.cylinderCounts?.length > 0) {
    pills.push({ key: "cylinderCounts", label: filters.cylinderCounts.map((c: number) => `${c} ${translate("units.cylShort")}`).join(", ") });
  }

  if (filters.exchangePossible !== undefined) {
    pills.push({ key: "exchangePossible", label: filters.exchangePossible ? translate("filterPills.exchange") : translate("filterPills.noExchange") });
  }

  if (filters.installmentPossible !== undefined) {
    pills.push({ key: "installmentPossible", label: filters.installmentPossible ? translate("filterPills.paymentInParts") : translate("filterPills.noPaymentInParts") });
  }

  if (filters.hasPhotos) {
    pills.push({ key: "hasPhotos", label: translate("filterPills.withPhotos") });
  }

  if (filters.ownersCounts?.length > 0) {
    pills.push({ key: "ownersCounts", label: filters.ownersCounts.map(getOwnersCountLabel).join(", ") });
  }

  if (filters.importCountries?.length > 0) {
    pills.push({ key: "importCountries", label: filters.importCountries.map(getImportCountryLabel).join(", ") });
  }

  if (filters.accidentHistories?.length > 0) {
    pills.push({ key: "accidentHistories", label: filters.accidentHistories.map(getAccidentHistoryLabel).join(", ") });
  }

  if (filters.availabilities?.length > 0) {
    pills.push({ key: "availabilities", label: filters.availabilities.map(getAvailabilityLabel).join(", ") });
  }

  if (filters.equipment?.length > 0) {
    pills.push({ key: "equipment", label: `${translate("filterPills.options")} (${filters.equipment.length})` });
  }

  if (filters.characteristics?.length > 0) {
    pills.push({ key: "characteristics", label: `${translate("filterPills.characteristics")} (${filters.characteristics.length})` });
  }

  if (filters.noLegalIssues !== undefined) pills.push({ key: "noLegalIssues", label: translate("filterPills.noLegalIssues") });

  return pills;
}

export function removeFilterByKey(filters: Record<string, any>, key: string): Record<string, any> {
  const updated = { ...filters };

  if (key.startsWith("vehicle_")) {
    const parts = key.replace("vehicle_", "").split("_");
    const brand = parts[0] === "any" ? undefined : parts[0];
    const model = parts.slice(1).join("_");
    updated.vehicleSelections = (updated.vehicleSelections || []).filter(
      (s: VehicleSelection) => !((s.brand || undefined) === brand && (s.model || "") === model)
    );
    if (updated.vehicleSelections.length === 0) delete updated.vehicleSelections;
    return updated;
  }

  const rangeKeys: Record<string, string[]> = {
    year: ["yearFrom", "yearTo"],
    price: ["priceFrom", "priceTo"],
    mileage: ["mileageFrom", "mileageTo"],
    engineVolume: ["engineVolumeFrom", "engineVolumeTo"],
    horsepower: ["horsepowerFrom", "horsepowerTo"],
  };

  if (rangeKeys[key]) {
    for (const k of rangeKeys[key]) delete updated[k];
    return updated;
  }

  delete updated[key];
  return updated;
}
