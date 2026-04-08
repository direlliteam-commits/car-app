import React, { ReactNode } from "react";
import { CarsFilterProvider, useCarsFilter } from "@/contexts/CarsFilterContext";
import { CarsListProvider, useCarsList } from "@/contexts/CarsListContext";

export { buildQueryString } from "@/lib/query-string-builder";
export { mapListingToCar } from "@/lib/mappers";
export { useCarsFilter } from "@/contexts/CarsFilterContext";
export { useCarsList } from "@/contexts/CarsListContext";

export function CarsProvider({ children }: { children: ReactNode }) {
  return (
    <CarsFilterProvider>
      <CarsListProvider>
        {children}
      </CarsListProvider>
    </CarsFilterProvider>
  );
}

export function useCars() {
  const filterCtx = useCarsFilter();
  const listCtx = useCarsList();

  return {
    ...listCtx,
    filters: filterCtx.filters,
    searchQuery: filterCtx.searchQuery,
    sortOption: filterCtx.sortOption,
    setFilters: filterCtx.setFilters,
    setSearchQuery: filterCtx.setSearchQuery,
    setSortOption: filterCtx.setSortOption,
    clearFilters: filterCtx.clearFilters,
    hasActiveFilters: filterCtx.hasActiveFilters,
    activeFiltersCount: filterCtx.activeFiltersCount,
  };
}
