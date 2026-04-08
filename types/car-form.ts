import type {
  BodyType,
  FuelType,
  Transmission,
  DriveType,
  Condition,
  SteeringWheel,
  OwnersCount,
  AccidentHistory,
  ImportCountry,
  Equipment,
  SellerType,
  Availability,
  Currency,
  VehicleType,
  CabinType,
  WheelConfiguration,
  CoolingType,
  ChassisType,
  SuspensionType,
  EuroClass,
} from "@/types/car";

export interface FormData {
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number | undefined;
  price: string;
  originalPrice: string;
  creditDiscount: string;
  tradeInDiscount: string;
  insuranceDiscount: string;
  mileage: string;
  bodyType?: BodyType;
  fuelType?: FuelType;
  transmission?: Transmission;
  driveType?: DriveType;
  engineVolume: string;
  horsepower: string;
  color?: string;
  currency: Currency;
  images: string[];
  videoUri: string | null;
  description: string;
  location: string;
  sellerName: string;
  sellerPhone: string;
  condition?: Condition;
  steeringWheel?: SteeringWheel;
  hasGasEquipment: boolean;
  exchangePossible: boolean;
  exchangeDetails: string;
  installmentPossible: boolean;
  installmentDetails: string;
  creditAvailable: boolean;
  tradeInAvailable: boolean;
  tradeInMaxAge: number;
  tradeInBonus: number;
  ownersCount?: OwnersCount;
  equipment: Equipment[];
  importCountry?: ImportCountry;
  accidentHistory?: AccidentHistory;
  warranty: string;
  generation: string;
  version: string;
  modificationId?: number;
  configurationId?: number;
  sellerType: SellerType;
  availability?: Availability;
  noLegalIssues: boolean;
  customsCleared: boolean;
  bodyDamages: Record<string, string>;
  payloadCapacity: string;
  axleCount?: number;
  cabinType?: CabinType;
  wheelConfiguration?: WheelConfiguration;
  grossWeight: string;
  seatingCapacity: string;
  coolingType?: CoolingType;
  cylinderCount?: number;
  operatingHours: string;
  chassisType?: ChassisType;
  operatingWeight: string;
  suspensionType?: SuspensionType;
  euroClass?: EuroClass;
  seatHeight: string;
  dryWeight: string;
  fuelTankCapacity: string;
  bucketVolume: string;
  diggingDepth: string;
  boomLength: string;
  bladeWidth: string;
  tractionClass: string;
  liftingCapacity: string;
  liftingHeight: string;
  drumVolume: string;
  rollerWidth: string;
  cuttingWidth: string;
  hasPTO: boolean;
  drillingDepth: string;
  pavingWidth: string;
  platformCapacity: string;
  vin: string;
  creditMinDownPaymentPercent: number;
  creditInterestRateFrom: number;
  creditMaxMonths: number;
  creditPartnerBankIds: number[];
  branchId: string | null;
}
