import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";

export function useModelRating(
  brand: string,
  model?: string,
  generation?: string,
  enabled = true,
) {
  return useQuery<{ avgRating: number; reviewsCount: number }>({
    queryKey: [API.modelRating, brand, model, generation],
    queryFn: async () => {
      const params = new URLSearchParams({ brand });
      if (model) params.append("model", model);
      if (generation) params.append("generation", generation);
      const resp = await apiRequest("GET", `${API.modelRating}?${params}`);
      return resp.json();
    },
    enabled: !!brand && enabled,
    staleTime: 60000,
  });
}
