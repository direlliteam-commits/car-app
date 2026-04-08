import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAppColorScheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/constants/colors";
import { useTranslation } from "@/lib/i18n";
import { SCREEN_PADDING_H } from "@/constants/layout";
import { ScreenHeader } from "@/components/ScreenHeader";
import { AppIcons as I } from "@/constants/icons";
import { DealerProfileHeader } from "@/components/profile/DealerProfileHeader";
import { ProfileGuestView } from "@/components/profile/ProfileGuestView";
import { ProfileStickyHeader, ProfileMenuDropdown } from "@/components/profile/ProfileStickyHeader";
import { ProfileBannerSection } from "@/components/profile/ProfileBannerSection";
import { ProfileContentCards } from "@/components/profile/ProfileContentCards";
import { ProfileMenuSection } from "@/components/profile/ProfileMenuSection";
import { ProfileAboutSheet } from "@/components/profile/ProfileAboutSheet";
import { ProfileCreateSheet } from "@/components/profile/ProfileCreateSheet";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileActions } from "@/hooks/useProfileActions";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const colorScheme = useAppColorScheme();
  const colors = useColors(colorScheme);
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const data = useProfileData();
  const actions = useProfileActions({
    user: data.user,
    refreshUser: data.refreshUser,
    showAlert: data.showAlert,
    stickyHeaderOpacity: data.stickyHeaderOpacity,
    stickyHeaderVisible: data.stickyHeaderVisible,
    aboutSheetProgress: data.aboutSheetProgress,
    setUploadingAvatar: data.setUploadingAvatar,
    setAboutSheetVisible: data.setAboutSheetVisible,
    logout: data.logout,
  });

  if (!data.isAuthenticated) {
    return <ProfileGuestView colors={colors} isDark={isDark} t={t} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {data.user?.role !== "dealer" && (
        <ProfileStickyHeader
          colors={colors}
          isDark={isDark}
          displayName={data.displayName}
          unreadCount={data.unreadCount}
          stickyHeaderOpacity={data.stickyHeaderOpacity}
          insets={insets}
          onMenuPress={() => data.setShowProfileMenu(true)}
          t={t}
        />
      )}

      <ScrollView
        ref={data.scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        onScroll={actions.handleScroll}
        scrollEventThrottle={64}
        refreshControl={
          <RefreshControl refreshing={data.refreshing} onRefresh={data.onRefresh} tintColor={colors.textTertiary} />
        }
      >
        {data.user?.role === "dealer" ? (
          <>
            <ScreenHeader
              title={t("profile.profileHeader")}
              hideBack
              backgroundColor={isDark ? colors.surface : colors.background}
              rightActions={[
                { icon: I.notifications as any, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/notifications"); }, color: colors.textSecondary, badge: data.unreadCount },
                { icon: I.settings as any, onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/settings"); }, color: colors.textSecondary },
              ]}
            />
            <DealerProfileHeader
              user={data.user as any}
              colors={colors}
              isDark={isDark}
              myListingsCount={data.myListingCars.length}
              onPickAvatar={actions.handlePickAvatar}
              uploadingAvatar={data.uploadingAvatar}
              dealerFeatures={data.dealerFeatures}
            />
          </>
        ) : (
          <>
            <ProfileBannerSection
              colors={colors}
              isDark={isDark}
              user={data.user}
              displayName={data.displayName}
              memberDurationLabel={data.memberDurationLabel}
              userRating={data.userRating}
              unreadCount={data.unreadCount}
              insets={insets}
              defaultAvatarSource={data.defaultAvatarSource}
              isProSeller={data.isProSeller}
              proSubscription={data.proSubscription}
              proStatusQuery={data.proStatusQuery}
              onMenuPress={() => data.setShowProfileMenu(true)}
              openAboutSheet={actions.openAboutSheet}
              t={t}
            />
            <ProfileContentCards
              colors={colors}
              isDark={isDark}
              user={data.user}
              displayName={data.displayName}
              userReviewsCount={data.userReviewsCount}
              myListingsForPreview={data.myListingsForPreview}
              myListingCars={data.myListingCars}
              myReviews={data.myReviews}
              myJournalQuery={data.myJournalQuery}
              myJournalCount={data.myJournalCount}
              followersCount={data.followersCount}
              followingCount={data.followingCount}
              onCreatePress={() => data.setShowCreateSheet(true)}
              t={t}
            />
          </>
        )}

        <ProfileMenuSection
          colors={colors}
          isDark={isDark}
          user={data.user}
          dealerFeatures={data.dealerFeatures}
          frozenListingsCount={data.frozenListingsCount}
          isProSeller={data.isProSeller}
          proSubscription={data.proSubscription}
          proGracePeriod={data.proGracePeriod}
          dealerRequestQuery={data.dealerRequestQuery}
          autoRenewMutation={data.autoRenewMutation}
          t={t}
        />
      </ScrollView>

      <ProfileMenuDropdown
        visible={data.showProfileMenu}
        onClose={() => data.setShowProfileMenu(false)}
        colors={colors}
        isDark={isDark}
        insets={insets}
        onEditProfile={() => router.push("/edit-profile")}
        onSettings={() => router.push("/settings")}
        onShare={actions.handleShareProfile}
        onLogout={actions.handleLogout}
        t={t}
      />

      <ProfileAboutSheet
        visible={data.aboutSheetVisible}
        onClose={actions.closeAboutSheet}
        displayName={data.displayName}
        aboutText={data.user?.companyDescription || data.user?.about || ""}
        colors={colors}
        insets={insets}
        aboutSheetProgress={data.aboutSheetProgress}
        aboutPanHandlers={actions.aboutPanResponder.panHandlers}
      />

      <ProfileCreateSheet
        visible={data.showCreateSheet}
        onClose={() => data.setShowCreateSheet(false)}
        colors={colors}
        isDark={isDark}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingHorizontal: SCREEN_PADDING_H,
  },
});
