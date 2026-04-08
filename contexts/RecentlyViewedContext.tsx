import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "@/lib/api-endpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, ApiListing } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { mapListingToCar } from "@/lib/mappers";

const STORAGE_KEY = "recently_viewed_ids";
const MAX_ITEMS = 50;

interface RecentlyViewedContextValue {
  recentlyViewed: string[];
  recentlyViewedCars: Car[];
  addToRecentlyViewed: (carId: string) => void;
  clearRecentlyViewed: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  useEffect(() => {
    loadIds();
  }, [isAuthenticated]);

  const loadIds = async () => {
    if (isAuthenticated) {
      try {
        const res = await apiRequest("GET", API.recentlyViewed);
        const data = await res.json();
        const listings = data.listings || data;
        setRecentlyViewed(listings.map((l: { id: number }) => String(l.id)));
        return;
      } catch (e) {
        console.error("loadRecentlyViewed API:", e);
      }
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch (e) {
      console.error("loadRecentlyViewed storage:", e);
    }
  };

  const addToRecentlyViewed = useCallback(
    (carId: string) => {
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((id) => id !== carId);
        const next = [carId, ...filtered].slice(0, MAX_ITEMS);
        if (!isAuthenticated) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
      queryClient.invalidateQueries({ queryKey: [API.listings.byIds] });
    },
    [isAuthenticated, queryClient],
  );

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const idsString = useMemo(() => recentlyViewed.join(","), [recentlyViewed]);

  const query = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.listings.byIds, idsString],
    queryFn: async () => {
      if (recentlyViewed.length === 0) return { listings: [] };
      if (isAuthenticated) {
        const res = await apiRequest("GET", API.recentlyViewed);
        return res.json();
      }
      const res = await apiRequest("GET", `${API.listings.byIds}?ids=${idsString}`);
      return res.json();
    },
    enabled: recentlyViewed.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const recentlyViewedCars = useMemo(() => {
    if (!query.data?.listings) return [];
    const mapped = query.data.listings.map(mapListingToCar);
    if (isAuthenticated) return mapped;
    const mappedById = new Map(mapped.map((car) => [car.id, car]));
    return recentlyViewed
      .map((id) => mappedById.get(id))
      .filter((car): car is Car => car !== undefined);
  }, [query.data, recentlyViewed, isAuthenticated]);

  const value = useMemo(
    () => ({
      recentlyViewed,
      recentlyViewedCars,
      addToRecentlyViewed,
      clearRecentlyViewed,
    }),
    [recentlyViewed, recentlyViewedCars, addToRecentlyViewed, clearRecentlyViewed],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  }
  return context;
}
