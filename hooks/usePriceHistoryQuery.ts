import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";

interface PriceHistoryEntry {
  oldPrice: number;
  newPrice: number;
  changedAt: string;
  currency?: string;
}

export function usePriceHistory(listingId: string | number) {
  return useQuery<{ history: PriceHistoryEntry[] }>({
    queryKey: [API.listings.priceHistory(listingId)],
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });
}
