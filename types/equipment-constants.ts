import { translate } from "@/lib/i18n";
import type { Equipment } from "./equipment-types";

export const MOTO_EQUIPMENT: Set<Equipment> = new Set<Equipment>([
  "abs", "esp", "led_headlights", "xenon_headlights", "fog_lights", "led_drl", "led_taillights",
  "navigation", "bluetooth", "usb_ports_front",
  "cruise_control", "heated_seats_front", "keyless_entry", "start_button",
  "tire_pressure_monitor",
]);

export const SPECIAL_EQUIPMENT: Set<Equipment> = new Set<Equipment>([
  "abs", "esp", "era_glonass",
  "ac", "climate_control", "cruise_control",
  "parking_sensors_rear", "parking_camera_rear", "parking_camera_360",
  "navigation", "bluetooth", "usb_ports_front", "usb_ports_rear",
  "led_headlights", "xenon_headlights", "fog_lights", "led_drl", "led_taillights",
  "rain_sensor", "light_sensor",
  "heated_seats_front", "heated_steering",
  "head_up_display", "digital_dashboard", "keyless_entry", "start_button",
  "hill_start_assist", "hill_descent_control",
  "tire_pressure_monitor",
]);

export const TRUCK_EXCLUDED_EQUIPMENT: Set<Equipment> = new Set<Equipment>([
  "airbag_center", "airbag_rear_side", "airbag_driver_knee", "airbag_passenger_knee",
  "panoramic_roof", "sunroof", "massage_seats",
  "ventilated_seats_rear", "electric_seats_passenger", "memory_seats_passenger",
  "rear_entertainment", "rear_climate", "tri_zone_climate",
  "auto_parking", "armored_body",
]);

const _EQUIPMENT_DATA: { value: Equipment; category: string; subcategory?: string }[] = [
  { value: "airbag_driver", category: "safety", subcategory: "airbags" },
  { value: "airbag_passenger", category: "safety", subcategory: "airbags" },
  { value: "airbag_center", category: "safety", subcategory: "airbags" },
  { value: "airbag_front_side", category: "safety", subcategory: "airbags" },
  { value: "airbag_rear_side", category: "safety", subcategory: "airbags" },
  { value: "airbag_curtain", category: "safety", subcategory: "airbags" },
  { value: "airbag_driver_knee", category: "safety", subcategory: "airbags" },
  { value: "airbag_passenger_knee", category: "safety", subcategory: "airbags" },
  { value: "abs", category: "safety" },
  { value: "esp", category: "safety" },
  { value: "rear_door_lock", category: "safety" },
  { value: "era_glonass", category: "safety" },
  { value: "armored_body", category: "safety" },
  { value: "isofix", category: "safety" },
  { value: "collision_warning", category: "assist" },
  { value: "collision_prevention", category: "assist" },
  { value: "pedestrian_detection", category: "assist" },
  { value: "lane_departure_warning", category: "assist" },
  { value: "lane_keeping", category: "assist" },
  { value: "traffic_jam_assist", category: "assist" },
  { value: "fatigue_sensor", category: "assist" },
  { value: "road_sign_recognition", category: "assist" },
  { value: "traction_control_asr", category: "assist" },
  { value: "steering_stabilization_vsm", category: "assist" },
  { value: "brake_distribution_ebd", category: "assist" },
  { value: "blind_spot", category: "assist" },
  { value: "cross_traffic_alert", category: "assist" },
  { value: "night_vision", category: "assist" },
  { value: "hill_start_assist", category: "assist" },
  { value: "hill_descent_control", category: "assist" },
  { value: "ac", category: "comfort", subcategory: "climate" },
  { value: "climate_control", category: "comfort", subcategory: "climate" },
  { value: "dual_climate", category: "comfort", subcategory: "climate" },
  { value: "tri_zone_climate", category: "comfort", subcategory: "climate" },
  { value: "rear_climate", category: "comfort", subcategory: "climate" },
  { value: "cruise_control", category: "comfort", subcategory: "cruise" },
  { value: "adaptive_cruise", category: "comfort", subcategory: "cruise" },
  { value: "limiter", category: "comfort", subcategory: "cruise" },
  { value: "parking_sensors_front", category: "comfort", subcategory: "parking" },
  { value: "parking_sensors_rear", category: "comfort", subcategory: "parking" },
  { value: "parking_sensors_360", category: "comfort", subcategory: "parking" },
  { value: "auto_parking", category: "comfort", subcategory: "parking" },
  { value: "parking_camera_rear", category: "comfort", subcategory: "camera" },
  { value: "parking_camera_front", category: "comfort", subcategory: "camera" },
  { value: "parking_camera_360", category: "comfort", subcategory: "camera" },
  { value: "steering_height", category: "comfort", subcategory: "steering" },
  { value: "steering_reach", category: "comfort", subcategory: "steering" },
  { value: "steering_electric", category: "comfort", subcategory: "steering" },
  { value: "steering_memory", category: "comfort", subcategory: "steering" },
  { value: "power_windows_front", category: "comfort", subcategory: "windows" },
  { value: "power_windows_rear", category: "comfort", subcategory: "windows" },
  { value: "power_windows_all", category: "comfort", subcategory: "windows" },
  { value: "heated_seats_front", category: "comfort", subcategory: "seats" },
  { value: "heated_seats_rear", category: "comfort", subcategory: "seats" },
  { value: "ventilated_seats_front", category: "comfort", subcategory: "seats" },
  { value: "ventilated_seats_rear", category: "comfort", subcategory: "seats" },
  { value: "electric_seats_driver", category: "comfort", subcategory: "seats" },
  { value: "electric_seats_passenger", category: "comfort", subcategory: "seats" },
  { value: "memory_seats_driver", category: "comfort", subcategory: "seats" },
  { value: "memory_seats_passenger", category: "comfort", subcategory: "seats" },
  { value: "massage_seats", category: "comfort", subcategory: "seats" },
  { value: "heated_steering", category: "comfort" },
  { value: "head_up_display", category: "comfort" },
  { value: "drive_mode_selector", category: "comfort" },
  { value: "remote_start", category: "comfort" },
  { value: "hands_free_trunk", category: "comfort" },
  { value: "multifunction_steering", category: "comfort" },
  { value: "digital_dashboard", category: "comfort" },
  { value: "keyless_entry", category: "comfort" },
  { value: "start_button", category: "comfort" },
  { value: "programmable_prestart", category: "comfort" },
  { value: "power_trunk", category: "comfort" },
  { value: "sunroof", category: "comfort" },
  { value: "panoramic_roof", category: "comfort" },
  { value: "electrochromic_mirrors", category: "comfort", subcategory: "mirrors" },
  { value: "folding_mirrors", category: "comfort", subcategory: "mirrors" },
  { value: "heated_mirrors", category: "comfort", subcategory: "mirrors" },
  { value: "auto_dimming_mirror", category: "comfort", subcategory: "mirrors" },
  { value: "navigation", category: "multimedia" },
  { value: "apple_carplay", category: "multimedia" },
  { value: "android_auto", category: "multimedia" },
  { value: "bluetooth", category: "multimedia" },
  { value: "usb_ports_front", category: "multimedia" },
  { value: "usb_ports_rear", category: "multimedia" },
  { value: "wireless_charging", category: "multimedia" },
  { value: "rear_entertainment", category: "multimedia" },
  { value: "dab_radio", category: "multimedia" },
  { value: "bose_audio", category: "multimedia", subcategory: "audio" },
  { value: "premium_audio", category: "multimedia", subcategory: "audio" },
  { value: "harman_kardon", category: "multimedia", subcategory: "audio" },
  { value: "jbl_audio", category: "multimedia", subcategory: "audio" },
  { value: "burmester", category: "multimedia", subcategory: "audio" },
  { value: "bang_olufsen", category: "multimedia", subcategory: "audio" },
  { value: "ambient_lighting", category: "interior" },
  { value: "leather_steering", category: "interior" },
  { value: "leather", category: "interior" },
  { value: "wood_trim", category: "interior" },
  { value: "aluminum_trim", category: "interior" },
  { value: "carbon_trim", category: "interior" },
  { value: "led_headlights", category: "exterior", subcategory: "headlights" },
  { value: "matrix_led", category: "exterior", subcategory: "headlights" },
  { value: "laser_lights", category: "exterior", subcategory: "headlights" },
  { value: "xenon_headlights", category: "exterior", subcategory: "headlights" },
  { value: "adaptive_headlights", category: "exterior", subcategory: "headlights" },
  { value: "fog_lights", category: "exterior" },
  { value: "led_drl", category: "exterior" },
  { value: "led_taillights", category: "exterior" },
  { value: "cornering_lights", category: "exterior" },
  { value: "auto_high_beam", category: "exterior" },
  { value: "rain_sensor", category: "exterior" },
  { value: "light_sensor", category: "exterior" },
  { value: "tinted_windows", category: "exterior" },
  { value: "alloy_wheels", category: "wheels" },
  { value: "spare_wheel", category: "wheels" },
  { value: "run_flat_tires", category: "wheels" },
  { value: "tire_pressure_monitor", category: "wheels" },
];

export const EQUIPMENT_OPTIONS: { value: Equipment; label: string; category: string; subcategory?: string }[] =
  _EQUIPMENT_DATA.map((e) => ({
    ...e,
    get label() { return translate(`options.${e.value}`); },
  }));

const _CATEGORIES_DATA: { id: string }[] = [
  { id: "safety" }, { id: "assist" }, { id: "comfort" },
  { id: "multimedia" }, { id: "interior" }, { id: "exterior" }, { id: "wheels" },
];

export const EQUIPMENT_CATEGORIES: { id: string; label: string }[] = _CATEGORIES_DATA.map((c) => ({
  ...c,
  get label() { return translate(`equipmentCategories.${c.id}`); },
}));

export function getEquipmentForVehicleType(vehicleType: string) {
  if (vehicleType === "moto") {
    return EQUIPMENT_OPTIONS.filter(e => MOTO_EQUIPMENT.has(e.value));
  }
  if (vehicleType === "special") {
    return EQUIPMENT_OPTIONS.filter(e => SPECIAL_EQUIPMENT.has(e.value));
  }
  if (vehicleType === "truck") {
    return EQUIPMENT_OPTIONS.filter(e => !TRUCK_EXCLUDED_EQUIPMENT.has(e.value));
  }
  return EQUIPMENT_OPTIONS;
}

export function getEquipmentCategoriesForVehicleType(vehicleType: string) {
  const equipmentForType = getEquipmentForVehicleType(vehicleType);
  const usedCategories = new Set(equipmentForType.map(e => e.category));
  return EQUIPMENT_CATEGORIES.filter(c => usedCategories.has(c.id));
}
