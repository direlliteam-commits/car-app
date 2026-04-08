import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  LayoutChangeEvent,
  Modal,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useAlert } from "@/contexts/AlertContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppIcons as I } from "@/constants/icons";
import { SellerProfileSkeleton } from "@/components/SkeletonCard";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SellerInfo, Review, ListingItem } from "@/components/seller/types";
import type { DealerJournalPost } from "@shared/schema";
import { ReviewModal } from "@/components/seller/ReviewModal";
import { UserReportModal } from "@/components/UserReportModal";
import { DealerPublicHeader } from "@/components/seller/DealerPublicHeader";
import { DealerOverviewTab } from "@/components/seller/DealerOverviewTab";
import { SellerListingsTab } from "@/components/seller/SellerListingsTab";
import { SellerReviewsTab } from "@/components/seller/SellerReviewsTab";
import { useTranslation } from "@/lib/i18n";
import { SCREEN_PADDING_H, HEADER_CONTENT_PADDING_H, CARD_PADDING, CARD_RADIUS, CARD_GAP, WEB_TOP_INSET, OVERLAY_BG, SHEET_BORDER_RADIUS } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { API } from "@/lib/api-endpoints";

export default function SellerProfileScreen() {
  const { id, branchId, tab: initialTab } = useLocalSearchParams<{ id: string; branchId?: string; tab?: string }>();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const { showAlert } = useAlert();

  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"info" | "overview" | "listings" | "reviews" | "journal">("overview");
  const [blockLoading, setBlockLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({}).current;
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorReady = useRef(false);
  const scrollYRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [tabBarSticky, setTabBarSticky] = useState(false);
  const tabBarOffsetY = useRef(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorX.value,
    width: indicatorW.value,
  }));

  const webTopInset = WEB_TOP_INSET;
  const dealerHeaderH = insets.top + webTopInset + 44;
  const isOwnProfile = !!(user?.id && id && String(user.id) === String(id));

  const headerVisibleRef = useRef(false);
  const tabBarStickyRef = useRef(false);
  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollYRef.current = y;
    const shouldShowHeader = y > 200;
    if (shouldShowHeader !== headerVisibleRef.current) {
      headerVisibleRef.current = shouldShowHeader;
      setHeaderVisible(shouldShowHeader);
    }
    if (tabBarOffsetY.current > 0) {
      const shouldStick = y >= tabBarOffsetY.current - dealerHeaderH;
      if (shouldStick !== tabBarStickyRef.current) {
        tabBarStickyRef.current = shouldStick;
        setTabBarSticky(shouldStick);
      }
    }
  }, [dealerHeaderH]);

  const animateIndicator = useCallback((tab: string) => {
    const layout = tabLayouts[tab];
    if (!layout) return;
    const padding = 14;
    const targetX = layout.x + padding;
    const targetW = layout.width - padding * 2;
    if (!indicatorReady.current) {
      indicatorX.value = targetX;
      indicatorW.value = targetW;
      indicatorReady.current = true;
      return;
    }
    const timingConfig = { duration: 250, easing: Easing.out(Easing.cubic) };
    indicatorX.value = withTiming(targetX, timingConfig);
    indicatorW.value = withTiming(targetW, timingConfig);
  }, [tabLayouts, indicatorX, indicatorW]);

  useEffect(() => {
    animateIndicator(activeTab);
  }, [activeTab, animateIndicator]);

  const sellerQuery = useQuery<SellerInfo>({
    queryKey: [API.users.getById(id)],
    enabled: !!id,
  });

  const reviewsQuery = useQuery<Review[]>({
    queryKey: [API.users.reviews(id)],
    enabled: !!id,
  });

  const listingsQuery = useQuery<{ listings: ListingItem[] }>({
    queryKey: [`${API.listings.list}?userId=${id}`],
    enabled: !!id,
  });

  const blockQuery = useQuery<{ blocked: boolean }>({
    queryKey: [API.users.blocked(id)],
    enabled: !!id && isAuthenticated && !isOwnProfile,
  });

  const seller = sellerQuery.data ?? null;

  const journalQuery = useQuery<{ posts: DealerJournalPost[]; likedPostIds: number[] }>({
    queryKey: [API.journal.getById(id)],
    enabled: !!id && (seller?.role === "dealer" || (!!seller?.isProSeller && seller?.role !== "dealer")),
  });

  const followStatsQuery = useQuery<{ followersCount: number; followingCount: number; isFollowing: boolean }>({
    queryKey: [API.journal.followStats(id)],
    enabled: !!id,
  });
  const qc = useQueryClient();
  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (shouldFollow) {
        await apiRequest("POST", API.journal.follow(id));
      } else {
        await apiRequest("DELETE", API.journal.follow(id));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [API.journal.followStats(id)] });
    },
  });
  const isFollowingSeller = followStatsQuery.data?.isFollowing ?? false;
  const sellerFollowersCount = followStatsQuery.data?.followersCount ?? 0;
  const sellerFollowingCount = followStatsQuery.data?.followingCount ?? 0;

  const reviews = reviewsQuery.data ?? [];
  const listings = listingsQuery.data?.listings ?? [];
  const isBlockedByMe = blockQuery.data?.blocked ?? false;
  const journalPosts = journalQuery.data?.posts ?? [];
  const loading = sellerQuery.isLoading;
  const error = sellerQuery.error ? t("seller.errorLoad") : null;
  const refreshing = sellerQuery.isRefetching || reviewsQuery.isRefetching || listingsQuery.isRefetching || journalQuery.isRefetching;

  const didSetInitialTab = useRef(false);
  useEffect(() => {
    if (seller && !didSetInitialTab.current) {
      didSetInitialTab.current = true;
      const validTabs = ["info", "overview", "listings", "reviews", "journal"];
      if (initialTab && validTabs.includes(initialTab)) {
        setActiveTab(initialTab as any);
        if (initialTab === "journal" || initialTab === "reviews") {
          setTimeout(() => {
            if (tabBarOffsetY.current > 0) {
              scrollRef.current?.scrollTo({ y: tabBarOffsetY.current - 10, animated: false });
            }
          }, 400);
        }
      } else {
        setActiveTab("overview");
      }
    }
  }, [seller, initialTab]);

  const cardBorderStyle = { borderWidth: 0 as number, borderColor: "transparent" };

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sellerQuery.refetch();
    reviewsQuery.refetch();
    listingsQuery.refetch();
    blockQuery.refetch();
    journalQuery.refetch();
  }, [sellerQuery, reviewsQuery, listingsQuery, blockQuery, journalQuery]);

  const handleToggleBlock = useCallback(() => {
    if (!isAuthenticated || !id) return;
    const action = isBlockedByMe ? t("seller.unblockAction") : t("seller.blockAction");
    showAlert(
      isBlockedByMe ? t("seller.unblockConfirm") : t("seller.blockConfirm"),
      `${t("seller.blockConfirmMsg")} ${action} ${t("seller.blockConfirmMsgEnd")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: isBlockedByMe ? t("seller.unblockBtn") : t("seller.blockBtn"),
          style: isBlockedByMe ? "default" : "destructive",
          onPress: async () => {
            setBlockLoading(true);
            try {
              if (isBlockedByMe) {
                await apiRequest("DELETE", API.users.block(id));
              } else {
                await apiRequest("POST", API.users.block(id));
              }
              queryClient.invalidateQueries({ queryKey: [API.users.blocked(id)] });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              showAlert(t("seller.error"), `${t("seller.blockError")} ${action} ${t("seller.blockErrorEnd")}`, undefined, "error");
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ]
    );
  }, [isAuthenticated, id, isBlockedByMe]);

  const handleWriteToSeller = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    if (listings.length === 0) {
      router.push("/(tabs)/messages");
      return;
    }
    setChatLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await apiRequest("POST", API.conversations.create, {
        sellerId: id,
        listingId: listings[0]?.id,
      });
      const data = await res.json();
      router.push(`/chat/${data.id}`);
    } catch {
      showAlert(t("seller.error"), t("seller.chatError"), undefined, "error");
    } finally {
      setChatLoading(false);
    }
  }, [isAuthenticated, id, listings]);

  const handleSubmitReview = useCallback(async (rating: number, comment: string) => {
    if (!isAuthenticated || !id || rating === 0 || isOwnProfile) return;
    await apiRequest("POST", API.reviews, {
      sellerId: id,
      rating,
      comment: comment.trim() || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    queryClient.invalidateQueries({ queryKey: [API.users.reviews(id)] });
    queryClient.invalidateQueries({ queryKey: [API.users.getById(id)] });
    setReviewModalVisible(false);
  }, [isAuthenticated, id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader hideBack={false} />
        <SellerProfileSkeleton />
      </View>
    );
  }

  if (error || !seller) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ScreenHeader hideBack={false} />
        <View style={styles.errorContainer}>
          <Ionicons name={I.alert} size={48} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || t("seller.notFound")}
          </Text>
          <Pressable
            onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)"); }}
            style={({ pressed }) => [styles.retryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.retryButtonText}>{t("seller.back")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isDealer = seller.role === "dealer";
  const isProSeller = !!seller.isProSeller && !isDealer;
  const ratingValue = seller.rating ?? 0;
  const reviewCount = seller.reviewsCount ?? reviews.length;

  const dealerTabs = ["overview", "info", "listings", "reviews", "journal"] as const;
  const otherTabs = ["overview", "listings", "reviews", "journal"] as const;
  const tabs = isDealer ? dealerTabs : otherTabs;

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "info": return t("seller.infoTab");
      case "overview": return t("seller.overviewTab");
      case "listings": return t("seller.listingsTab");
      case "reviews": return t("seller.reviewsTab");
      case "journal": return t("seller.journalTab");
      default: return "";
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "listings": return listings.length;
      case "reviews": return reviews.length;
      case "journal": return journalPosts.length;
      default: return null;
    }
  };

  const pageBg = isDark ? colors.background : colors.surface;
  const renderStickyTabBar = (isOverlay = false) => (
    <View
      style={[
        styles.stickyBlock,
        { backgroundColor: isDark ? colors.surface : colors.background },
        isOverlay && { position: "absolute" as const, top: dealerHeaderH, left: 0, right: 0, zIndex: 15, marginTop: 0, borderRadius: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      onLayout={!isOverlay ? (e: LayoutChangeEvent) => { tabBarOffsetY.current = e.nativeEvent.layout.y; } : undefined}
    >
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabBar, { borderBottomColor: colors.border }]}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const count = getTabCount(tab);
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab as typeof activeTab);
                }}
                onLayout={(e: LayoutChangeEvent) => {
                  const { x, width } = e.nativeEvent.layout;
                  tabLayouts[tab] = { x, width };
                  if (tab === activeTab) animateIndicator(tab);
                }}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
              >
                <View style={styles.tabLabelRow}>
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.text : colors.textTertiary },
                      isActive && styles.tabTextActive,
                    ]}
                  >
                    {getTabLabel(tab)}
                  </Text>
                  {count != null && count > 0 && (
                    <View style={[styles.tabCountBadge, { backgroundColor: colors.text + "15" }]}>
                      <Text style={[styles.tabCountText, { color: colors.text }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
          <Animated.View style={[styles.tabIndicator, { backgroundColor: colors.text }, indicatorStyle]} />
        </ScrollView>
      </View>
    </View>
  );

  const mergedBlockBottom = {
    backgroundColor: isDark ? colors.surface : colors.background,
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  };

  const renderTabContent = () => {
    if (activeTab === "info" && isDealer) {
      return (
        <DealerOverviewTab
          seller={seller}
          listings={listings}
          reviews={reviews}
          ratingValue={ratingValue}
          colors={colors}
          onShowAllListings={() => setActiveTab("listings")}
          onShowAllReviews={() => setActiveTab("reviews")}
          journalPosts={journalPosts}
          onShowJournal={() => setActiveTab("journal")}
          mode="info"
          activeBranchId={branchId}
          isProSellerProfile={isProSeller}
        />
      );
    }

    if (activeTab === "overview") {
      return (
        <DealerOverviewTab
          seller={seller}
          listings={listings}
          reviews={reviews}
          ratingValue={ratingValue}
          colors={colors}
          onShowAllListings={() => setActiveTab("listings")}
          onShowAllReviews={() => setActiveTab("reviews")}
          journalPosts={journalPosts}
          onShowJournal={() => setActiveTab("journal")}
          mode="overview"
          isProSellerProfile={!isDealer}
          journalFollowers={sellerFollowersCount}
          journalFollowing={sellerFollowingCount}
          isFollowing={isFollowingSeller}
          onFollowToggle={(follow) => followMutation.mutate(follow)}
          followPending={followMutation.isPending}
          isOwnProfile={isOwnProfile}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    if (activeTab === "listings") {
      return (
        <View style={[styles.tabContentListings, styles.dealerTabCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <SellerListingsTab
            listings={listings}
            isLoading={listingsQuery.isLoading}
            colors={colors}
            cardBorderStyle={cardBorderStyle}
          />
        </View>
      );
    }

    if (activeTab === "reviews") {
      return (
        <View style={[styles.tabContentPadded, styles.dealerTabCard, { backgroundColor: isDark ? colors.surface : colors.background }]}>
          <SellerReviewsTab
            reviews={reviews}
            isLoading={reviewsQuery.isLoading}
            isAuthenticated={isAuthenticated}
            isOwnProfile={isOwnProfile}
            onLeaveReview={() => setReviewModalVisible(true)}
            colors={colors}
            ratingValue={ratingValue}
            cardBorderStyle={cardBorderStyle}
          />
        </View>
      );
    }

    if (activeTab === "journal") {
      return (
        <DealerOverviewTab
          seller={seller}
          listings={listings}
          reviews={reviews}
          ratingValue={ratingValue}
          colors={colors}
          onShowAllListings={() => setActiveTab("listings")}
          onShowAllReviews={() => setActiveTab("reviews")}
          journalPosts={journalPosts}
          mode="journal"
          isProSellerProfile={isProSeller}
          journalFollowers={sellerFollowersCount}
          journalFollowing={sellerFollowingCount}
          isFollowing={isFollowingSeller}
          onFollowToggle={(follow) => followMutation.mutate(follow)}
          followPending={followMutation.isPending}
          isOwnProfile={isOwnProfile}
          isAuthenticated={isAuthenticated}
        />
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <StatusBar style={headerVisible && !isDark ? "dark" : "light"} />

      <ScreenHeader
        title={headerVisible ? (isDealer ? (seller?.companyName || seller?.name || "") : (seller?.name || "")) : undefined}
        backgroundColor={headerVisible ? (isDark ? colors.surface : colors.background) : "transparent"}
        iconColor={headerVisible ? colors.text : "#fff"}
        borderBottom={headerVisible && !tabBarSticky}
        borderColor={colors.border}
        style={styles.headerOverlay}
        rightActions={[{ icon: I.menu as any, onPress: () => { if (isAuthenticated && !isOwnProfile) setMenuVisible(true); }, color: headerVisible ? colors.text : "#fff" }]}
      />

      {tabBarSticky && renderStickyTabBar(true)}

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={64}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
        }
      >
        <DealerPublicHeader
          seller={seller}
          colors={colors}
          reviewCount={reviewCount}
          ratingValue={ratingValue}
          onReviewsPress={() => setActiveTab("reviews")}
          isProSeller={isProSeller}
          isPrivateUser={!isDealer && !isProSeller}
        />

        {renderStickyTabBar()}

        {renderTabContent()}
      </ScrollView>

      {!isOwnProfile && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={handleSubmitReview}
          colors={colors}
          insets={insets}
        />
      )}

      {!isOwnProfile && id && (
        <UserReportModal
          visible={reportModalVisible}
          onClose={() => setReportModalVisible(false)}
          targetUserId={id}
          colors={colors}
        />
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuSheet, { backgroundColor: isDark ? colors.surface : colors.background, paddingBottom: insets.bottom + 8 }]}>
            {isAuthenticated && !isOwnProfile && (
              <>
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    setReportModalVisible(true);
                  }}
                  style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="flag-outline" size={20} color={colors.accentOrange} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{t("report.menuReport")}</Text>
                </Pressable>
                <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    handleToggleBlock();
                  }}
                  style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name={isBlockedByMe ? "lock-open-outline" : "ban-outline"} size={20} color={isBlockedByMe ? colors.accentBlue : colors.error} />
                  <Text style={[styles.menuItemText, { color: isBlockedByMe ? colors.accentBlue : colors.error }]}>
                    {isBlockedByMe ? t("seller.unblockBtn") : t("seller.blockBtn")}
                  </Text>
                </Pressable>
              </>
            )}
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={() => setMenuVisible(false)}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.textSecondary }]}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HEADER_CONTENT_PADDING_H,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  stickyBlock: {
    marginTop: CARD_GAP,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  tabBarWrapper: {
    position: "relative",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 2,
  },
  tabItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    position: "relative",
  },
  tabItemActive: {},
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabTextActive: {
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -2,
    height: 2.5,
    borderRadius: 1,
  },
  tabContentPadded: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: CARD_PADDING,
    paddingBottom: 20,
  },
  tabContentListings: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: CARD_PADDING,
    paddingBottom: 20,
  },
  dealerTabCard: {
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_BG,
    justifyContent: "flex-end" as const,
  },
  menuSheet: {
    borderTopLeftRadius: SHEET_BORDER_RADIUS,
    borderTopRightRadius: SHEET_BORDER_RADIUS,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  journalStatsCard: {
    borderRadius: CARD_RADIUS,
    marginHorizontal: SCREEN_PADDING_H,
    marginBottom: CARD_GAP,
    padding: CARD_PADDING,
  },
  journalStatsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  journalStatItem: {
    flex: 1,
    alignItems: "center" as const,
  },
  journalStatValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  journalStatLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  journalStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  followBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  followBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
