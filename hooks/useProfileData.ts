import { useState, useCallback, useMemo, useRef } from "react";
import { ScrollView } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/api-endpoints";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCars } from "@/contexts/CarsContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/query-client";
import type { Review } from "@/components/seller/types";

export function useProfileData() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  const { myListingCars } = useCars();
  const { showAlert } = useAlert();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [aboutSheetVisible, setAboutSheetVisible] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const stickyHeaderOpacity = useSharedValue(0);
  const stickyHeaderVisible = useSharedValue(false);
  const aboutSheetProgress = useSharedValue(0);
  const defaultAvatarSource = useMemo(() => require("@/assets/images/default-avatar.png"), []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const dealerFeaturesQuery = useQuery({
    queryKey: [API.dealer.myFeatures],
    queryFn: async () => {
      const resp = await apiRequest("GET", API.dealer.myFeatures);
      return resp.json();
    },
    enabled: isAuthenticated && user?.role === "dealer",
  });
  const dealerFeatures = dealerFeaturesQuery.data ?? null;

  const proStatusQuery = useQuery<{ isProSeller: boolean; subscription: { id: number; startDate: string; endDate: string; autoRenew: boolean; daysRemaining: number } | null; gracePeriod?: { active: boolean; subscriptionEnd: string; graceDaysLeft: number }; config: { priceAmd: number } }>({
    queryKey: [API.proSeller.status],
    enabled: isAuthenticated && user?.role !== "dealer",
  });

  const dealerRequestQuery = useQuery<{ id: number; status: string } | null>({
    queryKey: [API.dealerRequests.my],
    enabled: isAuthenticated && user?.role !== "dealer",
  });

  const isProSeller = proStatusQuery.data?.isProSeller === true;
  const proSubscription = proStatusQuery.data?.subscription ?? null;
  const proGracePeriod = proStatusQuery.data?.gracePeriod ?? null;

  const myReviewsQuery = useQuery<Review[]>({
    queryKey: [API.users.reviews(user?.id ?? "")],
    enabled: isAuthenticated && !!user?.id,
  });
  const myReviews = myReviewsQuery.data ?? [];

  const myJournalQuery = useQuery<{ posts: { id: number; title?: string; content?: string; category?: string; createdAt?: string; images?: string[]; brand?: string; model?: string; rating?: number; likesCount?: number; commentsCount?: number; viewsCount?: number }[] }>({
    queryKey: [API.journal.userPosts(user?.id ?? "")],
    enabled: isAuthenticated && !!user?.id,
  });
  const myJournalCount = myJournalQuery.data?.posts?.length ?? 0;

  const followStatsQuery = useQuery<{ followersCount: number; followingCount: number }>({
    queryKey: [API.journal.followStats(user?.id ?? "")],
    enabled: isAuthenticated && !!user?.id,
  });
  const followersCount = followStatsQuery.data?.followersCount ?? 0;
  const followingCount = followStatsQuery.data?.followingCount ?? 0;

  const myListingsForPreview = myListingCars.slice(0, 4);
  const frozenListingsCount = myListingCars.filter((c) => c.status === "frozen").length;

  const autoRenewMutation = useMutation({
    mutationFn: async (autoRenew: boolean) => {
      const resp = await apiRequest("PUT", API.dealer.autoRenew, { autoRenew });
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
    },
    onError: () => {
      showAlert(t("common.error"), t("profile.autoRenewError"));
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      myReviewsQuery.refetch();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  }, [refreshUser, myReviewsQuery]);

  const memberDurationLabel = useMemo(() => {
    if (!user?.createdAt) return "";
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffYears = Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (diffYears < 1) return t("profile.lessThanYear");
    return t("profile.memberYears").replace("{years}", String(diffYears));
  }, [user?.createdAt, t]);

  const displayName = user?.name || user?.username || user?.phone || t("common.user");
  const userRating = user?.rating || 0;
  const userReviewsCount = user?.reviewsCount || 0;

  return {
    isAuthenticated,
    user,
    logout,
    refreshUser,
    unreadCount,
    myListingCars,
    showAlert,
    refreshing,
    onRefresh,
    aboutSheetVisible,
    setAboutSheetVisible,
    showProfileMenu,
    setShowProfileMenu,
    showCreateSheet,
    setShowCreateSheet,
    uploadingAvatar,
    setUploadingAvatar,
    scrollRef,
    stickyHeaderOpacity,
    stickyHeaderVisible,
    aboutSheetProgress,
    defaultAvatarSource,
    dealerFeatures,
    proStatusQuery,
    isProSeller,
    proSubscription,
    proGracePeriod,
    dealerRequestQuery,
    myReviews,
    myReviewsQuery,
    myJournalQuery,
    myJournalCount,
    followersCount,
    followingCount,
    myListingsForPreview,
    frozenListingsCount,
    autoRenewMutation,
    memberDurationLabel,
    displayName,
    userRating,
    userReviewsCount,
  };
}
