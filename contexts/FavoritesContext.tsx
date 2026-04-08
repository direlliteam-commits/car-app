import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, ApiListing } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { mapListingToCar } from "@/lib/mappers";

const STORAGE_KEY = "auto_armenia_favorites";

interface FavoritesContextValue {
  favorites: string[];
  favoriteCars: Car[];
  isLoadingFavorites: boolean;
  toggleFavorite: (carId: string) => void;
  isFavorite: (carId: string) => boolean;
  refreshFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const wasAuthenticated = useRef(false);
  const queryClient = useQueryClient();

  const syncVersionRef = useRef(0);

  useEffect(() => {
    const version = ++syncVersionRef.current;
    const syncFavorites = async () => {
      if (isAuthenticated) {
        try {
          const res = await apiRequest("GET", API.favorites.list);
          if (syncVersionRef.current !== version) return;
          const data = await res.json();
          const listings = data.listings || data;
          const serverIds = listings.map((l: ApiListing) => String(l.id));

          if (!wasAuthenticated.current) {
            try {
              const stored = await AsyncStorage.getItem(STORAGE_KEY);
              const localIds: string[] = stored ? JSON.parse(stored) : [];
              const newIds = localIds.filter((id) => !serverIds.includes(id));

              const syncResults = await Promise.allSettled(
                newIds.map((id) => apiRequest("POST", API.favorites.toggle(id)))
              );
              if (syncVersionRef.current !== version) return;
              const successCount = syncResults.filter((r) => r.status === "fulfilled").length;
              if (newIds.length > 0 && successCount < newIds.length) {
                console.warn(`Favorites sync: ${successCount}/${newIds.length} synced`);
              }

              const merged = [...new Set([...serverIds, ...newIds])];
              setFavorites(merged);
              await AsyncStorage.removeItem(STORAGE_KEY);
            } catch (e) {
              if (syncVersionRef.current === version) setFavorites(serverIds);
            }
          } else {
            setFavorites(serverIds);
          }

          wasAuthenticated.current = true;
        } catch (e) {
          if (syncVersionRef.current !== version) return;
          console.error("loadFavorites API:", e);
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setFavorites(JSON.parse(stored));
          } catch (e2) {
            console.error("loadFavorites storage:", e2);
          }
        }
      } else {
        wasAuthenticated.current = false;
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (syncVersionRef.current === version) {
            setFavorites(stored ? JSON.parse(stored) : []);
          }
        } catch (e) {
          console.error("loadFavorites storage:", e);
        }
      }
    };
    syncFavorites();
  }, [isAuthenticated]);

  const toggleFavorite = useCallback(async (carId: string) => {
    let wasIncluded = false;
    setFavorites((prev) => {
      wasIncluded = prev.includes(carId);
      const newFavorites = wasIncluded
        ? prev.filter((id) => id !== carId)
        : [...prev, carId];

      if (!isAuthenticated) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
        queryClient.invalidateQueries({ queryKey: [API.listings.byIds, "favorites"] });
      }

      return newFavorites;
    });

    if (isAuthenticated) {
      apiRequest("POST", API.favorites.toggle(carId))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [API.favorites.list] });
          queryClient.invalidateQueries({ queryKey: [API.listings.list, carId, "detail"] });
        })
        .catch((e: unknown) => {
          console.error("toggleFavorite API:", e);
          setFavorites((prev) =>
            wasIncluded ? [...prev, carId] : prev.filter((id) => id !== carId)
          );
          queryClient.invalidateQueries({ queryKey: [API.favorites.list] });
        });
    }
  }, [isAuthenticated, queryClient]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const isFavorite = useCallback(
    (carId: string) => favoritesSet.has(carId),
    [favoritesSet]
  );

  const favoritesIdsString = useMemo(
    () => favorites.join(","),
    [favorites],
  );

  const authFavoritesQuery = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.favorites.list],
    enabled: isAuthenticated && favorites.length > 0,
    staleTime: 30_000,
  });

  const guestFavoritesQuery = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.listings.byIds, "favorites", favoritesIdsString],
    queryFn: async () => {
      if (favorites.length === 0) return { listings: [] };
      const res = await apiRequest("GET", `${API.listings.byIds}?ids=${favoritesIdsString}`);
      return res.json();
    },
    enabled: !isAuthenticated && favorites.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const favoriteCars = useMemo(() => {
    if (favorites.length === 0) return [];
    if (isAuthenticated) {
      if (!authFavoritesQuery.data?.listings) return [];
      return authFavoritesQuery.data.listings
        .filter((l: ApiListing) => favoritesSet.has(String(l.id)))
        .map(mapListingToCar)
        .map((car) => ({ ...car, isFavorite: true }));
    }
    if (!guestFavoritesQuery.data?.listings) return [];
    const mapped = guestFavoritesQuery.data.listings.map(mapListingToCar);
    const mappedById = new Map(mapped.map(car => [car.id, car]));
    return favorites
      .map((id) => mappedById.get(id))
      .filter((car): car is Car => car !== undefined)
      .map((car) => ({ ...car, isFavorite: true }));
  }, [isAuthenticated, authFavoritesQuery.data, guestFavoritesQuery.data, favorites, favoritesSet]);

  const isLoadingFavorites = isAuthenticated
    ? authFavoritesQuery.isLoading
    : guestFavoritesQuery.isLoading;

  const refreshFavorites = useCallback(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: [API.favorites.list] });
    } else {
      queryClient.invalidateQueries({ queryKey: [API.listings.byIds, "favorites"] });
    }
  }, [isAuthenticated, queryClient]);

  const value = useMemo(
    () => ({ favorites, favoriteCars, isLoadingFavorites, toggleFavorite, isFavorite, refreshFavorites }),
    [favorites, favoriteCars, isLoadingFavorites, toggleFavorite, isFavorite, refreshFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
