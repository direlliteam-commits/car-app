import { ImageSourcePropType } from "react-native";

export const VEHICLE_TYPE_IMAGES: Record<string, ImageSourcePropType> = {
  passenger: require("@/assets/images/vehicle-types/passenger.png"),
  truck: require("@/assets/images/vehicle-types/truck.png"),
  special: require("@/assets/images/vehicle-types/special.png"),
  moto: require("@/assets/images/vehicle-types/moto.png"),
  all: require("@/assets/images/vehicle-types/all.png"),
  dealer: require("@/assets/images/vehicle-types/dealer.png"),
};

export function getVehicleTypeImage(vehicleType?: string): ImageSourcePropType {
  return VEHICLE_TYPE_IMAGES[vehicleType || "passenger"] || VEHICLE_TYPE_IMAGES.passenger;
}
