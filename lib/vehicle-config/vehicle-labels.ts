import { translate } from "../i18n";

function toCamelCase(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

const categoryMap: Record<string, string> = {
  vehicleTypes: "vehicleTypes",
  cabinTypes: "cabinTypes",
  chassisTypes: "chassisTypes",
  suspensionTypes: "suspensionTypes",
  coolingTypes: "coolingTypes",
  motoDriveTypes: "motoDriveTypes",
  bodyTypes: "bodyTypes",
  availability: "availability",
  fuelTypes: "fuelTypes",
  transmissions: "transmissions",
  driveTypes: "driveTypes",
  conditions: "conditions",
  steeringWheels: "steeringWheels",
  ownersCount: "ownersCount",
  accidentHistory: "accidentHistory",
  importCountries: "importCountries",
  sellerTypes: "sellerTypes",
  characteristics: "characteristics",
};

export function getVehicleLabel(category: string, value: string | number): string {
  const prefix = categoryMap[category] || category;
  const key = `vehicle.${prefix}_${toCamelCase(String(value))}`;
  const result = translate(key);
  if (result === key) {
    return String(value);
  }
  return result;
}

const BODY_TYPE_FALLBACKS: Record<string, string> = {
  suv: "suv_5d",
  hatchback: "hatchback_5d",
};

export function getBodyTypeLabel(value: string): string {
  const result = getVehicleLabel("bodyTypes", value);
  if (result === value && BODY_TYPE_FALLBACKS[value]) {
    return getVehicleLabel("bodyTypes", BODY_TYPE_FALLBACKS[value]);
  }
  return result;
}

const ENGINE_TYPE_FUEL_MAP: Record<string, string> = {
  turbocharged: "petrol",
  naturally_aspirated: "petrol",
  lpg: "gas",
};

export function getFuelTypeLabel(value: string): string {
  const mapped = ENGINE_TYPE_FUEL_MAP[value];
  if (mapped) return getVehicleLabel("fuelTypes", mapped);
  return getVehicleLabel("fuelTypes", value);
}

export function getTransmissionLabel(value: string): string {
  return getVehicleLabel("transmissions", value);
}

const DRIVE_TYPE_FALLBACKS: Record<string, string> = {
  awd: "all",
  fwd: "front",
  rwd: "rear",
};

export function getDriveTypeLabel(value: string): string {
  const result = getVehicleLabel("driveTypes", value);
  if (result === value && DRIVE_TYPE_FALLBACKS[value]) {
    return getVehicleLabel("driveTypes", DRIVE_TYPE_FALLBACKS[value]);
  }
  return result;
}

export function getConditionLabel(value: string): string {
  return getVehicleLabel("conditions", value);
}

export function getSteeringWheelLabel(value: string): string {
  return getVehicleLabel("steeringWheels", value);
}

export function getVehicleTypeLabel(value: string): string {
  return getVehicleLabel("vehicleTypes", value);
}

export function getAvailabilityLabel(value: string): string {
  return getVehicleLabel("availability", value);
}

export function getOwnersCountLabel(value: number): string {
  if (value >= 5) return getVehicleLabel("ownersCount", "5plus");
  return getVehicleLabel("ownersCount", String(value));
}

export function getAccidentHistoryLabel(value: string): string {
  return getVehicleLabel("accidentHistory", value);
}

export function getImportCountryLabel(value: string): string {
  return getVehicleLabel("importCountries", value);
}

export function getSellerTypeLabel(value: string): string {
  return getVehicleLabel("sellerTypes", value);
}

export function getCabinTypeLabel(value: string): string {
  return getVehicleLabel("cabinTypes", value);
}

export function getChassisTypeLabel(value: string): string {
  return getVehicleLabel("chassisTypes", value);
}

export function getSuspensionTypeLabel(value: string): string {
  return getVehicleLabel("suspensionTypes", value);
}

export function getCoolingTypeLabel(value: string): string {
  return getVehicleLabel("coolingTypes", value);
}

export function getMotoDriveTypeLabel(value: string): string {
  return getVehicleLabel("motoDriveTypes", value);
}

export function getCharacteristicLabel(value: string): string {
  return getVehicleLabel("characteristics", value);
}

const COLOR_ALIASES: Record<string, string> = {
  grey: "gray",
};

const COLOR_HEX_MAP: Record<string, string> = {
  black: "#1A1A1A",
  white: "#F5F5F5",
  silver: "#C0C0C0",
  gray: "#808080",
  red: "#E53935",
  blue: "#1E88E5",
  darkBlue: "#1A237E",
  dark_blue: "#1A237E",
  green: "#43A047",
  brown: "#6D4C41",
  beige: "#D4C5A9",
  gold: "#FFD700",
  orange: "#FB8C00",
  yellow: "#FDD835",
  purple: "#8E24AA",
  pink: "#EC407A",
  burgundy: "#800020",
  bicolor: "#888888",
};

export function getColorHex(colorKey: string | undefined | null): string | null {
  if (!colorKey) return null;
  const ruKey = RUSSIAN_TO_KEY[colorKey];
  if (ruKey && COLOR_HEX_MAP[ruKey]) return COLOR_HEX_MAP[ruKey];
  const normalized = COLOR_ALIASES[colorKey] || colorKey;
  const camelKey = normalized.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return COLOR_HEX_MAP[camelKey] || COLOR_HEX_MAP[normalized] || null;
}

const RUSSIAN_TO_KEY: Record<string, string> = {
  "Чёрный": "black",
  "Черный": "black",
  "Белый": "white",
  "Серебристый": "silver",
  "Серый": "gray",
  "Красный": "red",
  "Синий": "blue",
  "Тёмно-синий": "darkBlue",
  "Темно-синий": "darkBlue",
  "Зелёный": "green",
  "Зеленый": "green",
  "Коричневый": "brown",
  "Бежевый": "beige",
  "Золотистый": "gold",
  "Оранжевый": "orange",
  "Жёлтый": "yellow",
  "Желтый": "yellow",
  "Фиолетовый": "purple",
  "Розовый": "pink",
  "Бордовый": "burgundy",
  "Двухцветный": "bicolor",
};

export function getColorLabel(colorKey: string | undefined | null): string {
  if (!colorKey) return "";
  const ruKey = RUSSIAN_TO_KEY[colorKey];
  if (ruKey) return translate(`colors.${ruKey}`) || colorKey;
  const normalized = COLOR_ALIASES[colorKey] || colorKey;
  const camelKey = normalized.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
  return translate(`colors.${camelKey}`) || colorKey;
}
