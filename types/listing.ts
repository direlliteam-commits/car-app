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
import type { ListingStatus } from "@shared/schema";

export type VinStatus = "none" | "requested" | "shared" | "own";

export type { ListingStatus } from "@shared/schema";

export interface Bank {
  id: number;
  nameRu: string;
  nameEn: string;
  nameAm: string;
  logoUrl: string | null;
}

interface SellerFields {
  sellerName?: string;
  sellerPhone?: string;
  sellerType?: SellerType;
  isProSeller?: boolean;
  sellerAvatarUrl?: string | null;
  sellerCompanyLogoUrl?: string | null;
  sellerCompanyName?: string | null;
  sellerShowroomAddress?: string | null;
  sellerCity?: string | null;
  dealerPlanCode?: string | null;
  dealerRating?: number | null;
  dealerReviewCount?: number | null;
  dealerCompanyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  branchCity?: string | null;
  branchAddress?: string | null;
  userCity?: string | null;
}

interface CreditFields {
  creditAvailable?: boolean;
  creditMinDownPaymentPercent?: number | null;
  creditInterestRateFrom?: number | null;
  creditMaxMonths?: number | null;
  creditPartnerBankIds?: number[] | null;
  estimatedMonthlyFrom?: number | null;
  creditBanks?: Bank[] | null;
}

interface PromotionFields {
  promotion?: {
    features: string[];
    expiresAt?: string | null;
    activePromotions?: Array<{
      packageCode: string;
      expiresAt: string | null;
    }>;
  } | null;
}

export interface TruckFields {
  payloadCapacity?: number;
  axleCount?: number;
  cabinType?: CabinType;
  wheelConfiguration?: WheelConfiguration;
  grossWeight?: number;
  suspensionType?: SuspensionType;
  euroClass?: EuroClass;
  hasPTO?: boolean;
}

export interface SpecialFields {
  operatingHours?: number;
  chassisType?: ChassisType;
  operatingWeight?: number;
  bucketVolume?: number;
  diggingDepth?: number;
  boomLength?: number;
  bladeWidth?: number;
  tractionClass?: string;
  liftingCapacity?: number;
  liftingHeight?: number;
  drumVolume?: number;
  rollerWidth?: number;
  cuttingWidth?: number;
  drillingDepth?: number;
  pavingWidth?: number;
  platformCapacity?: number;
}

export interface MotoFields {
  seatHeight?: number;
  dryWeight?: number;
  fuelTankCapacity?: number;
  coolingType?: CoolingType;
  cylinderCount?: number;
}

export interface ApiListingBase extends SellerFields, CreditFields, PromotionFields {
  id: number;
  vehicleType?: VehicleType;
  brand: string;
  model: string;
  generation?: string;
  modificationId?: number;
  configurationId?: number;
  year: number;
  price: number;
  originalPrice?: number | null;
  creditDiscount?: number | null;
  tradeInDiscount?: number | null;
  insuranceDiscount?: number | null;
  currency?: "USD" | "AMD" | "EUR" | "RUB";
  mileage: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  driveType: DriveType;
  engineVolume: number;
  horsepower: number;
  color: string;
  images?: string[];
  videoUrl?: string | null;
  description?: string;
  location?: string;
  bumpedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
  condition?: Condition;
  steeringWheel?: SteeringWheel;
  hasGasEquipment?: boolean;
  exchangePossible?: boolean;
  exchangeDetails?: string | null;
  installmentPossible?: boolean;
  installmentDetails?: string | null;
  tradeInAvailable?: boolean;
  tradeInMaxAge?: number | null;
  tradeInBonus?: number | null;
  ownersCount?: OwnersCount;
  equipment?: Equipment[];
  importCountry?: ImportCountry;
  accidentHistory?: AccidentHistory;
  bodyDamages?: Record<string, string>;
  lastServiceDate?: string;
  keysCount?: 1 | 2;
  warranty?: string;
  availability?: Availability;
  customsCleared?: boolean;
  vin?: string;
  vinStatus?: VinStatus;
  noLegalIssues?: boolean;
  acceleration?: number;
  fuelConsumption?: number;
  groundClearance?: number;
  trunkVolume?: number;
  characteristics?: CarCharacteristic[];
  seatingCapacity?: number;
  status?: ListingStatus;
  moderationNote?: string | null;
  views?: number;
  deletedAt?: string;
  isGoodOffer?: boolean;
  avgMarketPrice?: number;
  previousPrice?: number;
}

export interface ApiListing extends ApiListingBase, TruckFields, SpecialFields, MotoFields {
  userId?: string;
  trimName?: string;
  version?: string;
  seller?: {
    id: string | number;
    dealerBranches?: Array<{ id: number; tradeInBonus?: number | null; tradeInMaxAge?: number | null; [key: string]: unknown }>;
    [key: string]: unknown;
  };
}

export interface CarBase extends SellerFields, CreditFields, PromotionFields {
  id: string;
  userId?: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  generation?: string;
  version?: string;
  modificationId?: number;
  configurationId?: number;
  year: number;
  price: number;
  originalPrice?: number | null;
  creditDiscount?: number | null;
  tradeInDiscount?: number | null;
  insuranceDiscount?: number | null;
  currency: "USD" | "AMD" | "EUR" | "RUB";
  mileage: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  driveType: DriveType;
  engineVolume: number;
  horsepower: number;
  color: string;
  images: string[];
  videoUrl?: string | null;
  description: string;
  location: string;
  sellerName: string;
  sellerPhone: string;
  sellerType: SellerType;
  bumpedAt?: string | null;
  createdAt: string;
  isFavorite?: boolean;
  condition: Condition;
  hasPhotos: boolean;
  steeringWheel: SteeringWheel;
  hasGasEquipment: boolean;
  exchangePossible: boolean;
  exchangeDetails?: string | null;
  installmentPossible: boolean;
  installmentDetails?: string | null;
  tradeInAvailable: boolean;
  tradeInMaxAge?: number | null;
  tradeInBonus?: number | null;
  ownersCount: OwnersCount;
  equipment: Equipment[];
  trimName?: string;
  importCountry?: ImportCountry;
  accidentHistory: AccidentHistory;
  bodyDamages?: Record<string, string>;
  lastServiceDate?: string;
  keysCount: 1 | 2;
  warranty?: string;
  availability?: Availability;
  customsCleared?: boolean;
  vin?: string;
  vinStatus?: VinStatus;
  noLegalIssues?: boolean;
  acceleration?: number;
  fuelConsumption?: number;
  groundClearance?: number;
  trunkVolume?: number;
  characteristics?: CarCharacteristic[];
  seatingCapacity?: number;
  views?: number;
  favoritesCount?: number;
  status?: ListingStatus;
  moderationNote?: string | null;
  isGoodOffer?: boolean;
  avgMarketPrice?: number;
  previousPrice?: number;
}

export interface CarPassenger extends CarBase {
  vehicleType: "passenger";
}

export interface CarTruck extends CarBase, TruckFields {
  vehicleType: "truck";
}

export interface CarSpecial extends CarBase, SpecialFields {
  vehicleType: "special";
}

export interface CarMoto extends CarBase, MotoFields {
  vehicleType: "moto";
}

export interface Car extends CarBase, TruckFields, SpecialFields, MotoFields {
  updatedAt?: string;
}
