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
import { useQuery } from "@tanstack/react-query";
import { Car, ApiListing } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { mapListingToCar } from "@/lib/mappers";

const STORAGE_KEY = "auto_armenia_comparison";
const MAX_COMPARISON = 3;

interface ComparisonContextValue {
  comparisonList: string[];
  comparisonCars: Car[];
  isLoadingComparison: boolean;
  toggleComparison: (carId: string) => Promise<boolean>;
  clearComparison: () => void;
  isInComparison: (carId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<string[]>([]);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setComparisonList(JSON.parse(stored));
    } catch (e) {
      console.error("loadComparison:", e);
    }
  };

  const toggleComparison = useCallback(
    async (carId: string): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setComparisonList((prev) => {
          if (prev.includes(carId)) {
            const next = prev.filter((id) => id !== carId);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).then(() => resolve(false)).catch(() => resolve(false));
            return next;
          }
          if (prev.length >= MAX_COMPARISON) {
            resolve(false);
            return prev;
          }
          const next = [...prev, carId];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).then(() => resolve(true)).catch(() => resolve(true));
          return next;
        });
      });
    },
    []
  );

  const clearComparison = useCallback(async () => {
    setComparisonList([]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }, []);

  const comparisonSet = useMemo(() => new Set(comparisonList), [comparisonList]);

  const isInComparison = useCallback(
    (carId: string) => comparisonSet.has(carId),
    [comparisonSet]
  );

  const comparisonIdsString = useMemo(
    () => comparisonList.join(","),
    [comparisonList],
  );

  const comparisonQuery = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.listings.byIds, "comparison", comparisonIdsString],
    queryFn: async () => {
      if (comparisonList.length === 0) return { listings: [] };
      const res = await apiRequest("GET", `${API.listings.byIds}?ids=${comparisonIdsString}`);
      return res.json();
    },
    enabled: comparisonList.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const comparisonCars = useMemo(() => {
    if (!comparisonQuery.data?.listings) return [];
    const mapped = comparisonQuery.data.listings.map(mapListingToCar);
    const mappedById = new Map(mapped.map(car => [car.id, car]));
    return comparisonList
      .map((id) => mappedById.get(id))
      .filter((car): car is Car => car !== undefined);
  }, [comparisonQuery.data, comparisonList]);

  const value = useMemo(
    () => ({
      comparisonList,
      comparisonCars,
      isLoadingComparison: comparisonQuery.isLoading,
      toggleComparison,
      clearComparison,
      isInComparison,
    }),
    [comparisonList, comparisonCars, comparisonQuery.isLoading, toggleComparison, clearComparison, isInComparison]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
