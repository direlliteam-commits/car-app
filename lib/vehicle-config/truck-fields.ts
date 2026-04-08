import type { SpecialFieldDef } from "./special-equipment-fields";
import { translate } from "@/lib/i18n";

function getSuspensionOptions() {
  return [
    { value: "leaf_spring", label: translate("truckSpecs.suspensionLeafSpring") },
    { value: "air", label: translate("truckSpecs.suspensionAir") },
    { value: "combined", label: translate("truckSpecs.suspensionCombined") },
  ];
}

function getCabinTypeOptions() {
  return [
    { value: "day", label: translate("truckSpecs.cabinDay") },
    { value: "sleeper", label: translate("truckSpecs.cabinSleeper") },
    { value: "crew", label: translate("truckSpecs.cabinCrew") },
    { value: "extended", label: translate("truckSpecs.cabinExtended") },
  ];
}

function getWheelConfigOptions() {
  return [
    { value: "4x2", label: "4x2" },
    { value: "4x4", label: "4x4" },
    { value: "6x2", label: "6x2" },
    { value: "6x4", label: "6x4" },
    { value: "6x6", label: "6x6" },
    { value: "8x2", label: "8x2" },
    { value: "8x4", label: "8x4" },
    { value: "8x8", label: "8x8" },
  ];
}

function getAxleCountOptions() {
  return [
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
  ];
}

function getEuroClassOptions() {
  return [
    { value: "euro_0", label: "Euro 0" },
    { value: "euro_1", label: "Euro 1" },
    { value: "euro_2", label: "Euro 2" },
    { value: "euro_3", label: "Euro 3" },
    { value: "euro_4", label: "Euro 4" },
    { value: "euro_5", label: "Euro 5" },
    { value: "euro_6", label: "Euro 6" },
  ];
}

function getCommonTruckFields(): SpecialFieldDef[] {
  return [
    { key: "payloadCapacity", label: translate("truckSpecs.payloadCapacity"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "grossWeight", label: translate("truckSpecs.grossWeight"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "horsepower", label: translate("truckSpecs.horsepower"), unit: translate("truckSpecs.unitHp"), type: "number", filterType: "range" },
    { key: "wheelConfiguration", label: translate("truckSpecs.wheelConfiguration"), type: "select", filterType: "select", filterArrayKey: "wheelConfigurations", pickerKey: "wheelConfig", options: getWheelConfigOptions() },
    { key: "axleCount", label: translate("truckSpecs.axleCount"), type: "number", filterType: "select", filterArrayKey: "axleCounts", pickerKey: "axleCount", options: getAxleCountOptions() },
    { key: "suspensionType", label: translate("truckSpecs.suspensionType"), type: "select", filterType: "select", filterArrayKey: "suspensionTypes", pickerKey: "suspensionType", options: getSuspensionOptions() },
    { key: "euroClass", label: translate("truckSpecs.euroClass"), type: "select", filterType: "select", filterArrayKey: "euroClasses", pickerKey: "euroClass", options: getEuroClassOptions() },
  ];
}

function getCabinTypeField(): SpecialFieldDef {
  return { key: "cabinType", label: translate("truckSpecs.cabinType"), type: "select", filterType: "select", options: getCabinTypeOptions() };
}

function getSeatingOptions(values: string[]) {
  return values.map(v => ({ value: v, label: v }));
}

function getTruckGenericFields(): SpecialFieldDef[] {
  return [
    ...getCommonTruckFields(),
    getCabinTypeField(),
    { key: "seatingCapacity", label: translate("truckSpecs.seatingCapacity"), type: "select", filterType: "range", pickerKey: "seatingCapacity", options: getSeatingOptions(["2", "3", "5", "6", "7"]) },
  ];
}

function getVanFields(): SpecialFieldDef[] {
  return [
    { key: "payloadCapacity", label: translate("truckSpecs.payloadCapacity"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "grossWeight", label: translate("truckSpecs.grossWeight"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "horsepower", label: translate("truckSpecs.horsepower"), unit: translate("truckSpecs.unitHp"), type: "number", filterType: "range" },
    { key: "seatingCapacity", label: translate("truckSpecs.seatingCapacity"), type: "select", filterType: "range", pickerKey: "seatingCapacity", options: getSeatingOptions(["2", "3", "5", "6", "7", "8", "9"]) },
  ];
}

function getPickupFields(): SpecialFieldDef[] {
  return [
    { key: "payloadCapacity", label: translate("truckSpecs.payloadCapacity"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "horsepower", label: translate("truckSpecs.horsepower"), unit: translate("truckSpecs.unitHp"), type: "number", filterType: "range" },
    { key: "seatingCapacity", label: translate("truckSpecs.seatingCapacity"), type: "select", filterType: "range", pickerKey: "seatingCapacity", options: getSeatingOptions(["2", "4", "5"]) },
  ];
}

function getDumpTruckFields(): SpecialFieldDef[] {
  return [
    ...getCommonTruckFields(),
    { key: "bucketVolume", label: translate("truckSpecs.bucketVolume"), unit: translate("truckSpecs.unitM3"), type: "number", filterType: "range" },
    getCabinTypeField(),
  ];
}

function getTankerFields(): SpecialFieldDef[] {
  return [
    ...getCommonTruckFields(),
    { key: "drumVolume", label: translate("truckSpecs.drumVolume"), unit: translate("truckSpecs.unitM3"), type: "number", filterType: "range" },
    getCabinTypeField(),
  ];
}

function getTrailerFields(): SpecialFieldDef[] {
  return [
    { key: "payloadCapacity", label: translate("truckSpecs.payloadCapacity"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "grossWeight", label: translate("truckSpecs.grossWeight"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "axleCount", label: translate("truckSpecs.axleCount"), type: "number", filterType: "select", filterArrayKey: "axleCounts", pickerKey: "axleCount", options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
    ]},
  ];
}

function getSemiTrailerFields(): SpecialFieldDef[] {
  return [
    { key: "payloadCapacity", label: translate("truckSpecs.payloadCapacity"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "grossWeight", label: translate("truckSpecs.grossWeight"), unit: translate("truckSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "axleCount", label: translate("truckSpecs.axleCount"), type: "number", filterType: "select", filterArrayKey: "axleCounts", pickerKey: "axleCount", options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
    ]},
    { key: "suspensionType", label: translate("truckSpecs.suspensionType"), type: "select", filterType: "select", filterArrayKey: "suspensionTypes", pickerKey: "suspensionType", options: getSuspensionOptions() },
  ];
}

function getTruckTypeFields(): Record<string, SpecialFieldDef[]> {
  return {
    truck: getTruckGenericFields(),
    van: getVanFields(),
    chassis_cab: [...getCommonTruckFields(), getCabinTypeField()],
    pickup: getPickupFields(),
    tractor: [...getCommonTruckFields(), getCabinTypeField()],
    dump_truck: getDumpTruckFields(),
    refrigerator_truck: [...getCommonTruckFields(), getCabinTypeField()],
    tanker: getTankerFields(),
    flatbed: [...getCommonTruckFields(), getCabinTypeField()],
    trailer: getTrailerFields(),
    semi_trailer: getSemiTrailerFields(),
  };
}

export function getFieldsForTruckType(bodyType: string): SpecialFieldDef[] {
  const fields = getTruckTypeFields();
  return fields[bodyType] || getCommonTruckFields();
}

const TRUCK_FILTER_ALLOWED_KEYS = new Set([
  "payloadCapacity", "grossWeight", "horsepower", "wheelConfiguration",
  "axleCount", "suspensionType", "euroClass", "cabinType", "seatingCapacity",
]);

export function getFilterFieldsForTruckType(bodyType: string): SpecialFieldDef[] {
  return getFieldsForTruckType(bodyType).filter(f => TRUCK_FILTER_ALLOWED_KEYS.has(f.key));
}
