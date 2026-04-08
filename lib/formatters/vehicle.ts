import { getFieldVisibility } from "@/lib/vehicle-field-visibility";
import { translate, getGlobalLanguage } from "@/lib/i18n";
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
export {
  DB_OPTION_LABELS,
  translateOptionCode,
  getEquipmentLabel,
  DB_BODY_TYPE_MAP,
  getEquipmentCategory,
} from "./option-labels";

export {
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
};

export function formatMileage(mileage: number): string {
  return `${mileage.toLocaleString("en-US")} ${translate("units.km")}`;
}

export function formatEngineVolume(volume: number, vehicleType?: string): string {
  if (volume === 0) return translate("units.electric");
  if (vehicleType === "moto") {
    const cc = volume > 100 ? volume : Math.round(volume * 1000);
    return `${cc} ${translate("units.cc")}`;
  }
  return `${volume.toFixed(1)} ${translate("units.liter")}`;
}

export function formatHorsepower(hp: number): string {
  return `${hp} ${translate("units.hp")}`;
}

export function getTransmissionShort(val: string): string {
  const map: Record<string, string> = {
    automatic: "AT",
    manual: "MT",
    robot: "AMT",
    variator: "CVT",
  };
  return map[val] || val;
}

export function getFuelShort(f: string): string {
  const map: Record<string, string> = {
    petrol: translate("fuelShort.petrol"),
    diesel: translate("fuelShort.diesel"),
    electric: translate("fuelShort.electric"),
    hybrid: translate("fuelShort.hybrid"),
    gas: translate("fuelShort.gas"),
    petrol_gas: translate("fuelShort.petrolGas"),
  };
  return map[f] || f;
}

export function localizeCarText(text: string): string {
  const lang = getGlobalLanguage();
  if (lang === "ru") return text;
  const restyling = translate("filters.restylingFull");
  const series = translate("filters.seriesWord");
  const klass = translate("filters.classWord");
  let result = text.replace(/Рестайлинг/g, restyling);
  result = result.replace(/серии/g, series);
  result = result.replace(/Класс/g, klass);
  return result;
}

export function getListingTitle(listing: { brand?: string; model?: string; year?: number; version?: string; generation?: string; vehicleType?: string; bodyType?: string }, options?: { excludeYear?: boolean }): string {
  const hasBrand = listing.brand && listing.brand.trim() !== "";
  const hasModel = listing.model && listing.model.trim() !== "";
  const showYear = !options?.excludeYear;

  if (hasBrand && hasModel) {
    let title = `${listing.brand} ${localizeCarText(listing.model!)}`;
    if (listing.version) title += ` ${listing.version}`;
    if (listing.generation) title += ` ${localizeCarText(listing.generation)}`;
    if (showYear && listing.year) title += `, ${listing.year}`;
    return title;
  }

  const bodyLabel = listing.bodyType ? getBodyTypeLabel(listing.bodyType) : "";
  if (hasBrand) {
    return `${listing.brand}${bodyLabel ? ` ${bodyLabel}` : ""}${showYear && listing.year ? `, ${listing.year}` : ""}`;
  }
  if (bodyLabel) {
    return `${bodyLabel}${showYear && listing.year ? `, ${listing.year}` : ""}`;
  }
  return listing.year ? `${listing.year}` : translate("formatters.listing");
}

export function getListingShortTitle(listing: { brand?: string; model?: string; year?: number; bodyType?: string }): string {
  const hasBrand = listing.brand && listing.brand.trim() !== "";
  const hasModel = listing.model && listing.model.trim() !== "";

  if (hasBrand && hasModel) {
    return `${listing.brand} ${localizeCarText(listing.model!)}, ${listing.year || ""}`.trim();
  }
  if (hasBrand) {
    return `${listing.brand}${listing.year ? `, ${listing.year}` : ""}`;
  }
  const bodyLabel = listing.bodyType ? getBodyTypeLabel(listing.bodyType) : "";
  if (bodyLabel) {
    return `${bodyLabel}${listing.year ? `, ${listing.year}` : ""}`;
  }
  return listing.year ? `${listing.year}` : translate("formatters.listing");
}

export function getListingSpecs(car: { mileage?: number; engineVolume?: number; fuelType?: string; transmission?: string; driveType?: string; horsepower?: number; vehicleType?: string; bodyType?: string; condition?: string; operatingHours?: number; operatingWeight?: number; liftingCapacity?: number; payloadCapacity?: number; color?: string }): string {
  const vis = getFieldVisibility(car.vehicleType, car.bodyType);
  const isFlexible = car.vehicleType === "special" || car.vehicleType === "moto";
  const parts: string[] = [];

  const hasOperatingHours = vis.operatingHours && car.operatingHours && car.operatingHours > 0;

  if (vis.mileage && car.mileage && car.mileage > 0) {
    parts.push(formatMileage(car.mileage));
  } else if (!isFlexible && car.condition === "new") {
    parts.push(translate("formatters.newCondition"));
  }

  if (hasOperatingHours) {
    parts.push(`${car.operatingHours!.toLocaleString("en-US")} ${translate("units.motorHours")}`);
  } else if (car.vehicleType === "special" && !vis.mileage && car.mileage && car.mileage > 0) {
    parts.push(formatMileage(car.mileage));
  }

  if (vis.horsepower && car.horsepower && car.horsepower > 0) {
    parts.push(`${car.horsepower} ${translate("units.hp")}`);
  }

  if (vis.engineVolume && car.engineVolume && car.engineVolume > 0) {
    parts.push(formatEngineVolume(car.engineVolume, car.vehicleType));
  }

  if (vis.fuelType && car.fuelType && car.fuelType !== "other") {
    parts.push(getFuelTypeLabel(car.fuelType));
  }

  if (vis.transmission && car.transmission && car.transmission !== "other") {
    parts.push(getTransmissionShort(car.transmission));
  }

  if (vis.driveType && car.driveType && car.driveType !== "other") {
    parts.push(getDriveTypeLabel(car.driveType));
  }

  if (!isFlexible && car.bodyType) {
    parts.push(getBodyTypeLabel(car.bodyType));
  }

  if (vis.liftingCapacity && car.liftingCapacity && car.liftingCapacity > 0) {
    parts.push(`${car.liftingCapacity.toLocaleString("en-US")} ${translate("units.kg")}`);
  }

  if (vis.operatingWeight && car.operatingWeight && car.operatingWeight > 0) {
    parts.push(`${(car.operatingWeight / 1000).toFixed(1)} ${translate("units.ton")}`);
  }

  if (vis.payloadCapacity && car.payloadCapacity && car.payloadCapacity > 0) {
    parts.push(`${(car.payloadCapacity / 1000).toFixed(1)} ${translate("units.ton")}`);
  }

  if (isFlexible && car.bodyType) {
    parts.push(getBodyTypeLabel(car.bodyType));
  }

  return parts.join(" · ") || (isFlexible ? getBodyTypeLabel(car.bodyType || "") : "");
}

export function getListingSpecsLines(car: { mileage?: number; engineVolume?: number; fuelType?: string; transmission?: string; driveType?: string; horsepower?: number; vehicleType?: string; bodyType?: string; condition?: string; operatingHours?: number; operatingWeight?: number; liftingCapacity?: number; payloadCapacity?: number }): [string, string] {
  const vis = getFieldVisibility(car.vehicleType, car.bodyType);
  const isFlexible = car.vehicleType === "special" || car.vehicleType === "moto";

  const line1: string[] = [];
  const line2: string[] = [];

  const hasOperatingHours = vis.operatingHours && car.operatingHours && car.operatingHours > 0;

  if (vis.mileage && car.mileage && car.mileage > 0) {
    line1.push(formatMileage(car.mileage));
  } else if (!isFlexible && car.condition === "new") {
    line1.push(translate("formatters.newCondition"));
  }

  if (hasOperatingHours) {
    line1.push(`${car.operatingHours!.toLocaleString("en-US")} ${translate("units.motorHours")}`);
  } else if (car.vehicleType === "special" && !vis.mileage && car.mileage && car.mileage > 0) {
    line1.push(formatMileage(car.mileage));
  }

  if (vis.horsepower && car.horsepower && car.horsepower > 0) {
    line1.push(`${car.horsepower} ${translate("units.hp")}`);
  }

  if (vis.engineVolume && car.engineVolume && car.engineVolume > 0) {
    line1.push(formatEngineVolume(car.engineVolume, car.vehicleType));
  }

  if (vis.fuelType && car.fuelType && car.fuelType !== "other") {
    line2.push(getFuelTypeLabel(car.fuelType));
  }

  if (vis.driveType && car.driveType && car.driveType !== "other") {
    line2.push(getDriveTypeLabel(car.driveType));
  }

  if (vis.transmission && car.transmission && car.transmission !== "other") {
    line2.push(getTransmissionShort(car.transmission));
  }

  if (vis.liftingCapacity && car.liftingCapacity && car.liftingCapacity > 0) {
    line1.push(`${car.liftingCapacity.toLocaleString("en-US")} ${translate("units.kg")}`);
  }

  if (vis.operatingWeight && car.operatingWeight && car.operatingWeight > 0) {
    line1.push(`${(car.operatingWeight / 1000).toFixed(1)} ${translate("units.ton")}`);
  }

  if (vis.payloadCapacity && car.payloadCapacity && car.payloadCapacity > 0) {
    line1.push(`${(car.payloadCapacity / 1000).toFixed(1)} ${translate("units.ton")}`);
  }

  if (isFlexible && car.bodyType) {
    line2.push(getBodyTypeLabel(car.bodyType));
  }

  if (line2.length === 0 && line1.length > 2) {
    const half = Math.ceil(line1.length / 2);
    return [line1.slice(0, half).join(" · "), line1.slice(half).join(" · ")];
  }

  return [line1.join(" · "), line2.join(" · ")];
}
