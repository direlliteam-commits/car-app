import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";

export function usePhotoLimit(userId: string | undefined) {
  const query = useQuery<{ maxPhotos: number } | null>({
    queryKey: [API.dealer.photoLimit],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  return { maxPhotos: query.data?.maxPhotos ?? 10, query };
}

export function useListingLimits(userId: string | undefined) {
  const query = useQuery<{
    maxListings: number;
    maxPhotos: number;
    currentCount: number;
    remaining: number;
    canUploadVideo: boolean;
    isProSeller: boolean;
  } | null>({
    queryKey: [API.auth.listingLimits],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  return query;
}

export function usePriceEstimate(
  brand: string,
  model: string,
  year: string,
  excludeUserId?: string,
) {
  const canEstimate = !!brand && !!model && !!year;
  const query = useQuery<{ avg: number; count: number; min: number; max: number }>({
    queryKey: [
      `${API.analytics.price}?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&yearFrom=${year || ""}&yearTo=${year || ""}${excludeUserId ? `&excludeUserId=${encodeURIComponent(excludeUserId)}` : ""}`,
    ],
    enabled: canEstimate,
    staleTime: 5 * 60 * 1000,
  });
  return query;
}

export function useExchangeRatesQuery() {
  return useQuery<{ USD: number; AMD: number; RUB: number; EUR: number }>({
    queryKey: [API.exchangeRates],
    staleTime: 60 * 60 * 1000,
  });
}
