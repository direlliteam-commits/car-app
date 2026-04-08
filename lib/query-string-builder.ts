import { CarFilters, SortOption } from "@/types/car";

export function buildQueryString(
  currentFilters: CarFilters,
  currentSearch: string,
  currentSort: SortOption,
  currentPage: number,
): string {
  const params = new URLSearchParams();
  params.set("limit", "50");
  params.set("offset", String(currentPage * 50));
  params.set("sort", currentSort);

  if (currentSearch.trim()) params.set("search", currentSearch.trim());

  if (currentFilters.vehicleType) params.set("vehicleType", currentFilters.vehicleType);

  const rangeFields: Array<[string, string, keyof CarFilters, keyof CarFilters]> = [
    ["yearFrom", "yearTo", "yearFrom", "yearTo"],
    ["priceFrom", "priceTo", "priceFrom", "priceTo"],
    ["mileageFrom", "mileageTo", "mileageFrom", "mileageTo"],
    ["engineVolumeFrom", "engineVolumeTo", "engineVolumeFrom", "engineVolumeTo"],
    ["horsepowerFrom", "horsepowerTo", "horsepowerFrom", "horsepowerTo"],
    ["accelerationFrom", "accelerationTo", "accelerationFrom", "accelerationTo"],
    ["payloadCapacityFrom", "payloadCapacityTo", "payloadCapacityFrom", "payloadCapacityTo"],
    ["grossWeightFrom", "grossWeightTo", "grossWeightFrom", "grossWeightTo"],
    ["seatingCapacityFrom", "seatingCapacityTo", "seatingCapacityFrom", "seatingCapacityTo"],
    ["operatingHoursFrom", "operatingHoursTo", "operatingHoursFrom", "operatingHoursTo"],
    ["operatingWeightFrom", "operatingWeightTo", "operatingWeightFrom", "operatingWeightTo"],
    ["seatHeightFrom", "seatHeightTo", "seatHeightFrom", "seatHeightTo"],
    ["dryWeightFrom", "dryWeightTo", "dryWeightFrom", "dryWeightTo"],
    ["fuelTankCapacityFrom", "fuelTankCapacityTo", "fuelTankCapacityFrom", "fuelTankCapacityTo"],
    ["bucketVolumeFrom", "bucketVolumeTo", "bucketVolumeFrom", "bucketVolumeTo"],
    ["diggingDepthFrom", "diggingDepthTo", "diggingDepthFrom", "diggingDepthTo"],
    ["boomLengthFrom", "boomLengthTo", "boomLengthFrom", "boomLengthTo"],
    ["bladeWidthFrom", "bladeWidthTo", "bladeWidthFrom", "bladeWidthTo"],
    ["liftingCapacityFrom", "liftingCapacityTo", "liftingCapacityFrom", "liftingCapacityTo"],
    ["liftingHeightFrom", "liftingHeightTo", "liftingHeightFrom", "liftingHeightTo"],
    ["drumVolumeFrom", "drumVolumeTo", "drumVolumeFrom", "drumVolumeTo"],
    ["rollerWidthFrom", "rollerWidthTo", "rollerWidthFrom", "rollerWidthTo"],
    ["cuttingWidthFrom", "cuttingWidthTo", "cuttingWidthFrom", "cuttingWidthTo"],
    ["drillingDepthFrom", "drillingDepthTo", "drillingDepthFrom", "drillingDepthTo"],
    ["pavingWidthFrom", "pavingWidthTo", "pavingWidthFrom", "pavingWidthTo"],
    ["platformCapacityFrom", "platformCapacityTo", "platformCapacityFrom", "platformCapacityTo"],
  ];
  for (const [fromParam, toParam, fromKey, toKey] of rangeFields) {
    let fromVal = currentFilters[fromKey] ? Number(currentFilters[fromKey]) : 0;
    let toVal = currentFilters[toKey] ? Number(currentFilters[toKey]) : 0;
    if (fromVal && toVal && fromVal > toVal) {
      [fromVal, toVal] = [toVal, fromVal];
    }
    if (fromVal) params.set(fromParam, String(fromVal));
    if (toVal) params.set(toParam, String(toVal));
  }

  const singleRangeFields: Array<[string, keyof CarFilters]> = [
    ["fuelConsumptionTo", "fuelConsumptionTo"],
    ["groundClearanceFrom", "groundClearanceFrom"],
    ["trunkVolumeFrom", "trunkVolumeFrom"],
    ["trunkVolumeTo", "trunkVolumeTo"],
  ];
  for (const [param, key] of singleRangeFields) {
    if (currentFilters[key]) params.set(param, String(currentFilters[key]));
  }

  const arrayFields: Array<[string, keyof CarFilters]> = [
    ["bodyTypes", "bodyTypes"],
    ["fuelTypes", "fuelTypes"],
    ["transmissions", "transmissions"],
    ["driveTypes", "driveTypes"],
    ["colors", "colors"],
    ["conditions", "conditions"],
    ["sellerTypes", "sellerTypes"],
    ["steeringWheels", "steeringWheels"],
    ["ownersCounts", "ownersCounts"],
    ["equipment", "equipment"],
    ["importCountries", "importCountries"],
    ["accidentHistories", "accidentHistories"],
    ["availabilities", "availabilities"],
    ["characteristics", "characteristics"],
    ["location", "location"],
    ["axleCounts", "axleCounts"],
    ["cabinTypes", "cabinTypes"],
    ["wheelConfigurations", "wheelConfigurations"],
    ["coolingTypes", "coolingTypes"],
    ["cylinderCounts", "cylinderCounts"],
    ["chassisTypes", "chassisTypes"],
    ["suspensionTypes", "suspensionTypes"],
    ["euroClasses", "euroClasses"],
    ["tractionClasses", "tractionClasses"],
  ];
  for (const [param, key] of arrayFields) {
    const arr = currentFilters[key] as string[] | undefined;
    if (arr && arr.length > 0) params.set(param, arr.join(","));
  }

  const booleanFields: Array<[string, keyof CarFilters]> = [
    ["hasGasEquipment", "hasGasEquipment"],
    ["exchangePossible", "exchangePossible"],
    ["installmentPossible", "installmentPossible"],
    ["creditAvailable", "creditAvailable"],
    ["noLegalIssues", "noLegalIssues"],
    ["customsCleared", "customsCleared"],
    ["hasPTO", "hasPTO"],
  ];
  for (const [param, key] of booleanFields) {
    if (currentFilters[key] !== undefined) params.set(param, String(currentFilters[key]));
  }

  if (currentFilters.hasPhotos) params.set("hasPhotos", "true");
  if (currentFilters.promotedOnly) params.set("promotedOnly", "true");

  if (currentFilters.vehicleSelections && currentFilters.vehicleSelections.length > 0) {
    const selectionsForQuery = currentFilters.vehicleSelections
      .filter((s) => s.brand || s.model)
      .map((s) => ({
        ...(s.brand ? { brand: s.brand } : {}),
        ...(s.model ? { model: s.model } : {}),
        ...(s.generation ? { generation: s.generation } : {}),
      }));
    if (selectionsForQuery.length > 0) {
      params.set("vehicleSelections", JSON.stringify(selectionsForQuery));
    }
  }

  return params.toString();
}
