import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FormData } from "@/types/car-form";
import { apiRequest, getAuthToken } from "@/lib/query-client";

export const DRAFTS_KEY = "armauto_drafts";

export interface DraftEntry {
  id: string;
  serverId?: number;
  data: Partial<FormData>;
  updatedAt: number;
}

export async function loadDrafts(): Promise<DraftEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DraftEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDraft(id: string, data: Partial<FormData>, serverId?: number): Promise<void> {
  const drafts = await loadDrafts();
  const idx = drafts.findIndex((d) => d.id === id);
  const existing = idx >= 0 ? drafts[idx] : undefined;
  const entry: DraftEntry = { id, data, updatedAt: Date.now(), serverId: serverId ?? existing?.serverId };
  if (idx >= 0) {
    drafts[idx] = entry;
  } else {
    drafts.unshift(entry);
  }
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export async function removeDraft(id: string): Promise<void> {
  const drafts = await loadDrafts();
  const draft = drafts.find((d) => d.id === id);
  const filtered = drafts.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));

  if (draft?.serverId) {
    try {
      await apiRequest("DELETE", `/api/drafts/${draft.serverId}`);
    } catch {}
  }
}

function formDataToServerPayload(data: Partial<FormData>): Record<string, unknown> {
  return {
    brand: data.brand || "",
    model: data.model || "",
    year: data.year || new Date().getFullYear(),
    price: data.price || 0,
    mileage: data.mileage || 0,
    bodyType: data.bodyType || "",
    fuelType: data.fuelType || "",
    transmission: data.transmission || "",
    driveType: data.driveType || "",
    engineVolume: data.engineVolume || 0,
    horsepower: data.horsepower || 0,
    color: data.color || "",
    images: data.images || [],
    description: data.description || "",
    location: data.location || "",
    condition: data.condition || "used",
    vehicleType: data.vehicleType || "passenger",
    sellerName: data.sellerName || "",
    sellerPhone: data.sellerPhone || "",
    sellerType: data.sellerType || "private",
    equipment: data.equipment || [],
    currency: data.currency,
    generation: data.generation,
    version: data.version,
    vin: data.vin,
    steeringWheel: data.steeringWheel,
    exchangePossible: data.exchangePossible,
    exchangeDetails: data.exchangeDetails,
    customsCleared: data.customsCleared,
    hasGasEquipment: data.hasGasEquipment,
    ownersCount: data.ownersCount,
    accidentHistory: data.accidentHistory,
    installmentPossible: data.installmentPossible,
    installmentDetails: data.installmentDetails,
    creditAvailable: data.creditAvailable,
    tradeInAvailable: data.tradeInAvailable,
    importCountry: data.importCountry,
    warranty: data.warranty,
    availability: data.availability,
    noLegalIssues: data.noLegalIssues,
    bodyDamages: data.bodyDamages,
    branchId: data.branchId,
    originalPrice: data.originalPrice,
    creditDiscount: data.creditDiscount,
    tradeInDiscount: data.tradeInDiscount,
    insuranceDiscount: data.insuranceDiscount,
  };
}

interface ServerDraft {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  engineVolume: number;
  horsepower: number;
  color: string;
  images: string[];
  description: string;
  location: string;
  condition: string;
  vehicleType: string;
  sellerName: string;
  sellerPhone: string;
  sellerType: string;
  equipment: string[];
  currency: string;
  generation: string;
  version: string;
  vin: string;
  steeringWheel: string;
  exchangePossible: boolean;
  exchangeDetails: string;
  customsCleared: boolean;
  hasGasEquipment: boolean;
  ownersCount: string;
  accidentHistory: string;
  installmentPossible: boolean;
  installmentDetails: string;
  creditAvailable: boolean;
  tradeInAvailable: boolean;
  importCountry: string;
  warranty: string;
  availability: string;
  noLegalIssues: boolean;
  bodyDamages: Record<string, string>;
  branchId: string | null;
  originalPrice: number;
  creditDiscount: number;
  tradeInDiscount: number;
  insuranceDiscount: number;
  updatedAt: string;
}

function serverDraftToFormData(d: ServerDraft): Partial<FormData> {
  return {
    brand: d.brand || "",
    model: d.model || "",
    year: d.year || undefined,
    price: d.price ? String(d.price) : undefined,
    mileage: d.mileage ? String(d.mileage) : undefined,
    bodyType: d.bodyType || undefined,
    fuelType: d.fuelType || undefined,
    transmission: d.transmission || undefined,
    driveType: d.driveType || undefined,
    engineVolume: d.engineVolume ? String(d.engineVolume) : undefined,
    horsepower: d.horsepower ? String(d.horsepower) : undefined,
    color: d.color || undefined,
    images: d.images || [],
    description: d.description || "",
    location: d.location || "",
    condition: d.condition || "used",
    vehicleType: d.vehicleType || "passenger",
    sellerName: d.sellerName || "",
    sellerPhone: d.sellerPhone || "",
    sellerType: d.sellerType || "private",
    equipment: d.equipment || [],
    currency: d.currency || undefined,
    generation: d.generation || "",
    version: d.version || "",
    vin: d.vin || "",
    steeringWheel: d.steeringWheel || undefined,
    exchangePossible: d.exchangePossible ?? false,
    exchangeDetails: d.exchangeDetails || "",
    customsCleared: d.customsCleared ?? false,
    hasGasEquipment: d.hasGasEquipment ?? false,
    ownersCount: d.ownersCount || undefined,
    accidentHistory: d.accidentHistory || undefined,
    installmentPossible: d.installmentPossible ?? false,
    installmentDetails: d.installmentDetails || "",
    creditAvailable: d.creditAvailable ?? false,
    tradeInAvailable: d.tradeInAvailable ?? false,
    importCountry: d.importCountry || undefined,
    warranty: d.warranty || "",
    availability: d.availability || undefined,
    noLegalIssues: d.noLegalIssues ?? false,
    bodyDamages: d.bodyDamages || {},
    branchId: d.branchId || null,
    originalPrice: d.originalPrice ? String(d.originalPrice) : "",
    creditDiscount: d.creditDiscount ? String(d.creditDiscount) : "",
    tradeInDiscount: d.tradeInDiscount ? String(d.tradeInDiscount) : "",
    insuranceDiscount: d.insuranceDiscount ? String(d.insuranceDiscount) : "",
  } as Partial<FormData>;
}

export async function syncDraftToServer(id: string, data: Partial<FormData>): Promise<number | undefined> {
  try {
    const token = await getAuthToken();
    if (!token) return undefined;

    const drafts = await loadDrafts();
    const draft = drafts.find((d) => d.id === id);
    const serverId = draft?.serverId;
    const serverData = formDataToServerPayload(data);

    if (serverId) {
      await apiRequest("PUT", `/api/drafts/${serverId}`, serverData);
      return serverId;
    } else {
      const res = await apiRequest("POST", "/api/drafts", serverData);
      const result = await res.json();
      if (result?.id) {
        await saveDraft(id, data, result.id);
        return result.id;
      }
    }
  } catch {
  }
  return undefined;
}

export async function loadServerDrafts(): Promise<DraftEntry[]> {
  try {
    const token = await getAuthToken();
    if (!token) return [];

    const res = await apiRequest("GET", "/api/drafts");
    const serverDrafts: ServerDraft[] = await res.json();

    if (!Array.isArray(serverDrafts)) return [];

    return serverDrafts.map((d) => ({
      id: `server_${d.id}`,
      serverId: d.id,
      data: serverDraftToFormData(d),
      updatedAt: new Date(d.updatedAt).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function migrateLegacyDraft(): Promise<void> {
  try {
    const legacyKey = "armcars_add_draft";
    const raw = await AsyncStorage.getItem(legacyKey);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<FormData>;
    const hasContent = saved.brand || saved.model || saved.price || saved.mileage || (saved.images && saved.images.length > 0);
    if (hasContent) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
      await saveDraft(id, saved);
    }
    await AsyncStorage.removeItem(legacyKey);
  } catch {
  }
}
