import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import { Car, ApiListing } from "@/types/car";
import type { ListingStatus } from "@/types/car";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { mapListingToCar } from "@/lib/mappers";
import { buildQueryString } from "@/lib/query-string-builder";
import { useCarsFilter } from "@/contexts/CarsFilterContext";

interface ListingsResponse {
  listings: ApiListing[];
  total: number;
}

interface CarsListContextValue {
  cars: Car[];
  myListings: string[];
  myListingCars: Car[];
  totalCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isFiltering: boolean;
  filteredCars: Car[];
  addCar: (car: Omit<Car, "id" | "createdAt">) => Promise<void>;
  deleteCar: (carId: string) => Promise<void>;
  updateListingStatus: (carId: string, status: ListingStatus) => Promise<void>;
  bumpListing: (carId: string) => Promise<void>;
  getCarById: (carId: string) => Car | undefined;
  refreshListings: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const CarsListContext = createContext<CarsListContextValue | null>(null);

async function fetchListingsApi(queryString: string): Promise<ListingsResponse> {
  const res = await apiRequest("GET", `${API.listings.list}?${queryString}`);
  return res.json();
}

export function CarsListProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { debouncedFilters, debouncedSearchQuery, debouncedSortOption } = useCarsFilter();

  const baseQueryString = useMemo(
    () => buildQueryString(debouncedFilters, debouncedSearchQuery, debouncedSortOption, 0),
    [debouncedFilters, debouncedSearchQuery, debouncedSortOption],
  );

  const listingsQuery = useInfiniteQuery<ListingsResponse>({
    queryKey: [API.listings.list, baseQueryString],
    queryFn: ({ pageParam = 0 }) => {
      const qs = buildQueryString(
        debouncedFilters,
        debouncedSearchQuery,
        debouncedSortOption,
        pageParam as number,
      );
      return fetchListingsApi(qs);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + (p.listings?.length ?? 0), 0);
      return loaded < (lastPage.total ?? 0) ? allPages.length : undefined;
    },
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });

  const cars = useMemo(() => {
    if (!listingsQuery.data) return [];
    const all = listingsQuery.data.pages.flatMap((page) => page.listings.map(mapListingToCar));
    const seen = new Set<string>();
    return all.filter((car) => {
      if (seen.has(car.id)) return false;
      seen.add(car.id);
      return true;
    });
  }, [listingsQuery.data]);

  const totalCount = listingsQuery.data?.pages[0]?.total ?? 0;

  const myListingsQuery = useQuery<{ listings: ApiListing[] }>({
    queryKey: [API.listings.my],
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const myListings = useMemo(() => {
    if (!myListingsQuery.data) return [];
    return myListingsQuery.data.listings.map((l) => String(l.id));
  }, [myListingsQuery.data]);

  const addCarMutation = useMutation({
    mutationFn: async (carData: Omit<Car, "id" | "createdAt">) => {
      const res = await apiRequest("POST", API.listings.list, {
        ...carData,
        currency: carData.currency || "USD",
        images: carData.images || [],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
    },
  });

  const deleteCarMutation = useMutation({
    mutationFn: async (carId: string) => {
      await apiRequest("DELETE", API.listings.getById(carId));
      return carId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ carId, status }: { carId: string; status: ListingStatus }) => {
      await apiRequest("PUT", API.listings.getById(carId), { status });
      return carId;
    },
    onSuccess: (carId) => {
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
      queryClient.invalidateQueries({ queryKey: [API.listings.list, carId, "detail"] });
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
    },
  });

  const bumpMutation = useMutation({
    mutationFn: async (carId: string) => {
      await apiRequest("POST", API.listings.bump(carId));
      return carId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.listings.list] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
      queryClient.invalidateQueries({ queryKey: [API.catalog.sections] });
    },
  });

  const addCar = useCallback(
    async (carData: Omit<Car, "id" | "createdAt">) => {
      await addCarMutation.mutateAsync(carData);
    },
    [addCarMutation],
  );

  const deleteCar = useCallback(
    async (carId: string) => {
      await deleteCarMutation.mutateAsync(carId);
    },
    [deleteCarMutation],
  );

  const updateListingStatus = useCallback(
    async (carId: string, status: ListingStatus) => {
      await updateStatusMutation.mutateAsync({ carId, status });
    },
    [updateStatusMutation],
  );

  const bumpListing = useCallback(
    async (carId: string) => {
      await bumpMutation.mutateAsync(carId);
    },
    [bumpMutation],
  );

  const carsById = useMemo(() => new Map(cars.map(car => [car.id, car])), [cars]);
  const myListingsById = useMemo(() => {
    if (!myListingsQuery.data) return new Map<string, ApiListing>();
    return new Map(myListingsQuery.data.listings.map(l => [String(l.id), l]));
  }, [myListingsQuery.data]);

  const getCarById = useCallback(
    (carId: string) => {
      const fromCars = carsById.get(carId);
      if (fromCars) return fromCars;
      const myListing = myListingsById.get(carId);
      if (myListing) return mapListingToCar(myListing);
      return undefined;
    },
    [carsById, myListingsById],
  );

  const refreshListings = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [API.listings.list] });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) {
      listingsQuery.fetchNextPage();
    }
  }, [listingsQuery]);

  const hasMore = !!listingsQuery.hasNextPage;
  const isLoadingMore = listingsQuery.isFetchingNextPage;

  const myListingCars = useMemo(() => {
    if (!myListingsQuery.data) return [];
    const STATUS_ORDER: Record<string, number> = { active: 0, moderation: 1, frozen: 2, rejected: 3, sold: 4, archived: 5 };
    return myListingsQuery.data.listings
      .map(mapListingToCar)
      .sort((a, b) => (STATUS_ORDER[a.status ?? "active"] ?? 5) - (STATUS_ORDER[b.status ?? "active"] ?? 5));
  }, [myListingsQuery.data]);

  const value = useMemo(
    () => ({
      cars,
      myListings,
      myListingCars,
      totalCount,
      isLoading: listingsQuery.isLoading,
      isFetching: listingsQuery.isFetching && !listingsQuery.isLoading,
      isFiltering: listingsQuery.isPlaceholderData === true && listingsQuery.isFetching,
      filteredCars: cars,
      addCar,
      deleteCar,
      updateListingStatus,
      bumpListing,
      getCarById,
      refreshListings,
      loadMore,
      hasMore,
      isLoadingMore,
    }),
    [
      cars,
      myListings,
      myListingCars,
      totalCount,
      listingsQuery.isLoading,
      listingsQuery.isFetching,
      listingsQuery.isPlaceholderData,
      addCar,
      deleteCar,
      updateListingStatus,
      bumpListing,
      getCarById,
      refreshListings,
      loadMore,
      hasMore,
      isLoadingMore,
    ],
  );

  return <CarsListContext.Provider value={value}>{children}</CarsListContext.Provider>;
}

export function useCarsList() {
  const context = useContext(CarsListContext);
  if (!context) {
    throw new Error("useCarsList must be used within a CarsListProvider");
  }
  return context;
}
