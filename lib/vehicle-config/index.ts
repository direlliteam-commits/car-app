export {
  getVehicleLabel,
  getBodyTypeLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getDriveTypeLabel,
  getConditionLabel,
  getSteeringWheelLabel,
  getVehicleTypeLabel,
  getAvailabilityLabel,
  getOwnersCountLabel,
  getAccidentHistoryLabel,
  getImportCountryLabel,
  getSellerTypeLabel,
  getCabinTypeLabel,
  getChassisTypeLabel,
  getSuspensionTypeLabel,
  getCoolingTypeLabel,
  getMotoDriveTypeLabel,
  getCharacteristicLabel,
  getColorHex,
  getColorLabel,
} from "./vehicle-labels";

export type { FieldVisibility } from "./vehicle-field-visibility";
export { getFieldVisibility } from "./vehicle-field-visibility";

export type { SpecialFieldDef } from "./special-equipment-fields";
export {
  getTractionClasses,
  getFieldsForEquipmentType,
  getFilterFieldsForEquipmentType,
} from "./special-equipment-fields";

export {
  getFieldsForMotoType,
  getFilterFieldsForMotoType,
} from "./moto-fields";

export {
  getFieldsForTruckType,
  getFilterFieldsForTruckType,
} from "./truck-fields";
