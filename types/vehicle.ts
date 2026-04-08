import { translate } from "@/lib/i18n";

const _cc = (s: string) => s.replace(/_([a-z0-9])/g, (_: string, c: string) => c.toUpperCase());
const _vt = (cat: string, val: string | number) => translate(`vehicle.${cat}_${_cc(String(val))}`);

export type VehicleType = "passenger" | "truck" | "special" | "moto";

export type CabinType = "day" | "sleeper" | "crew" | "extended";

export type WheelConfiguration = "4x2" | "4x4" | "6x2" | "6x4" | "6x6" | "8x2" | "8x4" | "8x8";

export type CoolingType = "air" | "liquid" | "oil";

export type MotoBodyType =
  | "sport_bike"
  | "cruiser"
  | "touring"
  | "enduro"
  | "chopper"
  | "scooter"
  | "naked"
  | "classic"
  | "adventure"
  | "motocross"
  | "trial"
  | "supermoto"
  | "cafe_racer"
  | "bobber"
  | "custom_moto"
  | "atv"
  | "pitbike"
  | "minibike";

export type ChassisType = "wheeled" | "tracked";

export type SuspensionType = "leaf_spring" | "air" | "combined";

export type EuroClass = "euro_0" | "euro_1" | "euro_2" | "euro_3" | "euro_4" | "euro_5" | "euro_6";

export type BodyType = 
  | "sedan"
  | "hatchback_3d"
  | "hatchback_4d"
  | "hatchback_5d"
  | "suv_3d"
  | "suv_5d"
  | "suv_open"
  | "crossover"
  | "wagon"
  | "coupe"
  | "convertible"
  | "minivan"
  | "pickup"
  | "liftback"
  | "limousine"
  | "van"
  | "compactvan"
  | "roadster"
  | "targa"
  | "fastback"
  | "microvan"
  | "truck"
  | "chassis_cab"
  | "bus"
  | "tractor"
  | "dump_truck"
  | "refrigerator_truck"
  | "tanker"
  | "tow_truck"
  | "minibus"
  | "concrete_mixer"
  | "crane_truck"
  | "trailer"
  | "semi_trailer"
  | "special_vehicle"
  | "flatbed"
  | "excavator"
  | "bulldozer"
  | "loader"
  | "forklift"
  | "road_roller"
  | "grader"
  | "harvester"
  | "farm_tractor"
  | "aerial_platform"
  | "backhoe"
  | "skid_steer"
  | "scissor_lift"
  | "drilling_rig"
  | "asphalt_paver"
  | "trailer_special"
  | "sport_bike"
  | "cruiser"
  | "touring"
  | "enduro"
  | "chopper"
  | "scooter"
  | "naked"
  | "classic"
  | "adventure"
  | "motocross"
  | "trial"
  | "supermoto"
  | "cafe_racer"
  | "bobber"
  | "custom_moto"
  | "atv"
  | "pitbike"
  | "minibike";

export type EngineType = 
  | "turbocharged"
  | "naturally_aspirated"
  | "lpg";

export type Availability = 
  | "any"
  | "in_stock"
  | "on_order"
  | "in_transit";

export type FuelType = 
  | "petrol"
  | "diesel"
  | "hybrid"
  | "electric"
  | "gas"
  | "petrol_gas"
  | "other";

export type Transmission = 
  | "automatic"
  | "manual"
  | "robot"
  | "variator"
  | "other";

export type DriveType = 
  | "front"
  | "rear"
  | "all"
  | "chain"
  | "belt"
  | "shaft"
  | "other";

export type Condition = 
  | "new"
  | "used"
  | "damaged";

export type SteeringWheel = 
  | "left"
  | "right";

export type OwnersCount = 1 | 2 | 3 | 4 | 5;

export type AccidentHistory = 
  | "none"
  | "minor"
  | "major"
  | "unknown";

export type ImportCountry = 
  | "armenia"
  | "usa"
  | "germany"
  | "japan"
  | "korea"
  | "georgia"
  | "russia"
  | "uae"
  | "china"
  | "canada"
  | "france"
  | "italy"
  | "uk"
  | "turkey"
  | "iran"
  | "lithuania"
  | "poland"
  | "other";

export type SellerType = 
  | "any"
  | "dealer"
  | "private";

export type CarCharacteristic = 
  | "compact"
  | "medium"
  | "large"
  | "comfortable"
  | "spacious_rear"
  | "spacious_trunk"
  | "oversized_cargo"
  | "offroad_capable"
  | "offroad"
  | "fast"
  | "good_handling"
  | "sporty"
  | "economical"
  | "liquid"
  | "many_options"
  | "prestigious"
  | "stylish"
  | "new_model";

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "passenger", get label() { return _vt("vehicleTypes", "passenger"); } },
  { value: "truck", get label() { return _vt("vehicleTypes", "truck"); } },
  { value: "special", get label() { return _vt("vehicleTypes", "special"); } },
  { value: "moto", get label() { return _vt("vehicleTypes", "moto"); } },
];

export const CABIN_TYPES: { value: CabinType; label: string }[] = [
  { value: "day", get label() { return _vt("cabinTypes", "day"); } },
  { value: "sleeper", get label() { return _vt("cabinTypes", "sleeper"); } },
  { value: "crew", get label() { return _vt("cabinTypes", "crew"); } },
  { value: "extended", get label() { return _vt("cabinTypes", "extended"); } },
];

export const WHEEL_CONFIGURATIONS: { value: WheelConfiguration; label: string }[] = [
  { value: "4x2", label: "4x2" },
  { value: "4x4", label: "4x4" },
  { value: "6x2", label: "6x2" },
  { value: "6x4", label: "6x4" },
  { value: "6x6", label: "6x6" },
  { value: "8x2", label: "8x2" },
  { value: "8x4", label: "8x4" },
  { value: "8x8", label: "8x8" },
];

export const TRUCK_BODY_TYPES: BodyType[] = [
  "truck", "van", "chassis_cab", "pickup", "tractor", "dump_truck",
  "refrigerator_truck", "tanker", "flatbed", "trailer", "semi_trailer",
];

export const SPECIAL_BODY_TYPES: BodyType[] = [
  "crane_truck", "concrete_mixer", "tow_truck", "bus", "minibus",
  "excavator", "bulldozer", "loader", "forklift", "road_roller",
  "grader", "harvester", "farm_tractor", "aerial_platform", "backhoe",
  "skid_steer", "scissor_lift", "drilling_rig", "asphalt_paver",
  "trailer_special", "special_vehicle",
];

export const PASSENGER_BODY_TYPES: BodyType[] = [
  "sedan", "hatchback_3d", "hatchback_4d", "hatchback_5d", "liftback", "suv_3d", "suv_5d", "suv_open",
  "crossover", "wagon", "coupe", "convertible", "minivan", "pickup",
  "limousine", "compactvan", "roadster", "targa", "fastback", "microvan", "van",
];

export const MOTO_BODY_TYPES: BodyType[] = [
  "sport_bike", "cruiser", "touring", "enduro", "chopper", "scooter",
  "naked", "classic", "adventure", "motocross", "trial", "supermoto",
  "cafe_racer", "bobber", "custom_moto", "atv", "pitbike", "minibike",
];

export interface EquipmentCategory {
  value: string;
  label: string;
  bodyTypes: BodyType[];
}

export const SPECIAL_EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    value: "earthmoving",
    get label() { return translate("specialCategories.earthmoving"); },
    bodyTypes: ["excavator", "bulldozer", "backhoe"],
  },
  {
    value: "loaders",
    get label() { return translate("specialCategories.loaders"); },
    bodyTypes: ["loader", "skid_steer", "forklift"],
  },
  {
    value: "road_construction",
    get label() { return translate("specialCategories.road_construction"); },
    bodyTypes: ["grader", "road_roller", "asphalt_paver"],
  },
  {
    value: "construction",
    get label() { return translate("specialCategories.construction"); },
    bodyTypes: ["concrete_mixer", "drilling_rig"],
  },
  {
    value: "cranes",
    get label() { return translate("specialCategories.cranes"); },
    bodyTypes: ["crane_truck", "aerial_platform", "scissor_lift"],
  },
  {
    value: "agriculture",
    get label() { return translate("specialCategories.agriculture"); },
    bodyTypes: ["farm_tractor", "harvester"],
  },
  {
    value: "transport",
    get label() { return translate("specialCategories.transport"); },
    bodyTypes: ["bus", "minibus"],
  },
  {
    value: "municipal",
    get label() { return translate("specialCategories.municipal"); },
    bodyTypes: ["tow_truck", "special_vehicle", "trailer_special"],
  },
];

export const MOTO_CATEGORIES: EquipmentCategory[] = [
  {
    value: "classic",
    get label() { return translate("motoCategories.classic"); },
    bodyTypes: ["classic", "cruiser", "chopper", "bobber", "cafe_racer", "custom_moto"],
  },
  {
    value: "sport",
    get label() { return translate("motoCategories.sport"); },
    bodyTypes: ["sport_bike", "naked", "supermoto"],
  },
  {
    value: "touring",
    get label() { return translate("motoCategories.touring"); },
    bodyTypes: ["touring", "adventure"],
  },
  {
    value: "offroad",
    get label() { return translate("motoCategories.offroad"); },
    bodyTypes: ["enduro", "motocross", "trial"],
  },
  {
    value: "urban",
    get label() { return translate("motoCategories.urban"); },
    bodyTypes: ["scooter"],
  },
  {
    value: "small",
    get label() { return translate("motoCategories.small"); },
    bodyTypes: ["atv", "pitbike", "minibike"],
  },
];

export const TRUCK_GROUPS: EquipmentCategory[] = [
  {
    value: "cargo",
    get label() { return translate("truckGroups.cargo"); },
    bodyTypes: ["truck", "van", "flatbed", "chassis_cab"],
  },
  {
    value: "tractors",
    get label() { return translate("truckGroups.tractors"); },
    bodyTypes: ["tractor", "pickup"],
  },
  {
    value: "specialized",
    get label() { return translate("truckGroups.specialized"); },
    bodyTypes: ["dump_truck", "refrigerator_truck", "tanker"],
  },
  {
    value: "trailers",
    get label() { return translate("truckGroups.trailers"); },
    bodyTypes: ["trailer", "semi_trailer"],
  },
];

export const CHASSIS_TYPES: { value: ChassisType; label: string }[] = [
  { value: "wheeled", get label() { return _vt("chassisTypes", "wheeled"); } },
  { value: "tracked", get label() { return _vt("chassisTypes", "tracked"); } },
];

export const SUSPENSION_TYPES: { value: SuspensionType; label: string }[] = [
  { value: "leaf_spring", get label() { return _vt("suspensionTypes", "leaf_spring"); } },
  { value: "air", get label() { return _vt("suspensionTypes", "air"); } },
  { value: "combined", get label() { return _vt("suspensionTypes", "combined"); } },
];

export const EURO_CLASSES: { value: EuroClass; label: string }[] = [
  { value: "euro_0", label: "Euro 0" },
  { value: "euro_1", label: "Euro 1" },
  { value: "euro_2", label: "Euro 2" },
  { value: "euro_3", label: "Euro 3" },
  { value: "euro_4", label: "Euro 4" },
  { value: "euro_5", label: "Euro 5" },
  { value: "euro_6", label: "Euro 6" },
];

export const COOLING_TYPES: { value: CoolingType; label: string }[] = [
  { value: "air", get label() { return _vt("coolingTypes", "air"); } },
  { value: "liquid", get label() { return _vt("coolingTypes", "liquid"); } },
  { value: "oil", get label() { return _vt("coolingTypes", "oil"); } },
];

export const MOTO_DRIVE_TYPES: { value: DriveType; label: string }[] = [
  { value: "chain", get label() { return _vt("motoDriveTypes", "chain"); } },
  { value: "belt", get label() { return _vt("motoDriveTypes", "belt"); } },
  { value: "shaft", get label() { return _vt("motoDriveTypes", "shaft"); } },
];

const _BODY_TYPES_DATA: { value: BodyType; color?: string }[] = [
  { value: "sedan", color: "#3B82F6" },
  { value: "hatchback_3d", color: "#10B981" },
  { value: "hatchback_4d", color: "#16A34A" },
  { value: "hatchback_5d", color: "#22C55E" },
  { value: "liftback", color: "#8B5CF6" },
  { value: "suv_3d", color: "#F59E0B" },
  { value: "suv_5d", color: "#EF4444" },
  { value: "suv_open", color: "#FBBF24" },
  { value: "crossover", color: "#06B6D4" },
  { value: "wagon", color: "#6366F1" },
  { value: "coupe", color: "#EC4899" },
  { value: "convertible", color: "#F97316" },
  { value: "minivan", color: "#0EA5E9" },
  { value: "pickup", color: "#14B8A6" },
  { value: "limousine", color: "#1F2937" },
  { value: "van", color: "#A3A3A3" },
  { value: "compactvan", color: "#6D28D9" },
  { value: "roadster", color: "#E11D48" },
  { value: "targa", color: "#D97706" },
  { value: "fastback", color: "#059669" },
  { value: "microvan", color: "#7C3AED" },
  { value: "truck", color: "#78716C" },
  { value: "chassis_cab", color: "#57534E" },
  { value: "bus", color: "#0369A1" },
  { value: "tractor", color: "#44403C" },
  { value: "dump_truck", color: "#854D0E" },
  { value: "refrigerator_truck", color: "#0E7490" },
  { value: "tanker", color: "#4338CA" },
  { value: "tow_truck", color: "#B91C1C" },
  { value: "minibus", color: "#0D9488" },
  { value: "concrete_mixer", color: "#9A3412" },
  { value: "crane_truck", color: "#1D4ED8" },
  { value: "trailer", color: "#71717A" },
  { value: "semi_trailer", color: "#52525B" },
  { value: "special_vehicle", color: "#991B1B" },
  { value: "flatbed", color: "#65A30D" },
  { value: "excavator", color: "#B45309" },
  { value: "bulldozer", color: "#92400E" },
  { value: "loader", color: "#0F766E" },
  { value: "forklift", color: "#4D7C0F" },
  { value: "road_roller", color: "#CA8A04" },
  { value: "grader", color: "#64748B" },
  { value: "harvester", color: "#15803D" },
  { value: "farm_tractor", color: "#166534" },
  { value: "aerial_platform", color: "#7C3AED" },
  { value: "backhoe", color: "#A16207" },
  { value: "skid_steer", color: "#0E7490" },
  { value: "scissor_lift", color: "#6D28D9" },
  { value: "drilling_rig", color: "#525252" },
  { value: "asphalt_paver", color: "#44403C" },
  { value: "trailer_special", color: "#57534E" },
  { value: "sport_bike", color: "#DC2626" },
  { value: "cruiser", color: "#92400E" },
  { value: "touring", color: "#0284C7" },
  { value: "enduro", color: "#15803D" },
  { value: "chopper", color: "#7C2D12" },
  { value: "scooter", color: "#0891B2" },
  { value: "naked", color: "#EA580C" },
  { value: "classic", color: "#78716C" },
  { value: "adventure", color: "#16A34A" },
  { value: "motocross", color: "#CA8A04" },
  { value: "trial", color: "#65A30D" },
  { value: "supermoto", color: "#E11D48" },
  { value: "cafe_racer", color: "#B45309" },
  { value: "bobber", color: "#57534E" },
  { value: "custom_moto", color: "#4B5563" },
  { value: "atv", color: "#047857" },
  { value: "pitbike", color: "#D97706" },
  { value: "minibike", color: "#9333EA" },
];

export const BODY_TYPES: { value: BodyType; label: string; color?: string }[] =
  _BODY_TYPES_DATA.map((bt) => ({
    ...bt,
    get label() { return _vt("bodyTypes", bt.value); },
  }));

export const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "any", get label() { return _vt("availability", "any"); } },
  { value: "in_stock", get label() { return _vt("availability", "in_stock"); } },
  { value: "on_order", get label() { return _vt("availability", "on_order"); } },
  { value: "in_transit", get label() { return _vt("availability", "in_transit"); } },
];

export const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "petrol", get label() { return _vt("fuelTypes", "petrol"); } },
  { value: "diesel", get label() { return _vt("fuelTypes", "diesel"); } },
  { value: "hybrid", get label() { return _vt("fuelTypes", "hybrid"); } },
  { value: "electric", get label() { return _vt("fuelTypes", "electric"); } },
  { value: "gas", get label() { return _vt("fuelTypes", "gas"); } },
  { value: "petrol_gas", get label() { return _vt("fuelTypes", "petrol_gas"); } },
];

export const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: "automatic", get label() { return _vt("transmissions", "automatic"); } },
  { value: "manual", get label() { return _vt("transmissions", "manual"); } },
  { value: "robot", get label() { return _vt("transmissions", "robot"); } },
  { value: "variator", get label() { return _vt("transmissions", "variator"); } },
];

export const DRIVE_TYPES: { value: DriveType; label: string }[] = [
  { value: "front", get label() { return _vt("driveTypes", "front"); } },
  { value: "rear", get label() { return _vt("driveTypes", "rear"); } },
  { value: "all", get label() { return _vt("driveTypes", "all"); } },
];

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "new", get label() { return _vt("conditions", "new"); } },
  { value: "used", get label() { return _vt("conditions", "used"); } },
  { value: "damaged", get label() { return _vt("conditions", "damaged"); } },
];

export const STEERING_WHEELS: { value: SteeringWheel; label: string }[] = [
  { value: "left", get label() { return _vt("steeringWheels", "left"); } },
  { value: "right", get label() { return _vt("steeringWheels", "right"); } },
];

export const OWNERS_COUNT: { value: OwnersCount; label: string }[] = [
  { value: 1, get label() { return translate("vehicle.ownersCount_1"); } },
  { value: 2, get label() { return translate("vehicle.ownersCount_2"); } },
  { value: 3, get label() { return translate("vehicle.ownersCount_3"); } },
  { value: 4, get label() { return translate("vehicle.ownersCount_4"); } },
  { value: 5, get label() { return translate("vehicle.ownersCount_5plus"); } },
];

export const ACCIDENT_HISTORY: { value: AccidentHistory; label: string }[] = [
  { value: "none", get label() { return _vt("accidentHistory", "none"); } },
  { value: "minor", get label() { return _vt("accidentHistory", "minor"); } },
  { value: "major", get label() { return _vt("accidentHistory", "major"); } },
  { value: "unknown", get label() { return _vt("accidentHistory", "unknown"); } },
];

export const IMPORT_COUNTRIES: { value: ImportCountry; label: string }[] = [
  { value: "armenia", get label() { return _vt("importCountries", "armenia"); } },
  { value: "usa", get label() { return _vt("importCountries", "usa"); } },
  { value: "germany", get label() { return _vt("importCountries", "germany"); } },
  { value: "japan", get label() { return _vt("importCountries", "japan"); } },
  { value: "korea", get label() { return _vt("importCountries", "korea"); } },
  { value: "georgia", get label() { return _vt("importCountries", "georgia"); } },
  { value: "russia", get label() { return _vt("importCountries", "russia"); } },
  { value: "uae", get label() { return _vt("importCountries", "uae"); } },
  { value: "china", get label() { return _vt("importCountries", "china"); } },
  { value: "canada", get label() { return _vt("importCountries", "canada"); } },
  { value: "france", get label() { return _vt("importCountries", "france"); } },
  { value: "italy", get label() { return _vt("importCountries", "italy"); } },
  { value: "uk", get label() { return _vt("importCountries", "uk"); } },
  { value: "turkey", get label() { return _vt("importCountries", "turkey"); } },
  { value: "iran", get label() { return _vt("importCountries", "iran"); } },
  { value: "lithuania", get label() { return _vt("importCountries", "lithuania"); } },
  { value: "poland", get label() { return _vt("importCountries", "poland"); } },
  { value: "other", get label() { return _vt("importCountries", "other"); } },
];

export const SELLER_TYPES: { value: SellerType; label: string }[] = [
  { value: "any", get label() { return _vt("sellerTypes", "any"); } },
  { value: "dealer", get label() { return _vt("sellerTypes", "dealer"); } },
  { value: "private", get label() { return _vt("sellerTypes", "private"); } },
];

export const CAR_CHARACTERISTICS: { value: CarCharacteristic; label: string }[] = [
  { value: "compact", get label() { return _vt("characteristics", "compact"); } },
  { value: "medium", get label() { return _vt("characteristics", "medium"); } },
  { value: "large", get label() { return _vt("characteristics", "large"); } },
  { value: "comfortable", get label() { return _vt("characteristics", "comfortable"); } },
  { value: "spacious_rear", get label() { return _vt("characteristics", "spacious_rear"); } },
  { value: "spacious_trunk", get label() { return _vt("characteristics", "spacious_trunk"); } },
  { value: "oversized_cargo", get label() { return _vt("characteristics", "oversized_cargo"); } },
  { value: "offroad_capable", get label() { return _vt("characteristics", "offroad_capable"); } },
  { value: "offroad", get label() { return _vt("characteristics", "offroad"); } },
  { value: "fast", get label() { return _vt("characteristics", "fast"); } },
  { value: "good_handling", get label() { return _vt("characteristics", "good_handling"); } },
  { value: "sporty", get label() { return _vt("characteristics", "sporty"); } },
  { value: "economical", get label() { return _vt("characteristics", "economical"); } },
  { value: "liquid", get label() { return _vt("characteristics", "liquid"); } },
  { value: "many_options", get label() { return _vt("characteristics", "many_options"); } },
  { value: "prestigious", get label() { return _vt("characteristics", "prestigious"); } },
  { value: "stylish", get label() { return _vt("characteristics", "stylish"); } },
  { value: "new_model", get label() { return _vt("characteristics", "new_model"); } },
];
