import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";

export function useCatalogSections() {
  return useQuery<{ sections: any }>({
    queryKey: [API.catalog.sections],
  });
}
