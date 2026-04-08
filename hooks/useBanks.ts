import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import type { Bank } from "@/types/listing";

export function useBanks(enabled: boolean = true) {
  return useQuery<Bank[]>({
    queryKey: [API.credit.banks],
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
