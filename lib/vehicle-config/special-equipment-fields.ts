import { translate } from "@/lib/i18n";

export interface SpecialFieldDef {
  key: string;
  label: string;
  unit?: string;
  type: "number" | "boolean" | "select";
  filterType?: "range" | "boolean" | "select";
  filterArrayKey?: string;
  pickerKey?: string;
  options?: { value: string | number; label: string }[];
}

export function getTractionClasses() {
  return [
    { value: "0.6", label: "0.6" },
    { value: "0.9", label: "0.9" },
    { value: "1.4", label: "1.4" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "10", label: "10" },
  ];
}

function getChassisOptions() {
  return [
    { value: "wheeled", label: translate("specialSpecs.chassisWheeled") },
    { value: "tracked", label: translate("specialSpecs.chassisTracked") },
  ];
}

function getCommonSpecialFields(): SpecialFieldDef[] {
  return [
    { key: "operatingHours", label: translate("specialSpecs.operatingHours"), unit: translate("specialSpecs.unitHours"), type: "select", filterType: "range", pickerKey: "operatingHours" },
    { key: "horsepower", label: translate("specialSpecs.horsepower"), unit: translate("specialSpecs.unitHp"), type: "number", filterType: "range" },
    { key: "chassisType", label: translate("specialSpecs.chassisType"), type: "select", filterType: "select", options: getChassisOptions() },
    { key: "operatingWeight", label: translate("specialSpecs.operatingWeight"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getExcavatorFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "bucketVolume", label: translate("specialSpecs.bucketVolume"), unit: translate("specialSpecs.unitM3"), type: "number", filterType: "range" },
    { key: "diggingDepth", label: translate("specialSpecs.diggingDepth"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "boomLength", label: translate("specialSpecs.boomLength"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getBulldozerFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "bladeWidth", label: translate("specialSpecs.bladeWidth"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "tractionClass", label: translate("specialSpecs.tractionClass"), type: "select", filterType: "select", options: getTractionClasses() },
  ];
}

function getLoaderFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "liftingHeight", label: translate("specialSpecs.liftingHeight"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getForkliftFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "liftingHeight", label: translate("specialSpecs.liftingHeight"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getCraneFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitTons"), type: "number", filterType: "range" },
    { key: "boomLength", label: translate("specialSpecs.boomLength"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "liftingHeight", label: translate("specialSpecs.liftingHeight"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getConcreteMixerFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "drumVolume", label: translate("specialSpecs.drumVolume"), unit: translate("specialSpecs.unitM3"), type: "number", filterType: "range" },
  ];
}

function getRoadRollerFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "rollerWidth", label: translate("specialSpecs.rollerWidth"), unit: translate("specialSpecs.unitMm"), type: "number", filterType: "range" },
  ];
}

function getGraderFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "bladeWidth", label: translate("specialSpecs.bladeWidth"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getHarvesterFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "cuttingWidth", label: translate("specialSpecs.cuttingWidth"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "hasPTO", label: translate("specialSpecs.hasPTO"), type: "boolean", filterType: "boolean" },
  ];
}

function getTractorFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "tractionClass", label: translate("specialSpecs.tractionClass"), type: "select", filterType: "select", options: getTractionClasses() },
    { key: "hasPTO", label: translate("specialSpecs.hasPTO"), type: "boolean", filterType: "boolean" },
  ];
}

function getAerialPlatformFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingHeight", label: translate("specialSpecs.liftingHeight"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "platformCapacity", label: translate("specialSpecs.platformCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getScissorLiftFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingHeight", label: translate("specialSpecs.liftingHeight"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
    { key: "platformCapacity", label: translate("specialSpecs.platformCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getBackhoeFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "bucketVolume", label: translate("specialSpecs.bucketVolume"), unit: translate("specialSpecs.unitM3"), type: "number", filterType: "range" },
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getSkidSteerFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "bucketVolume", label: translate("specialSpecs.bucketVolume"), unit: translate("specialSpecs.unitM3"), type: "number", filterType: "range" },
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getDrillingRigFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "drillingDepth", label: translate("specialSpecs.drillingDepth"), unit: translate("specialSpecs.unitM"), type: "number", filterType: "range" },
  ];
}

function getAsphaltPaverFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "pavingWidth", label: translate("specialSpecs.pavingWidth"), unit: translate("specialSpecs.unitMm"), type: "number", filterType: "range" },
  ];
}

function getTowTruckFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getBusFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "seatingCapacity", label: translate("specialSpecs.seatingCapacity"), type: "select", filterType: "select", options: [
      { value: "10", label: "10" },
      { value: "15", label: "15" },
      { value: "20", label: "20" },
      { value: "25", label: "25" },
      { value: "30", label: "30" },
      { value: "35", label: "35" },
      { value: "40", label: "40" },
      { value: "45", label: "45" },
      { value: "50", label: "50" },
      { value: "55", label: "55" },
      { value: "60", label: "60" },
    ]},
  ];
}

function getMinibusFields(): SpecialFieldDef[] {
  return [
    ...getCommonSpecialFields(),
    { key: "seatingCapacity", label: translate("specialSpecs.seatingCapacity"), type: "select", filterType: "select", options: [
      { value: "6", label: "6" },
      { value: "7", label: "7" },
      { value: "8", label: "8" },
      { value: "9", label: "9" },
      { value: "10", label: "10" },
      { value: "12", label: "12" },
      { value: "14", label: "14" },
      { value: "16", label: "16" },
      { value: "18", label: "18" },
      { value: "20", label: "20" },
    ]},
  ];
}

function getTrailerSpecialFields(): SpecialFieldDef[] {
  return [
    { key: "operatingWeight", label: translate("specialSpecs.weight"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
    { key: "liftingCapacity", label: translate("specialSpecs.liftingCapacity"), unit: translate("specialSpecs.unitKg"), type: "number", filterType: "range" },
  ];
}

function getEquipmentTypeFields(): Record<string, SpecialFieldDef[]> {
  return {
    excavator: getExcavatorFields(),
    bulldozer: getBulldozerFields(),
    loader: getLoaderFields(),
    forklift: getForkliftFields(),
    crane_truck: getCraneFields(),
    concrete_mixer: getConcreteMixerFields(),
    road_roller: getRoadRollerFields(),
    grader: getGraderFields(),
    harvester: getHarvesterFields(),
    farm_tractor: getTractorFields(),
    aerial_platform: getAerialPlatformFields(),
    scissor_lift: getScissorLiftFields(),
    backhoe: getBackhoeFields(),
    skid_steer: getSkidSteerFields(),
    drilling_rig: getDrillingRigFields(),
    asphalt_paver: getAsphaltPaverFields(),
    tow_truck: getTowTruckFields(),
    bus: getBusFields(),
    minibus: getMinibusFields(),
    trailer_special: getTrailerSpecialFields(),
    special_vehicle: getCommonSpecialFields(),
  };
}

export function getFieldsForEquipmentType(bodyType: string): SpecialFieldDef[] {
  const fields = getEquipmentTypeFields();
  return fields[bodyType] || getCommonSpecialFields();
}

const FILTER_ALLOWED_KEYS = new Set([
  "operatingHours", "horsepower", "operatingWeight", "chassisType",
  "bucketVolume", "liftingCapacity", "liftingHeight",
]);

export function getFilterFieldsForEquipmentType(bodyType: string): SpecialFieldDef[] {
  return getFieldsForEquipmentType(bodyType).filter(f => FILTER_ALLOWED_KEYS.has(f.key));
}
