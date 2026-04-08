import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import type { AdminStats, DealerRequestItem, AdminListing, ReportItem, AdminUser } from "@/hooks/useAdminDealerRequests";

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: [API.admin.stats],
  });
}

export function useAdminDealerRequests(statusFilter: string) {
  const requestUrl =
    statusFilter === "all"
      ? API.admin.dealerRequests
      : `${API.admin.dealerRequests}?status=${statusFilter}`;
  return useQuery<DealerRequestItem[]>({
    queryKey: [requestUrl],
  });
}

export function useAdminListings(statusFilter: string) {
  const requestUrl = `${API.admin.listings}?status=${statusFilter}`;
  return useQuery<{ listings: AdminListing[]; total: number; hasMore?: boolean }>({
    queryKey: [requestUrl],
  });
}

export function useAdminListingDetail(id: number) {
  return useQuery<Record<string, any>>({
    queryKey: [API.admin.listingDetail(id)],
  });
}

export function useAdminReports(statusFilter: string) {
  const requestUrl =
    statusFilter === "all"
      ? API.admin.reports
      : `${API.admin.reports}?status=${statusFilter}`;
  return useQuery<{ reports: ReportItem[]; total: number }>({
    queryKey: [requestUrl],
  });
}

export function useAdminUsers(roleFilter: string, searchQuery: string) {
  const params = new URLSearchParams();
  if (roleFilter !== "all") params.set("role", roleFilter);
  if (searchQuery.trim()) params.set("search", searchQuery.trim());
  const requestUrl = `${API.admin.users}${params.toString() ? `?${params.toString()}` : ""}`;
  return useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: [requestUrl],
  });
}
