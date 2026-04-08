import type { SpecialFieldDef } from "./special-equipment-fields";
import { translate } from "@/lib/i18n";

function getCoolingOptions() {
  return [
    { value: "air", label: translate("motoSpecs.coolingAir") },
    { value: "liquid", label: translate("motoSpecs.coolingLiquid") },
    { value: "oil", label: translate("motoSpecs.coolingOil") },
  ];
}

function getCylinderOptions() {
  return [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 6, label: "6" },
  ];
}

function getDriveTypeOptions() {
  return [
    { value: "chain", label: translate("motoSpecs.driveChain") },
    { value: "belt", label: translate("motoSpecs.driveBelt") },
    { value: "shaft", label: translate("motoSpecs.driveShaft") },
  ];
}

function getCommonMotoFields(): SpecialFieldDef[] {
  return [
    { key: "coolingType", label: translate("motoSpecs.coolingType"), type: "select", filterType: "select", filterArrayKey: "coolingTypes", pickerKey: "coolingType", options: getCoolingOptions() },
    { key: "cylinderCount", label: translate("motoSpecs.cylinders"), type: "select", filterType: "select", filterArrayKey: "cylinderCounts", pickerKey: "cylinderCount", options: getCylinderOptions() },
    { key: "dryWeight", label: translate("motoSpecs.dryWeight"), unit: translate("motoSpecs.unitKg"), type: "select", filterType: "range", pickerKey: "dryWeight" },
    { key: "fuelTankCapacity", label: translate("motoSpecs.fuelTankCapacity"), unit: translate("motoSpecs.unitL"), type: "number", filterType: "range", pickerKey: "fuelTank" },
  ];
}

function getSeatHeightField(): SpecialFieldDef {
  return { key: "seatHeight", label: translate("motoSpecs.seatHeight"), unit: translate("motoSpecs.unitMm"), type: "select", filterType: "range", pickerKey: "seatHeight" };
}

function getMotoDriveField(): SpecialFieldDef {
  return { key: "motoDriveType", label: translate("motoSpecs.driveType"), type: "select", filterType: "select", filterArrayKey: "driveTypes", pickerKey: "driveType", options: getDriveTypeOptions() };
}

function getStandardBikeFields(): SpecialFieldDef[] {
  return [
    ...getCommonMotoFields(),
    getSeatHeightField(),
    getMotoDriveField(),
  ];
}

function getTouringFields(): SpecialFieldDef[] {
  return [
    ...getCommonMotoFields(),
    getSeatHeightField(),
    getMotoDriveField(),
    { key: "seatingCapacity", label: translate("motoSpecs.seatingCapacity"), type: "number", filterType: "select", options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
    ]},
  ];
}

function getScooterFields(): SpecialFieldDef[] {
  return [
    ...getCommonMotoFields(),
    getSeatHeightField(),
  ];
}

function getAtvFields(): SpecialFieldDef[] {
  return [
    ...getCommonMotoFields(),
    getMotoDriveField(),
    { key: "payloadCapacity", label: translate("motoSpecs.payloadCapacity"), unit: translate("motoSpecs.unitKg"), type: "number", filterType: "range", pickerKey: "payloadCapacity" },
  ];
}

function getMinibikeFields(): SpecialFieldDef[] {
  return [
    ...getCommonMotoFields(),
    getSeatHeightField(),
  ];
}

function getMotoTypeFields(): Record<string, SpecialFieldDef[]> {
  return {
    sport_bike: getStandardBikeFields(),
    cruiser: [...getCommonMotoFields(), getSeatHeightField(), getMotoDriveField()],
    touring: getTouringFields(),
    enduro: getStandardBikeFields(),
    chopper: [...getCommonMotoFields(), getSeatHeightField(), getMotoDriveField()],
    scooter: getScooterFields(),
    naked: getStandardBikeFields(),
    classic: getStandardBikeFields(),
    adventure: getStandardBikeFields(),
    motocross: getStandardBikeFields(),
    trial: getStandardBikeFields(),
    supermoto: getStandardBikeFields(),
    cafe_racer: getStandardBikeFields(),
    bobber: getStandardBikeFields(),
    custom_moto: [...getCommonMotoFields(), getSeatHeightField(), getMotoDriveField()],
    atv: getAtvFields(),
    pitbike: getStandardBikeFields(),
    minibike: getMinibikeFields(),
  };
}

export function getFieldsForMotoType(bodyType: string): SpecialFieldDef[] {
  const fields = getMotoTypeFields();
  return fields[bodyType] || getStandardBikeFields();
}

const MOTO_FILTER_ALLOWED_KEYS = new Set([
  "coolingType", "cylinderCount", "dryWeight", "fuelTankCapacity",
  "seatHeight", "motoDriveType", "payloadCapacity",
]);

export function getFilterFieldsForMotoType(bodyType: string): SpecialFieldDef[] {
  return getFieldsForMotoType(bodyType).filter(f => MOTO_FILTER_ALLOWED_KEYS.has(f.key));
}
