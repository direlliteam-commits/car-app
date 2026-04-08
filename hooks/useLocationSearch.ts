import { useState, useRef, useEffect, useCallback } from "react";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export const ARMENIA_CENTER = { latitude: 40.1872, longitude: 44.5152 };
export const ARMENIA_DELTA = { latitudeDelta: 2.5, longitudeDelta: 2.5 };

export interface LocationResult {
  address: string;
  city: string;
  lat: number;
  lng: number;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    road?: string;
    house_number?: string;
  };
}

interface UseLocationSearchOptions {
  initialAddress?: string;
  initialCity?: string;
  initialLat?: number | null;
  initialLng?: number | null;
}

export function extractCity(addr?: NominatimResult["address"]): string {
  if (!addr) return "";
  return addr.city || addr.town || addr.village || "";
}

export function formatAddress(item: NominatimResult): string {
  const parts = item.display_name.split(",").map((s) => s.trim());
  return parts.slice(0, 3).join(", ");
}

export function useLocationSearch(options: UseLocationSearchOptions = {}) {
  const { initialAddress, initialCity, initialLat, initialLng } = options;

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(initialAddress || "");
  const [selectedCity, setSelectedCity] = useState(initialCity || "");
  const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: query + ", Armenia",
        format: "json",
        limit: "6",
        countrycodes: "am",
        addressdetails: "1",
      });
      const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
        headers: { "User-Agent": "ArmAuto/1.0", "Accept-Language": "hy,ru,en" },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAddress(text), 400);
  }, [searchAddress]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "json",
        addressdetails: "1",
        zoom: "18",
      });
      const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
        headers: { "User-Agent": "ArmAuto/1.0", "Accept-Language": "hy,ru,en" },
      });
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || "";
        const road = data.address?.road || "";
        const houseNumber = data.address?.house_number || "";
        const addr = [road, houseNumber].filter(Boolean).join(" ") || data.display_name?.split(",").slice(0, 2).join(", ") || "";
        setSelectedAddress(addr);
        setSelectedCity(city);
      }
    } catch {}
  }, []);

  const selectResult = useCallback((item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const city = extractCity(item.address);
    const addr = formatAddress(item);
    setMarkerCoord({ latitude: lat, longitude: lng });
    setSelectedAddress(addr);
    setSelectedCity(city);
    setSearchText("");
    setSearchResults([]);
    return { lat, lng, city, addr };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSearchResults([]);
  }, []);

  return {
    searchText,
    searchResults,
    searching,
    locating,
    setLocating,
    selectedAddress,
    selectedCity,
    markerCoord,
    setMarkerCoord,
    handleSearchChange,
    reverseGeocode,
    selectResult,
    clearSearch,
  };
}
