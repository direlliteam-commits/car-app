import { ImageSourcePropType } from "react-native";
import { getApiUrl } from "@/lib/query-client";

const BODY_TYPE_IMAGES: Record<string, ImageSourcePropType> = {
  sedan: require("@/assets/images/body-types/passenger/sedan.png"),
  hatchback_5d: require("@/assets/images/body-types/passenger/hatchback_5d.png"),
  hatchback_3d: require("@/assets/images/body-types/passenger/hatchback_3d.png"),
  liftback: require("@/assets/images/body-types/passenger/liftback.png"),
  suv_5d: require("@/assets/images/body-types/passenger/suv_5d.png"),
  suv_3d: require("@/assets/images/body-types/passenger/suv_3d.png"),
  crossover: require("@/assets/images/body-types/passenger/crossover.png"),
  wagon: require("@/assets/images/body-types/passenger/wagon.png"),
  coupe: require("@/assets/images/body-types/passenger/coupe.png"),
  convertible: require("@/assets/images/body-types/passenger/convertible.png"),
  minivan: require("@/assets/images/body-types/passenger/minivan.png"),
  limousine: require("@/assets/images/body-types/passenger/limousine.png"),
  pickup: require("@/assets/images/body-types/passenger/pickup.png"),
  compactvan: require("@/assets/images/body-types/passenger/compactvan.png"),
  roadster: require("@/assets/images/body-types/passenger/roadster.png"),
  targa: require("@/assets/images/body-types/passenger/targa.png"),
  fastback: require("@/assets/images/body-types/passenger/fastback.png"),
  microvan: require("@/assets/images/body-types/passenger/microvan.png"),
};

const BODY_TYPE_FALLBACKS: Record<string, string> = {
  suv: "suv_5d",
  hatchback: "hatchback_5d",
  hatchback_4d: "hatchback_5d",
  suv_open: "suv_3d",
};

export function getBodyTypeImage(bodyType?: string): ImageSourcePropType | null {
  if (!bodyType) return null;
  return BODY_TYPE_IMAGES[bodyType] || BODY_TYPE_IMAGES[BODY_TYPE_FALLBACKS[bodyType]] || null;
}

export function getBodyTypeImageUrl(bodyType?: string): string | null {
  if (!bodyType) return null;
  return `${getApiUrl()}/body-types/${bodyType}.webp?v=5`;
}
