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
import { CarFilters, SavedSearch } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { API } from "@/lib/api-endpoints";

const STORAGE_KEY = "auto_armenia_saved_searches";

interface SavedSearchApiResponse {
  id: number;
  name: string;
  filters: CarFilters;
  createdAt?: string;
  created_at?: string;
  notificationsEnabled?: boolean;
  notifications_enabled?: boolean;
  resultsCount?: number;
  results_count?: number;
}

interface SavedSearchContextValue {
  savedSearches: SavedSearch[];
  saveSearch: (name: string, filters: CarFilters, notificationsEnabled: boolean, resultsCount: number) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  toggleSearchNotifications: (searchId: string) => Promise<void>;
  refreshSavedSearches: () => Promise<void>;
}

const SavedSearchContext = createContext<SavedSearchContextValue | null>(null);

export function SavedSearchProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const isFirstLoad = useRef(true);

  const loadSavedSearches = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await apiRequest("GET", API.savedSearches.list);
        const data = await res.json();
        setSavedSearches(
          data.map((s: SavedSearchApiResponse) => ({
            id: String(s.id),
            name: s.name,
            filters: s.filters,
            createdAt: s.createdAt || s.created_at || new Date().toISOString(),
            notificationsEnabled:
              s.notificationsEnabled ?? s.notifications_enabled ?? false,
            resultsCount: s.resultsCount ?? s.results_count ?? 0,
          }))
        );
        return;
      } catch (e) {
        console.error("loadSavedSearches API:", e);
      }
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      setSavedSearches(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error("loadSavedSearches storage:", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (!isAuthenticated) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
    }
  }, [savedSearches, isAuthenticated]);

  const saveSearch = useCallback(
    async (name: string, filters: CarFilters, notificationsEnabled: boolean, resultsCount: number) => {
      const newSearch: SavedSearch = {
        id:
          Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
        notificationsEnabled,
        resultsCount,
      };

      if (isAuthenticated) {
        try {
          const res = await apiRequest("POST", API.savedSearches.list, {
            name,
            filters,
            notificationsEnabled,
            resultsCount,
          });
          const data = await res.json();
          newSearch.id = String(data.id);
        } catch (e) {
          console.error("saveSearch API:", e);
        }
      }

      setSavedSearches((prev) => [newSearch, ...prev]);
    },
    [isAuthenticated]
  );

  const deleteSearch = useCallback(
    async (searchId: string) => {
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));

      if (isAuthenticated) {
        try {
          await apiRequest("DELETE", API.savedSearches.delete(searchId));
        } catch (e) {
          console.error("deleteSearch API:", e);
        }
      }
    },
    [isAuthenticated]
  );

  const toggleSearchNotifications = useCallback(
    async (searchId: string) => {
      setSavedSearches((prev) =>
        prev.map((s) =>
          s.id === searchId
            ? { ...s, notificationsEnabled: !s.notificationsEnabled }
            : s
        )
      );

      if (isAuthenticated) {
        try {
          await apiRequest(
            "PUT",
            API.savedSearches.notifications(searchId)
          );
        } catch (e) {
          console.error("toggleSearchNotifications API:", e);
        }
      }
    },
    [isAuthenticated]
  );

  const refreshSavedSearches = useCallback(async () => {
    await loadSavedSearches();
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      savedSearches,
      saveSearch,
      deleteSearch,
      toggleSearchNotifications,
      refreshSavedSearches,
    }),
    [savedSearches, saveSearch, deleteSearch, toggleSearchNotifications, refreshSavedSearches]
  );

  return (
    <SavedSearchContext.Provider value={value}>
      {children}
    </SavedSearchContext.Provider>
  );
}

export function useSavedSearches() {
  const context = useContext(SavedSearchContext);
  if (!context) {
    throw new Error(
      "useSavedSearches must be used within a SavedSearchProvider"
    );
  }
  return context;
}
