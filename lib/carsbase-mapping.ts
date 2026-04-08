import type { BodyType, FuelType, Transmission, DriveType, Equipment } from "@/types/car";
import { translate } from "@/lib/i18n";
import { OPTIONS_TO_EQUIPMENT } from "@/shared/equipment-mapping";

export function mapBodyType(cbBodyType: string | null | undefined): BodyType {
  const map: Record<string, BodyType> = {
    SEDAN: "sedan",
    SEDAN_2_DOORS: "sedan",
    SEDAN_HARDTOP: "sedan",
    HATCHBACK_3_DOORS: "hatchback_3d",
    HATCHBACK_4_DOORS: "hatchback_4d",
    HATCHBACK_5_DOORS: "hatchback_5d",
    ALLROAD_3_DOORS: "suv_3d",
    ALLROAD_5_DOORS: "suv_5d",
    ALLROAD_OPEN: "suv_open",
    WAGON_3_DOORS: "wagon",
    WAGON_5_DOORS: "wagon",
    PHAETON_WAGON: "wagon",
    COUPE: "coupe",
    COUPE_HARDTOP: "coupe",
    FASTBACK: "fastback",
    TARGA: "targa",
    SPEEDSTER: "convertible",
    CABRIO: "convertible",
    ROADSTER: "roadster",
    PHAETON: "convertible",
    MINIVAN: "minivan",
    COMPACTVAN: "compactvan",
    MICROVAN: "microvan",
    PICKUP_ONE: "pickup",
    PICKUP_ONE_HALF: "pickup",
    PICKUP_TWO: "pickup",
    LIFTBACK: "liftback",
    LIMOUSINE: "limousine",
    VAN: "van",
  };
  return map[cbBodyType || ""] || "sedan";
}

export function mapFuelType(cbEngineType: string | null | undefined): FuelType {
  const map: Record<string, FuelType> = {
    GASOLINE: "petrol",
    DIESEL: "diesel",
    HYBRID: "hybrid",
    ELECTRO: "electric",
    LPG: "gas",
    H2: "petrol",
  };
  return map[cbEngineType || ""] || "petrol";
}

export function mapTransmission(cbTransmission: string | null | undefined): Transmission {
  const map: Record<string, Transmission> = {
    AUTOMATIC: "automatic",
    MECHANICAL: "manual",
    ROBOT: "robot",
    VARIATOR: "variator",
  };
  return map[cbTransmission || ""] || "automatic";
}

export function mapDriveType(cbDrive: string | null | undefined): DriveType {
  const map: Record<string, DriveType> = {
    FORWARD_CONTROL: "front",
    REAR_DRIVE: "rear",
    ALL_WHEEL_DRIVE: "all",
  };
  return map[cbDrive || ""] || "front";
}

export function mapEquipment(cbOptions: Record<string, number> | null | undefined): Equipment[] {
  if (!cbOptions) return [];

  const result: Equipment[] = [];
  for (const [key, val] of Object.entries(cbOptions)) {
    if (val === 1 && OPTIONS_TO_EQUIPMENT[key]) {
      result.push(OPTIONS_TO_EQUIPMENT[key] as Equipment);
    }
  }
  return result;
}

export function mapBodyTypeLabel(cbBodyType: string | null | undefined): string {
  const map: Record<string, string> = {
    SEDAN: translate("bodyTypes.sedan"),
    SEDAN_2_DOORS: translate("bodyTypes.sedan2doors"),
    SEDAN_HARDTOP: translate("bodyTypes.sedanHardtop"),
    HATCHBACK_3_DOORS: translate("bodyTypes.hatchback3doors"),
    HATCHBACK_4_DOORS: translate("bodyTypes.hatchback4doors"),
    HATCHBACK_5_DOORS: translate("bodyTypes.hatchback5doors"),
    ALLROAD_3_DOORS: translate("bodyTypes.suv3doors"),
    ALLROAD_5_DOORS: translate("bodyTypes.suv5doors"),
    ALLROAD_OPEN: translate("bodyTypes.suvOpen"),
    WAGON_3_DOORS: translate("bodyTypes.wagon3doors"),
    WAGON_5_DOORS: translate("bodyTypes.wagon5doors"),
    PHAETON_WAGON: translate("bodyTypes.phaetonWagon"),
    COUPE: translate("bodyTypes.coupe"),
    COUPE_HARDTOP: translate("bodyTypes.coupeHardtop"),
    FASTBACK: translate("bodyTypes.fastback"),
    TARGA: translate("bodyTypes.targa"),
    SPEEDSTER: translate("bodyTypes.speedster"),
    CABRIO: translate("bodyTypes.cabrio"),
    ROADSTER: translate("bodyTypes.roadster"),
    PHAETON: translate("bodyTypes.phaeton"),
    MINIVAN: translate("bodyTypes.minivan"),
    COMPACTVAN: translate("bodyTypes.compactvan"),
    MICROVAN: translate("bodyTypes.microvan"),
    PICKUP_ONE: translate("bodyTypes.pickupSingleCab"),
    PICKUP_ONE_HALF: translate("bodyTypes.pickupExtendedCab"),
    PICKUP_TWO: translate("bodyTypes.pickupDoubleCab"),
    LIFTBACK: translate("bodyTypes.liftback"),
    LIMOUSINE: translate("bodyTypes.limousine"),
    VAN: translate("bodyTypes.van"),
  };
  return map[cbBodyType || ""] || cbBodyType || "";
}
