import type {
  VehicleType,
  BodyType,
  FuelType,
  Transmission,
  DriveType,
  Condition,
  SteeringWheel,
  OwnersCount,
  AccidentHistory,
  ImportCountry,
  SellerType,
  CarCharacteristic,
  CabinType,
  WheelConfiguration,
  CoolingType,
  ChassisType,
  Availability,
  SuspensionType,
  EuroClass,
} from "./vehicle";
import type { Equipment } from "./equipment";
import { translate } from "@/lib/i18n";

const _cc = (s: string) => s.replace(/_([a-z0-9])/g, (_: string, c: string) => c.toUpperCase());

export type SortOption = 
  | "date_desc"
  | "date_asc"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "year_asc"
  | "mileage_asc"
  | "mileage_desc";

export interface VehicleSelection {
  brand?: string;
  brandId?: number;
  model?: string;
  modelId?: number;
  generation?: string;
}

export interface CarFilters {
  vehicleType?: VehicleType;
  vehicleSelections?: VehicleSelection[];
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  bodyTypes?: BodyType[];
  fuelTypes?: FuelType[];
  transmissions?: Transmission[];
  driveTypes?: DriveType[];
  colors?: string[];
  engineVolumeFrom?: number;
  engineVolumeTo?: number;
  horsepowerFrom?: number;
  horsepowerTo?: number;
  conditions?: Condition[];
  sellerTypes?: SellerType[];
  hasPhotos?: boolean;
  steeringWheels?: SteeringWheel[];
  hasGasEquipment?: boolean;
  exchangePossible?: boolean;
  installmentPossible?: boolean;
  creditAvailable?: boolean;
  ownersCounts?: OwnersCount[];
  equipment?: Equipment[];
  importCountries?: ImportCountry[];
  accidentHistories?: AccidentHistory[];
  availabilities?: Availability[];
  noLegalIssues?: boolean;
  customsCleared?: boolean;
  accelerationFrom?: number;
  accelerationTo?: number;
  fuelConsumptionTo?: number;
  groundClearanceFrom?: number;
  trunkVolumeFrom?: number;
  trunkVolumeTo?: number;
  characteristics?: CarCharacteristic[];
  location?: string[];
  payloadCapacityFrom?: number;
  payloadCapacityTo?: number;
  grossWeightFrom?: number;
  grossWeightTo?: number;
  axleCounts?: number[];
  cabinTypes?: CabinType[];
  wheelConfigurations?: WheelConfiguration[];
  seatingCapacityFrom?: number;
  seatingCapacityTo?: number;
  coolingTypes?: CoolingType[];
  cylinderCounts?: number[];
  operatingHoursFrom?: number;
  operatingHoursTo?: number;
  chassisTypes?: ChassisType[];
  operatingWeightFrom?: number;
  operatingWeightTo?: number;
  suspensionTypes?: SuspensionType[];
  euroClasses?: EuroClass[];
  seatHeightFrom?: number;
  seatHeightTo?: number;
  dryWeightFrom?: number;
  dryWeightTo?: number;
  fuelTankCapacityFrom?: number;
  fuelTankCapacityTo?: number;
  bucketVolumeFrom?: number;
  bucketVolumeTo?: number;
  diggingDepthFrom?: number;
  diggingDepthTo?: number;
  boomLengthFrom?: number;
  boomLengthTo?: number;
  bladeWidthFrom?: number;
  bladeWidthTo?: number;
  tractionClasses?: string[];
  liftingCapacityFrom?: number;
  liftingCapacityTo?: number;
  liftingHeightFrom?: number;
  liftingHeightTo?: number;
  drumVolumeFrom?: number;
  drumVolumeTo?: number;
  rollerWidthFrom?: number;
  rollerWidthTo?: number;
  cuttingWidthFrom?: number;
  cuttingWidthTo?: number;
  hasPTO?: boolean;
  drillingDepthFrom?: number;
  drillingDepthTo?: number;
  pavingWidthFrom?: number;
  pavingWidthTo?: number;
  platformCapacityFrom?: number;
  platformCapacityTo?: number;
  promotedOnly?: boolean;
  topOnly?: boolean;
  recommendationsOnly?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: CarFilters;
  createdAt: string;
  notificationsEnabled: boolean;
  resultsCount: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  filters: CarFilters;
}

const _PRESETS_DATA: { id: string; icon: string; filters: CarFilters }[] = [
  { id: "budget", icon: "cash-outline", filters: { priceTo: 10000 } },
  { id: "new", icon: "star-outline", filters: { conditions: ["new"] } },
  { id: "low_mileage", icon: "pulse-outline", filters: { mileageTo: 50000 } },
  { id: "first_owner", icon: "person-outline", filters: { ownersCounts: [1] } },
  { id: "no_accidents", icon: "shield-outline", filters: { accidentHistories: ["none"] } },
  { id: "suv", icon: "car-outline", filters: { bodyTypes: ["suv_3d", "suv_5d", "suv_open", "crossover"] } },
  { id: "electric", icon: "flash-outline", filters: { fuelTypes: ["electric", "hybrid"] } },
  { id: "truck", icon: "cube-outline", filters: { vehicleType: "truck" } },
  { id: "special", icon: "construct-outline", filters: { vehicleType: "special" } },
  { id: "moto", icon: "bicycle-outline", filters: { vehicleType: "moto" } },
];

export const FILTER_PRESETS: FilterPreset[] = _PRESETS_DATA.map((p) => ({
  ...p,
  get name() { return translate(`filterPresets.${_cc(p.id)}`); },
}));

const _SORT_DATA: { value: SortOption }[] = [
  { value: "date_desc" }, { value: "date_asc" },
  { value: "price_asc" }, { value: "price_desc" },
  { value: "year_desc" }, { value: "year_asc" },
  { value: "mileage_asc" }, { value: "mileage_desc" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = _SORT_DATA.map((s) => ({
  ...s,
  get label() { return translate(`sort.${_cc(s.value)}`); },
}));

const _COLORS_DATA: { value: string; hex: string }[] = [
  { value: "black", hex: "#1a1a1a" },
  { value: "white", hex: "#ffffff" },
  { value: "silver", hex: "#c0c0c0" },
  { value: "gray", hex: "#808080" },
  { value: "red", hex: "#dc2626" },
  { value: "blue", hex: "#2563eb" },
  { value: "dark_blue", hex: "#1e3a5f" },
  { value: "green", hex: "#16a34a" },
  { value: "brown", hex: "#92400e" },
  { value: "beige", hex: "#d4a574" },
  { value: "gold", hex: "#c9a227" },
  { value: "orange", hex: "#ea580c" },
  { value: "yellow", hex: "#eab308" },
  { value: "purple", hex: "#7c3aed" },
  { value: "pink", hex: "#ec4899" },
  { value: "burgundy", hex: "#7f1d1d" },
  { value: "bicolor", hex: "#888888" },
];

export const COLORS: { value: string; label: string; hex: string }[] = _COLORS_DATA.map((c) => ({
  ...c,
  get label() { return translate(`colors.${_cc(c.value)}`); },
}));

export const LOCATIONS: string[] = [
  "Ереван",
  "Гюмри",
  "Ванадзор",
  "Вагаршапат (Эчмиадзин)",
  "Абовян",
  "Капан",
  "Раздан",
  "Армавир",
  "Арташат",
  "Гавар",
  "Иджеван",
  "Горис",
  "Чаренцаван",
  "Севан",
  "Аштарак",
  "Масис",
  "Артик",
  "Сисиан",
  "Дилижан",
  "Ехегнадзор",
  "Степанаван",
  "Спитак",
  "Мартуни",
  "Берд",
  "Варденис",
  "Ташир",
  "Алаверди",
  "Меградзор",
  "Нор-Ачин",
];

export type Currency = "USD" | "AMD" | "RUB" | "EUR";

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "USD", symbol: "$", get label() { return translate("currencies.usd"); } },
  { value: "AMD", symbol: "֏", get label() { return translate("currencies.amd"); } },
  { value: "EUR", symbol: "€", get label() { return translate("currencies.eur"); } },
  { value: "RUB", symbol: "₽", get label() { return translate("currencies.rub"); } },
];
