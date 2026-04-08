import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import type { StoryItem } from "@/components/Stories";

export function useStoriesQuery() {
  const { data, isLoading } = useQuery<{ stories: StoryItem[] }>({
    queryKey: [API.stories],
    staleTime: 3 * 60 * 1000,
  });

  return { stories: data?.stories || [], isLoading };
}
