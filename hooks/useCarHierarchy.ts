import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";

export interface ApiBrand {
  id: number;
  name: string;
  cyrillicName: string | null;
  country: string | null;
  category: string | null;
  vehicleType: string;
  popular: boolean;
  logoUrl: string | null;
}

export interface ApiModel {
  id: number;
  brandId: number;
  name: string;
}

export interface ApiGeneration {
  id: number;
  modelId: number;
  name: string;
  yearFrom: number | null;
  yearTo: number | null;
  restyling: boolean;
  imageUrl: string | null;
}

export interface ApiConfiguration {
  id: number;
  generationId: number;
  name: string;
  bodyType: string | null;
  doorsCount: number | null;
  photoUrl: string | null;
}

export interface ApiModification {
  id: number;
  configurationId: number;
  generationId: number;
  name: string;
  horsePower: number | null;
  engineCapacity: number | null;
  engineType: string | null;
  transmissionCode: string | null;
  drive: string | null;
  acceleration: number | null;
  maxSpeed: number | null;
  fuelConsumptionCity: number | null;
  fuelConsumptionHighway: number | null;
  fuelConsumptionMixed: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  wheelBase: number | null;
  clearance: number | null;
  weight: number | null;
  fullWeight: number | null;
  trunkMinCapacity: number | null;
  trunkMaxCapacity: number | null;
  fuelTankCapacity: number | null;
  seats: string | null;
  cylinders: number | null;
  volume: number | null;
  moment: number | null;
  gearCount: number | null;
  petrolType: string | null;
  groupName: string | null;
  options: Record<string, number> | null;
}

const HIERARCHY_STALE_TIME = 10 * 60 * 1000;
const DETAIL_STALE_TIME = 5 * 60 * 1000;

export function useBrands(vehicleType?: string, equipmentClass?: string) {
  const isNonPassenger = vehicleType && vehicleType !== "passenger";
  const queryKey = equipmentClass
    ? [API.brands.list, { equipmentClass }]
    : vehicleType
      ? [API.brands.list, { vehicleType, withListings: isNonPassenger }]
      : [API.brands.list];

  const { data: rawBrands = [], isLoading: loading } = useQuery<ApiBrand[]>({
    queryKey,
    queryFn: async () => {
      const url = equipmentClass
        ? `${API.brands.list}?equipmentClass=${encodeURIComponent(equipmentClass)}`
        : vehicleType
          ? `${API.brands.list}?vehicleType=${vehicleType}${isNonPassenger ? "&withListings=true" : ""}`
          : API.brands.list;
      const res = await apiRequest("GET", url);
      return res.json();
    },
    staleTime: HIERARCHY_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  const brands = useMemo(() => {
    if (vehicleType) return rawBrands;
    const seen = new Map<string, ApiBrand>();
    for (const b of rawBrands) {
      const existing = seen.get(b.name);
      if (!existing || b.vehicleType === "passenger") {
        seen.set(b.name, b);
      }
    }
    return Array.from(seen.values());
  }, [rawBrands, vehicleType]);

  const popularBrands = useMemo(() => brands.filter(b => b.popular), [brands]);
  const chineseBrands = useMemo(() => brands.filter(b => b.category === "chinese"), [brands]);
  const foreignBrands = useMemo(() => brands.filter(b => b.category === "foreign"), [brands]);
  const russianBrands = useMemo(() => brands.filter(b => b.category === "russian"), [brands]);

  const constructionBrands = useMemo(() => brands.filter(b => b.category === "construction"), [brands]);
  const bulldozerBrands = useMemo(() => brands.filter(b => b.category === "bulldozer"), [brands]);
  const loaderBrands = useMemo(() => brands.filter(b => b.category === "loader"), [brands]);
  const craneBrands = useMemo(() => brands.filter(b => b.category === "crane"), [brands]);
  const roadBrands = useMemo(() => brands.filter(b => b.category === "road"), [brands]);
  const agricultureBrands = useMemo(() => brands.filter(b => b.category === "agriculture"), [brands]);
  const specialVehicleBrands = useMemo(() => brands.filter(b => b.category === "special_vehicle"), [brands]);

  return {
    brands, popularBrands, chineseBrands, foreignBrands, russianBrands,
    constructionBrands, bulldozerBrands, loaderBrands, craneBrands,
    roadBrands, agricultureBrands, specialVehicleBrands,
    loading,
  };
}

export type BrandCategory =
  | "all" | "popular" | "foreign" | "chinese" | "russian"
  | "construction" | "bulldozer" | "loader" | "crane" | "road" | "agriculture" | "special_vehicle";

export function useFilteredBrands(brands: ApiBrand[], searchQuery: string) {
  return useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase().trim();
    return brands.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.cyrillicName && b.cyrillicName.toLowerCase().includes(q))
    );
  }, [brands, searchQuery]);
}

export function useModels(brandId: number | null, equipmentClass?: string, vehicleType?: string) {
  const isNonPassenger = vehicleType && vehicleType !== "passenger";
  const queryKey = equipmentClass
    ? [API.brands.list, String(brandId), "models", { class: equipmentClass }]
    : [API.brands.list, String(brandId), "models", { withListings: isNonPassenger }];

  const { data: models = [], isLoading: loading } = useQuery<ApiModel[]>({
    queryKey,
    queryFn: async () => {
      const base = API.brands.models(brandId!);
      const params: string[] = [];
      if (equipmentClass) params.push(`class=${encodeURIComponent(equipmentClass)}`);
      else if (isNonPassenger) params.push("withListings=true");
      const url = params.length ? `${base}?${params.join("&")}` : base;
      const res = await apiRequest("GET", url);
      return res.json();
    },
    enabled: !!brandId,
    staleTime: HIERARCHY_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  return { models, loading };
}

export function useGenerations(modelId: number | null) {
  const { data: generations = [], isLoading: loading } = useQuery<ApiGeneration[]>({
    queryKey: [API.models.list, String(modelId), "generations"],
    enabled: !!modelId,
    staleTime: HIERARCHY_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  return { generations, loading };
}

export function useConfigurations(generationId: number | null) {
  const { data: configurations = [], isLoading: loading } = useQuery<ApiConfiguration[]>({
    queryKey: [API.generations.list, String(generationId), "configurations"],
    enabled: !!generationId,
    staleTime: DETAIL_STALE_TIME,
    gcTime: 15 * 60 * 1000,
  });

  return { configurations, loading };
}

export function useModifications(configurationId: number | null) {
  const { data: modifications = [], isLoading: loading } = useQuery<ApiModification[]>({
    queryKey: [API.configurations.list, String(configurationId), "modifications"],
    enabled: !!configurationId,
    staleTime: DETAIL_STALE_TIME,
    gcTime: 15 * 60 * 1000,
  });

  return { modifications, loading };
}
