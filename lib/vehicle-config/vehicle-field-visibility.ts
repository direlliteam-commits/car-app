import type { VehicleType } from "@/types/car";

const NO_ENGINE_BODY_TYPES = new Set<string>([
  "trailer", "semi_trailer", "trailer_special",
]);

const USES_WHEEL_CONFIG_NOT_STANDARD_DRIVE = new Set<string>([
  "truck", "chassis_cab", "tractor", "dump_truck",
  "refrigerator_truck", "tanker", "flatbed",
]);

export interface FieldVisibility {
  mileage: boolean;
  transmission: boolean;
  fuelType: boolean;
  engineVolume: boolean;
  horsepower: boolean;
  driveType: boolean;
  steeringWheel: boolean;
  gasEquipment: boolean;
  color: boolean;
  operatingHours: boolean;
  operatingWeight: boolean;
  liftingCapacity: boolean;
  payloadCapacity: boolean;
}

export function getFieldVisibility(
  vehicleType?: VehicleType | string,
  bodyType?: string,
): FieldVisibility {
  const vt = (vehicleType || "passenger") as VehicleType;

  if (vt === "passenger") {
    return {
      mileage: true,
      transmission: true,
      fuelType: true,
      engineVolume: true,
      horsepower: true,
      driveType: true,
      steeringWheel: true,
      gasEquipment: true,
      color: true,
      operatingHours: false,
      operatingWeight: false,
      liftingCapacity: false,
      payloadCapacity: false,
    };
  }

  if (vt === "moto") {
    return {
      mileage: true,
      transmission: false,
      fuelType: false,
      engineVolume: true,
      horsepower: true,
      driveType: false,
      steeringWheel: false,
      gasEquipment: false,
      color: true,
      operatingHours: false,
      operatingWeight: false,
      liftingCapacity: false,
      payloadCapacity: false,
    };
  }

  if (vt === "special") {
    if (bodyType && NO_ENGINE_BODY_TYPES.has(bodyType)) {
      return {
        mileage: false,
        transmission: false,
        fuelType: false,
        engineVolume: false,
        horsepower: false,
        driveType: false,
        steeringWheel: false,
        gasEquipment: false,
        color: false,
        operatingHours: false,
        operatingWeight: true,
        liftingCapacity: true,
        payloadCapacity: true,
      };
    }
    return {
      mileage: false,
      transmission: false,
      fuelType: false,
      engineVolume: false,
      horsepower: !!bodyType,
      driveType: false,
      steeringWheel: false,
      gasEquipment: false,
      color: false,
      operatingHours: true,
      operatingWeight: true,
      liftingCapacity: true,
      payloadCapacity: false,
    };
  }

  if (vt === "truck") {
    if (bodyType && NO_ENGINE_BODY_TYPES.has(bodyType)) {
      return {
        mileage: false,
        transmission: false,
        fuelType: false,
        engineVolume: false,
        horsepower: false,
        driveType: false,
        steeringWheel: false,
        gasEquipment: false,
        color: false,
        operatingHours: false,
        operatingWeight: false,
        liftingCapacity: false,
        payloadCapacity: true,
      };
    }
    const usesStandardDrive = bodyType ? !USES_WHEEL_CONFIG_NOT_STANDARD_DRIVE.has(bodyType) : false;
    return {
      mileage: true,
      transmission: true,
      fuelType: true,
      engineVolume: !!bodyType,
      horsepower: true,
      driveType: usesStandardDrive,
      steeringWheel: !!bodyType,
      gasEquipment: false,
      color: false,
      operatingHours: false,
      operatingWeight: false,
      liftingCapacity: false,
      payloadCapacity: true,
    };
  }

  return {
    mileage: true,
    transmission: true,
    fuelType: true,
    engineVolume: true,
    horsepower: true,
    driveType: true,
    steeringWheel: true,
    gasEquipment: true,
    color: true,
    operatingHours: false,
    operatingWeight: false,
    liftingCapacity: false,
    payloadCapacity: false,
  };
}
